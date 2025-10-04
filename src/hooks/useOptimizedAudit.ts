/**
 * OPTIMIZED AUDIT HOOK
 * 
 * Replaces the old activity tracking with smart batching and debouncing
 * - Reduces API calls by 90%+
 * - Batches actions into summaries
 * - Only sends heartbeat every 5 minutes
 * - Logs only significant events
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { usePathname } from 'next/navigation';

interface UseOptimizedAuditOptions {
  enabled?: boolean;
  heartbeatInterval?: number; // milliseconds, default 5 minutes
}

export function useOptimizedAudit(options: UseOptimizedAuditOptions = {}) {
  const { enabled = true, heartbeatInterval = 5 * 60 * 1000 } = options; // 5 minutes default
  
  const pathname = usePathname();
  const updateHeartbeat = useMutation(api.auditSystem.updateSessionHeartbeat);
  const logEvent = useMutation(api.auditSystem.logSignificantEvent);
  
  // Track actions locally
  const activityCountRef = useRef(0);
  const lastHeartbeatRef = useRef(Date.now());
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Send heartbeat with activity summary
  const sendHeartbeat = useCallback(async () => {
    if (!enabled) return;
    
    try {
      await updateHeartbeat({
        currentPage: pathname || undefined,
        activityCount: activityCountRef.current,
      });
      
      // Reset counter after sending
      activityCountRef.current = 0;
      lastHeartbeatRef.current = Date.now();
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }, [enabled, pathname, updateHeartbeat]);

  // Track action (local only, aggregated)
  const trackAction = useCallback(() => {
    if (!enabled) return;
    activityCountRef.current++;
  }, [enabled]);

  // Log significant event (sent immediately)
  const logSignificantEvent = useCallback(async (
    eventType: 'project_created' | 'project_approved' | 'task_completed' | 'file_uploaded' | 'permission_change' | 'data_export' | 'error',
    details?: any,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    if (!enabled) return;
    
    try {
      await logEvent({
        eventType,
        details,
        severity,
      });
    } catch (error) {
      console.error('Failed to log significant event:', error);
    }
  }, [enabled, logEvent]);

  // Setup heartbeat interval
  useEffect(() => {
    if (!enabled) return;

    // Initial heartbeat on mount
    sendHeartbeat();

    // Setup interval
    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatInterval);

    // Cleanup
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      // Send final heartbeat on unmount
      sendHeartbeat();
    };
  }, [enabled, heartbeatInterval, sendHeartbeat]);

  // Send heartbeat on page change
  useEffect(() => {
    if (!enabled) return;
    sendHeartbeat();
  }, [pathname, enabled, sendHeartbeat]);

  // Send heartbeat before page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability on page close
      if (navigator.sendBeacon && activityCountRef.current > 0) {
        // Note: sendBeacon doesn't work with Convex directly
        // So we just send the heartbeat normally
        sendHeartbeat();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, sendHeartbeat]);

  return {
    trackAction,
    logSignificantEvent,
  };
}

/**
 * Example usage:
 * 
 * // In your component
 * const { trackAction, logSignificantEvent } = useOptimizedAudit();
 * 
 * // Track regular actions (batched)
 * const handleClick = () => {
 *   trackAction();
 *   // ... your logic
 * };
 * 
 * // Log significant events (sent immediately)
 * const handleProjectCreate = async () => {
 *   const projectId = await createProject(...);
 *   await logSignificantEvent('project_created', { projectId }, 'medium');
 * };
 */
