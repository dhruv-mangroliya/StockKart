const CACHE_NAME = "inventorybook-v3";
const urlsToCache = [
  "/manifest.json",
  "/mainLogo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        console.log("Some assets failed to cache during install");
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, cloned));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || new Response("Offline - API not available", { status: 503 })
          )
        )
    );
  } else {
    // Never cache HTML documents — always fetch fresh so auth state is correct
    if (request.destination === "document" || url.pathname === "/" || url.pathname.endsWith(".html")) {
      event.respondWith(
        fetch(request).catch(() => caches.match("/index.html"))
      );
      return;
    }
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, cloned));
          }
          return response;
        }).catch(() => new Response("Offline - Resource not available", { status: 503 }));
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/alert-manager");
        }
      })
    );
  }
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});
