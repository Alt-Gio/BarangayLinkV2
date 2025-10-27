"use client";

import { RoleBasedDashboard } from '../../components/dashboard/RoleBasedDashboard';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { useOfflineData } from '@/contexts/OfflineDataContext';
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
  
  // Get current user from offline context (cached!)
  const { currentUser, isOnline } = useOfflineData();
  const currentUserStatus = useQuery(api.users.getCurrentUserStatus);
  
  // PRIORITY CHECK: Check user status and redirect appropriately
  useEffect(() => {
    // Only check if we have loaded and checked for user
    if (hasCheckedStatus || !isLoaded || !user) return;
    
    // Mark that we've checked
    setHasCheckedStatus(true);
    
    // If no user status yet, they might be in setup - don't redirect!
    if (currentUserStatus === undefined) {
      console.log("⏳ User status loading...");
      return;
    }
    
    // If user doesn't exist in Convex, redirect to setup
    if (currentUserStatus === null) {
      console.log("⚠️ User not in database, redirecting to oauth-setup");
      router.replace('/oauth-setup');
      return;
    }
    
    // If profile incomplete, redirect to setup
    if (!currentUserStatus.department || !currentUserStatus.position || 
        currentUserStatus.department === "General" || currentUserStatus.position === "Community Member") {
      console.log("⚠️ Profile incomplete, redirecting to oauth-setup");
      router.replace('/oauth-setup');
      return;
    }
    
    // If pending or rejected, redirect to pending approval page
    if (currentUserStatus.status === "pending" || currentUserStatus.status === "rejected") {
      console.log("⚠️ User status:", currentUserStatus.status, "redirecting to pending-approval");
      router.replace('/pending-approval');
      return;
    }
    
    console.log("✅ User status:", currentUserStatus.status, "showing dashboard");
  }, [currentUserStatus, router, hasCheckedStatus, isLoaded, user]);
  
  // Initialize database and check user status
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First ensure user levels are seeded
        await initDb();
        // Don't call ensureUserExists - webhook already created user
        // Just mark as initialized
        setIsInitialized(true);
      } catch (error) {
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
  }, [user, isLoaded, isSignedIn, initDb, router, isInitialized]);

  // Redirect if not authenticated (but don't interfere with setup flow)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);
  
  // If user exists but profile incomplete, redirect to setup
  useEffect(() => {
    if (isLoaded && isSignedIn && currentUserStatus === null) {
      console.log("🔄 No user in Convex, redirecting to setup");
      router.replace('/oauth-setup');
    }
  }, [isLoaded, isSignedIn, currentUserStatus, router]);

  // Wait for user status to be loaded AND verified before rendering dashboard
  if (!isLoaded || !isSignedIn || !user || !isInitialized) {
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
