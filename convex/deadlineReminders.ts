import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Schedule deadline reminders when task is created or deadline is set
 * Sends notifications 24 hours before, 1 hour before, and when overdue
 */
export const scheduleDeadlineReminders = mutation({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.dueDate) {
      return { scheduled: false, reason: "No deadline set" };
    }

    const now = Date.now();
    const deadline = task.dueDate;

    // Don't schedule if deadline has passed
    if (deadline <= now) {
      return { scheduled: false, reason: "Deadline already passed" };
    }

    // Get all assigned users
    const assignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const reminderTimes = [
      { time: 24 * 60 * 60 * 1000, label: "tomorrow", emoji: "⏰" },
      { time: 60 * 60 * 1000, label: "1 hour", emoji: "🚨" },
      { time: 0, label: "now", emoji: "⚠️" }, // At deadline
    ];

    let scheduledCount = 0;

    for (const { time, label, emoji } of reminderTimes) {
      const reminderTime = deadline - time;
      
      // Only schedule if reminder time is in the future
      if (reminderTime > now) {
        await ctx.scheduler.runAt(
          reminderTime,
          internal.deadlineReminders.sendDeadlineReminderToAll,
          {
            taskId: args.taskId,
            reminderLabel: label,
            emoji,
          }
        );
        scheduledCount++;
      }
    }

    // Schedule overdue notification 1 hour after deadline
    const overdueTime = deadline + (60 * 60 * 1000);
    if (overdueTime > now) {
      await ctx.scheduler.runAt(
        overdueTime,
        internal.deadlineReminders.sendOverdueNotification,
        {
          taskId: args.taskId,
        }
      );
      scheduledCount++;
    }

    return { scheduled: true, count: scheduledCount, assignments: assignments.length };
  },
});

/**
 * Send deadline reminder to all assigned users
 */
export const sendDeadlineReminderToAll = internalMutation({
  args: {
    taskId: v.id("eventTasks"),
    reminderLabel: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    // Get all active assignments
    const assignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .filter((q) => q.neq(q.field("status"), "verified"))
      .collect();

    const now = Date.now();

    for (const assignment of assignments) {
      // Create in-app notification
      await ctx.db.insert("notifications", {
        userId: assignment.userId,
        type: "warning",
        title: `${args.emoji} Task Due ${args.reminderLabel}`,
        message: `"${task.title}" is due ${args.reminderLabel}!`,
        category: "deadline",
        relatedId: args.taskId,
        relatedType: "eventTask",
        isRead: false,
        createdAt: now,
        actionUrl: `/tasks/my-duties`,
        metadata: {
          priority: "high",
          category: "deadline",
          relatedId: args.taskId,
          data: {
            taskTitle: task.title,
            dueDate: task.dueDate,
            reminderLabel: args.reminderLabel,
          }
        }
      });

      // 🚨 Send push notification
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotification,
        {
          userId: assignment.userId,
          title: `${args.emoji} Task Due ${args.reminderLabel}!`,
          body: `"${task.title}"`,
          url: `/tasks/my-duties`,
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: `deadline-${args.taskId}`,
          requireInteraction: args.reminderLabel === "1 hour", // Sticky for urgent
          actions: [
            { action: "view", title: "View Task" },
            { action: "snooze", title: "Snooze" },
          ],
        }
      );
    }

    console.log(`✅ Deadline reminders sent to ${assignments.length} users for task: ${task.title}`);
  },
});

/**
 * Send overdue notification
 */
export const sendOverdueNotification = internalMutation({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    // Check if task is still not completed
    if (task.status === "done") return;

    // Get all active assignments that aren't completed
    const assignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .filter((q) => q.neq(q.field("status"), "verified"))
      .collect();

    const now = Date.now();

    for (const assignment of assignments) {
      // Create in-app notification
      await ctx.db.insert("notifications", {
        userId: assignment.userId,
        type: "error",
        title: `❌ Task Overdue`,
        message: `"${task.title}" is now overdue!`,
        category: "overdue",
        relatedId: args.taskId,
        relatedType: "eventTask",
        isRead: false,
        createdAt: now,
        actionUrl: `/tasks/my-duties`,
        metadata: {
          priority: "critical",
          category: "overdue",
          relatedId: args.taskId,
          data: {
            taskTitle: task.title,
            dueDate: task.dueDate,
          }
        }
      });

      // ❌ Send push notification
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotification,
        {
          userId: assignment.userId,
          title: `❌ Task Overdue!`,
          body: `"${task.title}" - Please complete ASAP`,
          url: `/tasks/my-duties`,
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: `overdue-${args.taskId}`,
          requireInteraction: true,
        }
      );
    }

    console.log(`❌ Overdue notifications sent to ${assignments.length} users for task: ${task.title}`);
  },
});
