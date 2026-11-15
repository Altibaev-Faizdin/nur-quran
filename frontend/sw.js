/**
 * Noor Al-Quran — Service Worker (PWA Offline & Cache Engine)
 * High-performance caching: Stale-While-Revalidate for UI assets,
 * Network-First for core Quran & Names API data.
 */

const CACHE_NAME = 'noor-quran-v1.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shared.css?v=4',
  '/shared.js?v=4',
  '/i18n.js',
  '/reciter-player.js',
  '/assets/images/logo.svg',
  '/pages/quran.html',
  '/pages/reciters.html',
  '/pages/prayer.html',
  '/pages/dua.html',
  '/pages/tasbih.html',
  '/pages/qibla.html',
  '/pages/hijri.html',
  '/pages/hadith.html',
  '/pages/names.html',
  '/pages/bookmarks.html',
  '/pages/login.html',
  '/pages/register.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and browser scheme requests
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. API Cache (Network-First with Cache Fallback for Surahs and 99 Names)
  if (url.pathname.includes('/api/surahs') || url.pathname.includes('/api/names')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 2. Audio Streaming / Range requests: stream directly from network
  if (url.pathname.endsWith('.mp3') || req.headers.get('range')) {
    return;
  }

  // 3. Stale-While-Revalidate for CSS, JS, Google Fonts, and images
  if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => cachedRes);
        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  // 4. Cache-First with Network fallback for HTML pages
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        }).catch(() => {
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || caches.match('index.html');
          }
        })
      );
    })
  );
});

