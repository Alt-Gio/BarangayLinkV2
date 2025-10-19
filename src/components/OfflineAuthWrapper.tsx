"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useOfflineData } from '@/contexts/OfflineDataContext';

interface OfflineAuthWrapperProps {
  children: React.ReactNode;
}

export function OfflineAuthWrapper({ children }: OfflineAuthWrapperProps) {
  const { user, isLoaded } = useUser();
  const { isOnline, currentUser } = useOfflineData();
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/'];

  useEffect(() => {
    // If we're online, use Clerk's normal auth
    if (isOnline) {
      if (isLoaded && !user && !publicRoutes.includes(pathname)) {
        router.push('/login');
      }
      setAuthChecked(true);
    } else {
      // If offline, check if we have cached user data
      if (!currentUser && !publicRoutes.includes(pathname)) {
        // No cached user - redirect to login with offline message
        console.log('⚠️ No cached user data for offline mode');
        // Don't redirect - just show the content with offline indicator
      }
      setAuthChecked(true);
    }
  }, [isOnline, isLoaded, user, currentUser, pathname]);

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isOnline ? 'Checking authentication...' : 'Loading offline mode...'}
          </p>
        </div>
      </div>
    );
  }

  // If offline and no cached user, show offline message but still render content
  if (!isOnline && !currentUser && !publicRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 border border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Offline Mode</h2>
            <p className="text-gray-400 mb-6">
              You need to be online at least once to use this page in offline mode.
              Please connect to the internet and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
