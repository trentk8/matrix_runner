const CACHE_NAME = "matrix-runner-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./manifest.webmanifest",
  "./js/main.js",
  "./js/core/Constants.js",
  "./js/core/EventBus.js",
  "./js/core/GameState.js",
  "./js/maze/FogOfWar.js",
  "./js/maze/MazeData.js",
  "./js/maze/MazeGenerator.js",
  "./js/player/Camera.js",
  "./js/player/CollisionSystem.js",
  "./js/player/PlayerController.js",
  "./js/rendering/DotRenderer.js",
  "./js/rendering/LODSystem.js",
  "./js/rendering/MinimapRenderer.js",
  "./js/rendering/ViewFrustum.js",
  "./js/ui/ControlOverlay.js",
  "./js/ui/HUD.js",
  "./js/ui/MenuSystem.js",
  "./js/ui/Notifications.js",
  "./assets/icons/matrix-runner-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const isValidResponse =
            networkResponse && networkResponse.status === 200;
          if (isValidResponse && requestUrl.origin === self.location.origin) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return caches.match(event.request);
        });
    })
  );
});
