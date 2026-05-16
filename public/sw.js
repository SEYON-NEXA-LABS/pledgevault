// Extract version from registration URL (sw.js?v=...)
const urlParams = new URLSearchParams(self.location.search);
const VERSION = urlParams.get('v') || '1.2.1';
const CACHE_NAME = `pledgevault-v${VERSION}`;
const OFFLINE_CACHE = 'pledgevault-offline';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/offline.html'
];

const CACHE_MAX_AGE = {
  'default': 30 * 24 * 60 * 60 * 1000, // 30 days
  'images': 90 * 24 * 60 * 60 * 1000, // 90 days
  'api': 5 * 60 * 1000 // 5 minutes (if ever cached)
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      // Main cache for app assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('PWA Cache Warning:', err));
      }),
      // Dedicated offline cache
      caches.open(OFFLINE_CACHE).then((cache) => {
        return cache.add('/offline.html').catch(err => console.warn('Offline Cache Warning:', err));
      })
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== OFFLINE_CACHE)
          .map((name) => {
            console.log(`[SW] Cleaning up old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // 1. Skip Supabase / API - Always Network (with offline fallback)
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return offline response for API failures
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html').then(response => 
              response || new Response('Service unavailable', { status: 503 })
            );
          }
          // For non-navigation API requests, just fail silently
          throw new Error('Network request failed');
        })
    );
    return;
  }

  // 2. Navigation Requests (HTML) -> NETWORK FIRST with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Try cache first
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            // Fall back to offline page if both network and cache fail
            return caches.match('/offline.html').then(offlineResponse => 
              offlineResponse || new Response('Offline', { status: 503 })
            );
          });
        })
    );
    return;
  }

  // 3. Static Assets (Images, Fonts, CSS, JS) -> CACHE FIRST, then Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Check if cache is still fresh based on file type
        const isCacheable = event.request.url.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|css|js)$/i);
        if (isCacheable) {
          return cachedResponse;
        }
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Validate response before caching
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Return cached version if available, otherwise fail silently
          return cachedResponse || new Response('Network unavailable', { status: 503 });
        });
    })
  );
});

// Background sync for cleanup (runs periodically)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupOldCaches();
  }
});

// Cleanup function for old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, OFFLINE_CACHE];
  
  for (const name of cacheNames) {
    if (!currentCaches.includes(name)) {
      console.log(`[SW] Deleting old cache: ${name}`);
      await caches.delete(name);
    }
  }
}
