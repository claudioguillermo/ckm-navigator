const { applyCorsHeaders, handleOptions, json } = require('./_shared');

module.exports = function health(req, res) {
  applyCorsHeaders(req, res);

  if (handleOptions(req, res)) {
    return;
  }

  json(res, 200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.QWEN_API_KEY,
  });
};
