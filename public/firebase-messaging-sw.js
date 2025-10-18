// Firebase Cloud Messaging Service Worker

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA5Uz-eARzXbO873CN4kzHGAvo9BX7Gqeo",
  authDomain: "barangaylink-v2.firebaseapp.com",
  projectId: "barangaylink-v2",
  storageBucket: "barangaylink-v2.firebasestorage.app",
  messagingSenderId: "804912061017",
  appId: "1:804912061017:web:6373c52cdad249f2fdef48"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'BarangayLink';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: payload.notification?.icon || payload.data?.icon || '/icon-192x192.png',
    badge: payload.notification?.badge || payload.data?.badge || '/badge-72x72.png',
    image: payload.notification?.image || payload.data?.image,
    tag: payload.data?.tag || 'notification',
    data: {
      url: payload.data?.url || '/',
      notificationId: payload.data?.notificationId,
      ...payload.data,
    },
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.requireInteraction === 'true',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event);

  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // App is open, navigate and focus
            return client.focus().then(() => {
              return client.navigate(urlToOpen);
            });
          }
        }
        // App is not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle push events (for custom push notifications)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received:', event);

  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const options = {
      body: data.body || data.message,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      image: data.image,
      tag: data.tag || 'notification',
      data: {
        url: data.url || '/',
        notificationId: data.notificationId,
      },
      actions: data.actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'BarangayLink', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

console.log('[Service Worker] Firebase Messaging Service Worker loaded');
