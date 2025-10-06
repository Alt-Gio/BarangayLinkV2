"use client";

import { RoleBasedDashboard } from '../../components/dashboard/RoleBasedDashboard';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { errorHandler } from '@/lib/errorHandler';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database and ensure user exists
  const initDb = useMutation(api.seedData.seedUserLevels);
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  
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
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          errorHandler.logErrorPublic(error, 'Dashboard initialization');
        }
        setIsInitialized(true); // Continue even if initialization fails
      }
    };
    
    if (user && isLoaded && isSignedIn) {
      initializeApp();
    }
  }, [user, isLoaded, isSignedIn, initDb, ensureUserExists]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

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

  // Render dashboard without Liveblocks - simpler and more reliable
  return <RoleBasedDashboard />;
}
