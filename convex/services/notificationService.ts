/**
 * Notification Service - Cross-Module Notification System
 * Centralized notification creation from any activity
 */

import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type NotificationType =
  // Tasks
  | "task_assigned" | "task_completed" | "task_due_soon" | "task_overdue"
  // Events
  | "event_invitation" | "event_rsvp" | "event_reminder" | "event_checkin"
  // Projects
  | "project_assigned" | "milestone_completed" | "project_update"
  // Messages
  | "message_mention" | "message_reaction" | "poll_voted" | "poll_completed"
  // Documents
  | "document_shared" | "document_commented"
  // Collaboration
  | "comment_mention" | "review_requested" | "review_approved"
  // Gamification
  | "achievement_unlocked" | "level_up";

// Create notification from any module
export const createNotification = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    recipientId: v.id("users"),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    )),
    relatedEntityType: v.optional(v.string()), // "task", "event", "project", etc.
    relatedEntityId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.recipientId);
    if (!user) {
      throw new Error("Recipient not found");
    }

    // Create notification
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.recipientId,
      type: args.type as any, // Type will be validated at runtime
      title: args.title,
      message: args.message,
      priority: args.priority || "normal",
      isRead: false,
      relatedTaskId: args.relatedEntityType === "task" 
        ? (args.relatedEntityId as Id<"tasks">) 
        : undefined,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    // If high priority, also queue email notification
    if (args.priority === "high" || args.priority === "urgent") {
      await queueEmailNotification(ctx, {
        recipientId: args.recipientId,
        type: args.type,
        title: args.title,
        message: args.message,
        actionUrl: args.actionUrl,
      });
    }

    return notificationId;
  },
});

// Create bulk notifications (e.g., event reminders)
export const createBulkNotifications = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    recipientIds: v.array(v.id("users")),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    )),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationIds = await Promise.all(
      args.recipientIds.map(async (recipientId) => {
        return await ctx.db.insert("notifications", {
          userId: recipientId,
          type: args.type as any, // Type will be validated at runtime
          title: args.title,
          message: args.message,
          priority: args.priority || "normal",
          isRead: false,
          relatedTaskId: args.relatedEntityType === "task"
            ? (args.relatedEntityId as Id<"tasks">)
            : undefined,
          metadata: args.metadata,
          createdAt: Date.now(),
        });
      })
    );

    return { created: notificationIds.length, ids: notificationIds };
  },
});

// Notify on @mention in messages
export const notifyMention = mutation({
  args: {
    mentionedUserId: v.id("users"),
    mentionerUserId: v.id("users"),
    messageContent: v.string(),
    roomId: v.id("chatRooms"),
    roomName: v.string(),
  },
  handler: async (ctx, args) => {
    const mentioner = await ctx.db.get(args.mentionerUserId);
    
    return await ctx.db.insert("notifications", {
      userId: args.mentionedUserId,
      type: "message_mention",
      title: "You were mentioned",
      message: `${mentioner?.name || "Someone"} mentioned you in ${args.roomName}`,
      priority: "normal",
      isRead: false,
      metadata: {
        messageContent: args.messageContent.slice(0, 100), // Preview
        roomId: args.roomId,
        roomName: args.roomName,
        mentionerId: args.mentionerUserId,
        mentionerName: mentioner?.name,
      },
      createdAt: Date.now(),
    });
  },
});

// Notify on message reaction
export const notifyReaction = mutation({
  args: {
    messageAuthorId: v.id("users"),
    reactorUserId: v.id("users"),
    emoji: v.string(),
    roomName: v.string(),
    messagePreview: v.string(),
  },
  handler: async (ctx, args) => {
    // Don't notify if user reacted to their own message
    if (args.messageAuthorId === args.reactorUserId) {
      return null;
    }

    const reactor = await ctx.db.get(args.reactorUserId);

    return await ctx.db.insert("notifications", {
      userId: args.messageAuthorId,
      type: "message_reaction",
      title: "Someone reacted to your message",
      message: `${reactor?.name || "Someone"} reacted ${args.emoji} to your message in ${args.roomName}`,
      priority: "low",
      isRead: false,
      metadata: {
        emoji: args.emoji,
        roomName: args.roomName,
        messagePreview: args.messagePreview,
        reactorId: args.reactorUserId,
        reactorName: reactor?.name,
      },
      createdAt: Date.now(),
    });
  },
});

