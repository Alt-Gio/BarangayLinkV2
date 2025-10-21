# 🔔 NOTIFICATION SYSTEM - IMPLEMENTATION GUIDE

## 📊 Current Status Review

### ✅ What You Already Have:
1. **Backend System** - Robust notification mutations and queries in `convex/notifications.ts`
2. **Database Schema** - Notifications table with proper fields
3. **Basic Functions**:
   - Create notifications
   - Mark as read/unread
   - Get unread count
   - Delete notifications
   - Query user notifications

### ❌ What's Missing:
1. **UI Components** - Notification bell, dropdown, toast alerts
2. **Sidebar Integration** - Unread badge on sidebar
3. **Real-time Updates** - Live notification updates
4. **Auto-triggers** - Notifications when events happen (assignments, removals, etc.)
5. **Notification Center** - Dedicated page to view all notifications

---

## 🎯 Recommended Implementation Approach

### **Option 1: Comprehensive Full-Stack Solution (RECOMMENDED)**

This is the most complete solution for your BarangayLink application.

#### **Components Needed:**

```typescript
1. NotificationBell - Sidebar icon with badge
2. NotificationDropdown - Popup showing recent notifications
3. NotificationCenter - Full page for all notifications
4. NotificationToast - Real-time popup alerts
5. Auto-trigger hooks - Create notifications on events
```

#### **Architecture:**

```
User Action (Assign, Remove, Update)
         ↓
Backend Mutation (eventTaskAssignments.assignUsersToTask)
         ↓
Create Notification (notifications.createNotification)
         ↓
Real-time Update (Convex reactivity)
         ↓
UI Components Update Automatically
         ↓
User sees notification (Bell badge, Toast, Dropdown)
```

---

## 🛠️ Step-by-Step Implementation

### **STEP 1: Create Notification Bell Component**

Create `src/components/notifications/NotificationBell.tsx`:

```typescript
"use client";

import { Bell } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
```

---

### **STEP 2: Create Notification Dropdown**

Create `src/components/notifications/NotificationDropdown.tsx`:

```typescript
"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { X, Check, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: Props) {
  const router = useRouter();
  const notifications = useQuery(api.notifications.getAllUserNotifications, { 
    limit: 10 
  });
  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    
    // Navigate to related page if actionUrl exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.metadata?.data?.projectId) {
      router.push(\`/projects/\${notification.metadata.data.projectId}\`);
    } else if (notification.metadata?.data?.taskId) {
      router.push(\`/tasks/my-duties\`);
    }
    
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_removed':
        return '❌';
      case 'task_updated':
        return '✏️';
      case 'message':
        return '💬';
      case 'project_announcement':
        return '📢';
      case 'deadline':
        return '⏰';
      default:
        return '🔔';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/95 backdrop-blur sticky top-0">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            {notifications && notifications.some(n => !n.isRead) && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={\`p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer \${
                  !notification.isRead ? 'bg-teal-500/10 border-l-4 border-l-teal-500' : ''
                }\`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white line-clamp-1">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification({ notificationId: notification._id });
                        }}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-800/95">
          <button
            onClick={() => {
              router.push('/notifications');
              onClose();
            }}
            className="w-full text-sm text-teal-400 hover:text-teal-300 font-medium"
          >
            View All Notifications →
          </button>
        </div>
      </div>
    </>
  );
}
```

---

### **STEP 3: Update Sidebar to Include Notification Bell**

Modify `src/components/layout/Sidebar.tsx`:

```typescript
// Add import
import { NotificationBell } from '@/components/notifications/NotificationBell';

// In the sidebar header, after the search or logo:
<div className="flex items-center justify-between px-4 py-3">
  <div className="flex items-center gap-3">
    {/* Logo */}
    <div className="bg-teal-500 text-white font-bold text-xl px-3 py-2 rounded-lg">
      BL
    </div>
    <div>
      <h2 className="text-white font-semibold">BarangayLink</h2>
      <p className="text-xs text-gray-400">v2.0.0</p>
    </div>
  </div>
  
  {/* Notification Bell */}
  <NotificationBell />
</div>
```

---

### **STEP 4: Add Auto-Notification Triggers**

Update `convex/eventTaskAssignments.ts` to send notifications:

```typescript
// In assignUsersToTask mutation, after creating assignment:

// Send notification to newly assigned user
await ctx.db.insert("notifications", {
  userId,
  title: "New Task Assignment",
  message: \`You've been assigned to "\${task.title}"\`,
  type: "info",
  category: "task_assigned",
  isRead: false,
  createdAt: now,
  actionUrl: \`/tasks/my-duties\`,
  metadata: {
    priority: "medium",
    category: "task_assigned",
    relatedId: args.taskId,
    data: {
      taskId: args.taskId,
      taskTitle: task.title,
      assignedByName: assignedBy.name,
      assignedById: assignedBy._id,
    }
  }
});

// When removing user from task:
await ctx.db.insert("notifications", {
  userId: assignment.userId,
  title: "Removed from Task",
  message: \`You've been removed from "\${task.title}"\`,
  type: "info",
  category: "task_removed",
  isRead: false,
  createdAt: now,
  metadata: {
    data: {
      taskId: args.taskId,
      taskTitle: task.title,
    }
  }
});
```

