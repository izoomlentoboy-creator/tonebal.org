/**
 * Tone Balance Payment Server
 * Node.js + Express + YooKassa API
 *
 * Запуск: node server.js
 * Или с nodemon: npx nodemon server.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Request timeout for YooKassa API calls (ms)
const API_TIMEOUT = 25000; // 25 seconds - YooKassa can be slow

// ============================================
// CONFIGURATION
// ============================================
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '513198';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || 'test_*g-9MajwhhX704_hx3udBkn0YAoiMZCE65nmEMeumcsdI';
const BASE_URL = process.env.BASE_URL || 'https://tonebal.org';

// Subscription settings
const SUBSCRIPTION_PRICE = 2500; // рублей
const SUBSCRIPTION_DAYS = 30;

// YooKassa IP whitelist для проверки webhook (по документации)
const YOOKASSA_IPS = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11',
    '77.75.156.35',
    '77.75.154.128/25',
    '2a02:5180::/32'
];

// ============================================
// FILE-BASED PERSISTENCE (Vercel /tmp storage)
// ============================================
const DATA_FILE = '/tmp/tonebalance_data.json';

let subscriptions = new Map();
let payments = new Map();

function loadDataFromFile() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            subscriptions = new Map(data.subscriptions || []);
            payments = new Map(data.payments || []);
            console.log(`📂 Loaded ${subscriptions.size} subscriptions, ${payments.size} payments from file`);
        }
    } catch (error) {
        console.log('📂 No existing data file, starting fresh');
    }
}

function saveDataToFile() {
    try {
        const data = {
            subscriptions: Array.from(subscriptions.entries()),
            payments: Array.from(payments.entries()),
            savedAt: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(`💾 Saved ${subscriptions.size} subscriptions to file`);
    } catch (error) {
        console.error('Failed to save data:', error.message);
    }
}

// Load data on startup
loadDataFromFile();

// ============================================
// MIDDLEWARE
// ============================================

// Allow all origins for API calls (same-origin requests from the page itself)
app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname), { maxAge: '1h' }));

// Performance: Keep-alive and fast response headers
app.use((req, res, next) => {
    res.set('Connection', 'keep-alive');
    res.set('Keep-Alive', 'timeout=30');
    res.set('X-Response-Time', Date.now().toString());
    next();
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if IP is in YooKassa whitelist
 */
function isYooKassaIP(ip) {
    const cleanIP = ip.replace(/^::ffff:/, '');

    for (const allowedIP of YOOKASSA_IPS) {
        if (allowedIP.includes('/')) {
            const prefix = allowedIP.split('/')[0].split('.').slice(0, 2).join('.');
            if (cleanIP.startsWith(prefix)) {
                return true;
            }
        } else {
            if (cleanIP === allowedIP) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Get payment from YooKassa API
 */
async function getPaymentFromYooKassa(paymentId) {
    try {
        const response = await fetchWithTimeout(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')
            }
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('YooKassa API error:', error.message);
        return null;
    }
}

/**
 * Activate subscription for user
 * This is called both from webhook AND from payment status check (fallback)
 */
function activateSubscription(userId, nosology, paymentId, amount) {
    const subscriptionKey = `${userId}_${nosology}`;
    const existingSub = subscriptions.get(subscriptionKey);

    const expiresAt = new Date();
    let startDate = new Date();

    // If existing subscription, extend it
    if (existingSub && new Date(existingSub.expires_at) > startDate) {
        startDate = new Date(existingSub.expires_at);
        expiresAt.setTime(startDate.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
    } else {
        expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DAYS);
    }

    subscriptions.set(subscriptionKey, {
        user_id: userId,
        nosology: nosology,
        payment_id: paymentId,
        amount: amount,
        starts_at: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
    });

    // Save to file immediately
    saveDataToFile();

    console.log(`✅ Subscription activated: ${userId} -> ${nosology} until ${expiresAt.toISOString()}`);
    return subscriptions.get(subscriptionKey);
}

function getNosologyName(nosology) {
    const names = {
        paresis: 'Парез гортани',
        nodules: 'Узелки на связках',
        hypertonic: 'Гипертонусная дисфония',
        hypotonic: 'Гипотонусная дисфония',
        dysphagia: 'Дисфагия',
        mutation: 'Мутационная дисфония',
        professional: 'Профессионалы голоса',
        breathing: 'Дыхательная гимнастика',
        voiceSetting: 'Постановка голоса',
        introduction: 'Введение'
    };
    return names[nosology] || nosology;
}

// ============================================
// ROUTES
// ============================================

// Account portal — redirect to payment page with correct params
app.get('/account', (req, res) => {
    const section = req.query.section || 'paresis';
    const uid = req.query.uid || '';
    const lang = req.query.lang || 'ru';
    res.redirect(`/pay?nosology=${encodeURIComponent(section)}&user_id=${encodeURIComponent(uid)}&lang=${encodeURIComponent(lang)}`);
});

// Serve payment page
app.get('/pay', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    // Reload data from file to ensure fresh state
    loadDataFromFile();

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        shopId: YOOKASSA_SHOP_ID,
        subscriptionsCount: subscriptions.size,
        paymentsCount: payments.size
    });
});

