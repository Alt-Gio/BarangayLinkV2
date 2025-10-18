# 🔔 Push Notifications - Complete Usage Guide

## ✅ **All Features Implemented!**

All push notification features have been integrated into your existing code. Here's how to use them:

---

## 📋 **Priority 1: Basic Push Notifications** (AUTO-WORKING)

### **1. Task Assignment Notifications** ✅

**What it does:**
- Sends push notification when user is assigned to a task
- Shows who assigned them and task name
- Includes direct link to tasks page

**Where it works:**
- File: `convex/eventTaskAssignments.ts`
- Function: `assignUsersToTask`
- **Already integrated** - works automatically!

**Example notification:**
```
📋 New Task Assigned
Marc assigned you: "Road Drainage Repair"
[View Task]
```

**How to test:**
1. Assign a task to a user in the event management
2. User receives push notification immediately
3. Clicking opens `/tasks/my-duties`

---

### **2. New Message Notifications** ✅

**What it does:**
- Sends push notification when receiving new message
- Shows sender name and message preview
- Opens messages page when clicked

**Where it works:**
- File: `convex/messaging.ts`
- Function: `sendMessage`
- **Already integrated** - works automatically!

**Example notification:**
```
💬 Marc
Hey, can you help with the event tomorrow?
[View Message]
```

**How to test:**
1. Send a message to another user
2. They receive push notification
3. Clicking opens `/messages`

---

### **3. Achievement Unlock Notifications** ✅

**What it does:**
- Sends celebration notification when achievement unlocked
- Shows achievement name and description
- Requires user interaction (stays visible)

**Where it works:**
- File: `convex/achievementNotifications.ts`
- Functions:
  - `sendAchievementNotification` (generic)
  - `check10HourMasterAchievement`
  - `checkTaskCompletionAchievement`
  - `checkEventParticipationAchievement`

**Example notification:**
```
🏆 Achievement Unlocked!
10 Hour Master: You've contributed 10 hours to community projects!
[View Profile]
```

**How to integrate:**
```typescript
// When user completes a task, check achievement
import { internal } from "./_generated/api";

// In your task completion function:
await ctx.scheduler.runAfter(
  0,
  internal.achievementNotifications.checkTaskCompletionAchievement,
  {
    userId: user._id,
    completedTasksCount: totalCompleted,
  }
);
```

**Achievements available:**
- **Task Milestones:** 5, 10, 25, 50, 100 tasks
- **Hour Milestones:** 10 hours worked
- **Event Participation:** 1, 5, 10 events attended

---

### **4. Event Reminder Notifications** ✅

**What it does:**
- Schedules automatic reminders for events
- Sends 24 hours, 1 hour, and 15 minutes before event
- All participants get notified

**Where it works:**
- File: `convex/eventReminders.ts`
- Function: `scheduleEventReminders`

**Example notification:**
```
📅 Event in 1 hour
Road Drainage Project starts soon!
[View Event]
```

**How to integrate:**
```typescript
// When creating an event, schedule reminders:
import { api } from "./_generated/api";

// After event is created:
await ctx.runMutation(api.eventReminders.scheduleEventReminders, {
  eventId: newEventId,
});
```

**Or manually trigger:**
```typescript
// In your event creation function:
await ctx.scheduler.runAfter(
  0,
  internal.eventReminders.scheduleEventReminders,
  {
    eventId: event._id,
  }
);
```

---

## ⏱️ **Priority 2: Advanced Features**

### **5. Work Timer Notification** ✅

**What it does:**
- Shows persistent notification while working
- Updates in real-time with elapsed time
- Includes Stop, Pause, and Note actions
- Stays visible until dismissed

**Where it works:**
- File: `convex/workTimerNotifications.ts`
- Functions:
  - `sendWorkTimerNotification` (start timer)
  - `updateWorkTimerNotification` (update every minute)
  - `stopWorkTimerNotification` (stop timer)

**Example notification:**
```
⏱️ Working on: Road Drainage
Time: 02:34:15
Started: 10:15 AM
[Stop Timer] [Pause] [Add Note]
```

**How to integrate:**

```typescript
// When user clocks in:
import { api } from "./_generated/api";

// Start work timer notification
await ctx.runMutation(api.workTimerNotifications.sendWorkTimerNotification, {
  taskId: task._id,
});

// On client-side, update every minute:
useEffect(() => {
  if (!isWorking) return;
  
  const interval = setInterval(async () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    await updateWorkTimerNotification({
      taskId: currentTask._id,
      elapsedSeconds: elapsed,
    });
  }, 60000); // Every 60 seconds
  
  return () => clearInterval(interval);
}, [isWorking]);

// When user clocks out:
await ctx.runMutation(api.workTimerNotifications.stopWorkTimerNotification, {
  taskId: task._id,
  totalDuration: durationMinutes,
});
```

