"use client";

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';

/**
 * Listens for new notifications and displays them as browser notifications
 * This works WITHOUT Firebase - just uses browser Notification API
 */
export function NotificationListener() {
  const { user } = useUser();
  const lastCheckRef = useRef<number>(Date.now());
  
  // Query notifications for current user
  const notifications = useQuery(
    api.notifications.getAllUserNotifications,
    user ? { limit: 50, onlyUnread: false } : "skip"
  );

  useEffect(() => {
    if (!user || !notifications) return;
    if (Notification.permission !== 'granted') return;

    // Get unread notifications created after last check
    const newNotifications = notifications.filter(
      notif => !notif.isRead && notif.createdAt > lastCheckRef.current
    );

    // Show browser notification for each new notification
    newNotifications.forEach(notif => {
      try {
        const browserNotif = new Notification(notif.title, {
          body: notif.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: notif._id,
          requireInteraction: notif.type === 'error' || notif.type === 'warning',
        });

        browserNotif.onclick = () => {
          window.focus();
          if (notif.actionUrl) {
            window.location.href = notif.actionUrl;
          }
        };

        console.log(`✅ Notification shown: ${notif.title}`);
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    });

    // Update last check time
    if (notifications.length > 0) {
      const latestTime = Math.max(...notifications.map(n => n.createdAt));
      lastCheckRef.current = latestTime;
    }
  }, [notifications, user]);

  // This component doesn't render anything
  return null;
}
