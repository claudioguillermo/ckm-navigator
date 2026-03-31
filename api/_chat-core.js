const parsedTimeout = Number.parseInt(process.env.WEB_SEARCH_TIMEOUT_MS || '6000', 10);
const WEB_SEARCH_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 6000;
const parsedMaxResults = Number.parseInt(process.env.WEB_SEARCH_MAX_RESULTS || '4', 10);
const WEB_SEARCH_MAX_RESULTS = Math.max(1, Math.min(6, Number.isFinite(parsedMaxResults) ? parsedMaxResults : 4));
const PUBMED_TRIAL_LOOKBACK_YEARS = 5;

function getMedicalDisclaimer(language) {
  const disclaimers = {
    en: '⚕️ This information is for educational purposes only. Always consult your healthcare provider for medical advice.',
    pt: '⚕️ Esta informação é apenas para fins educacionais. Sempre consulte seu médico para aconselhamento médico.',
    es: '⚕️ Esta información es solo con fines educativos. Siempre consulte a su proveedor de atención médica para obtener asesoramiento médico.',
  };

  return disclaimers[language] || disclaimers.en;
}

function buildFallbackMessage(language) {
  const messages = {
    en: 'I have found relevant information in our curriculum about this, but the AI connection is currently being configured. Please consult your physician at the clinic for specific details.\n\n',
    pt: 'Encontrei informações relevantes em nosso currículo sobre isso, mas a conexão com a IA está sendo configurada. Por favor, consulte seu médico na clínica para detalhes específicos.\n\n',
    es: 'He encontrado información relevante en nuestro currículo sobre esto, pero la conexión de IA se está configurando actualmente. Consulte a su médico en la clínica para obtener detalles específicos.\n\n',
  };

  const message = messages[language] || messages.en;
  return message + getMedicalDisclaimer(language);
}

function buildSystemPrompt(language) {
  return `You are a medical education assistant for the EMPOWER-CKM program.
You help patients understand cardio-kidney-metabolic health in simple terms.

GUIDANCE:
- Use the provided curriculum context as your primary source when it is relevant
- You may also rely on your general medical knowledge to make the answer more complete
- If supplemental web context is provided, it comes from PubMed only and should be treated as supporting evidence
- If PubMed context is used, explicitly tell the user that you used PubMed web sources
- Prefer PubMed clinical guidelines, systematic reviews, meta-analyses, and recent clinical trials over lower-evidence article types
- Do not limit yourself to the curriculum when the question needs broader explanation, examples, or current background
- Keep language simple and accessible, at a pre-high-school reading level
- Respect cultural food preferences (e.g., Brazilian/Portuguese, Latin/Spanish)
- Always include the medical disclaimer
- Cite curriculum sources with [Source N] notation when you use them
- If the evidence is weak or conflicting, say so clearly instead of guessing
- If the question is outside the curriculum and you need to generalize, answer carefully and note that it is general guidance

Language: ${language}
Target audience: Portuguese/Spanish-speaking immigrant populations in Massachusetts`;
}

function buildUserPrompt(query, curriculumContext, webContext, language) {
  const parts = [];

  if (curriculumContext) {
    parts.push(`Curriculum context:\n${curriculumContext}`);
  }

  if (webContext?.text) {
    parts.push(`PubMed context:\n${webContext.text}`);
  }

  parts.push(`User Question: ${query}`);
  parts.push(
    `Respond in ${language}. Use the curriculum as the starting point, but feel free to synthesize with the PubMed context and your general knowledge to give a fuller, more balanced answer. If PubMed context is present, mention that PubMed web sources were used.`
  );

  return parts.join('\n\n');
}

