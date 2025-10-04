/**
 * OPTIMIZED SESSION TRACKING HOOK
 * 
 * Replaces the old inefficient logging with the new audit system
 * - Uses auditSystem instead of userSessions
 * - Graceful error handling (no crashes)
 * - Integrates with useOptimizedAudit for batching
 */

import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
}

interface LocationInfo {
  city?: string;
  country?: string;
}

export const useSessionTracking = () => {
  const { isSignedIn, sessionId } = useAuth();
  const { user } = useUser();
  
  // Use NEW optimized audit system
  const startSession = useMutation(api.auditSystem.startSession);
  const endSession = useMutation(api.auditSystem.endSession);
  
  // Note: logActivity is deprecated - use useOptimizedAudit hook instead
  
  const sessionStartedRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  // Get device information
  const getDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // Detect device type
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      device = 'Mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      device = 'Tablet';
    }

    return { browser, os, device };
  };

  // Get location information (you can integrate with IP geolocation service)
  const getLocationInfo = async (): Promise<LocationInfo> => {
    try {
      // You can replace this with a real geolocation service
      // For now, we'll use a simple IP-based service
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        city: data.city,
        country: data.country_name,
      };
    } catch (error) {
      console.warn('Failed to get location info:', error);
      return {};
    }
  };

  // Start session when user signs in (with retry logic)
  useEffect(() => {
    const initSession = async () => {
      if (isSignedIn && sessionId && user && !sessionStartedRef.current) {
        try {
          const deviceInfo = getDeviceInfo();
          // Skip location lookup to avoid external API dependency
          
          const result = await startSession({
            clerkSessionId: sessionId,
            userAgent: navigator.userAgent,
            deviceInfo,
          });
          
          if (result) {
            sessionStartedRef.current = true;
            console.log('Session started successfully');
          } else {
            // Session start returned null (user not ready), retry in 2 seconds
            console.log('Session start deferred, retrying...');
            setTimeout(initSession, 2000);
          }
        } catch (error) {
          console.error('Failed to start session:', error);
          // Don't crash the app, session will be created via heartbeat if needed
        }
      }
    };

    initSession();
  }, [isSignedIn, sessionId, user, startSession]);

  // End session when user signs out or page unloads
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionStartedRef.current && sessionId) {
        try {
          await endSession({ clerkSessionId: sessionId });
        } catch (error) {
          console.error('Failed to end session:', error);
        }
      }
    };

    // REMOVED: Tab visibility logging (was causing excessive API calls)
    // Use useOptimizedAudit hook instead for page tracking

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // End session on cleanup
      if (sessionStartedRef.current && sessionId) {
        endSession({ clerkSessionId: sessionId }).catch(console.error);
      }
    };
  }, [sessionId, endSession]);

  // DEPRECATED: Old tracking functions kept for backward compatibility
  // Use useOptimizedAudit hook instead for new code
  const trackPageView = (page: string, details?: any) => {
    console.warn('trackPageView is deprecated. Use useOptimizedAudit hook instead.');
    // No-op: Page tracking now handled by useOptimizedAudit heartbeat
  };

  const trackAction = (action: string, page?: string, details?: any, duration?: number) => {
    console.warn('trackAction is deprecated. Use useOptimizedAudit hook instead.');
    // No-op: Action tracking now handled by useOptimizedAudit batching
  };

  const trackError = (error: string, page?: string, details?: any) => {
    console.warn('trackError is deprecated. Use useOptimizedAudit.logSignificantEvent instead.');
    // No-op: Error tracking should use logSignificantEvent
  };

  // REMOVED: Excessive event listeners that caused 8K+ API calls
  // Now handled by useOptimizedAudit hook with 5-minute heartbeat batching

  return {
    trackPageView,
    trackAction,
    trackError,
    isSessionActive: sessionStartedRef.current,
  };
};

export default useSessionTracking;
