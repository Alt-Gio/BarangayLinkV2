"use client";

import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

/**
 * Hook to track user online presence
 * Updates presence every 30 seconds while user is active
 */
export function usePresence() {
  const updatePresence = useMutation(api.presence.updatePresence);

  useEffect(() => {
    // Update presence immediately
    updatePresence({ status: 'online' });

    // Update every 30 seconds to keep online status
    const interval = setInterval(() => {
      updatePresence({ status: 'online' });
    }, 30000); // 30 seconds

    // Set to offline when component unmounts or page closes
    const handleBeforeUnload = () => {
      updatePresence({ status: 'offline' });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Mark as offline when unmounting
      updatePresence({ status: 'offline' });
    };
  }, [updatePresence]);
}
