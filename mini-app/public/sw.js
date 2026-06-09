const CACHE_NAME = "nui-ba-den-pwa-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./favicon.png",
  "./logo.png",
  "./icon.png",
  "./adaptive-icon.png"
];

// Install event: Cache assets individually to be resilient to single-asset failures
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell assets");
      return Promise.all(
        ASSETS.map((asset) => {
          // Force network fetch to bypass browser HTTP cache on install
          const request = new Request(asset, { cache: "reload" });
          return cache.add(request).catch((err) => {
            console.warn(`[Service Worker] Failed to cache asset: ${asset}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Serve cached assets or fetch from network
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass cache for API calls (FastAPI / Supabase)
  if (url.pathname.startsWith("/api") || url.host.includes("supabase.co")) {
    return;
  }

  // 1. Network-First for navigation requests (HTML shell)
  if (event.request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname === "/") {
    // Standard SPA behavior: always fetch and serve the root /index.html file for any route navigation
    const indexRequest = new Request("/index.html", { cache: "no-cache" });
    event.respondWith(
      fetch(indexRequest)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Cache it under the original navigation request (e.g. /profile) to support offline sub-route loading
              cache.put(event.request, cacheCopy);
            });
            return networkResponse;
          }
          return caches.match("./index.html") || caches.match("./");
        })
        .catch(() => {
          // Offline fallback
          return caches.match("./index.html") || caches.match("./");
        })
    );
    return;
  }

  // 2. Cache-First for standard static assets (js, css, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache dynamic static assets on the fly
          if (
            networkResponse.status === 200 &&
            event.request.method === "GET" &&
            url.origin === self.location.origin &&
            !url.pathname.includes("/node_modules/")
          ) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        });
    })
  );
});
