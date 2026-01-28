<meta name='viewport' content='width=device-width, initial-scale=1'/>const CACHE_NAME = 'resinvest-v1';
const urlsToCache = [
  '/resinvest-magazyn/',
  '/resinvest-magazyn/index.html'
];

// Instalacja Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache otwarty');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Aktywacja Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategia: Network First, fallback to Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Klonuj odpowiedź
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});