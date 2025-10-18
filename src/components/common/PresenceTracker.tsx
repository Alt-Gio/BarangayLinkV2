"use client";

import { usePresence } from '@/hooks/usePresence';

/**
 * Global presence tracker component
 * Add this to your root layout to track user online status
 */
export function PresenceTracker() {
  usePresence();
  return null; // This component doesn't render anything
}
