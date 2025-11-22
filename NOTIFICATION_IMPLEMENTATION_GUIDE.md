# 🔔 Notification Implementation Guide

**Step-by-step code examples for upgrading your notification system**

---

## 📦 Step 1: Install Dependencies

```bash
npm install sonner framer-motion howler lucide-react
```

---

## 🎨 Step 2: Modern Toast Notifications

### Create: `src/lib/toast.ts`
```typescript
import { toast as sonnerToast } from 'sonner';
import { playNotificationSound } from './notificationSounds';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'task' | 'message';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  sound?: boolean;
}

export function showToast(options: ToastOptions) {
  const {
    title,
    description,
    type = 'info',
    priority = 'medium',
    action,
    duration,
    sound = true,
  } = options;

  // Play sound based on priority
  if (sound) {
    playNotificationSound(priority);
  }

  // Show toast with appropriate styling
  const toastFn = getToastFunction(type);
  
  toastFn(title, {
    description,
    duration: duration || getDurationForPriority(priority),
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    className: `toast-${priority}`,
  });
}

function getToastFunction(type: ToastType) {
  switch (type) {
    case 'success': return sonnerToast.success;
    case 'error': return sonnerToast.error;
    case 'warning': return sonnerToast.warning;
    default: return sonnerToast;
  }
}

function getDurationForPriority(priority: string): number {
  switch (priority) {
    case 'critical': return 10000; // 10 seconds
    case 'high': return 7000;
    case 'medium': return 5000;
    case 'low': return 3000;
    default: return 5000;
  }
}
```

---

## 🔊 Step 3: Notification Sounds

### Create: `src/lib/notificationSounds.ts`
```typescript
import { Howl } from 'howler';

const sounds = {
  critical: new Howl({
    src: ['/sounds/critical.mp3'],
    volume: 0.8,
  }),
  high: new Howl({
    src: ['/sounds/high.mp3'],
    volume: 0.6,
  }),
  medium: new Howl({
    src: ['/sounds/medium.mp3'],
    volume: 0.4,
  }),
  low: new Howl({
    src: ['/sounds/low.mp3'],
    volume: 0.2,
  }),
  success: new Howl({
    src: ['/sounds/success.mp3'],
    volume: 0.5,
  }),
  message: new Howl({
    src: ['/sounds/message.mp3'],
    volume: 0.5,
  }),
};

let soundEnabled = true;

export function playNotificationSound(
  type: 'critical' | 'high' | 'medium' | 'low' | 'success' | 'message'
) {
  if (!soundEnabled) return;
  
  try {
    sounds[type]?.play();
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function setVolume(type: keyof typeof sounds, volume: number) {
  sounds[type]?.volume(volume);
}

// Vibration for mobile
export function vibrateDevice(pattern: number[] = [200]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export const vibrationPatterns = {
  critical: [200, 100, 200, 100, 200],
  high: [100, 50, 100],
  medium: [100],
  low: [50],
};
```

---

## 🎴 Step 4: Enhanced Notification Card

### Create: `src/components/notifications/EnhancedNotificationCard.tsx`
```typescript
"use client";

import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  FolderKanban,
  Trophy,
  Bell,
  Eye,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCardProps {
  notification: {
    _id: string;
    title: string;
    message: string;
    type: string;
    category: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    createdAt: number;
    isRead: boolean;
    imageUrl?: string;
    actionUrl?: string;
    metadata?: any;
  };
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (notification: any) => void;
}

export function EnhancedNotificationCard({
  notification,
  onRead,
  onDelete,
  onView,
}: NotificationCardProps) {
  const priorityColors = {
    critical: 'border-l-red-500 bg-red-950/20',
    high: 'border-l-orange-500 bg-orange-950/20',
    medium: 'border-l-yellow-500 bg-yellow-950/20',
    low: 'border-l-green-500 bg-green-950/20',
  };

  const icon = getCategoryIcon(notification.category);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`
        relative p-4 rounded-lg border-l-4 
        ${priorityColors[notification.priority]}
        ${!notification.isRead ? 'bg-gray-800/50' : 'bg-gray-900/30'}
        hover:bg-gray-800/70 transition-all cursor-pointer
      `}
      onClick={() => onView(notification)}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="font-semibold text-white truncate">
            {notification.title}
          </h4>

          {/* Message */}
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</span>
            
            {notification.metadata?.senderName && (
              <>
                <span>•</span>
                <span>by {notification.metadata.senderName}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(notification._id);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 rounded transition"
              >
                <CheckCircle className="w-3 h-3" />
                Mark Read
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(notification);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              <Eye className="w-3 h-3" />
              View
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getCategoryIcon(category: string) {
  const iconProps = { className: "w-5 h-5 text-gray-400" };
  
  switch (category) {
    case 'task_assigned':
    case 'task':
      return <FolderKanban {...iconProps} />;
    case 'message':
    case 'chat':
      return <MessageSquare {...iconProps} />;
    case 'achievement':
      return <Trophy {...iconProps} className="w-5 h-5 text-yellow-500" />;
    case 'deadline':
      return <Clock {...iconProps} className="w-5 h-5 text-orange-500" />;
    case 'success':
      return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle {...iconProps} className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-500" />;
    default:
      return <Bell {...iconProps} />;
  }
}
```

---

## 📱 Step 5: Cross-Platform Push Notifications

