/**
 * Secure Backend API for EMPOWER-CKM Navigator
 *
 * This server acts as a proxy between the frontend and Claude API,
 * protecting the API key and implementing rate limiting.
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', 1);

const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_MAX_REQUESTS = 10;
const chatRateTracker = new Map();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
const configuredOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const allowedOrigins = process.env.NODE_ENV === 'production' ? configuredOrigins : [...new Set([...defaultDevOrigins, ...configuredOrigins])];

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.error('❌ ALLOWED_ORIGINS or FRONTEND_URL must be configured in production.');
    process.exit(1);
}

const corsOptions = {
    origin(origin, callback) {
        // Allow same-origin/non-browser requests and configured origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const isProd = process.env.NODE_ENV === 'production';
const sessionCookieSameSite = (process.env.SESSION_COOKIE_SAMESITE || (isProd ? 'none' : 'lax')).toLowerCase();
const validSameSite = new Set(['lax', 'strict', 'none']);
const normalizedSameSite = validSameSite.has(sessionCookieSameSite) ? sessionCookieSameSite : (isProd ? 'none' : 'lax');
const sessionStore = new MemoryStore({
    checkPeriod: 24 * 60 * 60 * 1000
});

// Session management
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProd, // HTTPS only in production
        sameSite: normalizedSameSite,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static frontend hosting for single-deploy environments
app.use(express.static(path.join(__dirname)));

function getRateLimitKey(req) {
    return req.session?.userId || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
}

function getRateLimitState(req) {
    const key = getRateLimitKey(req);
    const now = Date.now();
    const current = chatRateTracker.get(key);
    if (!current || now >= current.resetAt) {
        const fresh = { count: 0, resetAt: now + CHAT_WINDOW_MS };
        chatRateTracker.set(key, fresh);
        return fresh;
    }
    return current;
}

function pruneRateLimitMap() {
    const now = Date.now();
    for (const [key, state] of chatRateTracker.entries()) {
        if (now >= state.resetAt) {
            chatRateTracker.delete(key);
        }
    }
}

function applyRateHeaders(res, state) {
    const remaining = Math.max(0, CHAT_MAX_REQUESTS - state.count);
    res.setHeader('RateLimit-Limit', String(CHAT_MAX_REQUESTS));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(state.resetAt / 1000)));
}

function enforceChatRateLimit(req, res, next) {
    pruneRateLimitMap();
    const state = getRateLimitState(req);
    if (state.count >= CHAT_MAX_REQUESTS) {
        applyRateHeaders(res, state);
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    state.count += 1;
    applyRateHeaders(res, state);
    return next();
}

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

function validateChatRequest(req, res, next) {
    const { query, context } = req.body;

    // Validate query
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Invalid query parameter' });
    }

    if (query.length > 1000) {
        return res.status(400).json({ error: 'Query too long (max 1000 characters)' });
    }

    // Validate context (optional)
    if (context && typeof context !== 'string') {
        return res.status(400).json({ error: 'Invalid context parameter' });
    }

    if (context && context.length > 10000) {
        return res.status(400).json({ error: 'Context too long (max 10000 characters)' });
    }

    next();
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        apiKeyConfigured: !!process.env.QWEN_API_KEY
    });
});

/**
 * Initialize session (call this on app load)
 */
app.post('/api/session/init', (req, res) => {
    if (!req.session.initialized) {
        req.session.initialized = true;
        req.session.userId = generateUserId();
        req.session.createdAt = new Date().toISOString();
    }

    res.json({
        success: true,
        userId: req.session.userId
    });
});

/**
 * Chat endpoint - proxies to Qwen API
 */
