import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Send achievement unlock notification
 * Call this when user unlocks an achievement
 */
export const sendAchievementNotification = internalMutation({
  args: {
    userId: v.id("users"),
    achievementTitle: v.string(),
    achievementDescription: v.string(),
    achievementIcon: v.optional(v.string()),
    points: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const now = Date.now();

    // Create in-app notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "success",
      title: `🏆 Achievement Unlocked: ${args.achievementTitle}`,
      message: args.achievementDescription,
      category: "achievement",
      isRead: false,
      createdAt: now,
      actionUrl: "/profile",
      metadata: {
        priority: "low",
        category: "achievement",
        data: {
          achievementTitle: args.achievementTitle,
          achievementDescription: args.achievementDescription,
          points: args.points,
        }
      }
    });

    // 🏆 Send push notification
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: args.userId,
        title: `🏆 Achievement Unlocked!`,
        body: `${args.achievementTitle}: ${args.achievementDescription}`,
        url: `/profile`,
        icon: args.achievementIcon || "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag: "achievement",
        requireInteraction: true,
      }
    );

    console.log(`✅ Achievement notification sent to ${user.name}: ${args.achievementTitle}`);
  },
});

/**
 * Example achievements that can be triggered
 */

// 10 Hour Master Achievement
export const check10HourMasterAchievement = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Calculate total time from time entries
    const timeEntries = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = totalMinutes / 60;

    if (totalHours >= 10) {
      await ctx.scheduler.runAfter(
        0,
        internal.achievementNotifications.sendAchievementNotification,
        {
          userId: args.userId,
          achievementTitle: "10 Hour Master",
          achievementDescription: "You've contributed 10 hours to community projects!",
          points: 100,
        }
      );
    }
  },
});

// Task Completion Achievement
export const checkTaskCompletionAchievement = internalMutation({
  args: { 
    userId: v.id("users"),
    completedTasksCount: v.number(),
  },
  handler: async (ctx, args) => {
    const milestones = [
      { count: 5, title: "Getting Started", description: "Completed 5 tasks", points: 50 },
      { count: 10, title: "Task Warrior", description: "Completed 10 tasks", points: 100 },
      { count: 25, title: "Community Hero", description: "Completed 25 tasks", points: 250 },
      { count: 50, title: "Dedication Master", description: "Completed 50 tasks", points: 500 },
      { count: 100, title: "Legend", description: "Completed 100 tasks!", points: 1000 },
    ];

    const milestone = milestones.find(m => m.count === args.completedTasksCount);
    
    if (milestone) {
      await ctx.scheduler.runAfter(
        0,
        internal.achievementNotifications.sendAchievementNotification,
        {
          userId: args.userId,
          achievementTitle: milestone.title,
          achievementDescription: milestone.description,
          points: milestone.points,
        }
      );
    }
  },
});

// Event Participation Achievement
export const checkEventParticipationAchievement = internalMutation({
  args: { 
    userId: v.id("users"),
    eventsAttended: v.number(),
  },
  handler: async (ctx, args) => {
    const milestones = [
      { count: 1, title: "First Event", description: "Attended your first community event", points: 25 },
      { count: 5, title: "Active Participant", description: "Attended 5 events", points: 125 },
      { count: 10, title: "Community Pillar", description: "Attended 10 events", points: 250 },
    ];

    const milestone = milestones.find(m => m.count === args.eventsAttended);
    
    if (milestone) {
      await ctx.scheduler.runAfter(
        0,
        internal.achievementNotifications.sendAchievementNotification,
        {
          userId: args.userId,
          achievementTitle: milestone.title,
          achievementDescription: milestone.description,
          points: milestone.points,
        }
      );
    }
  },
});
