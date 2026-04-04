const CACHE_NAME = "tamenny-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// ========================================
// إعدادات نظام Geofencing
// ========================================
let geofenceMonitoringActive = false;
let geofenceIntervalId = null;
const GEOFENCE_CHECK_INTERVAL = 60000; // كل دقيقة
const ZONE_STATES_KEY = 'tamenny_zone_states';

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

// ========================================
// دوال Geofencing
// ========================================

/**
 * حساب المسافة بين نقطتين باستخدام صيغة Haversine
 * @param {number} lat1 - خط عرض النقطة الأولى
 * @param {number} lon1 - خط طول النقطة الأولى
 * @param {number} lat2 - خط عرض النقطة الثانية
 * @param {number} lon2 - خط طول النقطة الثانية
 * @returns {number} المسافة بالأمتار
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // نصف قطر الأرض بالأمتار
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * تحويل الدرجات إلى راديان
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * جلب حالة المناطق المحفوظة
 */
async function getZoneStates() {
  try {
    const stored = await getFromIndexedDB(ZONE_STATES_KEY);
    return stored || {};
  } catch {
    return {};
  }
}

/**
 * حفظ حالة المناطق
 */
async function saveZoneStates(states) {
  try {
    await saveToIndexedDB(ZONE_STATES_KEY, states);
  } catch (error) {
    console.error('Error saving zone states:', error);
  }
}

/**
 * جلب المناطق الآمنة من الخادم
 */
async function fetchSafeZones() {
  try {
    const response = await fetch('/api/safe-zones', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    const data = await response.json();
    return data.success ? data.safeZones : [];
  } catch (error) {
    console.error('Error fetching safe zones:', error);
    return [];
  }
}

/**
 * إرسال حدث geofence إلى الخادم
 */
async function sendGeofenceEvent(zoneId, event, lat, lng) {
  try {
    const response = await fetch('/api/safe-zones/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ zoneId, event, lat, lng }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending geofence event:', error);
    return false;
  }
}

/**
 * إرسال إشعار محلي
 */
async function showLocalNotification(title, body, data = {}) {
  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data,
    dir: 'rtl',
    lang: 'ar',
  };

  return self.registration.showNotification(title, options);
}

/**
 * التحقق من الموقع ومراقبة المناطق
 */
async function checkLocationAndZones() {
  if (!geofenceMonitoringActive) return;

  try {
    // الحصول على الموقع الحالي
    const position = await getCurrentPosition();
    const { latitude: currentLat, longitude: currentLng } = position.coords;

    // جلب المناطق الآمنة
    const zones = await fetchSafeZones();
    if (zones.length === 0) return;

    // جلب الحالات السابقة
    const zoneStates = await getZoneStates();

    // فحص كل منطقة
    for (const zone of zones) {
      const distance = calculateHaversineDistance(
        currentLat, currentLng,
        zone.latitude, zone.longitude
      );

      const isInside = distance <= zone.radius;
      const wasInside = zoneStates[zone.id]?.isInside || false;

      // تحقق من تغيير الحالة
      if (isInside !== wasInside) {
        const eventType = isInside ? 'enter' : 'exit';
        
        // تحقق من إعدادات الإشعارات
        const shouldNotify = eventType === 'enter' 
          ? zone.notifyOnEnter 
          : zone.notifyOnExit;

        // إرسال الحدث إلى الخادم
        await sendGeofenceEvent(zone.id, eventType, currentLat, currentLng);

        // إظهار إشعار محلي
        if (shouldNotify) {
          const title = eventType === 'enter' 
            ? 'دخول إلى منطقة آمنة' 
            : 'خروج من منطقة آمنة';
          const body = eventType === 'enter'
            ? `لقد دخلت إلى "${zone.name}"`
            : `لقد غادرت "${zone.name}"`;

          await showLocalNotification(title, body, { zoneId: zone.id, eventType });

          // إشعار خاص للأطفال
          if (eventType === 'exit' && zone.childAlertEnabled && zone.childName) {
            await showLocalNotification(
              'تنبيه: خروج طفل',
              `الطفل "${zone.childName}" غادر المنطقة الآمنة "${zone.name}"`,
              { zoneId: zone.id, eventType: 'child_exit', childName: zone.childName }
            );
          }
        }

        // تحديث الحالة
        zoneStates[zone.id] = {
          isInside,
          lastChecked: Date.now(),
          lastEvent: eventType,
        };
      }
    }

    // حفظ الحالات المحدثة
    await saveZoneStates(zoneStates);

  } catch (error) {
    console.error('Error checking location and zones:', error);
  }
}

/**
 * الحصول على الموقع الحالي
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    // Service Worker لا يستطيع الوصول لـ geolocation مباشرة
    // نحتاج للتواصل مع الصفحة الرئيسية
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        if (clients.length > 0) {
          // إرسال طلب للموقع للصفحة الرئيسية
          clients[0].postMessage({ type: 'GET_LOCATION' });
          
          // الاستماع للرد
          const messageHandler = (event) => {
            if (event.data && event.data.type === 'LOCATION_RESPONSE') {
              self.removeEventListener('message', messageHandler);
              resolve({ coords: event.data.coords });
            }
          };
          self.addEventListener('message', messageHandler);
          
          // timeout بعد 10 ثواني
          setTimeout(() => {
            self.removeEventListener('message', messageHandler);
            reject(new Error('Location request timeout'));
          }, 10000);
        } else {
          reject(new Error('No active window'));
        }
      });
  });
}

/**
 * بدء مراقبة المناطق الآمنة
 */
async function startGeofenceMonitoring() {
  if (geofenceMonitoringActive) return;
  
  geofenceMonitoringActive = true;
  
  // فحص فوري
  await checkLocationAndZones();
  
  // بدء المراقبة الدورية
  geofenceIntervalId = setInterval(checkLocationAndZones, GEOFENCE_CHECK_INTERVAL);
  
  // إشعار المستخدم
  await showLocalNotification(
    'تم تفعيل مراقبة المناطق الآمنة',
    'سيتم إشعارك عند الدخول أو الخروج من المناطق المحددة'
  );
}

/**
 * إيقاف مراقبة المناطق الآمنة
 */
function stopGeofenceMonitoring() {
  geofenceMonitoringActive = false;
  
  if (geofenceIntervalId) {
    clearInterval(geofenceIntervalId);
    geofenceIntervalId = null;
  }
}

/**
 * دوال IndexedDB للتخزين
 */
function getFromIndexedDB(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tamenny_sw', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval');
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('keyval', 'readonly');
      const store = tx.objectStore('keyval');
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

function saveToIndexedDB(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tamenny_sw', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval');
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      store.put(value, key);
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

// ========================================
// معالجة الرسائل من الصفحة الرئيسية
// ========================================
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'START_GEOFENCE_MONITORING':
      startGeofenceMonitoring();
      break;
      
    case 'STOP_GEOFENCE_MONITORING':
      stopGeofenceMonitoring();
      break;
      
    case 'LOCATION_RESPONSE':
      // يتم معالجة هذا في getCurrentPosition
      break;
      
    case 'GET_GEOFENCE_STATUS':
      event.ports[0]?.postMessage({
        active: geofenceMonitoringActive,
      });
      break;
  }
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

async function removePendingUpdate(id) {
  console.log("Removed pending update:", id);
}
