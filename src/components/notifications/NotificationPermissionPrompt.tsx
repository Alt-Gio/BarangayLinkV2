"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Smartphone, CheckCircle } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export function NotificationPermissionPrompt() {
  const { permission, isSupported, requestPermission, isLoading } = useNotificationPermission();
  const [isVisible, setIsVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Show prompt 3 seconds after page load if permission not granted
  useEffect(() => {
    // Check if Firebase is configured
    const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
                                   process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    if (!isFirebaseConfigured) {
      console.warn('⚠️ Firebase not configured - notification prompt hidden');
      return;
    }

    const timer = setTimeout(() => {
      if (isSupported && permission === 'default') {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  // Hide if Firebase not configured, permission already granted or denied
  const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  if (!isFirebaseConfigured || !isSupported || permission !== 'default' || !isVisible) {
    return null;
  }

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg shadow-2xl z-50 animate-slideUp overflow-hidden">
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        disabled={isLoading}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="p-4">
        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Enable Notifications</h3>
                <p className="text-sm text-white/90">
                  Stay updated with task assignments, messages, and important updates
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white/10 rounded-lg p-3 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Get notified about new tasks</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Receive important messages</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Never miss deadlines</span>
              </div>
            </div>

            {/* Platform indicator */}
            <div className="flex items-center gap-2 mb-4 text-xs text-white/70">
              <Smartphone className="w-4 h-4" />
              <span>Works on mobile and desktop</span>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 bg-white text-teal-600 px-4 py-2.5 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Enabling...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Enable Notifications</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                disabled={isLoading}
                className="px-4 py-2.5 text-white/80 hover:text-white transition-colors disabled:opacity-50"
              >
                Later
              </button>
            </div>
          </>
        ) : (
          // Success state
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-300" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Notifications Enabled!</h3>
            <p className="text-sm text-white/90">
              You'll now receive important updates
            </p>
          </div>
        )}
      </div>

      {/* Privacy note */}
      {!isSuccess && (
        <div className="bg-black/20 px-4 py-2 text-xs text-white/70 text-center">
          🔒 Your privacy is protected. Notifications are stored securely in Convex.
        </div>
      )}
    </div>
  );
}