---

### **STEP 5: Add Real-time Toast Notifications**

Create `src/components/notifications/NotificationToast.tsx`:

```typescript
"use client";

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner'; // or react-hot-toast

export function NotificationToast() {
  const notifications = useQuery(api.notifications.getAllUserNotifications, { 
    limit: 1,
    onlyUnread: true 
  });
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Only show toast if it's a new notification
      if (latestNotification._id !== lastNotificationId) {
        toast.custom((t) => (
          <div className="bg-gray-800 border border-teal-500 rounded-lg shadow-lg p-4 max-w-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔔</div>
              <div className="flex-1">
                <h4 className="text-white font-semibold">
                  {latestNotification.title}
                </h4>
                <p className="text-gray-400 text-sm mt-1">
                  {latestNotification.message}
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(t)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
        });
        
        setLastNotificationId(latestNotification._id);
      }
    }
  }, [notifications, lastNotificationId]);

  return null; // This component doesn't render anything
}
```

Add to your main layout:

```typescript
// In src/app/layout.tsx or main layout component:
import { NotificationToast } from '@/components/notifications/NotificationToast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConvexClientProvider>
          <NotificationToast />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
```

---

### **STEP 6: Create Notification Center Page**

Create `src/app/notifications/page.tsx`:

```typescript
"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Trash2, Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const notifications = useQuery(api.notifications.getAllUserNotifications, {
    limit: 100,
    onlyUnread: filter === 'unread'
  });
  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Bell className="w-7 h-7 text-teal-500" />
                Notifications
              </h1>
              <p className="text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setFilter('all')}
              className={\`px-4 py-2 rounded-lg transition-colors \${
                filter === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }\`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={\`px-4 py-2 rounded-lg transition-colors \${
                filter === 'unread'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }\`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={\`bg-gray-800 rounded-lg p-5 border \${
                  !notification.isRead
                    ? 'border-teal-500 bg-teal-500/5'
                    : 'border-gray-700'
                } hover:border-gray-600 transition-all\`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">
                    {notification.category === 'task_assigned' ? '📋' :
                     notification.category === 'task_removed' ? '❌' :
                     notification.category === 'message' ? '💬' : '🔔'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-white font-semibold">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full mt-2" />
                      )}
                    </div>
                    <p className="text-gray-400 mt-2">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead({ notificationId: notification._id })}
                            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification({ notificationId: notification._id })}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### **STEP 7: Add Notification Menu Item to Sidebar**

Update sidebar menu items:

```typescript
{
  id: 'notifications',
  label: 'Notifications',
  icon: <Bell className="w-4 h-4" />,
  path: '/notifications',
  roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
}
```

---

## 🎨 Visual Indicators

### **Badge Styles:**

```css
/* Unread count badge */
.notification-badge {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Unread notification indicator */
.unread-indicator {
  background: #14b8a6;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.6);
}
```

---

## 📱 Notification Types & Triggers

### **Event Task System:**

```typescript
// Task Assignment
"New Task Assignment" - When user assigned to task
"Task Updated" - When task details change
"Task Completed" - When task marked as done
"Task Removed" - When user removed from task
"Task Deadline" - 24 hours before due date

// Team Collaboration
"New Comment" - When someone comments on your task
"Mentioned" - When tagged in comment (@username)
"Status Changed" - When task status changes

// Project Management
"Project Assignment" - Added to project
"Project Update" - Important project changes
"Budget Alert" - Budget thresholds reached
"Milestone Reached" - Project milestones

// Messages
"New Message" - Direct message received
"Group Message" - Message in group chat

// System
"Welcome" - New user onboarding
"Approval Request" - Pending approvals
"System Alert" - Important system updates
```

---

## 🚀 Implementation Checklist

- [ ] Create NotificationBell component
- [ ] Create NotificationDropdown component
- [ ] Create NotificationToast component
- [ ] Create Notifications page
- [ ] Add NotificationBell to Sidebar
- [ ] Add notification triggers in eventTaskAssignments
- [ ] Add notification triggers in projects
- [ ] Add notification triggers in messaging
- [ ] Add menu item to Sidebar
- [ ] Test real-time updates
- [ ] Test mark as read
- [ ] Test delete notifications
- [ ] Test filter (all/unread)
- [ ] Add sound effects (optional)
- [ ] Add browser push notifications (optional)

---

## 🎯 Benefits

✅ **Real-time Updates** - Users see notifications instantly
✅ **Unread Indicators** - Clear visual badges
✅ **Organized** - Categorized by type
✅ **Actionable** - Click to navigate to related page
✅ **Manageable** - Mark read, delete, filter
✅ **Professional** - Clean, modern UI

---

## 💡 Optional Enhancements

1. **Sound Notifications** - Play sound on new notification
2. **Browser Push** - Native browser notifications
3. **Email Digest** - Daily email summary
4. **Notification Preferences** - Users choose what to receive
5. **Notification Groups** - Group similar notifications
6. **Notification History** - Archive after 30 days

---

This implementation gives you a **complete, production-ready notification system** similar to Facebook, LinkedIn, or Slack! 🎉
