"use client";

import { useState, useEffect } from 'react';

export function useNetworkState() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('🟢 Network: Back online!');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('🔴 Network: Going offline!');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Also check periodically (in case events don't fire)
    const checkInterval = setInterval(() => {
      if (navigator.onLine !== isOnline) {
        setIsOnline(navigator.onLine);
      }
    }, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, [isOnline]);
  
  return isOnline;
}
