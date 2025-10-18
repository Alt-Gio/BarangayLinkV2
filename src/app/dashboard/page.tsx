"use client";

import { RoleBasedDashboard } from '../../components/dashboard/RoleBasedDashboard';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { errorHandler } from '@/lib/errorHandler';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

  // Initialize database and ensure user exists
  const initDb = useMutation(api.seedData.seedUserLevels);
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  
  // Get current user status (doesn't throw errors for pending/rejected)
  const currentUser = useQuery(api.users.getCurrentUserStatus);
  
  // PRIORITY CHECK: Redirect pending/rejected users IMMEDIATELY
  useEffect(() => {
    if (currentUser && !hasCheckedStatus) {
      setHasCheckedStatus(true);
      if (currentUser.status === "pending" || currentUser.status === "rejected") {
        // Immediate redirect - don't even show loading
        router.replace('/pending-approval');
      }
    }
  }, [currentUser, router, hasCheckedStatus]);
  
  // Initialize database and user if functions are available
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First ensure user levels are seeded
        await initDb();
        // Then ensure current user exists in database
        await ensureUserExists();
        setIsInitialized(true);
      } catch (error) {
        // Check if error is about pending approval
        if (error instanceof Error && (error.message.includes('pending') || error.message.includes('rejected'))) {
          router.push('/pending-approval');
          return;
        }
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          errorHandler.logErrorPublic(error, 'Dashboard initialization');
        }
        setIsInitialized(true); // Set initialized even on error to show something
      }
    };
    
    if (user && isLoaded && isSignedIn && !isInitialized) {
      initializeApp();
    }
  }, [user, isLoaded, isSignedIn, initDb, ensureUserExists, router, isInitialized]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  // Wait for user status to be loaded AND verified before rendering dashboard
  if (!isLoaded || !isSignedIn || !user || !isInitialized || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  // Final safety check - if status is not active, show loading (redirect will happen in useEffect)
  if (currentUser.status !== "active") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying account status...</p>
        </div>
      </div>
    );
  }

  // Render dashboard only for active users
  return <RoleBasedDashboard />;
}
