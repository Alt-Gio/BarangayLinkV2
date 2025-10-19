const CACHE_NAME = 'barangaylink-v2-v1.0.0';
const CACHE_DYNAMIC = 'barangaylink-dynamic-v1';
const CACHE_API = 'barangaylink-api-v1';

const urlsToCache = [
  '/',
  '/dashboard',
  '/projects',
  '/tasks',
  '/events',
  '/chat',
  '/analytics',
  '/tasks/habits',
  '/tasks/my-tasks',
  '/events/sprints',
  '/admin/invitations',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets only');
        // Only cache static assets, not pages (Next.js handles pages dynamically)
        const staticAssets = [
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png',
        ];
        return cache.addAll(staticAssets);
      })
      .then(() => {
        console.log('[SW] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Fetch event - Minimal interference, let Next.js and IndexedDB handle offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains (Clerk, Convex, etc)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API routes and Convex - let them fail gracefully
  if (url.pathname.includes('/api/') || url.pathname.includes('convex') || url.pathname.includes('_next/')) {
    return;
  }

  // Only handle static assets (images, manifest, etc)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|json|woff|woff2|ttf)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_DYNAMIC).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          }).catch(() => {
            console.log('[SW] Asset fetch failed (offline):', url.pathname);
            return new Response('', { status: 503 });
          });
        })
    );
  }
  
  // For everything else (pages), let Next.js handle it
  // IndexedDB will provide offline data
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== CACHE_DYNAMIC && cacheName !== CACHE_API) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data...');
    
    // Open IndexedDB to get pending actions
    const db = await openDB();
    const pendingActions = await getPendingActions(db);
    
    if (pendingActions.length === 0) {
      console.log('[SW] No pending actions to sync');
      return;
    }
    
    console.log(`[SW] Found ${pendingActions.length} pending actions`);
    
    // Process each pending action
    for (const action of pendingActions) {
      try {
        // Attempt to send the action to the server
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          // Remove from queue if successful
          await removeAction(db, action.id);
          console.log('[SW] Synced action:', action.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync action:', action.id, error);
      }
    }
    
    console.log('[SW] Sync complete');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BarangayLinkOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

function getPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from BarangayLink',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BarangayLink', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});
