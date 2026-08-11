/* Service worker: la app (index.html) se sirve RED-PRIMERO para que las
   actualizaciones lleguen siempre, con respaldo en caché para uso offline.
   Las librerías (lib/) e íconos se sirven caché-primero. */
const CACHE = 'ubi-bien-inmueble-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './lib/pdf.min.js', './lib/pdf.worker.min.js', './lib/xlsx.full.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function cachePut(request, res) {
  const copy = res.clone();
  caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
  return res;
}

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdnLib = /cdnjs\.cloudflare\.com/.test(url.href);
  if (!sameOrigin && !isCdnLib) return;

  const isAppShell = request.mode === 'navigate' || /(?:^|\/)index\.html$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isAppShell) {
    // RED PRIMERO: siempre la última versión; caché solo si no hay conexión
    e.respondWith(
      fetch(request).then(res => cachePut(request, res)).catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // Librerías, íconos y CDN: caché primero (no cambian entre versiones)
    e.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => cachePut(request, res)).catch(() => Promise.reject('offline')))
    );
  }
});
