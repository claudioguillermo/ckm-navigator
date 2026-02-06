(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.I18nService = api.I18nService;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    class I18nService {
        constructor(options) {
            const opts = options || {};
            this.fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
            this.basePath = opts.basePath || './locales';
            this.inlineFallbackEn = opts.inlineFallbackEn || {};
            this.loadedLocales = new Set();
        }

        async fetchLocale(lang) {
            if (!this.fetchImpl) {
                throw new Error('Fetch is not available for locale loading');
            }

            const response = await this.fetchImpl(`${this.basePath}/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Could not load locale: ${lang}`);
            }
            return response.json();
        }

        async ensureEnglish(translations, requestToken, isLatestRequest) {
            if (translations.en && this.loadedLocales.has('en')) {
                return translations.en;
            }

            try {
                const enData = await this.fetchLocale('en');
                if (typeof isLatestRequest === 'function' && !isLatestRequest(requestToken)) {
                    return null;
                }
                translations.en = enData;
                this.loadedLocales.add('en');
                return enData;
            } catch (_) {
                translations.en = this.inlineFallbackEn;
                this.loadedLocales.add('en');
                return translations.en;
            }
        }

        async loadLanguage(lang, translations, options) {
            const opts = options || {};
            const requestToken = opts.requestToken;
            const isLatestRequest = opts.isLatestRequest;

            if (translations[lang] && this.loadedLocales.has(lang)) {
                return {
                    language: lang,
                    stale: false,
                    usedFallback: false,
                    translations
                };
            }

            let usedFallback = false;

            try {
                const langData = await this.fetchLocale(lang);
                if (typeof isLatestRequest === 'function' && !isLatestRequest(requestToken)) {
                    return { language: lang, stale: true, usedFallback: false, translations };
                }
                translations[lang] = langData;
                this.loadedLocales.add(lang);
                return {
                    language: lang,
                    stale: false,
                    usedFallback: false,
                    translations
                };
            } catch (_) {
                usedFallback = true;
            }

            const enData = await this.ensureEnglish(translations, requestToken, isLatestRequest);
            if (typeof isLatestRequest === 'function' && !isLatestRequest(requestToken)) {
                return { language: lang, stale: true, usedFallback: usedFallback, translations };
            }

            if (!translations[lang]) {
                translations[lang] = enData || this.inlineFallbackEn;
            }
            this.loadedLocales.add(lang);

            return {
                language: lang,
                stale: false,
                usedFallback,
                translations
            };
        }
    }

    return { I18nService };
});
