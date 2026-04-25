const CACHE_NAME = 'pledgevault-v1.1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use cache.addAll only for essential assets, ignore failures for non-critical ones
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
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Skip non-GET requests (Login, POST, etc.)
  if (event.request.method !== 'GET') return;

  // 2. Skip Supabase / API requests - let them hit the network directly
  const url = new URL(event.request.url);
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
    return;
  }

  // 3. Dynamic Strategy for other GET requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Don't cache if not a successful response or from a different origin
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // If fetch fails and we have nothing in cache, just let it fail naturally
        // unless it's a navigation request, then we could show an offline page.
      });
    })
  );
});
