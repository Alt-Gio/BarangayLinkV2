"use client";

import { useState, useCallback } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { offlineStorage, STORES } from "@/lib/offlineStorage";
import { useMutation } from "convex/react";
import { FunctionReference } from "convex/server";

interface OfflineMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: (args: any) => void;
  rollback?: () => void;
}

export function useOfflineMutation<T = any>(
  mutation: FunctionReference<"mutation">,
  functionName?: string,
  options?: OfflineMutationOptions<T>
) {
  const { isOnline } = useNetworkStatus();
  const [isPending, setIsPending] = useState(false);
  const convexMutation = useMutation(mutation as any);

  const execute = useCallback(
    async (args: any) => {
      setIsPending(true);

      try {
        if (isOnline) {
          // Online: Execute mutation immediately
          const result = await convexMutation(args);
          options?.onSuccess?.(result);
          return result;
        } else {
          // Offline: Queue mutation and apply optimistic update
          options?.optimisticUpdate?.(args);

          await offlineStorage.addToQueue({
            type: "mutation",
            function: functionName || "unknown",
            args,
            timestamp: Date.now(),
          });

          // Return a temporary ID for optimistic updates
          const tempId = `temp_${Date.now()}_${Math.random()}`;
          return tempId;
        }
      } catch (error) {
        options?.rollback?.();
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [isOnline, convexMutation, functionName, options]
  );

  return { execute, isPending, isOffline: !isOnline };
}

// Sync offline queue when back online
export async function syncOfflineQueue(
  executeMutation: (functionName: string, args: any) => Promise<any>
) {
  const queue = await offlineStorage.getQueue();
  
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await executeMutation(item.function, item.args);
      await offlineStorage.removeFromQueue(item.id);
      success++;
    } catch (error) {
      console.error(`Failed to sync mutation ${item.function}:`, error);
      failed++;
    }
  }

  return { success, failed };
}
