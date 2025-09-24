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
  const startSession = useMutation(api.userSessions.startSession);
  const endSession = useMutation(api.userSessions.endSession);
  const logActivity = useMutation(api.userSessions.logActivity);
  
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

  // Start session when user signs in
  useEffect(() => {
    const initSession = async () => {
      if (isSignedIn && sessionId && user && !sessionStartedRef.current) {
        try {
          const deviceInfo = getDeviceInfo();
          const locationInfo = await getLocationInfo();
          
          await startSession({
            clerkSessionId: sessionId,
            userAgent: navigator.userAgent,
            deviceInfo,
            location: locationInfo,
          });
          
          sessionStartedRef.current = true;
          console.log('Session started successfully');
        } catch (error) {
          console.error('Failed to start session:', error);
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionStartedRef.current) {
        // Log when user switches away from the tab
        logActivity({
          activityType: 'page_view',
          page: window.location.pathname,
          details: { action: 'tab_hidden' },
        }).catch(console.error);
      } else if (document.visibilityState === 'visible' && sessionStartedRef.current) {
        // Log when user returns to the tab
        logActivity({
          activityType: 'page_view',
          page: window.location.pathname,
          details: { action: 'tab_visible' },
        }).catch(console.error);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // End session on cleanup
      if (sessionStartedRef.current && sessionId) {
        endSession({ clerkSessionId: sessionId }).catch(console.error);
      }
    };
  }, [sessionId, endSession, logActivity]);

  // Track page views
  const trackPageView = (page: string, details?: any) => {
    if (sessionStartedRef.current) {
      logActivity({
        activityType: 'page_view',
        page,
        details,
      }).catch(console.error);
    }
  };

  // Track user actions
  const trackAction = (action: string, page?: string, details?: any, duration?: number) => {
    if (sessionStartedRef.current) {
      logActivity({
        activityType: 'action',
        action,
        page: page || window.location.pathname,
        details,
        duration,
      }).catch(console.error);
    }
  };

  // Track errors
  const trackError = (error: string, page?: string, details?: any) => {
    if (sessionStartedRef.current) {
      logActivity({
        activityType: 'error',
        page: page || window.location.pathname,
        details: { error, ...details },
      }).catch(console.error);
    }
  };

  // Activity heartbeat to keep session alive
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // If more than 5 minutes of inactivity, log it
      if (timeSinceLastActivity > 5 * 60 * 1000 && sessionStartedRef.current) {
        trackAction('heartbeat', window.location.pathname, {
          inactiveTime: timeSinceLastActivity,
        });
      }
      
      lastActivityRef.current = now;
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Track user interactions to update last activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  return {
    trackPageView,
    trackAction,
    trackError,
    isSessionActive: sessionStartedRef.current,
  };
};

export default useSessionTracking;
