# 📱 Native-Like Notification System Implementation Guide

## Overview

This guide outlines how to implement **native app-like notifications** for BarangayLink on both **mobile** and **desktop** platforms using modern Web APIs.

---

## 🎯 Goals

1. ✅ **Mobile Notifications** - Like native Android/iOS apps
2. ✅ **Desktop Notifications** - System notifications on Windows/Mac/Linux
3. ✅ **Push Notifications** - Work even when app is closed
4. ✅ **Rich Media** - Images, actions, badges
5. ✅ **Offline Support** - Queue notifications when offline

---

## 📊 Technology Stack Recommendation

### **1. Web Push Notifications API**
Native browser notifications that work across all platforms.

```typescript
// Browser support:
✅ Chrome/Edge (Desktop & Mobile)
✅ Firefox (Desktop & Mobile)
✅ Safari (Desktop & iOS 16.4+)
✅ Opera, Brave, Samsung Internet
```

### **2. Service Worker + Push API**
Your app already has service workers! We'll extend them.

### **3. Backend Options**

**Option A: Firebase Cloud Messaging (FCM)** ⭐ Recommended
- Free for unlimited messages
- Easy setup
- Great documentation
- Works with Convex

**Option B: Web Push Library (Self-Hosted)**
- `web-push` npm package
- Full control
- No third-party dependency

**Option C: OneSignal**
- Free tier: 10k subscribers
- Analytics included
- Easy integration

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 User Action                     │
│  (Task assigned, message received, etc.)        │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│            Convex Backend Function              │
│  Creates notification in database               │
│  + Triggers push notification service           │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         Push Notification Service               │
│      (FCM, web-push, or OneSignal)              │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│           Service Worker (Browser)              │
│  Receives push → Shows notification             │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│        Native System Notification              │
│   📱 Mobile: Android/iOS notification           │
│   💻 Desktop: Windows/Mac/Linux notification    │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Phase 1: Request Permission**

```typescript
// src/hooks/useNotificationPermission.ts
"use client";

import { useEffect, useState } from 'react';

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  return { permission, isSupported, requestPermission };
}
```

### **Phase 2: Subscribe to Push Notifications**

```typescript
// src/lib/pushNotifications.ts
"use client";

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    // Send subscription to backend
    await saveSubscription(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

// Helper function
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscription(subscription: PushSubscription) {
  // Save to Convex database
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  return response.json();
}
```

### **Phase 3: Enhanced Service Worker**

