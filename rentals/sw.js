// Pinoy BnB Rentals web: keeps the app's own files on the device so it opens without internet.
// Your data is never sent here; it stays in this browser. Licence checks always go online.
const CACHE = 'pbnb-rentals-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './sql-wasm.js', './sql-wasm.wasm', './manifest.json'])).catch(() => undefined));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Pages: try the network first (to get updates), fall back to the saved copy.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return r;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  // Files (code, pictures, database engine): saved copy first, then the network.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((r) => {
          if (r.ok) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return r;
        }),
    ),
  );
});
