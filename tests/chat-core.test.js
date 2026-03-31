const test = require('node:test');
const assert = require('node:assert/strict');

const chatCore = require('../api/_chat-core');

test('system prompt allows broader reasoning beyond curriculum', () => {
  const prompt = chatCore.buildSystemPrompt('en');

  assert.match(prompt, /general medical knowledge/i);
  assert.match(prompt, /PubMed/i);
  assert.match(prompt, /explicitly tell the user/i);
  assert.match(prompt, /OUTPUT STYLE/i);
  assert.doesNotMatch(prompt, /Base answers ONLY/i);
});

test('user prompt includes both curriculum and web context when present', () => {
  const prompt = chatCore.buildUserPrompt(
    'What are the latest CKM guidelines?',
    'Curriculum excerpt here.',
    {
      text: 'Supplemental web context text.',
    },
    'en'
  );

  assert.match(prompt, /Curriculum context:/i);
  assert.match(prompt, /PubMed context:/i);
  assert.match(prompt, /Respond in en\./i);
  assert.match(prompt, /brief and highly structured/i);
});

test('web search mode can be disabled and enabled explicitly', () => {
  const originalMode = process.env.WEB_SEARCH_MODE;

  process.env.WEB_SEARCH_MODE = 'off';
  assert.equal(chatCore.shouldUseWebSearch('What is CKM?', ['chunk']), false);

  process.env.WEB_SEARCH_MODE = 'always';
  assert.equal(chatCore.shouldUseWebSearch('What is CKM?', ['chunk']), true);

  if (originalMode === undefined) {
    delete process.env.WEB_SEARCH_MODE;
  } else {
    process.env.WEB_SEARCH_MODE = originalMode;
  }
});

test('fallback message includes the medical disclaimer', () => {
  const message = chatCore.buildFallbackMessage('pt');

  assert.match(message, /conexão com a IA/i);
  assert.match(message, /fins educacionais/i);
});

test('web context warning is localized', () => {
  assert.match(chatCore.getWebContextWarning('en'), /PubMed web sources/i);
  assert.match(chatCore.getWebContextWarning('es'), /PubMed/i);
});

test('PubMed search terms bias toward preferred evidence types', () => {
  const terms = chatCore.buildPubMedSearchTerms('heart failure');

  assert.equal(terms.length, 3);
  assert.match(terms[0].term, /practice guideline/i);
  assert.match(terms[1].term, /systematic review/i);
  assert.match(terms[1].term, /meta-analysis/i);
  assert.match(terms[2].term, /clinical trial/i);
  assert.match(terms[2].term, /randomized controlled trial/i);
});

test('PubMed evidence classification only keeps preferred article types', () => {
  assert.equal(
    chatCore.getPubMedEvidenceKind({
      publicationTypes: ['Practice Guideline'],
      publicationYear: 2024,
    }),
    'guideline'
  );

  assert.equal(
    chatCore.getPubMedEvidenceKind({
      publicationTypes: ['Systematic Review'],
      publicationYear: 2023,
    }),
    'systematic-review'
  );

  assert.equal(
    chatCore.getPubMedEvidenceKind({
      publicationTypes: ['Randomized Controlled Trial'],
      publicationYear: new Date().getFullYear(),
    }),
    'clinical-trial'
  );

  assert.equal(
    chatCore.getPubMedEvidenceKind({
      publicationTypes: ['Case Reports'],
      publicationYear: 2024,
    }),
    ''
  );
});

test('response style inference switches to expanded when asked', () => {
  assert.equal(chatCore.inferResponseStyle('Can you give me more detail?'), 'expanded');
  assert.equal(chatCore.inferResponseStyle('Just the basics, please.'), 'concise');
  assert.equal(chatCore.inferResponseStyle('What is CKM?'), 'concise');
});
