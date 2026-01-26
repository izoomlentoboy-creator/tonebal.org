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
// IN-MEMORY DATABASE (замените на MongoDB/PostgreSQL в production)
// ============================================
const subscriptions = new Map();
const payments = new Map();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: [
        'https://tonebal.org',
        'https://www.tonebal.org',
        'http://localhost:3000',
        /\.vercel\.app$/
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
    // В production здесь должна быть полноценная проверка CIDR
    // Для простоты проверяем префиксы
    const cleanIP = ip.replace(/^::ffff:/, '');
    
    for (const allowedIP of YOOKASSA_IPS) {
        if (allowedIP.includes('/')) {
            // CIDR notation - упрощенная проверка
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
 * Verify YooKassa notification by checking payment status
 */
async function verifyNotification(paymentId) {
    try {
        const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
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
        console.error('Verification error:', error);
        return null;
    }
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

// Serve payment page
app.get('/pay', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static HTML pages
app.get('/privacy.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy.html'));
});

app.get('/terms.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'terms.html'));
});

// Also handle without .html extension
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'terms.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        shopId: YOOKASSA_SHOP_ID,
        secretKeyConfigured: !!YOOKASSA_SECRET_KEY && YOOKASSA_SECRET_KEY.length > 10,
        secretKeyPrefix: YOOKASSA_SECRET_KEY ? YOOKASSA_SECRET_KEY.substring(0, 5) + '...' : 'NOT SET'
    });
});

// Debug endpoint - проверка конфигурации
app.get('/api/debug/config', (req, res) => {
    res.json({
        shopId: YOOKASSA_SHOP_ID,
        secretKeySet: !!YOOKASSA_SECRET_KEY,
        secretKeyLength: YOOKASSA_SECRET_KEY ? YOOKASSA_SECRET_KEY.length : 0,
        secretKeyPrefix: YOOKASSA_SECRET_KEY ? YOOKASSA_SECRET_KEY.substring(0, 10) : 'NOT SET',
        baseUrl: BASE_URL,
        nodeEnv: process.env.NODE_ENV || 'development'
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
        // Для тестового режима упрощаем данные (без чека)
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
            }
        };

        // Чек добавляем только если это не тестовый режим
        // (тестовый магазин может не поддерживать 54-ФЗ)
        if (!YOOKASSA_SECRET_KEY.startsWith('test_')) {
            paymentData.receipt = {
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
            };
        }

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

        console.log('Creating payment with YooKassa...');
        console.log('Shop ID:', YOOKASSA_SHOP_ID);
        console.log('Secret Key prefix:', YOOKASSA_SECRET_KEY ? YOOKASSA_SECRET_KEY.substring(0, 10) + '...' : 'NOT SET');

        const response = await fetch('https://api.yookassa.ru/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Idempotence-Key': idempotenceKey,
                'Authorization': 'Basic ' + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')
            },
            body: JSON.stringify(paymentData)
        });

        console.log('YooKassa response status:', response.status);
        const result = await response.json();
        console.log('YooKassa response:', JSON.stringify(result, null, 2));

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

            console.log(`Payment created: ${result.id} for user ${user_id}`);

            // Return confirmation URL
            res.json({
                success: true,
                payment_id: result.id,
                confirmation_url: result.confirmation?.confirmation_url,
                status: result.status
            });
        } else {
            console.error('YooKassa error:', JSON.stringify(result, null, 2));
            // Возвращаем более подробную информацию об ошибке
            let errorMessage = 'Ошибка создания платежа';
            if (result.description) {
                errorMessage = result.description;
            }
            if (result.code) {
                errorMessage += ` (код: ${result.code})`;
            }
            if (result.type === 'error' && result.parameter) {
                errorMessage += `. Параметр: ${result.parameter}`;
            }
            res.status(400).json({
                success: false,
                error: errorMessage,
                details: result
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
 * 
 * Требования по документации:
 * 1. URL должен использовать HTTPS и порт 443 или 8443
 * 2. Должен возвращать HTTP 200 для подтверждения получения
 * 3. Рекомендуется проверять IP отправителя
 * 4. Рекомендуется проверять статус объекта через API
 */
app.post('/api/webhooks/yookassa', async (req, res) => {
    try {
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`Webhook received from IP: ${clientIP}`);

        // Проверка IP (опционально, но рекомендуется)
        // В production раскомментируйте для безопасности
        // if (!isYooKassaIP(clientIP)) {
        //     console.warn(`Webhook from unauthorized IP: ${clientIP}`);
        //     return res.status(403).json({ error: 'Forbidden' });
        // }

        const { type, event, object } = req.body;

        // Проверяем тип уведомления
        if (type !== 'notification') {
            console.warn(`Invalid notification type: ${type}`);
            return res.status(400).json({ error: 'Invalid notification type' });
        }

        console.log(`Webhook event: ${event}, payment ID: ${object?.id}`);

        // Проверяем подлинность уведомления через API (рекомендуется)
        const verifiedPayment = await verifyNotification(object?.id);
        
        if (!verifiedPayment) {
            console.error(`Failed to verify payment: ${object?.id}`);
            // Всё равно возвращаем 200, чтобы YooKassa не повторял запрос
            return res.status(200).json({ status: 'ok' });
        }

        // Проверяем, что статус совпадает
        if (verifiedPayment.status !== object?.status) {
            console.warn(`Status mismatch: webhook=${object?.status}, api=${verifiedPayment.status}`);
        }

        // Обработка события payment.succeeded
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

                console.log(`✅ Subscription activated: ${user_id} -> ${nosology} until ${expiresAt.toISOString()}`);
            }

            // Update payment status
            if (payments.has(payment.id)) {
                const paymentInfo = payments.get(payment.id);
                paymentInfo.status = 'succeeded';
                paymentInfo.paid_at = new Date().toISOString();
                payments.set(payment.id, paymentInfo);
            }
        }

        // Обработка события payment.canceled
        if (event === 'payment.canceled') {
            const payment = object;
            console.log(`❌ Payment canceled: ${payment.id}`);
            
            if (payments.has(payment.id)) {
                const paymentInfo = payments.get(payment.id);
                paymentInfo.status = 'canceled';
                payments.set(payment.id, paymentInfo);
            }
        }

        // Обработка события payment.waiting_for_capture
        if (event === 'payment.waiting_for_capture') {
            const payment = object;
            console.log(`⏳ Payment waiting for capture: ${payment.id}`);
            
            if (payments.has(payment.id)) {
                const paymentInfo = payments.get(payment.id);
                paymentInfo.status = 'waiting_for_capture';
                payments.set(payment.id, paymentInfo);
            }
        }

        // Обработка события refund.succeeded
        if (event === 'refund.succeeded') {
            const refund = object;
            console.log(`💰 Refund succeeded: ${refund.id} for payment ${refund.payment_id}`);
            
            // Деактивируем подписку при возврате
            const payment = payments.get(refund.payment_id);
            if (payment) {
                const subscriptionKey = `${payment.user_id}_${payment.nosology}`;
                const subscription = subscriptions.get(subscriptionKey);
                if (subscription) {
                    subscription.is_active = false;
                    subscription.refunded_at = new Date().toISOString();
                    subscriptions.set(subscriptionKey, subscription);
                    console.log(`Subscription deactivated due to refund: ${subscriptionKey}`);
                }
            }
        }

        // ВАЖНО: Всегда возвращаем HTTP 200 для подтверждения получения
        // YooKassa игнорирует тело и заголовки ответа
        res.status(200).json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        // Даже при ошибке возвращаем 200, чтобы избежать повторных отправок
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
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     ToneBalance Payment Server Started         ║
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
