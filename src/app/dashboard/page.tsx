"use client";

import { RoleBasedDashboard } from '../../components/dashboard/RoleBasedDashboard';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { api } from '../../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { errorHandler } from '@/lib/errorHandler';
import RippleLoader from '@/components/ui/RippleLoader';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

  const initDb = useMutation(api.seedData.seedUserLevels);
  const ensureUserExists = useMutation(api.users.ensureUserExists);
  const { currentUser, isOnline } = useOfflineData();
  const currentUserStatus = useQuery(api.users.getCurrentUserStatus);
  
  useEffect(() => {
    if (hasCheckedStatus || !isLoaded || !user) return;
    setHasCheckedStatus(true);
    
    if (currentUserStatus === undefined) return;
    
    if (currentUserStatus && (currentUserStatus.status === "pending" || currentUserStatus.status === "rejected")) {
      router.replace('/pending-approval');
      return;
    }
  }, [currentUserStatus, router, hasCheckedStatus, isLoaded, user]);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDb();
        setIsInitialized(true);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          errorHandler.logErrorPublic(error, 'Dashboard initialization');
        }
        setIsInitialized(true);
      }
    };
    
    if (user && isLoaded && isSignedIn && !isInitialized) {
      initializeApp();
    }
  }, [user, isLoaded, isSignedIn, initDb, router, isInitialized]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn || !user || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <RippleLoader size="lg" color="emerald" text="Loading your personalized dashboard..." />
      </div>
    );
  }

  if (currentUser.status !== "active") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <RippleLoader size="lg" color="emerald" text="Verifying account status..." />
      </div>
    );
  }

  return <RoleBasedDashboard />;
}
