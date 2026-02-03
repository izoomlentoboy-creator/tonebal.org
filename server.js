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

// Access code settings
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // No confusing chars: I, L, O, 0, 1
const CODE_LENGTH = 8;
const CODE_SECRET = process.env.CODE_SECRET || 'tb_code_secret_2025';

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
let accessCodes = new Map(); // code -> { payment_id, user_id, nosology, created_at, activated_at, activated_by }

let lastLoadTime = 0;
const LOAD_CACHE_MS = 5000; // Cache data for 5 seconds

function loadDataFromFile(force = false) {
    // Skip if recently loaded (within cache time) and not forced
    const now = Date.now();
    if (!force && lastLoadTime > 0 && (now - lastLoadTime) < LOAD_CACHE_MS) {
        return;
    }

    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            subscriptions = new Map(data.subscriptions || []);
            payments = new Map(data.payments || []);
            accessCodes = new Map(data.accessCodes || []);
            lastLoadTime = now;
            console.log(`📂 Loaded ${subscriptions.size} subscriptions, ${payments.size} payments, ${accessCodes.size} codes from file`);
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
            accessCodes: Array.from(accessCodes.entries()),
            savedAt: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(`💾 Saved ${subscriptions.size} subscriptions, ${accessCodes.size} codes to file`);
    } catch (error) {
        console.error('Failed to save data:', error.message);
    }
}

// Load data LAZILY - don't block cold start
// loadDataFromFile(); // Moved to API routes that need it

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
 * When called from code activation: userId is provided
 * When called from payment: generates access code instead
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

/**
 * Handle successful payment - generate access code
 * Called from webhook or status check
 */
function handleSuccessfulPayment(paymentId, nosology, amount) {
    // Check if code already exists for this payment
    let existingCode = null;
    accessCodes.forEach((codeData, code) => {
        if (codeData.payment_id === paymentId) {
            existingCode = code;
        }
    });

    if (existingCode) {
        console.log(`🔑 Code already exists for payment ${paymentId}: ${formatCode(existingCode)}`);
        return existingCode;
    }

    // Generate new code
    const code = createAccessCode(paymentId, nosology);
    console.log(`🔑 Generated code for payment ${paymentId}: ${formatCode(code)}`);
    return code;
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

/**
 * Generate a unique 8-character access code
 * Format: XXXX-XXXX (displayed), XXXXXXXX (stored)
 */
function generateAccessCode() {
    let code = '';
    const randomBytes = crypto.randomBytes(CODE_LENGTH);
    for (let i = 0; i < CODE_LENGTH; i++) {
        const idx = randomBytes[i] % CODE_ALPHABET.length;
        code += CODE_ALPHABET[idx];
    }
    return code;
}

/**
 * Format code for display: XXXX-XXXX
 */
function formatCode(code) {
    if (code.length !== 8) return code;
    return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Normalize code (remove dashes, uppercase)
 */
function normalizeCode(code) {
    return code.replace(/-/g, '').replace(/\s/g, '').toUpperCase();
}

/**
 * Create access code after successful payment
 * Returns the generated code
 */
function createAccessCode(paymentId, nosology) {
    // Generate unique code
    let code;
    let attempts = 0;
    do {
        code = generateAccessCode();
        attempts++;
    } while (accessCodes.has(code) && attempts < 100);

    if (attempts >= 100) {
        throw new Error('Failed to generate unique code');
    }

    const codeData = {
        code: code,
        payment_id: paymentId,
        nosology: nosology,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        activated_at: null,
        activated_by: null,
        is_used: false
    };

    accessCodes.set(code, codeData);
    saveDataToFile();

    console.log(`🔑 Access code created: ${formatCode(code)} for payment ${paymentId}`);
    return code;
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

// Serve payment page - fast static file response with caching
app.get('/pay', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Root also serves payment page
app.get('/', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Static HTML pages
app.get('/terms.html', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.sendFile(path.join(__dirname, 'terms.html'));
});

app.get('/privacy.html', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    res.sendFile(path.join(__dirname, 'privacy.html'));
});

// Fast health check - no file operations
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL
    });
});

