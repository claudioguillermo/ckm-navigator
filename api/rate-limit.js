const {
  applyCorsHeaders,
  ensureSession,
  handleOptions,
  json,
  getRateLimitState,
} = require('./_shared');

module.exports = function rateLimit(req, res) {
  applyCorsHeaders(req, res);

  if (handleOptions(req, res)) {
    return;
  }

  const session = ensureSession(req, res);
  const key = session.userId || req.headers['x-forwarded-for'] || 'anonymous';
  const state = getRateLimitState(key);

  json(res, 200, {
    limit: 10,
    remaining: Math.max(0, 10 - state.count),
    resetTime: new Date(state.resetAt).toISOString(),
  });
};
