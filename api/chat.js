const crypto = require('crypto');

const {
  applyCorsHeaders,
  enforceChatRateLimit,
  ensureSession,
  getMedicalDisclaimer,
  handleOptions,
  json,
  validateChatRequest,
} = require('./_shared');

const CHAT_TIMEOUT_MS = 30000;

function buildSystemPrompt(language) {
  return `You are a medical education assistant for the EMPOWER-CKM program.
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
}

function buildUserPrompt(query, context) {
  if (context) {
    return `Context:\n${context}\n\nUser Question: ${query}\n\nPlease provide a helpful answer based on the context above.`;
  }

  return `User Question: ${query}\n\nPlease provide a helpful answer based on the EMPOWER-CKM curriculum.`;
}

function buildFallbackMessage(language) {
  const messages = {
    en: "I have found relevant information in our curriculum about this, but the AI connection is currently being configured. Please consult your physician at the clinic for specific details.\n\n",
    pt: "Encontrei informações relevantes em nosso currículo sobre isso, mas a conexão com a IA está sendo configurada. Por favor, consulte seu médico na clínica para detalhes específicos.\n\n",
    es: "He encontrado información relevante en nuestro currículo sobre esto, pero la conexión de IA se está configurando actualmente. Consulte a su médico en la clínica para obtener detalles específicos.\n\n",
  };

  const message = messages[language] || messages.en;
  return message + getMedicalDisclaimer(language);
}

module.exports = async function chat(req, res) {
  applyCorsHeaders(req, res);

  if (handleOptions(req, res)) {
    return;
  }

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

  const { query, context, language = 'en' } = req.body;
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(query, context);

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
  const responseText = `${data.choices[0].message.content}\n\n${medicalDisclaimer}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`Chat request from user ${session.userId}: ${query.substring(0, 50)}...`);
  } else {
    console.log(`Chat request from user ${session.userId} at ${new Date().toISOString()}`);
  }

  json(res, 200, {
    response: responseText,
    usage: data.usage,
  });
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    maxDuration: 60,
  },
};
