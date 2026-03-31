const {
  applyCorsHeaders,
  enforceChatRateLimit,
  ensureSession,
  handleOptions,
  json,
  validateChatRequest,
} = require('./_shared');
const {
  buildFallbackMessage,
  buildSystemPrompt,
  buildUserPrompt,
  fetchWebContext,
  getMedicalDisclaimer,
  inferResponseStyle,
} = require('./_chat-core');

const CHAT_TIMEOUT_MS = 30000;

module.exports = async function chat(req, res) {
  applyCorsHeaders(req, res);

  if (handleOptions(req, res)) {
    return;
  }

  const { query, context, language = 'en' } = req.body || {};
  const validationError = validateChatRequest(req.body);
  if (validationError) {
    json(res, 400, { error: validationError });
    return;
  }

  const session = ensureSession(req, res);
  if (!session.userId) {
    json(res, 401, { error: 'Session not initialized. Please refresh the page.' });
    return;
  }

  const rateLimit = enforceChatRateLimit(req, res);
  if (!rateLimit.allowed) {
    json(res, 429, { error: 'Too many requests, please try again later.' });
    return;
  }

  if (!process.env.QWEN_API_KEY) {
    json(res, 503, {
      error: 'API key not configured',
      fallback: true,
      response: buildFallbackMessage(language),
    });
    return;
  }

  if (typeof fetch !== 'function') {
    json(res, 500, {
      error: 'Server runtime does not support fetch. Use Node.js 18+.',
    });
    return;
  }

  const responseStyle = inferResponseStyle(query);
  const systemPrompt = buildSystemPrompt(language, responseStyle);
  const webContext = await fetchWebContext(query, {
    curriculumChunks: context ? [context] : [],
    language,
  });
  const userPrompt = buildUserPrompt(query, context, webContext, language, responseStyle);

  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch('https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-flash-2025-07-28-us',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(fetchTimeout);

    json(res, 200, {
      response: buildFallbackMessage(language),
      fallback: true,
      error: 'Failed to contact AI service',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
    return;
  } finally {
    clearTimeout(fetchTimeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Qwen API error:', response.status, errorText);
    json(res, 200, {
      response: buildFallbackMessage(language),
      fallback: true,
      error: 'Failed to get response from AI service',
      details: process.env.NODE_ENV === 'development' ? errorText : undefined,
    });
    return;
  }

  const data = await response.json();
  if (!data?.choices?.[0]?.message?.content) {
    console.error('Invalid API response structure:', data);
    json(res, 500, { error: 'Invalid response from AI service' });
    return;
  }

  const medicalDisclaimer = getMedicalDisclaimer(language);
  const webContextWarning = webContext.warning ? `${webContext.warning}\n\n` : '';
  const responseText = `${webContextWarning}${data.choices[0].message.content}\n\n${medicalDisclaimer}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`Chat request from user ${session.userId}: ${query.substring(0, 50)}...`);
  } else {
    console.log(`Chat request from user ${session.userId} at ${new Date().toISOString()}`);
  }

  json(res, 200, {
    response: responseText,
    usage: data.usage,
    webSources: webContext.sources,
    webContextUsed: webContext.sources.length > 0,
  });
};
