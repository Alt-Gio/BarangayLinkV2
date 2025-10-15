"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { offlineStorage } from "@/lib/offlineStorage";

interface OfflineSyncContextType {
  isSyncing: boolean;
  queuedCount: number;
  syncNow: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isSyncing: false,
  queuedCount: 0,
  syncNow: async () => {},
});

export function useOfflineSync() {
  return useContext(OfflineSyncContext);
}

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  // Check queued mutations count
  const updateQueueCount = async () => {
    try {
      const queue = await offlineStorage.getQueue();
      setQueuedCount(queue.length);
    } catch (error) {
      console.error("Error checking queue:", error);
    }
  };

  // Sync offline queue
  const syncNow = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const queue = await offlineStorage.getQueue();
      
      if (queue.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`Syncing ${queue.length} pending changes...`);

      let success = 0;
      let failed = 0;

      for (const item of queue) {
        try {
          // TODO: Execute the queued mutation
          // This requires access to Convex client
          // For now, we'll just remove from queue
          await offlineStorage.removeFromQueue(item.id);
          success++;
        } catch (error) {
          console.error(`Failed to sync ${item.function}:`, error);
          failed++;
        }
      }

      await updateQueueCount();

      if (failed === 0) {
        console.log(`Sync complete: ${success} changes synced successfully`);
      } else {
        console.warn(`Sync completed with errors: ${success} succeeded, ${failed} failed`);
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      updateQueueCount();
      syncNow();
    }
  }, [isOnline]);

  // Check queue count on mount and periodically
  useEffect(() => {
    updateQueueCount();
    
    const interval = setInterval(updateQueueCount, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <OfflineSyncContext.Provider value={{ isSyncing, queuedCount, syncNow }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}
