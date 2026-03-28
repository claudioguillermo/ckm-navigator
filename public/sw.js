const CACHE_NAME = 'ckm-navigator-v14';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './main.js?v=10',
    './styles/main.css?v=13',
    './js/config/inline-fallback-en.js?v=10',
    './js/dom-utils.js?v=10',
    './js/core/i18n-service.js?v=10',
    './js/core/action-dispatcher.js?v=10',
    './js/features/curriculum-renderers.js?v=10',
    './js/features/curriculum-controller.js?v=10',
    './js/task-manager.js?v=10',
    './js/secure-storage.js?v=10',
    './js/chatbot.js?v=10',
    './js/search-engine.js?v=10',
    './js/features/chat-controller.js?v=10',
    './js/features/quiz-controller.js?v=10',
    './js/features/medication-controller.js?v=10',
    './js/features/analogy-controller.js?v=10',
    './js/features/movement-controller.js?v=10',
    './js/features/food-controller.js?v=10',
    './locales/en.json?v=10',
    './locales/pt.json?v=10',
    './locales/es.json?v=10',
    './favicon.ico',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/images/og-preview.png',
    './assets/screenshots/mobile-home.png',
    './assets/screenshots/desktop-dashboard.png'
];

async function updateCache(request, response) {
    if (!response || !response.ok || response.type !== 'basic') return response;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
    return response;
}

async function networkFirst(request, fallbackToIndex = false) {
    try {
        const response = await fetch(request);
        return updateCache(request, response);
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (fallbackToIndex) {
            return caches.match('./index.html');
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    return updateCache(request, response);
}

// Install event - cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Message handler for controlled activation
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Skip cross-origin requests and API requests
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    const isNavigation = request.mode === 'navigate' || request.destination === 'document' || acceptsHtml;
    const pathname = url.pathname.toLowerCase();
    const isJsOrJson = pathname.endsWith('.js') || pathname.endsWith('.json') || request.destination === 'script';

    if (isNavigation) {
        event.respondWith(networkFirst(request, true));
        return;
    }

    if (isJsOrJson) {
        event.respondWith(networkFirst(request, false));
        return;
    }

    event.respondWith(cacheFirst(request));
});