---

### **6. Deadline Reminders** ✅

**What it does:**
- Automatically schedules reminders for task deadlines
- Sends 24 hours, 1 hour before, at deadline, and when overdue
- Only notifies users who haven't completed the task
- Includes Snooze action button

**Where it works:**
- File: `convex/deadlineReminders.ts`
- Function: `scheduleDeadlineReminders`

**Example notifications:**
```
⏰ Task Due tomorrow
"Road Drainage Repair" is due tomorrow!
[View Task] [Snooze]

🚨 Task Due in 1 hour!
"Road Drainage Repair"
[View Task] [Snooze]

❌ Task Overdue!
"Road Drainage Repair" - Please complete ASAP
[View Task]
```

**How to integrate:**

```typescript
// When creating a task with a deadline:
import { api } from "./_generated/api";

// After task is created or deadline is set:
await ctx.runMutation(api.deadlineReminders.scheduleDeadlineReminders, {
  taskId: task._id,
});
```

**Or in task creation function:**
```typescript
// In convex/eventControl.ts createEventTask:
if (args.dueDate) {
  await ctx.scheduler.runAfter(
    0,
    internal.deadlineReminders.scheduleDeadlineReminders,
    {
      taskId: taskId,
    }
  );
}
```

---

### **7. Daily Digest** ✅

**What it does:**
- Sends morning summary of pending tasks, unread messages, upcoming events
- Only sends if there's something to report
- Scheduled to run every morning at 8 AM

**Where it works:**
- File: `convex/dailyDigest.ts`
- Functions:
  - `sendDailyDigest` (single user)
  - `sendDailyDigestToAll` (all users)
  - `sendWeeklySummary` (weekly recap)

**Example notification:**
```
📬 Daily Summary
📋 3 pending tasks
💬 2 unread messages
📅 1 upcoming event
[View Dashboard]
```

**How to schedule:**

**Option 1: Using Convex Crons (Recommended)**

Create `convex/crons.ts`:
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily digest at 8 AM every day
crons.daily(
  "daily digest",
  { hourUTC: 15 }, // 8 AM Philippine Time (UTC+8 = 15 UTC)
  internal.dailyDigest.sendDailyDigestToAll
);

// Weekly summary on Sunday at 6 PM
crons.weekly(
  "weekly summary",
  { hourUTC: 10, dayOfWeek: "sunday" },
  internal.dailyDigest.sendWeeklySummary
);

export default crons;
```

**Option 2: Manual Trigger**
```typescript
// Send to specific user:
await ctx.runMutation(internal.dailyDigest.sendDailyDigest, {
  userId: user._id,
});

// Send to all users:
await ctx.runMutation(internal.dailyDigest.sendDailyDigestToAll, {});
```

---

## 🔧 **Quick Integration Checklist**

### **Already Working (No Action Needed):**
- ✅ Task assignment notifications
- ✅ New message notifications

### **Need to Add:**

**1. Event Reminders:**
```typescript
// In convex/events.ts or wherever you create events:
import { internal } from "./_generated/api";

// After event creation:
await ctx.scheduler.runAfter(
  0,
  internal.eventReminders.scheduleEventReminders,
  {
    eventId: newEventId,
  }
);
```

**2. Deadline Reminders:**
```typescript
// In convex/eventControl.ts createEventTask:
import { internal } from "./_generated/api";

// After task creation (if it has a deadline):
if (args.dueDate) {
  await ctx.scheduler.runAfter(
    0,
    internal.deadlineReminders.scheduleDeadlineReminders,
    {
      taskId: taskId,
    }
  );
}
```

**3. Achievements:**
```typescript
// When user completes a task:
const completedCount = /* get user's total completed tasks */;

await ctx.scheduler.runAfter(
  0,
  internal.achievementNotifications.checkTaskCompletionAchievement,
  {
    userId: user._id,
    completedTasksCount: completedCount,
  }
);
```

**4. Work Timer:**
```typescript
// Add to your time tracking clockIn function:
import { api } from "./_generated/api";

await ctx.runMutation(api.workTimerNotifications.sendWorkTimerNotification, {
  taskId: args.taskId,
});
```

**5. Daily Digest (Cron Job):**

Create `convex/crons.ts`:
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "daily digest",
  { hourUTC: 15 }, // 8 AM PHT
  internal.dailyDigest.sendDailyDigestToAll
);

export default crons;
```

---

## 📱 **What Users Will See**

