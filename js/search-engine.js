/**
 * Hybrid search combining:
 * - BM25 for exact medical term matching
 * - Semantic similarity (simplified keyword overlap) for concept matching
 */
class HybridSearchEngine {
    constructor(chunks) {
        this.chunks = chunks;
        this.bm25Index = this.buildBM25Index(chunks);
    }

    buildBM25Index(chunks) {
        const index = {};
        const k1 = 1.5;
        const b = 0.75;

        const docFreq = {};
        const avgDocLength = chunks.reduce((sum, chunk) =>
            sum + chunk.content.split(/\s+/).length, 0) / chunks.length;

        chunks.forEach((chunk, idx) => {
            const terms = this.tokenize(chunk.content);
            const termFreq = {};

            terms.forEach(term => {
                termFreq[term] = (termFreq[term] || 0) + 1;
                if (!docFreq[term]) docFreq[term] = new Set();
                docFreq[term].add(idx);
            });

            index[chunk.id] = {
                terms: termFreq,
                docLength: terms.length,
                chunk: chunk
            };
        });

        return { index, docFreq, avgDocLength, k1, b, totalDocs: chunks.length };
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 2);
    }

    bm25Search(query, topK = 10) {
        const queryTerms = this.tokenize(query);
        const scores = {};

        const { index, docFreq, avgDocLength, k1, b, totalDocs } = this.bm25Index;

        for (const docId in index) {
            let score = 0;
            const doc = index[docId];

            queryTerms.forEach(term => {
                if (doc.terms[term]) {
                    const tf = doc.terms[term];
                    const df = docFreq[term]?.size || 0;

                    // SECURITY FIX: Prevent negative values in IDF calculation
                    // Clamp numerator to prevent Math.log(negative) = NaN
                    const numerator = Math.max(0.01, (totalDocs - df + 0.5));
                    const denominator = Math.max(0.01, (df + 0.5));
                    const idf = Math.log(numerator / denominator + 1);

                    score += idf * (tf * (k1 + 1)) /
                        (tf + k1 * (1 - b + b * (doc.docLength / avgDocLength)));
                }
            });

            if (score > 0) {
                scores[docId] = score;
            }
        }

        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topK)
            .map(([docId, score]) => ({
                chunk: index[docId].chunk,
                score: score,
                method: 'bm25'
            }));
    }

    semanticSearch(query, topK = 10) {
        const queryTerms = new Set(this.tokenize(query));
        const scores = [];

        this.chunks.forEach(chunk => {
            const chunkTerms = new Set(this.tokenize(chunk.content));
            const overlap = [...queryTerms].filter(t => chunkTerms.has(t)).length;

            // BUG FIX: Prevent division by zero
            // If either set is empty, similarity is 0
            let similarity = 0;
            if (queryTerms.size > 0 && chunkTerms.size > 0) {
                similarity = overlap / Math.sqrt(queryTerms.size * chunkTerms.size);
            }

            if (similarity > 0) {
                scores.push({
                    chunk: chunk,
                    score: similarity,
                    method: 'semantic'
                });
            }
        });

        return scores.sort((a, b) => b.score - a.score).slice(0, topK);
    }

    hybridSearch(query, topK = 5) {
        const bm25Results = this.bm25Search(query, 15);
        const semanticResults = this.semanticSearch(query, 15);

        const k = 60; // Reciprocal Rank Fusion constant
        const combinedScores = {};

        bm25Results.forEach((result, idx) => {
            const id = result.chunk.id;
            combinedScores[id] = {
                chunk: result.chunk,
                score: 1 / (k + idx + 1)
            };
        });

        semanticResults.forEach((result, idx) => {
            const id = result.chunk.id;
            if (combinedScores[id]) {
                combinedScores[id].score += 1 / (k + idx + 1);
            } else {
                combinedScores[id] = {
                    chunk: result.chunk,
                    score: 1 / (k + idx + 1)
                };
            }
        });

        return Object.values(combinedScores)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    searchWithLanguage(query, language, topK = 5) {
        const allResults = this.hybridSearch(query, topK * 3);
        return allResults
            .filter(result => result.chunk.metadata.language === language)
            .slice(0, topK);
    }
}

// Global Knowledge Extraction
function extractModuleKnowledge(translations) {
    const chunks = [];
    const langs = Object.keys(translations); // ['en', 'pt', 'es']

    langs.forEach(lang => {
        const modules = translations[lang].modules?.content;
        if (!modules) return;

        for (const moduleId in modules) {
            const module = modules[moduleId];
            // Combine all sections for chunking
            const content = module.sections.map(s => `## ${s.heading}\n${s.content}\n${s.expanded}`).join('\n\n');

            const sections = content.split(/^##\s+/m).filter(s => s.trim());

            sections.forEach((section, idx) => {
                chunks.push({
                    id: `${moduleId}_${lang}_${idx}`,
                    content: section.trim().replace(/<[^>]*>?/gm, ''), // Strip HTML for indexing
                    metadata: {
                        moduleId: moduleId,
                        moduleName: module.title,
                        language: lang,
                        category: module.category || 'general'
                    }
                });
            });
        }
    });
    return chunks;
}
