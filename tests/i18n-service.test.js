const test = require('node:test');
const assert = require('node:assert/strict');

const { I18nService } = require('../js/core/i18n-service.js');

function createFetchMock(map) {
    return async function fetchMock(url) {
        if (!(url in map)) {
            return { ok: false, json: async () => ({}) };
        }
        const payload = map[url];
        return {
            ok: true,
            json: async () => payload
        };
    };
}

test('loadLanguage fetches language locale successfully', async () => {
    const service = new I18nService({
        fetchImpl: createFetchMock({
            './locales/es.json': { nav: { home: 'Inicio' } }
        }),
        inlineFallbackEn: { nav: { home: 'Home' } }
    });

    const translations = { en: { nav: { home: 'Home' } } };
    const result = await service.loadLanguage('es', translations);

    assert.equal(result.stale, false);
    assert.equal(result.usedFallback, false);
    assert.equal(translations.es.nav.home, 'Inicio');
});

test('loadLanguage falls back to english when locale fetch fails', async () => {
    const service = new I18nService({
        fetchImpl: createFetchMock({
            './locales/en.json': { nav: { home: 'Home from fetch' } }
        }),
        inlineFallbackEn: { nav: { home: 'Inline home' } }
    });

    const translations = {};
    const result = await service.loadLanguage('pt', translations);

    assert.equal(result.usedFallback, true);
    assert.equal(translations.en.nav.home, 'Home from fetch');
    assert.equal(translations.pt.nav.home, 'Home from fetch');
});

test('loadLanguage uses inline fallback when language and english fetch fail', async () => {
    const service = new I18nService({
        fetchImpl: async () => ({ ok: false, json: async () => ({}) }),
        inlineFallbackEn: { nav: { home: 'Inline home' } }
    });

    const translations = {};
    await service.loadLanguage('pt', translations);

    assert.equal(translations.en.nav.home, 'Inline home');
    assert.equal(translations.pt.nav.home, 'Inline home');
});

test('loadLanguage returns stale when superseded request token is no longer active', async () => {
    let stale = true;
    const service = new I18nService({
        fetchImpl: createFetchMock({
            './locales/es.json': { nav: { home: 'Inicio' } }
        }),
        inlineFallbackEn: { nav: { home: 'Home' } }
    });

    const translations = { en: { nav: { home: 'Home' } } };
    const token = Symbol('request');
    const result = await service.loadLanguage('es', translations, {
        requestToken: token,
        isLatestRequest: () => !stale
    });

    assert.equal(result.stale, true);
    assert.equal(translations.es, undefined);
});
