// Bump VERSION on every release so players get the "New version available" bar.
const VERSION = '1.3.4';
const CACHE = 'math-clicker-' + VERSION;
const FILES = [
  './', 'index.html', 'style.css', 'manifest.json',
  'js/data.js', 'js/game.js', 'js/ui.js', 'js/update.js', 'js/fx.js', 'js/stars.js',
  'icon-192.png', 'icon-512.png',
];

// No skipWaiting here: the new version waits until the player taps Update.
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION' && e.ports[0]) e.ports[0].postMessage(VERSION);
});
