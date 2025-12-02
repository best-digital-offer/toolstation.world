// Service Worker for ToolStation.world
// Provides offline functionality and performance optimization

const CACHE_NAME = 'toolstation-v1';
const urlsToCache = [
  '/',
  '/assets/style.css',
  '/assets/main.js',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/tools/word-counter.html',
  '/tools/text-case.html',
  '/tools/qr.html',
  '/tools/image-compress.html',
  '/tools/jpg-png.html',
  '/tools/image-to-pdf.html',
  '/tools/bmi.html',
  '/tools/emi.html',
  '/tools/youtube-thumb.html'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});