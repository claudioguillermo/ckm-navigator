const { applyCorsHeaders, ensureSession, handleOptions, json } = require('../_shared');

module.exports = function initSession(req, res) {
  applyCorsHeaders(req, res);

  if (handleOptions(req, res)) {
    return;
  }

  const session = ensureSession(req, res);

  json(res, 200, {
    success: true,
    userId: session.userId,
  });
};
