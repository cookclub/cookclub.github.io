// sw.js
const CACHE = 'epub-reader-v3';
const ASSETS = ['/', '/index.html', '/books.json'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.headers.get('range')) return;            // EPUB zip streaming
  if (url.pathname.startsWith('/epubs/')) return;  // all book assets
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (req.method === 'GET' && url.origin === location.origin) {
        caches.open(CACHE).then(c => c.put(req, res.clone()));
      }
      return res;
    }))
  );
});