// ============================================
// PAYMENT ENDPOINTS
// ============================================

/**
 * Create payment
 * POST /api/payments/create
 */
app.post('/api/payments/create', async (req, res) => {
    try {
        const { user_id, nosology, payment_method, return_url } = req.body;

        if (!user_id || !nosology) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Generate idempotence key
        const idempotenceKey = crypto.randomUUID();

        // Create payment via YooKassa API
        const paymentData = {
            amount: {
                value: SUBSCRIPTION_PRICE.toFixed(2),
                currency: 'RUB'
            },
            confirmation: {
                type: 'redirect',
                // YooKassa will redirect here after payment
                return_url: return_url || `${BASE_URL}/pay?nosology=${nosology}&user_id=${user_id}`
            },
            capture: true,
            description: `Подписка Tone Balance: ${getNosologyName(nosology)} на ${SUBSCRIPTION_DAYS} дней`,
            metadata: {
                user_id: user_id,
                nosology: nosology,
                subscription_days: SUBSCRIPTION_DAYS
            },
            receipt: {
                customer: {
                    email: 'customer@tonebalance.app'
                },
                items: [{
                    description: `Подписка на программу "${getNosologyName(nosology)}"`,
                    quantity: '1.00',
                    amount: {
                        value: SUBSCRIPTION_PRICE.toFixed(2),
                        currency: 'RUB'
                    },
                    vat_code: 1,
                    payment_mode: 'full_payment',
                    payment_subject: 'service'
                }]
            }
        };

        // Add payment method type if specified
        if (payment_method) {
            const methodMap = {
                'bank_card': 'bank_card',
                'sbp': 'sbp',
                'sberbank': 'sberbank'
            };
            if (methodMap[payment_method]) {
                paymentData.payment_method_data = {
                    type: methodMap[payment_method]
                };
            }
        }

        const response = await fetchWithTimeout('https://api.yookassa.ru/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Idempotence-Key': idempotenceKey,
                'Authorization': 'Basic ' + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (result.id) {
            // Save payment info
            payments.set(result.id, {
                id: result.id,
                user_id: user_id,
                nosology: nosology,
                amount: SUBSCRIPTION_PRICE,
                status: result.status,
                created_at: new Date().toISOString()
            });
            saveDataToFile();

            console.log(`💳 Payment created: ${result.id} for user ${user_id}`);

            // Build confirmation URL with payment_id appended
            let confirmationUrl = result.confirmation?.confirmation_url;

            res.json({
                success: true,
                payment_id: result.id,
                confirmation_url: confirmationUrl,
                status: result.status,
                // Also return the return URL for client-side storage
                return_url: `${BASE_URL}/pay?nosology=${nosology}&user_id=${user_id}&payment_id=${result.id}`
            });
        } else {
            console.error('YooKassa error:', result);
            res.status(400).json({
                success: false,
                error: result.description || 'Payment creation failed'
            });
        }

    } catch (error) {
        console.error('Create payment error:', error.message || error);
        const errorMessage = error.name === 'AbortError'
            ? 'Payment service timeout. Please try again.'
            : 'Internal server error';
        res.status(500).json({ success: false, error: errorMessage });
    }
});

/**
 * Get payment status AND activate subscription if paid
 * GET /api/payments/status/:payment_id
 *
 * IMPORTANT: This endpoint also activates subscription as a fallback
 * in case webhook didn't work (Vercel serverless issue)
 */
app.get('/api/payments/status/:payment_id', async (req, res) => {
    try {
        const { payment_id } = req.params;

        // Always reload data from file to get latest state
        loadDataFromFile();

        // Get fresh payment status from YooKassa
        const payment = await getPaymentFromYooKassa(payment_id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // CRITICAL: If payment is succeeded, activate subscription NOW
        // This is the fallback mechanism when webhook doesn't work
        if (payment.status === 'succeeded' && payment.paid === true) {
            const { user_id, nosology } = payment.metadata || {};

            if (user_id && nosology) {
                const subscriptionKey = `${user_id}_${nosology}`;
                const existingSub = subscriptions.get(subscriptionKey);

                // Only activate if not already active for this payment
                if (!existingSub || existingSub.payment_id !== payment_id) {
                    console.log(`🔄 Fallback activation for payment ${payment_id}`);
                    activateSubscription(user_id, nosology, payment_id, payment.amount?.value);
                }
            }
        }

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
            payment_id: payment.id,
            status: payment.status,
            amount: payment.amount?.value,
            paid: payment.paid,
            metadata: payment.metadata
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Failed to get payment status' });
    }
});

/**
 * YooKassa Webhook
 * POST /api/webhooks/yookassa
 */
app.post('/api/webhooks/yookassa', async (req, res) => {
    try {
        // Reload data to ensure we have latest state
        loadDataFromFile();

        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`🔔 Webhook received from IP: ${clientIP}`);

        const { type, event, object } = req.body;

        if (type !== 'notification') {
            console.warn(`Invalid notification type: ${type}`);
            return res.status(400).json({ error: 'Invalid notification type' });
        }

        console.log(`📩 Webhook event: ${event}, payment ID: ${object?.id}`);

        // Verify payment via API
        const verifiedPayment = await getPaymentFromYooKassa(object?.id);

        if (!verifiedPayment) {
            console.error(`Failed to verify payment: ${object?.id}`);
            return res.status(200).json({ status: 'ok' });
        }

        // Handle payment.succeeded
        if (event === 'payment.succeeded') {
            const { user_id, nosology } = verifiedPayment.metadata || {};

            if (user_id && nosology) {
                activateSubscription(user_id, nosology, verifiedPayment.id, verifiedPayment.amount?.value);
            }

            // Update payment record
            if (payments.has(verifiedPayment.id)) {
                const paymentInfo = payments.get(verifiedPayment.id);
                paymentInfo.status = 'succeeded';
                paymentInfo.paid_at = new Date().toISOString();
                payments.set(verifiedPayment.id, paymentInfo);
                saveDataToFile();
            }
        }

        // Handle payment.canceled
        if (event === 'payment.canceled') {
            console.log(`❌ Payment canceled: ${object.id}`);

            if (payments.has(object.id)) {
                const paymentInfo = payments.get(object.id);
                paymentInfo.status = 'canceled';
                payments.set(object.id, paymentInfo);
                saveDataToFile();
            }
        }

        // Handle refund.succeeded
        if (event === 'refund.succeeded') {
            const refund = object;
            console.log(`💰 Refund succeeded: ${refund.id} for payment ${refund.payment_id}`);

            const payment = payments.get(refund.payment_id);
            if (payment) {
                const subscriptionKey = `${payment.user_id}_${payment.nosology}`;
                const subscription = subscriptions.get(subscriptionKey);
                if (subscription) {
                    subscription.is_active = false;
                    subscription.refunded_at = new Date().toISOString();
                    subscriptions.set(subscriptionKey, subscription);
                    saveDataToFile();
                    console.log(`Subscription deactivated due to refund: ${subscriptionKey}`);
                }
            }
        }

        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ status: 'error', message: error.message });
    }
});

