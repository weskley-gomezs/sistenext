const CACHE_NAME = 'sistenext-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Stale-While-Revalidate strategy for static resources,
// and custom fallback for app routes (SPAs)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests or Firebase Firestore/Auth/Vite HMR requests
  if (event.request.method !== 'GET' || 
      requestUrl.hostname.includes('firestore.googleapis.com') || 
      requestUrl.hostname.includes('firebase') || 
      requestUrl.hostname.includes('identitytoolkit.googleapis.com') ||
      requestUrl.pathname.includes('/@vite/') ||
      requestUrl.pathname.includes('/node_modules/')) {
    return;
  }

  // SPA navigation fallback: Serve '/' if requesting an HTML page that's not in cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Keep a copy of latest navigation response in cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve cached index.html
          return caches.match('/');
        })
    );
    return;
  }

  // For static assets, use Stale-While-Revalidate or Network-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            /* ignore network failure */
          });
        return cachedResponse;
      }

      // Network-First for other assets
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Fallback if fully offline and asset not cached
          return new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});

// Skip Waiting listener from app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
