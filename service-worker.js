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

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      cache.addAll(filesToCache)
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.open(cacheName).then(function (cache) {
      fetch(e.request).then(function (response) {
        return cache.put(e.request, response.clone()).then(function () {
          return response;
        });
      }).catch(function() {
        return cache.match(e.request);
      });
    })
  );
});