"use client";

import { ClerkProvider } from '@clerk/nextjs';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useEffect } from 'react';

interface ClerkOfflineProviderProps {
  children: React.ReactNode;
  publishableKey: string | undefined;
}

export function ClerkOfflineProvider({ children, publishableKey }: ClerkOfflineProviderProps) {
  const isOnline = useNetworkState();

  useEffect(() => {
    // Prevent Clerk from redirecting when offline
    if (!isOnline) {
      console.log('🔌 Offline mode: Clerk auth bypassed');
      
      // Intercept Clerk redirects when offline
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      window.history.pushState = function(...args) {
        const url = args[2];
        const urlString = url ? String(url) : '';
        // Prevent redirects to login when offline
        if (!isOnline && url && (urlString.includes('/sign-in') || urlString.includes('/sign-up'))) {
          console.log('🔌 Blocked offline redirect to:', url);
          return;
        }
        return originalPushState.apply(window.history, args);
      };

      window.history.replaceState = function(...args) {
        const url = args[2];
        const urlString = url ? String(url) : '';
        if (!isOnline && url && (urlString.includes('/sign-in') || urlString.includes('/sign-up'))) {
          console.log('🔌 Blocked offline redirect to:', url);
          return;
        }
        return originalReplaceState.apply(window.history, args);
      };

      return () => {
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
      };
    }
  }, [isOnline]);

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      // Don't navigate to sign-in when session is invalid (offline)
      appearance={{
        baseTheme: undefined,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
