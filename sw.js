const CACHE_NAME = "control-horas-v1";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./js/app.js",
  "./js/domain.js",
  "./css/styles.css",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Instalación: cache inicial
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
});

// Activación: limpieza de caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
});

// Fetch: offline-first
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
