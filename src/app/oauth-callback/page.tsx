"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(true);

  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isLoaded) {
      console.log("⏳ Waiting for Clerk to load...");
      return;
    }

    // If user exists and is signed in, proceed to setup
    if (user && isSignedIn) {
      console.log("✅ OAuth successful! User loaded:", user.firstName, user.lastName);
      console.log("✅ Redirecting to setup page...");
      setWaitingForUser(false);
      
      // Small delay to ensure everything is synced
      const timer = setTimeout(() => {
        router.push('/oauth-setup');
      }, 1000);

      return () => clearTimeout(timer);
    }

    // If loaded but no user, wait a bit and retry (Clerk might still be syncing)
    if (!user && retryCount < 5) {
      console.log(`⏳ Waiting for user session... (attempt ${retryCount + 1}/5)`);
      const retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }

    // After 5 retries, if still no user, redirect to login
    if (!user && retryCount >= 5) {
      console.log("❌ No user after 5 attempts, redirecting to login");
      router.push('/login');
    }

  }, [isLoaded, user, isSignedIn, router, retryCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="mb-6">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {!isLoaded ? "Connecting to Facebook..." : 
           waitingForUser ? `Loading your account... (${retryCount + 1}/5)` :
           "Authentication Successful!"}
        </h1>
        <p className="text-gray-400">
          {!isLoaded ? "Please wait..." :
           waitingForUser ? "Syncing your session..." :
           "Redirecting to setup..."}
        </p>
        {retryCount > 2 && waitingForUser && (
          <p className="text-yellow-400 text-sm mt-4">
            This is taking longer than usual. Please wait...
          </p>
        )}
      </div>
    </div>
  );
}
