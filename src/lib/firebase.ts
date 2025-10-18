"use client";

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Firebase configuration
// Check if all required environment variables are present
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Validate Firebase config
const isFirebaseConfigured = firebaseConfig.projectId && firebaseConfig.apiKey;

if (!isFirebaseConfigured) {
  console.warn('⚠️ Firebase is not configured. Please add environment variables to .env.local');
  console.warn('Missing values:', {
    projectId: !firebaseConfig.projectId,
    apiKey: !firebaseConfig.apiKey,
  });
}

// Initialize Firebase only if configured
const app = isFirebaseConfigured && getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0] || null;

// Get messaging instance (only in browser and if Firebase is configured)
let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && isFirebaseConfigured && app) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
  }
}

export { app, messaging };

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    if (!messaging) {
      console.log('Messaging not initialized');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting permission/token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return;

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}
