"use client";

import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ActivityTrackerOptions {
  type: 'task' | 'project' | 'none';
  id?: string;
  name?: string;
}

/**
 * Hook to automatically track user activity on pages
 * Sets activity when component mounts, clears when unmounts
 */
export function useActivityTracker({ type, id, name }: ActivityTrackerOptions) {
  const setActivity = useMutation(api.activity.setCurrentActivity);

  useEffect(() => {
    // Set activity when entering the page
    if (type !== 'none' && id && name) {
      setActivity({
        activityType: type,
        activityId: id,
        activityName: name,
      });
    }

    // Clear activity when leaving the page
    return () => {
      setActivity({
        activityType: 'none',
      });
    };
  }, [type, id, name, setActivity]);
}
