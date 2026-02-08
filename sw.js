const CACHE_NAME = 'tonematch-prototype-v1';
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './styles/app.css',
    './scripts/app.js',
    './services/faceDetect.js',
    './services/qualityCheck.js',
    './services/toneAnalyze.js',
    './services/paletteEngine.js',
    './services/lookEngine.js',
    './ui/Onboarding.js',
    './ui/Capture.js',
    './ui/Results.js',
    './ui/Adjust.js',
    './ui/PaletteDetail.js',
    './ui/TrendingLooks.js',
    './ui/Stencil.js',
    './data/palettes.json',
    './data/looks.json',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    event.respondWith(
        caches.match(request).then(cached => {
            const networkFetch = fetch(request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    return response;
                })
                .catch(() => cached);

            return cached || networkFetch;
        })
    );
});
