const CACHE = 'epub-reader-v1';
const ASSETS = [
  '.',
  'index.html',
  'books.json',
  'covers/arabiyya.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Skip range requests (EPUB internal fetches)
  if (req.headers.get('range')) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        try {
          if (
            req.method === 'GET' &&
            new URL(req.url).origin === location.origin
          ) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
        } catch (_) {}
        return res;
      });
    })
  );
});