// ============================================
// SUBSCRIPTION ENDPOINTS
// ============================================

/**
 * Get user subscriptions
 * GET /api/subscriptions/:user_id
 */
app.get('/api/subscriptions/:user_id', (req, res) => {
    // Always reload to get fresh data
    loadDataFromFile();

    const { user_id } = req.params;
    const userSubscriptions = [];

    subscriptions.forEach((sub, key) => {
        if (sub.user_id === user_id) {
            const isActive = new Date(sub.expires_at) > new Date();
            userSubscriptions.push({
                ...sub,
                is_active: isActive
            });
        }
    });

    console.log(`📋 User ${user_id} has ${userSubscriptions.length} subscriptions`);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
        user_id: user_id,
        subscriptions: userSubscriptions
    });
});

/**
 * Check subscription for specific nosology
 * GET /api/subscriptions/:user_id/:nosology
 */
app.get('/api/subscriptions/:user_id/:nosology', (req, res) => {
    // Always reload to get fresh data
    loadDataFromFile();

    const { user_id, nosology } = req.params;
    const subscriptionKey = `${user_id}_${nosology}`;

    const subscription = subscriptions.get(subscriptionKey);

    if (subscription) {
        const isActive = new Date(subscription.expires_at) > new Date();
        const daysLeft = Math.max(0, Math.ceil((new Date(subscription.expires_at) - new Date()) / (1000 * 60 * 60 * 24)));

        console.log(`🔍 Subscription check: ${subscriptionKey} = ${isActive ? 'active' : 'inactive'}`);

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
            has_subscription: isActive,
            is_active: isActive,
            expires_at: subscription.expires_at,
            days_left: daysLeft,
            nosology: nosology
        });
    } else {
        console.log(`🔍 No subscription found for: ${subscriptionKey}`);

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
            has_subscription: false,
            is_active: false,
            nosology: nosology
        });
    }
});

