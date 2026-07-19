// Service worker minimal — installabilité PWA (critère requis par Lighthouse / TWA / wrapper
// Capacitor), sans prétendre à un vrai mode hors-ligne complet (l'app dépend d'une API live).
// Écrit à la main plutôt que via next-pwa : une dépendance de moins à maintenir/déboguer.

const CACHE_NAME = "colismonde-shell-v1";
const APP_SHELL = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// "Network falling back to cache" : toujours privilégier la donnée fraîche (API, pages
// dynamiques), le cache ne sert que de filet de sécurité pour les assets statiques déjà vus.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
