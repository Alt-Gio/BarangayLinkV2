import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

// Create project notification/announcement
export const createProjectNotification = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    message: v.optional(v.string()),
    type: v.union(v.literal("announcement"), v.literal("reminder"), v.literal("update")),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    scheduledFor: v.optional(v.number()),
    targetRoles: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN", "BUILDER"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check if user can send notifications for this project
    const canNotify = currentUser.userLevel.name === "ADMIN" ||
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     (currentUser.userLevel.name === "BUILDER" && project.createdBy === currentUser._id);
    
    if (!canNotify) throw new Error("Permission denied");
    
    // Get project team members
    const teamMembers = project.assignedTo || [];
    
    // Filter by target roles if specified
    let targetUsers = teamMembers;
    if (args.targetRoles && args.targetRoles.length > 0) {
      const usersWithRoles = await Promise.all(
        teamMembers.map(async (userId) => {
          const user = await ctx.db.get(userId);
          if (!user) return null;
          const userLevel = await ctx.db.get(user.userLevel);
          return { userId, roleName: userLevel?.name };
        })
      );
      
      targetUsers = usersWithRoles
        .filter(user => user && args.targetRoles!.includes(user.roleName!))
        .map(user => user!.userId);
    }
    
    // Create notifications for each target user
    const notifications = await Promise.all(
      targetUsers.map(async (userId) => {
        return await ctx.db.insert("notifications", {
          userId,
          title: args.title,
          message: args.message || "",
          type: "info",
          category: "project_announcement",
          isRead: false,
          createdAt: Date.now(),
          metadata: {
            priority: args.priority || "medium",
            category: "project_announcement",
            relatedId: args.projectId,
            data: {
              projectId: args.projectId,
              projectTitle: project.title,
              notificationType: args.type,
              projectName: project.title,
              senderName: currentUser.name,
              senderRole: currentUser.userLevel.name,
              createdBy: currentUser._id,
              scheduledFor: args.scheduledFor
            }
          }
        });
      })
    );
    
    return notifications;
  }
});

// Get project notifications
export const getProjectNotifications = query({
  args: { 
    projectId: v.id("projects"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) return [];
    
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => 
        q.eq(q.field("userId"), currentUser._id)
      )
      .order("desc")
      .take(args.limit || 50);
    
    // Filter by project ID in the metadata.data.projectId
    const projectNotifications = notifications.filter(notification => 
      notification.metadata?.data?.projectId === args.projectId
    );
    
    return projectNotifications;
  }
});

// Mark notification as read
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications")
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) throw new Error("Not authenticated");
    
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    
    if (notification.userId !== currentUser._id) {
      throw new Error("Permission denied");
    }
    
    await ctx.db.patch(args.notificationId, {
      isRead: true
    });
    
    return args.notificationId;
  }
});

// Get user's unread notifications count
export const getUnreadNotificationsCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) return 0;
    
    const unreadCount = await ctx.db
      .query("notifications")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), currentUser._id),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();
    
    return unreadCount.length;
  }
});

// Send urgent project alert
export const sendUrgentProjectAlert = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    message: v.string(),
    alertType: v.union(v.literal("deadline"), v.literal("budget"), v.literal("emergency"), v.literal("milestone"))
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check permissions
    const canAlert = currentUser.userLevel.name === "ADMIN" ||
                    (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department);
    
    if (!canAlert) throw new Error("Permission denied");
    
    // Send to all project team members
    const teamMembers = project.assignedTo || [];
    
    const alerts = await Promise.all(
      teamMembers.map(async (userId) => {
        return await ctx.db.insert("notifications", {
          userId,
          title: `🚨 ${args.title}`,
          message: args.message,
          type: "warning",
          category: "project_alert",
          isRead: false,
          createdAt: Date.now(),
          metadata: {
            priority: "urgent",
            category: "project_alert",
            relatedId: args.projectId,
            data: {
              projectId: args.projectId,
              projectTitle: project.title,
              alertType: args.alertType,
              projectName: project.title,
              senderName: currentUser.name,
              senderRole: currentUser.userLevel.name,
              createdBy: currentUser._id
            }
          }
        });
      })
    );
    
    return alerts;
  }
});