### **Mobile (Android/iOS):**
```
[App Icon]
📋 New Task Assigned
Marc assigned you: "Road Drainage Repair"
[View Task] [Later]
3 minutes ago
```

### **Desktop (Windows/Mac):**
```
BarangayLink
📋 New Task Assigned
Marc assigned you: "Road Drainage Repair"
```

### **Action Buttons:**
- Task deadlines: [View Task] [Snooze]
- Work timer: [Stop Timer] [Pause] [Add Note]
- Messages: [Reply] [Mark Read]

---

## 🎯 **Notification Priority Levels**

| Type | Priority | Sticky | Sound |
|------|----------|--------|-------|
| Task Assignment | Medium | No | Yes |
| New Message | Medium | No | Yes |
| Achievement | Low | Yes | Yes |
| Event Reminder (24h) | Medium | No | Yes |
| Event Reminder (1h) | High | Yes | Yes |
| Deadline (tomorrow) | Medium | No | Yes |
| Deadline (1h) | High | Yes | Yes |
| Overdue | Critical | Yes | Yes |
| Work Timer | Low | Yes | No |
| Daily Digest | Low | No | Yes |

**Sticky = `requireInteraction: true`** (stays until dismissed)

---

## 🧪 **Testing Each Feature**

### **1. Test Task Assignment:**
```
1. Create a task
2. Assign to another user
3. Check their notifications
Expected: Push notification appears
```

### **2. Test Messages:**
```
1. Send a message to another user
2. Check their device
Expected: Push notification with message preview
```

### **3. Test Event Reminder:**
```
1. Create event 2 hours from now
2. Schedule reminders
3. Wait for 1-hour reminder
Expected: All participants get notified
```

### **4. Test Deadline:**
```
1. Create task with deadline 2 hours from now
2. Schedule reminders
3. Wait for 1-hour reminder
Expected: Assigned users get notified
```

### **5. Test Work Timer:**
```
1. Clock in to a task
2. Work timer notification appears
3. Update every minute (or manually trigger)
Expected: Notification updates with time
```

### **6. Test Daily Digest:**
```
1. Manually trigger:
   await sendDailyDigest({ userId: user._id })
2. Check notification
Expected: Summary of pending items
```

---

## 🎨 **Customization Options**

### **Change Notification Icons:**
```typescript
// In any notification function:
await sendPushNotification({
  ...
  icon: "/custom-icon.png", // Your custom icon
  badge: "/custom-badge.png", // Your custom badge
});
```

### **Add Custom Actions:**
```typescript
await sendPushNotification({
  ...
  actions: [
    { action: "accept", title: "Accept" },
    { action: "decline", title: "Decline" },
    { action: "view", title: "View Details" },
  ],
});
```

### **Change Notification Sound:**
```typescript
// In service worker (firebase-messaging-sw.js):
const options = {
  ...
  silent: false, // Play sound
  vibrate: [200, 100, 200], // Vibration pattern
};
```

---

## 📊 **Analytics & Monitoring**

### **Track Notification Delivery:**
```typescript
// In pushNotifications.ts sendPushNotification:
const result = await sendPushNotification({...});

// Log to your analytics:
console.log(`Push sent to user ${userId}: ${result.sent}`);
```

### **Monitor Click Rates:**
```typescript
// Track when user clicks notification
// Add to your analytics dashboard
```

---

## 🐛 **Troubleshooting**

### **Notifications not appearing:**
1. Check FCM is set up (VAPID key in .env.local)
2. Verify user has granted permission
3. Check `pushSubscriptions` table has user's token
4. Check browser console for errors

### **Notifications appearing but not clickable:**
1. Verify `url` parameter is set
2. Check service worker is registered
3. Test in incognito mode

### **Work timer not updating:**
1. Make sure client is calling `updateWorkTimerNotification` every minute
2. Check service worker permissions
3. Verify task ID is correct

---

## ✅ **Summary**

**What's Ready to Use:**
- ✅ Task assignments (auto-working)
- ✅ New messages (auto-working)
- ✅ Achievement system (functions ready)
- ✅ Event reminders (functions ready)
- ✅ Deadline reminders (functions ready)
- ✅ Work timer (functions ready)
- ✅ Daily digest (functions ready)

**What You Need to Do:**
1. Add FCM setup (follow `FCM_SETUP_INSTRUCTIONS.md`)
2. Add scheduler calls to existing functions (see integration examples above)
3. Set up cron jobs for daily digest
4. Test each feature!

**Total Implementation Time:** 2-3 hours to integrate everything! 🚀

---

**All features are $0 cost thanks to FCM!** 🎉
