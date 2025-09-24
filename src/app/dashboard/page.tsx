"use client";

import { RoleBasedDashboard } from '../../components/dashboard/RoleBasedDashboard';
import { LiveblocksRoomProvider } from '../../components/liveblocks/LiveblocksProvider';
import { CollaborativeRoom } from '../../components/liveblocks/CollaborativeRoom';
import { LiveblocksClientProvider } from '../../components/liveblocks/LiveblocksClientProvider';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Initialize database and ensure user exists
  const initDb = useMutation(api.seedData.seedUserLevels);
  const ensureUserExists = useMutation(api.users_fixed.ensureUserExists);
  
  // Initialize database and user if functions are available
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First ensure user levels are seeded
        await initDb();
        // Then ensure current user exists in database
        await ensureUserExists();
      } catch (error) {
        console.log('App initialization completed or skipped:', error.message);
      }
    };
    
    if (user && isLoaded) {
      initializeApp();
    }
  }, [user, isLoaded, initDb, ensureUserExists]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/login');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveblocksClientProvider>
      <LiveblocksRoomProvider roomId={`dashboard-${user.id}`}>
        <RoleBasedDashboard />
      </LiveblocksRoomProvider>
    </LiveblocksClientProvider>
  );
}
