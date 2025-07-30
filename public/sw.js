const CACHE_NAME = 'pos-system-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for data synchronization
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  if (event.tag === 'pos-data-sync') {
    event.waitUntil(syncPOSData());
  }
});

// Sync POS data when online
async function syncPOSData() {
  try {
    console.log('Service Worker: Syncing POS data...');
    
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      // Sync with server when available
      await sendDataToServer(pendingData);
      await clearPendingData();
      
      // Notify clients of successful sync
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'DATA_SYNCED',
          count: pendingData.length
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Data sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pos-offline-db', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      // Check if object store exists before creating transaction
      if (db.objectStoreNames.contains('pending')) {
        const transaction = db.transaction(['pending'], 'readonly');
        const store = transaction.objectStore('pending');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          db.close();
          resolve(getAllRequest.result);
        };

        getAllRequest.onerror = () => {
          db.close();
          reject(getAllRequest.error);
        };
      } else {
        db.close();
        resolve([]); // Return empty array if store doesn't exist
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function sendDataToServer(data) {
  // Implementation depends on your backend API
  console.log('Service Worker: Would send data to server:', data);
  return Promise.resolve();
}

async function clearPendingData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pos-offline-db', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      // Check if object store exists before creating transaction
      if (db.objectStoreNames.contains('pending')) {
        const transaction = db.transaction(['pending'], 'readwrite');
        const store = transaction.objectStore('pending');
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
          db.close();
          resolve();
        };

        clearRequest.onerror = () => {
          db.close();
          reject(clearRequest.error);
        };
      } else {
        db.close();
        resolve(); // Nothing to clear if store doesn't exist
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open POS',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'POS System', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});
