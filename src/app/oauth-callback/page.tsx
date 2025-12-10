"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import RippleLoader from '@/components/ui/RippleLoader';

export default function OAuthCallbackPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (user && isSignedIn) {
      setWaitingForUser(false);
      router.replace('/dashboard');
      return;
    }

    if (!user && retryCount < 5) {
      const retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }

    if (!user && retryCount >= 5) {
      router.push('/login');
    }

  }, [isLoaded, user, isSignedIn, router, retryCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <RippleLoader 
          size="lg" 
          color="emerald" 
          text={
            !isLoaded ? "Connecting to Facebook..." : 
            waitingForUser ? `Loading your account... (${retryCount + 1}/5)` :
            "Authentication Successful! Redirecting..."
          }
        />
        {retryCount > 2 && waitingForUser && (
          <p className="text-yellow-400 text-sm mt-6 animate-pulse">
            This is taking longer than usual. Please wait...
          </p>
        )}
      </div>
    </div>
  );
}
