/**
 * Noor Al-Quran — Service Worker (PWA Offline Engine v2.0)
 * Architecture:
 * - HTML Pages / Navigations: Network-First with Cache fallback & /pages/offline.html
 * - Static Assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
 * - API Data (/api/surahs, /api/names): Network-First with Cache fallback
 * - Audio Streaming: Direct network bypass
 * - Auth Requests: Completely bypassed from caching
 */

const CACHE_NAME = 'noor-quran-v2.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shared.css',
  '/shared.js',
  '/i18n.js',
  '/idb-store.js',
  '/reciter-player.js',
  '/assets/images/logo.svg',
  '/pages/offline.html',
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
        PRECACHE_ASSETS.map((url) => cache.add(url).catch(() => {}))
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

  // 1. Skip non-GET, browser extensions, and internal schemes
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 2. Never cache Auth endpoints
  if (url.pathname.includes('/api/auth/') || url.pathname.includes('/token/')) {
    return;
  }

  // 3. Audio Streaming: range requests and mp3s stream directly from network
  if (url.pathname.endsWith('.mp3') || req.headers.get('range')) {
    return;
  }

  // 4. HTML Navigation: Network-First -> Cache -> offline.html
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'));
  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(req, { ignoreSearch: true }).then((cached) => {
            if (cached) return cached;
            return caches.match('/pages/offline.html') || caches.match('offline.html');
          });
        })
    );
    return;
  }

  // 5. API Cache: Network-First with Cache fallback for surahs and 99 names
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
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  // 6. Static Assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
  if (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.json') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cachedRes) => {
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

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