app.post('/api/chat', enforceChatRateLimit, validateChatRequest, async (req, res) => {
    try {
        // Check if session initialized
        if (!req.session.initialized) {
            return res.status(401).json({
                error: 'Session not initialized. Please refresh the page.'
            });
        }

        // Check if API key configured
        if (!process.env.QWEN_API_KEY) {
            return res.status(503).json({
                error: 'API key not configured',
                fallback: true
            });
        }

        if (typeof fetch !== 'function') {
            return res.status(500).json({
                error: 'Server runtime does not support fetch. Use Node.js 18+.'
            });
        }

        const { query, context, language = 'en' } = req.body;

        // Build system prompt
        const systemPrompt = `You are a medical education assistant for the EMPOWER-CKM program.
You help patients understand cardio-kidney-metabolic health in simple terms.

CRITICAL RULES:
- Base answers ONLY on the provided context
- Use simple, clear language (pre-high school reading level)
- Respect cultural food preferences (e.g., Brazilian/Portuguese, Latin/Spanish)
- Always include medical disclaimer
- Cite sources with [Source N] notation
- If context doesn't answer the question, say so clearly

Language: ${language}
Target audience: Portuguese/Spanish-speaking immigrant populations in Massachusetts`;

        const userPrompt = context
            ? `Context:\n${context}\n\nUser Question: ${query}\n\nPlease provide a helpful answer based on the context above.`
            : `User Question: ${query}\n\nPlease provide a helpful answer based on the EMPOWER-CKM curriculum.`;

        // Call Qwen API
        const response = await fetch('https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.QWEN_API_KEY}`
            },
            body: JSON.stringify({
                model: 'qwen-flash-2025-07-28-us',
                max_tokens: 1000,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Qwen API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to get response from AI service',
                details: process.env.NODE_ENV === 'development' ? errorText : undefined
            });
        }

        const data = await response.json();

        // Validate response structure
        if (!data?.choices?.[0]?.message?.content) {
            console.error('Invalid API response structure:', data);
            return res.status(500).json({ error: 'Invalid response from AI service' });
        }

        // Add medical disclaimer
        const medicalDisclaimers = {
            en: "⚕️ This information is for educational purposes only. Always consult your healthcare provider for medical advice.",
            pt: "⚕️ Esta informação é apenas para fins educacionais. Sempre consulte seu médico para aconselhamento médico.",
            es: "⚕️ Esta información es solo con fines educativos. Siempre consulte a su proveedor de atención médica para obtener asesoramiento médico."
        };

        const responseText = data.choices[0].message.content + '\n\n' + (medicalDisclaimers[language] || medicalDisclaimers.en);

        // Log usage (optional - for monitoring)
        console.log(`Chat request from user ${req.session.userId}: ${query.substring(0, 50)}...`);

        res.json({
            response: responseText,
            usage: data.usage // Token usage for monitoring
        });

    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Get rate limit status
 */
app.get('/api/rate-limit', (req, res) => {
    pruneRateLimitMap();
    const rateLimitInfo = getRateLimitState(req);
    res.json({
        limit: CHAT_MAX_REQUESTS,
        remaining: Math.max(0, CHAT_MAX_REQUESTS - rateLimitInfo.count),
        resetTime: new Date(rateLimitInfo.resetAt).toISOString()
    });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// API 404 handler
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// SPA fallback for non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
    console.log(`🚀 EMPOWER-CKM Backend API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Key configured: ${!!process.env.QWEN_API_KEY}`);
    console.log(`🔒 CORS enabled for:`, allowedOrigins.length > 0 ? allowedOrigins : '(same-origin only)');
    console.log(`🍪 Session cookie sameSite: ${normalizedSameSite}`);

    if (!process.env.QWEN_API_KEY) {
        console.warn('⚠️  WARNING: QWEN_API_KEY not set. Chat functionality will not work.');
    }

    if (process.env.SESSION_SECRET === 'change-this-in-production') {
        console.warn('⚠️  WARNING: Using default SESSION_SECRET. Change this in production!');
    }

    if (normalizedSameSite === 'none' && !isProd) {
        console.warn('⚠️  SESSION_COOKIE_SAMESITE=none is unusual in development.');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
