const CACHE_NAME = "tamenny-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API requests
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // For navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match("/");
          });
        })
    );
    return;
  }

  // For other requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background sync for location updates
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-location") {
    event.waitUntil(syncLocation());
  }
});

async function syncLocation() {
  // Sync pending location updates
  const pendingUpdates = await getPendingUpdates();
  for (const update of pendingUpdates) {
    try {
      await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      await removePendingUpdate(update.id);
    } catch (error) {
      console.error("Failed to sync location:", error);
    }
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || "تحديث جديد",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    dir: "rtl",
    lang: "ar",
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "طمنّي", options)
  );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Placeholder functions for background sync
async function getPendingUpdates() {
  return [];
}

async function removePendingUpdate(id: string) {
  console.log("Removed pending update:", id);
}
