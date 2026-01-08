const CACHE_NAME = "control-horas-v2";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",

  // Bootstrap
  "./js/app.js",
  "./js/app_legacy.js",

  // Dominio legacy (aún usado) + refactor
  "./js/domain.js",
  "./js/domain/models.js",
  "./js/domain/rules.js",
  "./js/domain/services.js",

  // Infra
  "./js/infra/repository.js",
  "./js/infra/storage.js",

  // UI por capas (fase 6/7)
  "./js/ui/controllers.js",
  "./js/ui/dom.js",
  "./js/ui/views.js",

  // Icons
  "./favicon.ico",
  "./icons/icon-180.png",
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
