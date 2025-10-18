"use client";

import { useEffect, useState } from 'react';
import { requestNotificationPermission } from '@/lib/firebase';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useUser();
  const savePushSubscription = useMutation(api.pushNotifications.savePushSubscription);
  
  // Fetch existing token from Convex
  const existingSubscription = useQuery(
    api.pushNotifications.getUserSubscription,
    user ? {} : "skip"
  );

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
    
    // Set token from existing subscription if available
    if (existingSubscription?.token) {
      setToken(existingSubscription.token);
    }
  }, [existingSubscription]);

  const requestPermission = async () => {
    if (!isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    setIsLoading(true);
    
    try {
      // First, request basic browser notification permission
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        console.log('✅ Browser notification permission granted!');
        
        // Try to get FCM token (optional, may fail if not configured or not authenticated)
        try {
          const fcmToken = await requestNotificationPermission();
          
          if (fcmToken) {
            setToken(fcmToken);
            
            // Try to save token (may fail if not authenticated)
            try {
              await savePushSubscription({ token: fcmToken });
              console.log('✅ FCM token saved!');
            } catch (saveError) {
              console.warn('⚠️ Could not save FCM token (not logged in or Firebase not configured):', saveError);
              // This is okay - basic notifications will still work
            }
          }
        } catch (fcmError) {
          console.warn('⚠️ FCM not available (not configured or not authenticated):', fcmError);
          // This is okay - basic notifications will still work
        }
        
        return true;
      } else {
        console.log('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    permission, 
    isSupported, 
    requestPermission, 
    token,
    isLoading 
  };
}
