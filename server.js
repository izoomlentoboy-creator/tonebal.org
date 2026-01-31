/**
 * Tone Balance Access Server
 * Node.js + Express
 *
 * Простой сервер для активации доступа через deep link
 * Без платёжной системы - активация происходит напрямую
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION
// ============================================
const BASE_URL = process.env.BASE_URL || 'https://tonebal.org';
const SUBSCRIPTION_DAYS = 30;

// ============================================
// FILE-BASED PERSISTENCE (Vercel /tmp storage)
// ============================================
const DATA_FILE = '/tmp/tonebalance_data.json';

let subscriptions = new Map();

let lastLoadTime = 0;
const LOAD_CACHE_MS = 5000;

function loadDataFromFile(force = false) {
    const now = Date.now();
    if (!force && lastLoadTime > 0 && (now - lastLoadTime) < LOAD_CACHE_MS) {
        return;
    }

    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            subscriptions = new Map(data.subscriptions || []);
            lastLoadTime = now;
            console.log(`📂 Loaded ${subscriptions.size} subscriptions from file`);
        }
    } catch (error) {
        console.log('📂 No existing data file, starting fresh');
    }
}

function saveDataToFile() {
    try {
        const data = {
            subscriptions: Array.from(subscriptions.entries()),
            savedAt: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(`💾 Saved ${subscriptions.size} subscriptions to file`);
    } catch (error) {
        console.error('Failed to save data:', error.message);
    }
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));

app.options('*', cors());

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname), { maxAge: '1h' }));

app.use((req, res, next) => {
    res.set('Connection', 'keep-alive');
    res.set('Keep-Alive', 'timeout=30');
    next();
});

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function activateSubscription(userId, nosology, activationId) {
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
        activation_id: activationId,
        starts_at: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
    });

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

// Account portal — redirect to login page with params
app.get('/account', (req, res) => {
    const section = req.query.section || 'paresis';
    const uid = req.query.uid || '';
    const lang = req.query.lang || 'ru';
    res.redirect(`/login.html?nosology=${encodeURIComponent(section)}&user_id=${encodeURIComponent(uid)}&lang=${encodeURIComponent(lang)}`);
});

// Root serves main page
app.get('/', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login page
app.get('/login.html', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.sendFile(path.join(__dirname, 'login.html'));
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

// Support page
app.get('/support', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.sendFile(path.join(__dirname, 'support.html'));
});

app.get('/support.html', (req, res) => {
    res.redirect('/support');
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL
    });
});

// Detailed health check
app.get('/api/health/detailed', (req, res) => {
    loadDataFromFile();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        subscriptionsCount: subscriptions.size
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
 * Activate subscription
 * POST /api/subscriptions/activate
 */
app.post('/api/subscriptions/activate', (req, res) => {
    const { user_id, nosology, payment_id, secret } = req.body;

    // Simple secret check for activation
    if (secret !== 'tb_activate_2025') {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    if (!user_id || !nosology) {
        return res.status(400).json({ error: 'Missing user_id or nosology' });
    }

    const subscription = activateSubscription(user_id, nosology, payment_id || 'web_activation');

    res.json({
        success: true,
        subscription: subscription
    });
});

/**
 * Debug endpoint - list all subscriptions
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
// SUPPORT ENDPOINT
// ============================================

const SUPPORT_EMAIL = 'izoomlen@toboi.ru';

/**
 * Submit support request
 * POST /api/support
 */
app.post('/api/support', async (req, res) => {
    try {
        const { name, email, topic, message } = req.body;

        if (!name || !email || !topic || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Log the support request
        const supportRequest = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name,
            email,
            topic,
            message,
            created_at: new Date().toISOString(),
            user_agent: req.headers['user-agent'] || 'unknown'
        };

        console.log('📧 Support request received:', JSON.stringify(supportRequest, null, 2));

        // Save to file for backup
        try {
            const supportFile = '/tmp/tonebalance_support.json';
            let supportRequests = [];
            if (fs.existsSync(supportFile)) {
                supportRequests = JSON.parse(fs.readFileSync(supportFile, 'utf8'));
            }
            supportRequests.push(supportRequest);
            fs.writeFileSync(supportFile, JSON.stringify(supportRequests, null, 2));
            console.log('💾 Support request saved to file');
        } catch (fileError) {
            console.error('Failed to save support request:', fileError.message);
        }

        // For Vercel, we'll use a simple webhook or just log
        // In production, you would integrate with SendGrid, Mailgun, etc.
        // For now, return success and the form will fallback to mailto

        res.json({
            success: true,
            message: 'Support request received',
            id: supportRequest.id
        });

    } catch (error) {
        console.error('Support endpoint error:', error);
        res.status(500).json({ error: 'Failed to process support request' });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     Tone Balance Access Server Started          ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  URL:  ${BASE_URL}                               ║
║                                                ║
║  Main page:     ${BASE_URL}/                      ║
║  Login page:    ${BASE_URL}/login.html            ║
║  API Health:    ${BASE_URL}/api/health            ║
╚════════════════════════════════════════════════╝

📋 Endpoints:
    GET  /                              - Main activation page
    GET  /login.html                    - Login page
    GET  /account?section=xxx&uid=xxx   - Redirect from app to login

🔐 Login credentials:
    Email:    tonebal@mail.ru
    Password: tonebalance123
    GET  /api/subscriptions/:user_id    - Get user subscriptions
    GET  /api/subscriptions/:uid/:nos   - Check specific subscription
    POST /api/subscriptions/activate    - Activate subscription
`);
});

module.exports = app;
