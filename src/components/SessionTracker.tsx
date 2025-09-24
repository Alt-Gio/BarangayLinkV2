'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSessionTracking } from '../hooks/useSessionTracking';

export default function SessionTracker() {
  const pathname = usePathname();
  const { trackPageView, isSessionActive } = useSessionTracking();

  // Track page views when pathname changes
  useEffect(() => {
    if (isSessionActive) {
      trackPageView(pathname, {
        timestamp: Date.now(),
        referrer: document.referrer,
      });
    }
  }, [pathname, trackPageView, isSessionActive]);

  // This component doesn't render anything
  return null;
}