// Notify event organizer of new RSVP
export const notifyEventRSVP = mutation({
  args: {
    eventId: v.id("events"),
    eventTitle: v.string(),
    organizerId: v.id("users"),
    attendeeName: v.string(),
    rsvpStatus: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.organizerId,
      type: "event_rsvp",
      title: "New event RSVP",
      message: `${args.attendeeName} RSVP'd "${args.rsvpStatus}" to ${args.eventTitle}`,
      priority: "normal",
      isRead: false,
      metadata: {
        eventId: args.eventId,
        eventTitle: args.eventTitle,
        attendeeName: args.attendeeName,
        rsvpStatus: args.rsvpStatus,
      },
      createdAt: Date.now(),
    });
  },
});

// Notify on poll vote completion
export const notifyPollComplete = mutation({
  args: {
    pollCreatorId: v.id("users"),
    pollTitle: v.string(),
    roomName: v.string(),
    totalVotes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.pollCreatorId,
      type: "poll_completed",
      title: "Poll voting completed",
      message: `Your poll "${args.pollTitle}" in ${args.roomName} has ${args.totalVotes} votes`,
      priority: "low",
      isRead: false,
      metadata: {
        pollTitle: args.pollTitle,
        roomName: args.roomName,
        totalVotes: args.totalVotes,
      },
      createdAt: Date.now(),
    });
  },
});

// Notify team when milestone completed
export const notifyMilestoneComplete = mutation({
  args: {
    milestoneId: v.id("milestones"),
    milestoneName: v.string(),
    projectId: v.id("projects"),
    projectName: v.string(),
    completedById: v.id("users"),
    teamMemberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const completer = await ctx.db.get(args.completedById);

    // Notify all team members except the completer
    const recipients = args.teamMemberIds.filter(
      (id) => id !== args.completedById
    );

    const notificationIds = await Promise.all(
      recipients.map(async (memberId) => {
        return await ctx.db.insert("notifications", {
          userId: memberId,
          type: "milestone_completed",
          title: "Milestone completed! 🎉",
          message: `${completer?.name || "Someone"} completed milestone "${args.milestoneName}" in ${args.projectName}`,
          priority: "normal",
          isRead: false,
          metadata: {
            milestoneId: args.milestoneId,
            milestoneName: args.milestoneName,
            projectId: args.projectId,
            projectName: args.projectName,
            completedBy: completer?.name,
          },
          createdAt: Date.now(),
        });
      })
    );

    return { notified: notificationIds.length };
  },
});

// Notify on achievement unlock
export const notifyAchievement = mutation({
  args: {
    userId: v.id("users"),
    achievementTitle: v.string(),
    achievementDescription: v.string(),
    achievementIcon: v.string(),
    xpReward: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "achievement_unlocked",
      title: `Achievement Unlocked: ${args.achievementTitle}`,
      message: args.achievementDescription,
      priority: "normal",
      isRead: false,
      metadata: {
        achievementTitle: args.achievementTitle,
        achievementIcon: args.achievementIcon,
        xpReward: args.xpReward,
      },
      createdAt: Date.now(),
    });
  },
});

// Helper: Queue email notification
async function queueEmailNotification(
  ctx: any,
  data: {
    recipientId: Id<"users">;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
  }
) {
  const user = await ctx.db.get(data.recipientId);
  if (!user?.email) return;

  await ctx.db.insert("emailQueue", {
    to: user.email,
    type: data.type,
    data: {
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      userName: user.name,
    },
    priority: "normal",
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
  });
}
