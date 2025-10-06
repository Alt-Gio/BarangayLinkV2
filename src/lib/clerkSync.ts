"use client";

import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Hook to sync current user to Convex
export function useUserSync() {
  const { user } = useUser();
  const syncUser = useMutation(api.databaseManager.syncUserFromClerk);
  
  const syncCurrentUser = async () => {
    if (!user) return null;
    
    try {
      const result = await syncUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        imageUrl: user.imageUrl || '',
      });
      
      console.log('✅ User synced to Convex:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to sync user:', error);
      throw error;
    }
  };
  
  return { syncCurrentUser, user };
}

// Hook to get sync status
export function useSyncStatus() {
  const syncStatus = useQuery(api.clerk.getSyncStatus);
  return syncStatus;
}

// Manual sync utility (for admin use)
export async function syncClerkUsersToConvex(clerkUsers: any[]) {
  // This would typically be called from an admin interface
  // You'll need to implement the Clerk API calls to fetch users
  console.log('Manual sync not implemented yet - use the webhook or individual user sync');
}
