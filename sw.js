// Offline support. Network first so updates show up immediately; cache is the fallback.
// Bump VERSION when the file list changes.
const VERSION = 'cadence-v4';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'cycle.js', 'content.js', 'store.js', 'manifest.json', 'icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(request, res.clone()));
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./'))),
  );
});
