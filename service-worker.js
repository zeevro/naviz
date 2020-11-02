var cacheName = 'naviz-pwa';
var filesToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/bg.svg',
  '/arrow.svg',
  '/points.json'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(filesToCache))
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});