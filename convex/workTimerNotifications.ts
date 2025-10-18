import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Send work timer notification when user clocks in
 * Creates a persistent notification that can be updated
 */
export const sendWorkTimerNotification = mutation({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Find active time entry
    const activeEntry = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_running", (q) => q.eq("isRunning", true))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("taskId"), args.taskId))
      .first();

    if (!activeEntry) {
      return { sent: false, reason: "No active time entry" };
    }

    const startTime = activeEntry.startTime;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // 🔔 Send persistent push notification
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: user._id,
        title: `⏱️ Working on: ${task.title}`,
        body: `Time: ${timeString}\nStarted: ${new Date(startTime).toLocaleTimeString()}`,
        url: `/tasks/${args.taskId}`,
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag: `work-timer-${args.taskId}`, // Same tag = updates notification
        requireInteraction: true, // Stays until dismissed
        actions: [
          { action: "stop", title: "Stop Timer" },
          { action: "pause", title: "Pause" },
          { action: "note", title: "Add Note" },
        ],
      }
    );

    return { 
      sent: true, 
      taskId: args.taskId,
      startTime,
      timeString,
    };
  },
});

/**
 * Update work timer notification (call this periodically from client)
 */
export const updateWorkTimerNotification = mutation({
  args: {
    taskId: v.id("eventTasks"),
    elapsedSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const hours = Math.floor(args.elapsedSeconds / 3600);
    const minutes = Math.floor((args.elapsedSeconds % 3600) / 60);
    const seconds = args.elapsedSeconds % 60;

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update notification with same tag
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: user._id,
        title: `⏱️ Working on: ${task.title}`,
        body: `Time: ${timeString}`,
        url: `/tasks/${args.taskId}`,
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag: `work-timer-${args.taskId}`, // Same tag updates existing
        requireInteraction: true,
        actions: [
          { action: "stop", title: "Stop Timer" },
          { action: "pause", title: "Pause" },
          { action: "note", title: "Add Note" },
        ],
      }
    );

    return { updated: true, timeString };
  },
});

/**
 * Stop work timer notification
 */
export const stopWorkTimerNotification = mutation({
  args: {
    taskId: v.id("eventTasks"),
    totalDuration: v.number(), // in minutes
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const hours = Math.floor(args.totalDuration / 60);
    const minutes = args.totalDuration % 60;

    // Send completion notification
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: user._id,
        title: `✅ Work Session Complete`,
        body: `${task.title}\nTotal time: ${hours}h ${minutes}m`,
        url: `/tasks/${args.taskId}`,
        icon: "/icon-192x192.png",
        tag: `work-complete-${args.taskId}`,
      }
    );

    return { stopped: true };
  },
});

/**
 * Send milestone notification during work (e.g., every hour)
 */
export const sendWorkMilestoneNotification = internalMutation({
  args: {
    userId: v.id("users"),
    taskId: v.id("eventTasks"),
    hoursWorked: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: args.userId,
        title: `🎯 ${args.hoursWorked} Hour Milestone!`,
        body: `Great work on "${task.title}"!`,
        url: `/tasks/${args.taskId}`,
        icon: "/icon-192x192.png",
        tag: `milestone-${args.taskId}`,
      }
    );
  },
});