function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXmlEntities(text) {
  return String(text || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function extractFirstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : '';
}

function extractPublicationTypes(xml) {
  return [...xml.matchAll(/<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/gi)]
    .map((match) => stripHtml(decodeXmlEntities(match[1])))
    .filter(Boolean);
}

function extractPubMedArticleXml(xml) {
  const pmid = stripHtml(extractFirstMatch(xml, /<PMID[^>]*>([\s\S]*?)<\/PMID>/i));
  const title = stripHtml(decodeXmlEntities(extractFirstMatch(xml, /<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/i)));
  const abstractMatches = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)];
  const abstract = abstractMatches
    .map((match) => stripHtml(decodeXmlEntities(match[1])))
    .filter(Boolean)
    .join(' ');
  const journal = stripHtml(decodeXmlEntities(extractFirstMatch(xml, /<Journal>[\s\S]*?<Title[^>]*>([\s\S]*?)<\/Title>[\s\S]*?<\/Journal>/i)));
  const year = stripHtml(
    decodeXmlEntities(
      extractFirstMatch(xml, /<PubDate>[\s\S]*?(?:<Year[^>]*>([\s\S]*?)<\/Year>|<MedlineDate[^>]*>([\s\S]*?)<\/MedlineDate>)/i) ||
      extractFirstMatch(xml, /<PubDate>[\s\S]*?<Year[^>]*>([\s\S]*?)<\/Year>/i) ||
      extractFirstMatch(xml, /<PubDate>[\s\S]*?<MedlineDate[^>]*>([\s\S]*?)<\/MedlineDate>/i)
    )
  );
  const publicationTypes = extractPublicationTypes(xml);
  const publicationYear = Number.parseInt(year.match(/\d{4}/)?.[0] || '', 10) || null;

  const snippetParts = [abstract, journal && year ? `${journal} (${year})` : journal, year && !journal ? year : '']
    .filter(Boolean);

  return {
    pmid,
    title: title || `PubMed article ${pmid}`,
    snippet: snippetParts.join(' '),
    url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
    provider: 'PubMed',
    publicationTypes,
    publicationYear,
  };
}