### Update: `convex/pushNotificationsEnhanced.ts`
```typescript
import { mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Send push notification to user
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    imageUrl: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get user's push subscription
    const subscription = await ctx.runQuery(
      internal.pushNotifications.getUserSubscription,
      { userId: args.userId }
    );

    if (!subscription?.token) {
      console.log(`No push subscription for user ${args.userId}`);
      return { success: false, reason: "no_subscription" };
    }

    // Prepare notification payload
    const payload = {
      notification: {
        title: args.title,
        body: args.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        image: args.imageUrl,
        tag: args.data?.category || 'default',
        requireInteraction: args.priority === 'critical',
        vibrate: getVibrationPattern(args.priority),
        data: {
          url: args.actionUrl,
          ...args.data,
        },
      },
      // Platform-specific
      android: {
        priority: args.priority === 'critical' ? 'high' : 'normal',
        notification: {
          channelId: args.data?.category || 'default',
          color: getPriorityColor(args.priority),
          sound: `${args.priority}.mp3`,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: args.title,
              body: args.body,
            },
            sound: `${args.priority}.caf`,
            badge: 1,
            'content-available': 1,
          },
        },
      },
      webpush: {
        headers: {
          Urgency: args.priority === 'critical' ? 'high' : 'normal',
        },
      },
    };

    try {
      // Send via FCM (Firebase Cloud Messaging)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/send-fcm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: subscription.token,
            ...payload,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('FCM request failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Push notification failed:', error);
      return { success: false, error: String(error) };
    }
  },
});

function getVibrationPattern(priority: string): number[] {
  switch (priority) {
    case 'critical': return [200, 100, 200, 100, 200];
    case 'high': return [100, 50, 100];
    case 'medium': return [100];
    case 'low': return [50];
    default: return [100];
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#10b981';
  }
}
```

---

## 🎯 Step 6: Notification Center Page

### Update: `src/app/notifications/page.tsx`
```typescript
"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { EnhancedNotificationCard } from '@/components/notifications/EnhancedNotificationCard';
import { Bell, Filter, CheckCheck, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationCenterPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = useQuery(api.notifications.getAllUserNotifications, {
    limit: 100,
  });
  
  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Filter notifications
  const filteredNotifications = notifications?.filter((n) => {
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'read' && !n.isRead) return false;
    if (category !== 'all' && n.category !== category) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group notifications by date
  const groupedNotifications = groupByDate(filteredNotifications || []);
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-emerald-500" />
              Notification Center
            </h1>
            <p className="text-gray-400 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead({})}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 bg-gray-700 rounded-lg text-white"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 rounded-lg text-white"
            >
              <option value="all">All Categories</option>
              <option value="task">Tasks</option>
              <option value="project_announcement">Projects</option>
              <option value="message">Messages</option>
              <option value="achievement">Achievements</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, notifs]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold text-gray-400 mb-3">
                {date}
              </h2>
              <div className="space-y-2">
                {notifs.map((notification) => (
                  <EnhancedNotificationCard
                    key={notification._id}
                    notification={notification}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                    onView={(n) => {
                      if (n.actionUrl) window.location.href = n.actionUrl;
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredNotifications?.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function groupByDate(notifications: any[]) {
  const groups: Record<string, any[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let label: string;
    if (dateKey.getTime() === today.getTime()) {
      label = 'Today';
    } else if (dateKey.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });

  return groups;
}
```

---

## ⚙️ Step 7: Notification Preferences

### Create: `convex/notificationPreferences.ts`
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user's notification preferences
export const getUserPreferences = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    let prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // Return defaults if no preferences exist
    if (!prefs) {
      return getDefaultPreferences();
    }

    return prefs;
  },
});

// Update notification preferences
export const updatePreferences = mutation({
  args: {
    taskAssigned: v.optional(v.object({
      push: v.boolean(),
      email: v.boolean(),
      sound: v.boolean(),
    })),
    projectAnnouncement: v.optional(v.object({
      push: v.boolean(),
      email: v.boolean(),
      sound: v.boolean(),
    })),
    // Add more categories...
    soundVolume: v.optional(v.number()),
    vibrationEnabled: v.optional(v.boolean()),
    doNotDisturb: v.optional(v.object({
      enabled: v.boolean(),
      startTime: v.string(),
      endTime: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    let prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (prefs) {
      // Update existing
      await ctx.db.patch(prefs._id, args);
    } else {
      // Create new
      await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        ...getDefaultPreferences(),
        ...args,
      });
    }

    return { success: true };
  },
});

function getDefaultPreferences() {
  return {
    taskAssigned: { push: true, email: true, sound: true },
    taskCompleted: { push: true, email: false, sound: true },
    projectAnnouncement: { push: true, email: true, sound: true },
    message: { push: true, email: false, sound: true },
    achievement: { push: true, email: false, sound: true },
    soundVolume: 70,
    vibrationEnabled: true,
    doNotDisturb: {
      enabled: false,
      startTime: "22:00",
      endTime: "08:00",
    },
    emailDigest: "daily" as const,
  };
}
```

---

## 📝 Summary

**Files Created:**
1. ✅ `src/lib/toast.ts` - Toast notification system
2. ✅ `src/lib/notificationSounds.ts` - Sound & vibration
3. ✅ `src/components/notifications/EnhancedNotificationCard.tsx` - Modern UI
4. ✅ `convex/pushNotificationsEnhanced.ts` - Cross-platform push
5. ✅ `src/app/notifications/page.tsx` - Notification center
6. ✅ `convex/notificationPreferences.ts` - User preferences

**Next Steps:**
1. Download notification sound files
2. Update schema for new fields
3. Integrate toast system
4. Test on iOS/Android devices

**Result:**
Premium notification experience across all platforms! 🎉