/**
 * Manual subscription activation (for testing/support)
 * POST /api/subscriptions/activate
 */
app.post('/api/subscriptions/activate', (req, res) => {
    const { user_id, nosology, payment_id, secret } = req.body;

    // Simple secret check for manual activation (change in production!)
    if (secret !== 'tb_activate_2025') {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    if (!user_id || !nosology) {
        return res.status(400).json({ error: 'Missing user_id or nosology' });
    }

    const subscription = activateSubscription(user_id, nosology, payment_id || 'manual', '0');

    res.json({
        success: true,
        subscription: subscription
    });
});

/**
 * Debug endpoint - list all subscriptions (remove in production!)
 * GET /api/debug/subscriptions
 */
app.get('/api/debug/subscriptions', (req, res) => {
    loadDataFromFile();

    const allSubs = [];
    subscriptions.forEach((sub, key) => {
        allSubs.push({ key, ...sub });
    });

    res.json({
        count: allSubs.length,
        subscriptions: allSubs
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     Tone Balance Payment Server Started         ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  URL:  ${BASE_URL}                               ║
║                                                ║
║  Payment page: ${BASE_URL}/pay                   ║
║  API Health:   ${BASE_URL}/api/health            ║
║  Webhook URL:  ${BASE_URL}/api/webhooks/yookassa ║
╚════════════════════════════════════════════════╝

⚠️  Environment variables:
    YOOKASSA_SHOP_ID=${YOOKASSA_SHOP_ID}
    YOOKASSA_SECRET_KEY=${YOOKASSA_SECRET_KEY ? '***' + YOOKASSA_SECRET_KEY.slice(-4) : 'NOT SET'}
    BASE_URL=${BASE_URL}

📋 Next steps:
    1. Configure webhook in YooKassa: ${BASE_URL}/api/webhooks/yookassa
    2. Subscribe to events: payment.succeeded, payment.canceled, refund.succeeded
    3. Test with: ${BASE_URL}/pay?nosology=paresis&user_id=test123
`);
});

module.exports = app;
