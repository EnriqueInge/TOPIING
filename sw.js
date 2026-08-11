/* Service worker: cachea el shell de la app para uso offline.
   Nota: las librerías de PDF/OCR/Excel se sirven desde CDN y requieren
   conexión la primera vez; el resto de la app funciona sin conexión. */
const CACHE = 'ubi-bien-inmueble-v2';
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

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdnLib = /cdnjs\.cloudflare\.com/.test(url.href);
  // Cache-first tanto para el mismo origen como para las librerías del CDN,
  // de modo que tras la primera carga con internet la app abra y funcione offline.
  if (sameOrigin || isCdnLib) {
    e.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => sameOrigin ? caches.match('./index.html') : Promise.reject('offline')))
    );
  }
});
