// Extract version from registration URL (sw.js?v=...)
const urlParams = new URLSearchParams(self.location.search);
const VERSION = urlParams.get('v') || '1.2.1';
const CACHE_NAME = `pledgevault-v${VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/offline.html' // Minimal fallback
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('PWA Cache Warning:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // 1. Skip Supabase / API - Always Network
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
    return;
  }

  // 2. Navigation Requests (HTML) -> NETWORK FIRST
  // This ensures the user always sees the latest deployment when online
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Static Assets (Images, Fonts) -> CACHE FIRST, then Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => {
        // Silent fail for non-navigation
      });
    })
  );
});