// Detailed health check (for debugging)
app.get('/api/health/detailed', (req, res) => {
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

        // CRITICAL: If payment is succeeded, generate access code
        // This is the fallback mechanism when webhook doesn't work
        if (payment.status === 'succeeded' && payment.paid === true) {
            const { nosology } = payment.metadata || {};

            if (nosology) {
                // Generate code (or get existing) - don't auto-activate subscription
                // User will activate via code in the app
                console.log(`🔄 Ensuring code exists for payment ${payment_id}`);
                handleSuccessfulPayment(payment_id, nosology, payment.amount?.value);
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
            const { nosology } = verifiedPayment.metadata || {};

            if (nosology) {
                // Generate access code instead of auto-activating subscription
                // User will enter code in the app to activate
                handleSuccessfulPayment(verifiedPayment.id, nosology, verifiedPayment.amount?.value);
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
// ACCESS CODE ENDPOINTS
// ============================================

/**
 * Activate access code
 * POST /api/codes/activate
 * Body: { code: "XXXXXXXX", user_id: "user123" }
 */
app.post('/api/codes/activate', (req, res) => {
    try {
        loadDataFromFile();

        const { code, user_id } = req.body;

        if (!code || !user_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing code or user_id'
            });
        }

        const normalizedCode = normalizeCode(code);

        if (normalizedCode.length !== CODE_LENGTH) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат кода'
            });
        }

        // Check if code exists
        const codeData = accessCodes.get(normalizedCode);

        if (!codeData) {
            console.log(`❌ Code not found: ${normalizedCode}`);
            return res.status(400).json({
                success: false,
                error: 'Неверный код доступа'
            });
        }

        // Check if already used
        if (codeData.is_used) {
            console.log(`❌ Code already used: ${normalizedCode}`);
            return res.status(400).json({
                success: false,
                error: 'Этот код уже был использован'
            });
        }

        // Check if code expired (30 days from creation)
        const createdAt = new Date(codeData.created_at);
        const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (new Date() > expiresAt) {
            console.log(`❌ Code expired: ${normalizedCode}`);
            return res.status(400).json({
                success: false,
                error: 'Срок действия кода истёк'
            });
        }

        // Activate the code
        codeData.is_used = true;
        codeData.activated_at = new Date().toISOString();
        codeData.activated_by = user_id;
        accessCodes.set(normalizedCode, codeData);

        // Create subscription for user
        activateSubscription(user_id, codeData.nosology, codeData.payment_id, SUBSCRIPTION_PRICE);

        console.log(`✅ Code activated: ${formatCode(normalizedCode)} by user ${user_id}`);

        res.json({
            success: true,
            nosology: codeData.nosology,
            expires_at: new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
            message: `Доступ к программе «${getNosologyName(codeData.nosology)}» активирован на ${SUBSCRIPTION_DAYS} дней`
        });

    } catch (error) {
        console.error('Code activation error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

/**
 * Get code info (for displaying after payment)
 * GET /api/codes/:payment_id
 */
app.get('/api/codes/:payment_id', (req, res) => {
    loadDataFromFile();

    const { payment_id } = req.params;

    // Find code by payment_id
    let foundCode = null;
    accessCodes.forEach((codeData, code) => {
        if (codeData.payment_id === payment_id) {
            foundCode = { code, ...codeData };
        }
    });

    if (!foundCode) {
        return res.status(404).json({
            success: false,
            error: 'Code not found for this payment'
        });
    }

    res.json({
        success: true,
        code: formatCode(foundCode.code),
        code_raw: foundCode.code,
        nosology: foundCode.nosology,
        nosology_name: getNosologyName(foundCode.nosology),
        created_at: foundCode.created_at,
        is_used: foundCode.is_used,
        activated_by: foundCode.activated_by,
        activated_at: foundCode.activated_at
    });
});

/**
 * Debug: List all codes (remove in production)
 */
app.get('/api/debug/codes', (req, res) => {
    loadDataFromFile();

    const allCodes = [];
    accessCodes.forEach((codeData, code) => {
        allCodes.push({
            code: formatCode(code),
            ...codeData
        });
    });

    res.json({
        count: allCodes.length,
        codes: allCodes
    });
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
