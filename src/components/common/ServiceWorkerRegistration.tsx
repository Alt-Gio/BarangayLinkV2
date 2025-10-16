"use client";

import { useEffect } from 'react';
import { registerServiceWorker, registerSync } from '@/lib/registerSW';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker when component mounts
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker().then((registration) => {
        if (registration) {
          console.log('[PWA] Service Worker active');
          
          // Listen for online/offline events
          window.addEventListener('online', async () => {
            console.log('[PWA] Back online - triggering sync');
            await registerSync('sync-offline-data');
          });

          window.addEventListener('offline', () => {
            console.log('[PWA] Gone offline - data will be cached');
          });
        }
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
}
