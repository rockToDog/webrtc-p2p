self.addEventListener('install', function (event) {
  caches.open('sw_cache').then(function (cache) {
      return cache.addAll([
          '/index.html',
          '/manifest.json',
          '/icon.svg',
          '/assets/index-4fe8252b.css',
          '/assets/index-3066e739.js',
          '/assets/index-3066e739.js.map',
      ]);
  });

})

self.addEventListener('fetch', function (event) {
  event.respondWith(
      caches.match(event.request).then(function (response) {
          if (response) {
              return response;
          }
          return fetch(event.request);
      })
  );
});