function escapePubMedSearchText(text) {
  return String(text || '')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPubMedSearchTerms(query) {
  const safeQuery = escapePubMedSearchText(query);
  const currentYear = new Date().getFullYear();
  const trialWindowStart = currentYear - PUBMED_TRIAL_LOOKBACK_YEARS;
  const trialWindow = `("${trialWindowStart}/01/01"[dp] : "3000"[dp])`;

  return [
    {
      label: 'guideline',
      term: `(${safeQuery}) AND ("practice guideline"[ptyp] OR guideline[ptyp] OR "consensus development conference"[ptyp] OR recommendation[tiab] OR consensus[tiab])`,
    },
    {
      label: 'systematic-review',
      term: `(${safeQuery}) AND ("systematic review"[ptyp] OR "meta-analysis"[ptyp])`,
    },
    {
      label: 'clinical-trial',
      term: `(${safeQuery}) AND ("clinical trial"[ptyp] OR "randomized controlled trial"[ptyp]) AND ${trialWindow}`,
    },
  ];
}

function getPubMedEvidenceKind(article) {
  const types = new Set((article.publicationTypes || []).map((type) => type.toLowerCase()));

  if (types.has('practice guideline') || types.has('guideline') || types.has('consensus development conference')) {
    return 'guideline';
  }

  if (types.has('systematic review') || types.has('meta-analysis')) {
    return 'systematic-review';
  }

  const looksLikeTrial =
    types.has('clinical trial') ||
    types.has('randomized controlled trial') ||
    [...types].some((type) => type.includes('clinical trial') || type.includes('randomized controlled trial'));

  const year = article.publicationYear || 0;
  const isRecent = year >= new Date().getFullYear() - PUBMED_TRIAL_LOOKBACK_YEARS;

  if (looksLikeTrial && isRecent) {
    return 'clinical-trial';
  }

  return '';
}

function getPubMedEvidencePriority(kind) {
  if (kind === 'guideline') return 3;
  if (kind === 'systematic-review') return 2;
  if (kind === 'clinical-trial') return 1;
  return 0;
}

async function fetchPubMedContext(query, limit) {
  if (typeof fetch !== 'function') {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS);

  try {
    const searchTerms = buildPubMedSearchTerms(query);
    const collectedArticles = [];

    for (const searchTerm of searchTerms) {
      const searchResponse = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerm.term)}&retmode=json&retmax=${limit}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; CKM Navigator/1.0)',
          },
          signal: controller.signal,
        }
      );

      if (!searchResponse.ok) {
        continue;
      }

      const searchData = await searchResponse.json();
      const pmids = (searchData?.esearchresult?.idlist || []).slice(0, limit);
      if (!pmids.length) {
        continue;
      }

      const articleXmlResponses = await Promise.all(
        pmids.map(async (pmid) => {
          try {
            const articleResponse = await fetch(
              `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${encodeURIComponent(pmid)}&retmode=xml`,
              {
                headers: {
                  Accept: 'application/xml,text/xml',
                  'User-Agent': 'Mozilla/5.0 (compatible; CKM Navigator/1.0)',
                },
                signal: controller.signal,
              }
            );

            if (!articleResponse.ok) {
              return null;
            }

            const xml = await articleResponse.text();
            const article = extractPubMedArticleXml(xml);
            const evidenceKind = getPubMedEvidenceKind(article);

            if (!evidenceKind) {
              return null;
            }

            return {
              ...article,
              evidenceKind,
              evidencePriority: getPubMedEvidencePriority(evidenceKind),
              sourceBucket: searchTerm.label,
            };
          } catch {
            return null;
          }
        })
      );

      collectedArticles.push(...articleXmlResponses.filter(Boolean));
      if (collectedArticles.length >= limit) {
        break;
      }
    }

    return collectedArticles
      .sort((a, b) => {
        if (b.evidencePriority !== a.evidencePriority) {
          return b.evidencePriority - a.evidencePriority;
        }

        return (b.publicationYear || 0) - (a.publicationYear || 0);
      })
      .slice(0, limit)
      .filter((item) => item.snippet || item.url);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function dedupeWebSources(sources, limit) {
  const seen = new Set();
  const unique = [];

  for (const source of sources) {
    const key = source.url || `${source.provider}:${source.title}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(source);

    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}

function formatWebContext(sources) {
  if (!sources.length) {
    return '';
  }

  const lines = [
    'PubMed context (use as supporting evidence, not as the only authority). Prefer clinical guidelines, systematic reviews, meta-analyses, and recent clinical trials:',
  ];

  sources.forEach((source, index) => {
    lines.push(
      `[PubMed ${index + 1} | ${source.evidenceKind || source.sourceBucket || 'pubmed'}] ${source.title}${source.url ? `\nURL: ${source.url}` : ''}${source.snippet ? `\n${source.snippet}` : ''}`
    );
  });

  return lines.join('\n\n');
}

function getWebContextWarning(language) {
  const messages = {
    en: 'Note: I also used PubMed web sources for this answer.',
    pt: 'Nota: também usei fontes da web do PubMed para esta resposta.',
    es: 'Nota: también usé fuentes web de PubMed para esta respuesta.',
  };

  return messages[language] || messages.en;
}

function shouldUseWebSearch(query, curriculumChunks = []) {
  const mode = (process.env.WEB_SEARCH_MODE || 'adaptive').toLowerCase();
  if (mode === 'off') {
    return false;
  }

  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return false;
  }

  if (mode === 'always') {
    return true;
  }

  const normalized = trimmed.toLowerCase();
  const currentInfoSignals = [
    'latest',
    'current',
    'recent',
    'today',
    'guideline',
    'guidelines',
    'recommendation',
    'recommendations',
    'research',
    'study',
    'studies',
    'news',
    'update',
    'updated',
    '2024',
    '2025',
    '2026',
  ];

  if (currentInfoSignals.some((signal) => normalized.includes(signal))) {
    return true;
  }

  if ((curriculumChunks || []).length < 2) {
    return true;
  }

  return normalized.length > 80;
}

async function fetchWebContext(query, options = {}) {
  const curriculumChunks = options.curriculumChunks || [];
  if (!shouldUseWebSearch(query, curriculumChunks)) {
    return { text: '', sources: [], warning: '' };
  }

  const limit = WEB_SEARCH_MAX_RESULTS;
  const pubMedResults = await fetchPubMedContext(query, limit);

  const sources = dedupeWebSources(
    pubMedResults,
    limit
  );

  return {
    text: formatWebContext(sources),
    sources: sources.map((source, index) => ({
      id: `web-${index + 1}`,
      title: source.title,
      url: source.url,
      snippet: source.snippet,
      provider: source.provider,
      evidenceKind: source.evidenceKind,
      sourceBucket: source.sourceBucket,
    })),
    warning: sources.length > 0 ? getWebContextWarning(options.language) : '',
  };
}

module.exports = {
  buildFallbackMessage,
  buildPubMedSearchTerms,
  buildSystemPrompt,
  buildUserPrompt,
  fetchWebContext,
  getMedicalDisclaimer,
  getWebContextWarning,
  getPubMedEvidenceKind,
  shouldUseWebSearch,
};
