/**
 * Activity Service - Universal Activity Tracking
 * Centralized logging for all system activities across modules
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Activity types across all modules
export type ActivityType =
  // Tasks
  | "task_created" | "task_completed" | "task_assigned" | "task_updated"
  // Events
  | "event_created" | "event_rsvp" | "event_checkin" | "event_completed"
  // Projects
  | "project_created" | "project_updated" | "milestone_completed"
  // Documents
  | "document_uploaded" | "document_shared" | "document_commented"
  // Messaging
  | "message_sent" | "message_reaction" | "poll_created" | "poll_voted"
  // Collaboration
  | "comment_added" | "teammate_helped" | "review_submitted"
  // Gamification
  | "xp_earned" | "level_up" | "achievement_unlocked";

// Log activity with automatic notifications and gamification
export const logActivity = mutation({
  args: {
    activityType: v.string(),
    userId: v.id("users"),
    data: v.any(),
    relatedEntityType: v.optional(v.string()), // "task", "event", "project", etc.
    relatedEntityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Log to userActivityLogs
    const logId = await ctx.db.insert("userActivityLogs", {
      userId: args.userId,
      activityType: "action", // Generic action type
      action: args.activityType,
      targetType: args.relatedEntityType || "system",
      targetId: args.relatedEntityId || "",
      metadata: args.data,
      timestamp: Date.now(),
    });

    // 2. Check if this activity should trigger notifications
    const shouldNotify = shouldCreateNotification(args.activityType);
    if (shouldNotify) {
      // Import and call notification service
      // This will be implemented when we create notificationService
    }

    // 3. Check if this activity should award points
    const reward = getActivityReward(args.activityType);
    if (reward) {
      // Import and call gamification service
      // This will be implemented when we create gamificationService
    }

    // 4. Update projectActivities if related to a project
    if (args.data?.projectId) {
      await ctx.db.insert("projectActivities", {
        projectId: args.data.projectId as Id<"projects">,
        userId: args.userId,
        activityType: args.activityType as any, // Cast to allow flexible activity types
        title: args.data.title || generateActivityDescription(args.activityType, args.data),
        description: generateActivityDescription(args.activityType, args.data),
        metadata: args.data,
        timestamp: Date.now(),
      });
    }

    return logId;
  },
});

// Get unified activity feed for a user
export const getUserActivityFeed = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    types: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let query = ctx.db
      .query("userActivityLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    const activities = await query.take(limit);

    // Enrich with user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          userName: user?.name || "Unknown User",
          userAvatar: user?.profilePictureUrl,
        };
      })
    );

    // Filter by types if specified
    if (args.types && args.types.length > 0) {
      return enrichedActivities.filter((a) =>
        args.types!.includes(a.action!)
      );
    }

    return enrichedActivities;
  },
});

// Get system-wide activity feed (for dashboard)
export const getSystemActivityFeed = query({
  args: {
    limit: v.optional(v.number()),
    moduleTypes: v.optional(v.array(v.string())), // ["task", "event", "project"]
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    // Get recent activities from all users
    const activities = await ctx.db
      .query("userActivityLogs")
      .order("desc")
      .take(limit);

    // Enrich with user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          userName: user?.name || "Unknown User",
          userAvatar: user?.profilePictureUrl,
          userRole: user?.role,
        };
      })
    );

    // Filter by module types if specified
    if (args.moduleTypes && args.moduleTypes.length > 0) {
      return enrichedActivities.filter((a) =>
        args.moduleTypes!.includes(a.targetType!)
      );
    }

    return enrichedActivities;
  },
});

// Get project-specific activity feed
export const getProjectActivityFeed = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const activities = await ctx.db
      .query("projectActivities")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit);

    // Enrich with user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          userName: user?.name || "Unknown User",
          userAvatar: user?.profilePictureUrl,
        };
      })
    );

    return enrichedActivities;
  },
});

// Get activity statistics for dashboard
export const getActivityStats = query({
  args: {
    userId: v.optional(v.id("users")),
    timeRange: v.optional(v.string()), // "today", "week", "month"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeRanges = {
      today: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    };
    const since = args.timeRange
      ? timeRanges[args.timeRange as keyof typeof timeRanges]
      : timeRanges.week;

    // Get activities in time range
    let query = ctx.db.query("userActivityLogs");
    
    if (args.userId) {
      const activities = await ctx.db
        .query("userActivityLogs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(50);
      return activities;
    }

    const activities = await query.collect();
    const filtered = activities.filter((a) => a.timestamp >= since);

    // Count by type
    const byType: Record<string, number> = {};
    filtered.forEach((a) => {
      byType[a.action!] = (byType[a.action!] || 0) + 1;
    });

    return {
      total: filtered.length,
      byType,
      timeRange: args.timeRange || "week",
    };
  },
});

// Helper: Determine if activity should create notification
function shouldCreateNotification(activityType: string): boolean {
  const notifiableActivities = [
    "task_assigned",
    "task_completed",
    "event_rsvp",
    "milestone_completed",
    "message_sent", // If @mention
    "message_reaction",
    "poll_voted",
    "comment_added",
    "teammate_helped",
    "review_submitted",
  ];
  return notifiableActivities.includes(activityType);
}

// Helper: Get reward amount for activity
function getActivityReward(activityType: string): { xp?: number; gold?: number } | null {
  const rewards: Record<string, { xp?: number; gold?: number }> = {
    task_completed: { xp: 10, gold: 5 },
    event_checkin: { xp: 50 },
    milestone_completed: { xp: 100, gold: 50 },
    document_uploaded: { gold: 10 },
    teammate_helped: { xp: 25 },
    poll_voted: { xp: 5 },
    comment_added: { xp: 5 },
  };
  return rewards[activityType] || null;
}

// Helper: Generate human-readable description
function generateActivityDescription(activityType: string, data: any): string {
  const descriptions: Record<string, (d: any) => string> = {
    task_created: (d) => `created task "${d.taskTitle || 'Untitled'}"`,
    task_completed: (d) => `completed task "${d.taskTitle || 'Untitled'}"`,
    task_assigned: (d) => `assigned task to ${d.assigneeName || "someone"}`,
    event_rsvp: (d) => `RSVP'd to event "${d.eventTitle || 'Untitled'}"`,
    event_checkin: (d) => `checked in to event "${d.eventTitle || 'Untitled'}"`,
    milestone_completed: (d) => `completed milestone "${d.milestoneName || 'Untitled'}"`,
    document_uploaded: (d) => `uploaded document "${d.fileName || 'Untitled'}"`,
    message_sent: (d) => `sent a message in ${d.roomName || "chat"}`,
    poll_voted: (d) => `voted on poll "${d.pollTitle || 'Untitled'}"`,
    comment_added: (d) => `commented on ${d.targetType || "item"}`,
  };

  const generator = descriptions[activityType];
  return generator ? generator(data) : `performed ${activityType}`;
}
