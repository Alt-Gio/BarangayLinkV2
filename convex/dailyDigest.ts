import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Send daily digest to a user
 * Should be scheduled to run every morning at 8 AM
 */
export const sendDailyDigest = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active") return;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Get pending tasks
    const pendingAssignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .filter((q) => q.neq(q.field("status"), "verified"))
      .collect();

    // Get unread messages
    const userRooms = await ctx.db
      .query("chatRooms")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const myRooms = userRooms.filter(room => 
      room.participants.some(p => p === args.userId)
    );

    let unreadCount = 0;
    for (const room of myRooms) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      const unreadInRoom = messages.filter(msg =>
        msg.sender !== args.userId &&
        !msg.readBy.some(r => r.userId === args.userId)
      ).length;

      unreadCount += unreadInRoom;
    }

    // Get upcoming events (next 7 days)
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    const allEvents = await ctx.db.query("events").collect();
    
    // Filter events where user is an attendee and event is upcoming
    const upcomingEventDetails = allEvents.filter(event => 
      event.attendees.includes(args.userId) &&
      event.startDate > now && 
      event.startDate < sevenDaysFromNow
    );

    // Get recent notifications (last 24 hours)
    const recentNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    const importantNotifs = recentNotifications.filter(n => 
      n.createdAt > oneDayAgo &&
      (n.type === "warning" || n.type === "error" || n.category === "deadline")
    );

    // Get overdue tasks
    const overdueTasks = [];
    for (const assignment of pendingAssignments) {
      const task = await ctx.db.get(assignment.taskId);
      if (task && task.dueDate && task.dueDate < now) {
        overdueTasks.push(task);
      }
    }

    // Only send if there's something to report
    if (
      pendingAssignments.length === 0 &&
      unreadCount === 0 &&
      upcomingEventDetails.length === 0 &&
      overdueTasks.length === 0
    ) {
      console.log(`No digest sent to ${user.name} - nothing to report`);
      return { sent: false, reason: "Nothing to report" };
    }

    // Build digest message
    let digestParts = [];
    if (pendingAssignments.length > 0) {
      digestParts.push(`📋 ${pendingAssignments.length} pending task${pendingAssignments.length !== 1 ? 's' : ''}`);
    }
    if (overdueTasks.length > 0) {
      digestParts.push(`❌ ${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}`);
    }
    if (unreadCount > 0) {
      digestParts.push(`💬 ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`);
    }
    if (upcomingEventDetails.length > 0) {
      digestParts.push(`📅 ${upcomingEventDetails.length} upcoming event${upcomingEventDetails.length !== 1 ? 's' : ''}`);
    }

    const digestBody = digestParts.join('\n');

    // Create in-app notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "info",
      title: "📬 Daily Summary",
      message: digestBody,
      category: "digest",
      isRead: false,
      createdAt: now,
      actionUrl: "/dashboard",
      metadata: {
        priority: "low",
        category: "digest",
        data: {
          pendingTasks: pendingAssignments.length,
          unreadMessages: unreadCount,
          upcomingEvents: upcomingEventDetails.length,
          overdueTasks: overdueTasks.length,
        }
      }
    });

    // 📬 Send push notification
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: args.userId,
        title: "📬 Daily Summary",
        body: digestBody,
        url: "/dashboard",
        icon: "/icon-192x192.png",
        tag: "daily-digest",
      }
    );

    console.log(`✅ Daily digest sent to ${user.name}`);

    return {
      sent: true,
      stats: {
        pendingTasks: pendingAssignments.length,
        unreadMessages: unreadCount,
        upcomingEvents: upcomingEventDetails.length,
        overdueTasks: overdueTasks.length,
      }
    };
  },
});

/**
 * Send daily digest to all active users
 * Schedule this to run every morning at 8 AM
 */
export const sendDailyDigestToAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let sentCount = 0;
    for (const user of users) {
      const result = await ctx.scheduler.runAfter(
        0,
        internal.dailyDigest.sendDailyDigest,
        {
          userId: user._id,
        }
      );
      sentCount++;
    }

    console.log(`📬 Daily digest queued for ${sentCount} users`);

    return { queued: sentCount };
  },
});

/**
 * Weekly summary (more detailed than daily)
 */
export const sendWeeklySummary = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active") return;

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Get tasks completed this week
    const completedAssignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const completedThisWeek = completedAssignments.filter(a => 
      a.completedAt && a.completedAt > oneWeekAgo
    );

    // Get total time worked this week
    const timeEntries = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const thisWeekEntries = timeEntries.filter(entry => 
      entry.createdAt > oneWeekAgo
    );

    const totalMinutes = thisWeekEntries.reduce((sum, entry) => 
      sum + (entry.duration || 0), 0
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Build summary
    const summaryParts = [
      `✅ ${completedThisWeek.length} tasks completed`,
      `⏱️ ${hours}h ${minutes}m worked`,
    ];

    const summaryBody = summaryParts.join('\n');

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "success",
      title: "📊 Weekly Summary",
      message: summaryBody,
      category: "weekly_summary",
      isRead: false,
      createdAt: now,
      actionUrl: "/profile",
      metadata: {
        priority: "low",
        category: "weekly_summary",
        data: {
          tasksCompleted: completedThisWeek.length,
          hoursWorked: hours,
          minutesWorked: minutes,
        }
      }
    });

    // Send push
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: args.userId,
        title: "📊 Weekly Summary",
        body: summaryBody,
        url: "/profile",
        icon: "/icon-192x192.png",
        tag: "weekly-summary",
      }
    );

    return { sent: true };
  },
});
