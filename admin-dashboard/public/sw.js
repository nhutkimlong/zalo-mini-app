const CACHE_NAME = "baden-admin-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.png",
  "/logo.png",
  "/adaptive-icon.png",
  "/splash-icon.png"
];

// Install Event - Pre-caches critical shells
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching critical offline app shell");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Purges old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing deprecated cache storage:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic caching strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;
  
  // Skip cross-origin APIs or Supabase REST calls to ensure fresh sync
  if (req.url.includes("/api/") || req.url.includes("supabase.co")) {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match(req);
      })
    );
    return;
  }

  // Network-first falling back to cache for HTML/JS/CSS assets to allow updates
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }
        const responseToCache = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return res;
      })
      .catch(() => {
        return caches.match(req).then((cachedResponse) => {
          return cachedResponse || caches.match("/index.html");
        });
      })
  );
});
