/**
 * ToneBalance Payment Server
 * Node.js + Express + YooKassa API
 *
 * Запуск: node server.js
 * Или с nodemon: npx nodemon server.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION - ЗАМЕНИТЕ НА СВОИ ДАННЫЕ!
// ============================================
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '513198';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || 'YOUR_SECRET_KEY_HERE';
const BASE_URL = process.env.BASE_URL || 'https://tonebal.org';

// Subscription settings
const SUBSCRIPTION_PRICE = 2500; // рублей
const SUBSCRIPTION_DAYS = 30;

// ============================================
// IN-MEMORY DATABASE (замените на MongoDB/PostgreSQL в production)
// ============================================
const subscriptions = new Map();
const payments = new Map();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Serve payment page
app.get('/pay', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
                return_url: return_url || `${BASE_URL}/pay?nosology=${nosology}&user_id=${user_id}`
            },
            capture: true,
            description: `Подписка ToneBalance: ${getNosologyName(nosology)} на ${SUBSCRIPTION_DAYS} дней`,
            metadata: {
                user_id: user_id,
                nosology: nosology,
                subscription_days: SUBSCRIPTION_DAYS
            },
            receipt: {
                customer: {
                    email: 'customer@tonebalance.app' // В production - email пользователя
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

        const response = await fetch('https://api.yookassa.ru/v3/payments', {
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

            // Return confirmation URL
            res.json({
                success: true,
                payment_id: result.id,
                confirmation_url: result.confirmation?.confirmation_url,
                status: result.status
            });
        } else {
            console.error('YooKassa error:', result);
            res.status(400).json({
                success: false,
                error: result.description || 'Payment creation failed'
            });
        }

    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get payment status
 * GET /api/payments/status/:payment_id
 */
app.get('/api/payments/status/:payment_id', async (req, res) => {
    try {
        const { payment_id } = req.params;

        const response = await fetch(`https://api.yookassa.ru/v3/payments/${payment_id}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')
            }
        });

        const result = await response.json();

        res.json({
            payment_id: result.id,
            status: result.status,
            amount: result.amount?.value,
            paid: result.paid,
            metadata: result.metadata
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
        const { event, object } = req.body;

        console.log('Webhook received:', event, object?.id);

        if (event === 'payment.succeeded') {
            const payment = object;
            const { user_id, nosology, subscription_days } = payment.metadata || {};

            if (user_id && nosology) {
                // Activate subscription
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + (subscription_days || SUBSCRIPTION_DAYS));

                const subscriptionKey = `${user_id}_${nosology}`;
                const existingSub = subscriptions.get(subscriptionKey);

                // If existing subscription, extend it
                let startDate = new Date();
                if (existingSub && new Date(existingSub.expires_at) > startDate) {
                    startDate = new Date(existingSub.expires_at);
                    expiresAt.setTime(startDate.getTime() + (subscription_days || SUBSCRIPTION_DAYS) * 24 * 60 * 60 * 1000);
                }

                subscriptions.set(subscriptionKey, {
                    user_id: user_id,
                    nosology: nosology,
                    payment_id: payment.id,
                    amount: payment.amount?.value,
                    starts_at: startDate.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    is_active: true,
                    created_at: new Date().toISOString()
                });

                console.log(`Subscription activated: ${user_id} -> ${nosology} until ${expiresAt.toISOString()}`);
            }

            // Update payment status
            if (payments.has(payment.id)) {
                const paymentInfo = payments.get(payment.id);
                paymentInfo.status = 'succeeded';
                paymentInfo.paid_at = new Date().toISOString();
                payments.set(payment.id, paymentInfo);
            }
        }

        if (event === 'payment.canceled') {
            const payment = object;
            if (payments.has(payment.id)) {
                const paymentInfo = payments.get(payment.id);
                paymentInfo.status = 'canceled';
                payments.set(payment.id, paymentInfo);
            }
        }

        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
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
    const { user_id } = req.params;

    const userSubscriptions = [];

    subscriptions.forEach((sub, key) => {
        if (sub.user_id === user_id) {
            // Check if still active
            const isActive = new Date(sub.expires_at) > new Date();
            userSubscriptions.push({
                ...sub,
                is_active: isActive
            });
        }
    });

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
    const { user_id, nosology } = req.params;
    const subscriptionKey = `${user_id}_${nosology}`;

    const subscription = subscriptions.get(subscriptionKey);

    if (subscription) {
        const isActive = new Date(subscription.expires_at) > new Date();
        const daysLeft = Math.max(0, Math.ceil((new Date(subscription.expires_at) - new Date()) / (1000 * 60 * 60 * 24)));

        res.json({
            has_subscription: isActive,
            is_active: isActive,
            expires_at: subscription.expires_at,
            days_left: daysLeft,
            nosology: nosology
        });
    } else {
        res.json({
            has_subscription: false,
            is_active: false,
            nosology: nosology
        });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

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
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     ToneBalance Payment Server Started         ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  URL:  http://localhost:${PORT}                   ║
║                                                ║
║  Payment page: http://localhost:${PORT}/pay       ║
║  API Health:   http://localhost:${PORT}/api/health║
╚════════════════════════════════════════════════╝

⚠️  Don't forget to set environment variables:
    YOOKASSA_SHOP_ID=your_shop_id
    YOOKASSA_SECRET_KEY=your_secret_key
    BASE_URL=https://tonebal.org
`);
});

module.exports = app;
