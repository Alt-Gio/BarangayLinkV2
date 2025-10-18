# ✅ Quick Implementation Checklist

## 🎯 **3 Simple Steps to Complete Your Notification System**

Total Time: **15 minutes**

---

## **Step 1: Add Event Reminders (5 min)**

### Find your event creation function:
```bash
# Search for where events are created:
# Likely in: convex/events.ts or convex/eventControl.ts
```

### Add this code after event creation:
```typescript
import { internal } from "./_generated/api";

// After creating the event:
await ctx.scheduler.runAfter(
  0,
  internal.eventReminders.scheduleEventReminders,
  {
    eventId: newEvent._id,  // Use your actual event ID variable
  }
);
```

**Test:** Create an event 2 hours from now → You'll get a 1-hour reminder

---

## **Step 2: Add Deadline Reminders (5 min)**

### Find your task creation function:
```bash
# Likely in: convex/eventControl.ts - createEventTask
# Around line 147 after task is created
```

### Add this code after task creation (if it has a deadline):
```typescript
import { internal } from "./_generated/api";

// After creating the task:
if (args.dueDate) {
  await ctx.scheduler.runAfter(
    0,
    internal.deadlineReminders.scheduleDeadlineReminders,
    {
      taskId: taskId,  // Use your actual task ID variable
    }
  );
}
```

**Test:** Create a task with deadline 2 hours from now → You'll get a 1-hour reminder

---

## **Step 3: Add Achievement Checks (5 min)**

### Find where tasks are marked as complete:
```bash
# Likely in: convex/eventTaskAssignments.ts
# Function: markTaskComplete or updateTaskStatus
```

### Add this code when task status changes to "completed":
```typescript
import { internal } from "./_generated/api";

// After marking task complete:

// Count user's total completed tasks
const allAssignments = await ctx.db
  .query("eventTaskAssignments")
  .withIndex("by_user", (q) => q.eq("userId", assignment.userId))
  .filter((q) => q.eq(q.field("status"), "completed"))
  .collect();

const completedCount = allAssignments.length;

// Check for achievement milestones (5, 10, 25, 50, 100 tasks)
await ctx.scheduler.runAfter(
  0,
  internal.achievementNotifications.checkTaskCompletionAchievement,
  {
    userId: assignment.userId,
    completedTasksCount: completedCount,
  }
);
```

**Test:** Complete your 5th task → You'll get "Getting Started" achievement notification

---

## ✅ **Done! That's It!**

After adding these 3 pieces of code, you'll have:

- ✅ Task assignment notifications (already working)
- ✅ Message notifications (already working)
- ✅ Event reminders (now working!)
- ✅ Deadline reminders (now working!)
- ✅ Achievement notifications (now working!)
- ✅ Daily digest (already scheduled)

---

## 🧪 **How to Test Everything**

### **Test 1: Task Assignment** (Already working)
1. Assign a task to another user
2. They get notification within 5 seconds

### **Test 2: Messages** (Already working)
1. Send a message to another user
2. They get notification within 5 seconds

### **Test 3: Event Reminders** (After Step 1)
1. Create an event that starts in 2 hours
2. Wait 1 hour
3. All attendees get notification

### **Test 4: Deadline Reminders** (After Step 2)
1. Create a task with deadline in 2 hours
2. Wait 1 hour
3. Assigned users get notification

### **Test 5: Achievements** (After Step 3)
1. Complete 5 total tasks
2. Get "Getting Started" achievement notification!

---

## 🎯 **Exact Files to Edit**

Based on typical Convex structure:

| What | File | Function | Line (approx) |
|------|------|----------|---------------|
| Event reminders | `convex/events.ts` or `convex/eventControl.ts` | `createEvent` | After event insert |
| Deadline reminders | `convex/eventControl.ts` | `createEventTask` | ~Line 147 |
| Achievements | `convex/eventTaskAssignments.ts` | `markTaskComplete` or `updateStatus` | When status = "completed" |

---

## 💡 **Code Snippets Ready to Copy**

### **Import Statement (Add to top of file):**
```typescript
import { internal } from "./_generated/api";
```

### **Event Reminder (Copy-paste):**
```typescript
await ctx.scheduler.runAfter(0, internal.eventReminders.scheduleEventReminders, {
  eventId: EVENT_ID_HERE
});
```

### **Deadline Reminder (Copy-paste):**
```typescript
if (TASK_HAS_DEADLINE) {
  await ctx.scheduler.runAfter(0, internal.deadlineReminders.scheduleDeadlineReminders, {
    taskId: TASK_ID_HERE
  });
}
```

### **Achievement Check (Copy-paste):**
```typescript
const completed = await ctx.db.query("eventTaskAssignments")
  .withIndex("by_user", (q) => q.eq("userId", USER_ID_HERE))
  .filter((q) => q.eq(q.field("status"), "completed"))
  .collect();

await ctx.scheduler.runAfter(0, internal.achievementNotifications.checkTaskCompletionAchievement, {
  userId: USER_ID_HERE,
  completedTasksCount: completed.length
});
```

---

## 🚀 **After Implementation**

You'll have a **complete notification system** with:
- Real-time desktop notifications
- Scheduled reminders
- Achievement tracking
- Daily summaries
- All working automatically!

**Total effort: 15 minutes** ⏱️  
**Total value: Huge!** 🎉

---

**Start with Step 1 and work through each step. You'll be done in no time!** 🚀
