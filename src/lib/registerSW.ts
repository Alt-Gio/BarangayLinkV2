// Service Worker Registration for PWA Offline Functionality

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker not supported');
    return null;
  }

  try {
    console.log('[SW] Registering service worker...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service Worker registered successfully:', registration);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] New service worker found, installing...');

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New content available, please refresh');
            
            // Notify user about update
            if (window.confirm('New version available! Reload to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Register background sync for offline actions
export async function registerSync(tag: string = 'sync-offline-data') {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if Background Sync API is available
    if ('sync' in registration) {
      // @ts-ignore - Background Sync API types not fully supported yet
      await registration.sync.register(tag);
      console.log('[SW] Background sync registered:', tag);
      return true;
    } else {
      console.log('[SW] Background Sync API not available');
      return false;
    }
  } catch (error) {
    console.error('[SW] Background sync registration failed:', error);
    return false;
  }
}

// Unregister service worker (for debugging)
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[SW] Service Worker unregister failed:', error);
    return false;
  }
}