```typescript
// public/sw.js (extend your existing service worker)

// Listen for push events
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'view', title: 'View', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/close.png' }
    ],
    data: {
      url: data.url || '/',
      notificationId: data.notificationId,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // If app is already open, focus it
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

### **Phase 4: Convex Backend Integration**

```typescript
// convex/pushNotifications.ts
import { mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Save user's push subscription
export const savePushSubscription = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if subscription exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        endpoint: args.endpoint,
        keys: args.keys,
        updatedAt: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("pushSubscriptions", {
        userId: user._id,
        endpoint: args.endpoint,
        keys: args.keys,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Send push notification (called when creating notifications)
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user's push subscription
    const subscription = await ctx.runQuery(
      internal.pushNotifications.getUserSubscription,
      { userId: args.userId }
    );

    if (!subscription) {
      console.log("User has no push subscription");
      return { sent: false };
    }

    // Send push via your chosen service (FCM, web-push, etc.)
    // This would call your API route or external service
    
    return { sent: true };
  },
});
```

### **Phase 5: Schema Update**

```typescript
// convex/schema.ts - Add to your schema
pushSubscriptions: defineTable({
  userId: v.id("users"),
  endpoint: v.string(),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"]),
```

---

## 🎨 UI Components

### **1. Permission Prompt Component**

```typescript
// src/components/notifications/NotificationPermissionPrompt.tsx
"use client";

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { subscribeToPushNotifications } from '@/lib/pushNotifications';

export function NotificationPermissionPrompt() {
  const { permission, isSupported, requestPermission } = useNotificationPermission();
  const [isVisible, setIsVisible] = useState(permission === 'default');

  if (!isSupported || permission !== 'default' || !isVisible) {
    return null;
  }

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribeToPushNotifications();
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg shadow-2xl p-4 z-50 animate-slideUp">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Enable Notifications</h3>
          <p className="text-sm text-white/90 mb-3">
            Stay updated with task assignments, messages, and important updates
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              className="flex-1 bg-white text-teal-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              Enable
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### **2. Notification Settings Toggle**

```typescript
// src/components/settings/NotificationSettings.tsx
"use client";

import { Bell, BellOff, Smartphone, Monitor } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export function NotificationSettings() {
  const { permission, requestPermission } = useNotificationPermission();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Notifications</h3>
      
      {/* Push Notifications */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <Bell className="w-5 h-5 text-teal-400" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="text-white font-medium">Push Notifications</p>
              <p className="text-sm text-gray-400">
                {permission === 'granted' ? 'Enabled' : 
                 permission === 'denied' ? 'Blocked' : 'Not enabled'}
              </p>
            </div>
          </div>
          
          {permission !== 'granted' && permission !== 'denied' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              Enable
            </button>
          )}
        </div>
        
        {permission === 'denied' && (
          <p className="text-xs text-red-400 mt-2">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </div>

      {/* Platform Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <Smartphone className="w-5 h-5 text-teal-400 mb-2" />
          <p className="text-sm text-white font-medium">Mobile</p>
          <p className="text-xs text-gray-400">Works on Android & iOS</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <Monitor className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-sm text-white font-medium">Desktop</p>
          <p className="text-xs text-gray-400">Windows, Mac, Linux</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 📱 Mobile-Specific Features

### **Android Optimization**

```typescript
// AndroidManifest.json equivalent in manifest.json
{
  "name": "BarangayLink",
  "short_name": "BarangayLink",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#14b8a6",
  "background_color": "#111827",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "notifications": {
    "badge": "/badge-72x72.png"
  }
}
```

### **iOS Optimization**

```html
<!-- Add to layout.tsx <head> -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="BarangayLink">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## 🔔 Notification Types & Examples

### **1. Task Assignment**

```typescript
{
  title: "📋 New Task Assigned",
  message: "You've been assigned: Road Drainage Repair",
  icon: "/icons/task.png",
  image: "/images/task-preview.jpg",
  badge: "/badge.png",
  url: "/tasks/task_123",
  actions: [
    { action: 'view', title: 'View Task' },
    { action: 'later', title: 'Later' }
  ]
}
```

### **2. Message Received**

```typescript
{
  title: "💬 New Message from Marc",
  message: "Hey, can you check the drainage project?",
  icon: "/avatars/marc.jpg",
  url: "/messages",
  vibrate: [200, 100, 200],
  requireInteraction: true
}
```

### **3. Achievement Unlocked**

```typescript
{
  title: "🏆 Achievement Unlocked!",
  message: "You've earned: 10 Hour Master!",
  icon: "/icons/achievement.png",
  image: "/achievements/10-hour-master.png",
  url: "/profile",
  vibrate: [100, 50, 100, 50, 100]
}
```

---

## 💡 Best Practices

### **DO:**

✅ Ask permission at the right time (not immediately on load)  
✅ Explain the value before requesting  
✅ Use rich notifications with images and actions  
✅ Respect user preferences (quiet hours, etc.)  
✅ Test on real devices (Android, iOS, Desktop)  
✅ Handle offline scenarios gracefully  
✅ Group related notifications  
✅ Set expiration times  

### **DON'T:**

❌ Spam users with too many notifications  
❌ Send notifications for trivial updates  
❌ Use misleading notification text  
❌ Ignore permission denials  
❌ Forget to test on mobile browsers  
❌ Assume all browsers support all features  

---

## 🧪 Testing Checklist

- [ ] Desktop Chrome - Push notifications
- [ ] Desktop Firefox - Push notifications
- [ ] Desktop Edge - Push notifications
- [ ] Android Chrome - Push notifications
- [ ] Android Firefox - Push notifications
- [ ] Safari iOS 16.4+ - Push notifications
- [ ] Test with app closed
- [ ] Test with app open
- [ ] Test notification actions
- [ ] Test notification grouping
- [ ] Test offline queueing

---

## 📊 Implementation Timeline

### **Week 1: Foundation**
- Set up service worker push handling
- Implement permission request UI
- Add Convex schema for subscriptions

### **Week 2: Backend**
- Choose push service (FCM recommended)
- Set up VAPID keys
- Implement subscription management
- Create push sending logic

### **Week 3: Integration**
- Update notification creation to trigger push
- Add notification settings page
- Implement notification preferences

### **Week 4: Polish & Testing**
- Mobile testing (Android & iOS)
- Desktop testing (All browsers)
- Performance optimization
- Analytics tracking

---

## 🚀 Quick Start (Recommended Path)

### **1. Use Firebase Cloud Messaging (FCM)**

**Why FCM:**
- ✅ Free and unlimited
- ✅ Works with Convex
- ✅ Great documentation
- ✅ Cross-platform support

**Setup:**
```bash
npm install firebase
```

```typescript
// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  // Your config from Firebase Console
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
```

### **2. Minimum Viable Implementation**

**Day 1:** Request permission + Subscribe  
**Day 2:** Save subscription to Convex  
**Day 3:** Send test notification  
**Day 4:** Integrate with existing notifications  
**Day 5:** Mobile testing  

---

## 📚 Resources

- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API Specification](https://w3c.github.io/push-api/)

---

## 🎯 Expected Results

After implementation, users will get:

📱 **Mobile:**
- Native Android notifications
- iOS Safari notifications (iOS 16.4+)
- Badge counts on app icon
- Grouped notifications
- Notification actions

💻 **Desktop:**
- Windows Action Center
- macOS Notification Center
- Linux notification system
- Chrome/Firefox/Edge native style

This will make BarangayLink feel like a **true native application**! 🚀
