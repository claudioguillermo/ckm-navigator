const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'ckm_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_MAX_REQUESTS = 10;

const rateLimitStore = globalThis.__ckmRateLimitStore || new Map();
globalThis.__ckmRateLimitStore = rateLimitStore;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || 'change-this-in-production';
}

function getSessionSameSite() {
  const value = (process.env.SESSION_COOKIE_SAMESITE || 'lax').toLowerCase();
  if (value === 'lax' || value === 'strict' || value === 'none') {
    return value;
  }
  return 'lax';
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((cookies, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      return cookies;
    }

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
}

function timingSafeEqual(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function signValue(value) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(value)
    .digest('base64url');
}

function createSessionCookie(userId) {
  const signature = signValue(userId);
  const cookieValue = `${userId}.${signature}`;
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(cookieValue)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    `SameSite=${getSessionSameSite()[0].toUpperCase()}${getSessionSameSite().slice(1)}`,
  ];

  if (isProduction() || getSessionSameSite() === 'none') {
    attrs.push('Secure');
  }

  return attrs.join('; ');
}

function verifySessionCookie(cookieValue) {
  if (!cookieValue) {
    return null;
  }

  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex === -1) {
    return null;
  }

  const userId = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);
  const expectedSignature = signValue(userId);

  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  return userId;
}

function generateUserId() {
  return `user_${crypto.randomUUID()}`;
}

function getCookieValue(req, name) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[name];
}

function getSessionUserId(req) {
  const rawCookie = getCookieValue(req, SESSION_COOKIE_NAME);
  return verifySessionCookie(rawCookie);
}

function ensureSession(req, res) {
  const currentUserId = getSessionUserId(req);
  if (currentUserId) {
    return { userId: currentUserId, created: false };
  }

  const userId = generateUserId();
  res.setHeader('Set-Cookie', createSessionCookie(userId));
  return { userId, created: true };
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const directIp = req.headers['x-real-ip'] || req.socket?.remoteAddress;
  if (typeof directIp === 'string' && directIp.trim()) {
    return directIp.trim();
  }

  return 'anonymous';
}

function getRateLimitKey(req) {
  return getSessionUserId(req) || getClientIp(req);
}

function getRateLimitState(key) {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || now >= current.resetAt) {
    const fresh = { count: 0, resetAt: now + CHAT_WINDOW_MS };
    rateLimitStore.set(key, fresh);
    return fresh;
  }

  return current;
}

function pruneRateLimitMap() {
  const now = Date.now();
  for (const [key, state] of rateLimitStore.entries()) {
    if (now >= state.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

function applyRateHeaders(res, state) {
  const remaining = Math.max(0, CHAT_MAX_REQUESTS - state.count);
  res.setHeader('RateLimit-Limit', String(CHAT_MAX_REQUESTS));
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(Math.ceil(state.resetAt / 1000)));
}

function enforceChatRateLimit(req, res) {
  pruneRateLimitMap();
  const key = getRateLimitKey(req);
  const state = getRateLimitState(key);

  if (state.count >= CHAT_MAX_REQUESTS) {
    applyRateHeaders(res, state);
    return { allowed: false, state };
  }

  state.count += 1;
  applyRateHeaders(res, state);
  return { allowed: true, state };
}

function getSameOrigin(req) {
  const forwardedProto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const forwardedHost = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();

  if (!forwardedHost) {
    return null;
  }

  return `${forwardedProto}://${forwardedHost}`;
}

function isOriginAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  const sameOrigin = getSameOrigin(req);
  if (sameOrigin && origin === sameOrigin) {
    return true;
  }

  return false;
}

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin || !isOriginAllowed(req)) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Vary', 'Origin');
}

function handleOptions(req, res) {
  if (req.method !== 'OPTIONS') {
    return false;
  }

  applyCorsHeaders(req, res);
  res.statusCode = 204;
  res.end();
  return true;
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function validateChatRequest(body) {
  const { query, context } = body || {};

  if (!query || typeof query !== 'string') {
    return 'Invalid query parameter';
  }

  if (query.length > 1000) {
    return 'Query too long (max 1000 characters)';
  }

  if (context && typeof context !== 'string') {
    return 'Invalid context parameter';
  }

  if (context && context.length > 10000) {
    return 'Context too long (max 10000 characters)';
  }

  return null;
}

function getMedicalDisclaimer(language) {
  const disclaimers = {
    en: '⚕️ This information is for educational purposes only. Always consult your healthcare provider for medical advice.',
    pt: '⚕️ Esta informação é apenas para fins educacionais. Sempre consulte seu médico para aconselhamento médico.',
    es: '⚕️ Esta información es solo con fines educativos. Siempre consulte a su proveedor de atención médica para obtener asesoramiento médico.',
  };

  return disclaimers[language] || disclaimers.en;
}

function getSessionInfo(req) {
  return {
    userId: getSessionUserId(req),
    cookieName: SESSION_COOKIE_NAME,
  };
}

module.exports = {
  applyCorsHeaders,
  enforceChatRateLimit,
  ensureSession,
  generateUserId,
  getAllowedOrigins,
  getClientIp,
  getMedicalDisclaimer,
  getRateLimitKey,
  getRateLimitState,
  getSessionInfo,
  getSessionSameSite,
  getSessionSecret,
  handleOptions,
  isOriginAllowed,
  json,
  parseCookies,
  validateChatRequest,
  verifySessionCookie,
};
