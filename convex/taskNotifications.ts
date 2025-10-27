import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Task Notification System
 * Sends notifications based on task events and role-based rules
 */

/**
 * Create a task notification
 */
export const createTaskNotification = mutation({
  args: {
    userId: v.id("users"),
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("assigned"),
      v.literal("due_soon"),
      v.literal("overdue"),
      v.literal("working_on_it"),
      v.literal("task_completed"),
      v.literal("ready_for_review"),
      v.literal("review_approved"),
      v.literal("review_rejected"),
      v.literal("unassigned"),
      v.literal("task_updated")
    ),
    title: v.string(),
    message: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      category: "task",
      priority: args.priority || "medium",
      isRead: false,
      actionUrl: args.actionUrl,
      relatedTaskId: args.taskId,
      metadata: args.metadata || {},
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Notify when user is assigned to a task
 */
export const notifyTaskAssignment = mutation({
  args: {
    taskId: v.id("tasks"),
    assignedUserIds: v.array(v.id("users")),
    assignedByUserId: v.id("users"),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return [];

    const assignedBy = await ctx.db.get(args.assignedByUserId);
    if (!assignedBy) return [];

    const notifications = [];

    for (const userId of args.assignedUserIds) {
      const user = await ctx.db.get(userId);
      if (!user) continue;

      // Don't notify if they assigned themselves
      if (userId === args.assignedByUserId) continue;

      const priority = task.priority === "urgent" ? "urgent" : 
                      task.priority === "high" ? "high" : "medium";

      const notificationId: any = await ctx.runMutation(
        api.taskNotifications.createTaskNotification,
        {
          userId,
          taskId: args.taskId,
          type: "assigned",
          title: "📋 New Task Assigned",
          message: `${assignedBy.name} assigned you to "${task.title}"`,
          priority,
          actionUrl: `/tasks/${args.taskId}`,
          metadata: {
            taskTitle: task.title,
            assignedByName: assignedBy.name,
            dueDate: task.dueDate,
            storyPoints: task.storyPoints,
          },
        }
      );

      notifications.push(notificationId);
    }

    return notifications;
  },
});

/**
 * Notify when task is due soon (24 hours)
 */
export const notifyTaskDueSoon = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args): Promise<any[] | undefined> => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.dueDate || task.completed) return;

    const now = Date.now();
    const hoursUntilDue = (task.dueDate - now) / (1000 * 60 * 60);

    // Only notify if due within 24 hours
    if (hoursUntilDue > 24 || hoursUntilDue < 0) return;

    const notifications = [];

    for (const userId of task.assignedTo) {
      const notificationId: any = await ctx.runMutation(
        api.taskNotifications.createTaskNotification,
        {
          userId,
          taskId: args.taskId,
          type: "due_soon",
          title: "⏰ Task Due Soon",
          message: `"${task.title}" is due in ${Math.round(hoursUntilDue)} hours`,
          priority: "high",
          actionUrl: `/tasks/${args.taskId}`,
          metadata: {
            taskTitle: task.title,
            dueDate: task.dueDate,
            hoursRemaining: Math.round(hoursUntilDue),
          },
        }
      );

      notifications.push(notificationId);
    }

    return notifications;
  },
});

/**
 * Notify when task is overdue
 */
export const notifyTaskOverdue = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args): Promise<any[] | undefined> => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.dueDate || task.completed) return;

    const now = Date.now();
    if (task.dueDate > now) return; // Not overdue yet

    const notifications = [];

    for (const userId of task.assignedTo) {
      const notificationId: any = await ctx.runMutation(
        api.taskNotifications.createTaskNotification,
        {
          userId,
          taskId: args.taskId,
          type: "overdue",
          title: "🚨 Task Overdue",
          message: `"${task.title}" is overdue!`,
          priority: "urgent",
          actionUrl: `/tasks/${args.taskId}`,
          metadata: {
            taskTitle: task.title,
            dueDate: task.dueDate,
          },
        }
      );

      notifications.push(notificationId);
    }

    return notifications;
  },
});

/**
 * Notify when someone starts working on a task
 */
export const notifyWorkingOnIt = mutation({
  args: {
    taskId: v.id("tasks"),
    workingUserId: v.id("users"),
  },
  handler: async (ctx, args): Promise<any[] | undefined> => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    const workingUser = await ctx.db.get(args.workingUserId);
    if (!workingUser) return;

    const notifications = [];

    // Notify all assigned users (except the one working)
    for (const userId of task.assignedTo) {
      if (userId === args.workingUserId) continue;

      const notificationId: any = await ctx.runMutation(
        api.taskNotifications.createTaskNotification,
        {
          userId,
          taskId: args.taskId,
          type: "working_on_it",
          title: "🔧 Task In Progress",
          message: `${workingUser.name} started working on "${task.title}"`,
          priority: "low",
          actionUrl: `/tasks/${args.taskId}`,
          metadata: {
            taskTitle: task.title,
            workingUserName: workingUser.name,
          },
        }
      );

      notifications.push(notificationId);
    }

    return notifications;
  },
});

/**
 * Notify when task is marked as Done
 */
export const notifyTaskCompleted = mutation({
  args: {
    taskId: v.id("tasks"),
    completedByUserId: v.id("users"),
  },
  handler: async (ctx, args): Promise<any[] | undefined> => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    const completedBy = await ctx.db.get(args.completedByUserId);
    if (!completedBy) return;

    const notifications = [];

    // Notify all assigned users (except the completer)
    for (const userId of task.assignedTo) {
      if (userId === args.completedByUserId) continue;

      const notificationId: any = await ctx.runMutation(
        api.taskNotifications.createTaskNotification,
        {
          userId,
          taskId: args.taskId,
          type: "task_completed",
          title: "✅ Task Completed",
          message: `${completedBy.name} marked "${task.title}" as complete`,
          priority: "medium",
          actionUrl: `/tasks/${args.taskId}`,
          metadata: {
            taskTitle: task.title,
            completedByName: completedBy.name,
            completedByRole: completedBy.role,
          },
        }
      );

      notifications.push(notificationId);
    }

    // Notify task creator if they're not assigned
    if (task.createdBy && !task.assignedTo.includes(task.createdBy)) {
      const notificationId: any = await ctx.runMutation(
        api.taskNotifications.createTaskNotification,
        {
          userId: task.createdBy,
          taskId: args.taskId,
          type: "task_completed",
          title: "✅ Task Completed",
          message: `${completedBy.name} completed your task "${task.title}"`,
          priority: "medium",
          actionUrl: `/tasks/${args.taskId}`,
          metadata: {
            taskTitle: task.title,
            completedByName: completedBy.name,
          },
        }
      );

      notifications.push(notificationId);
    }

    return notifications;
  },
});

/**
 * Notify when task is moved to Review
 * Notifies Manager or higher roles for approval
 */
export const notifyTaskReadyForReview = mutation({
  args: {
    taskId: v.id("tasks"),
    movedByUserId: v.id("users"),
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args): Promise<any[] | undefined> => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    const movedBy = await ctx.db.get(args.movedByUserId);
    if (!movedBy) return;

    // Get milestone to find project
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone || !milestone.projectId) return;

    // Get all team members with Manager or higher role
    const project = await ctx.db.get(milestone.projectId);
    if (!project || !project.assignedTo) return;

    const notifications = [];

    for (const memberId of project.assignedTo) {
      const member = await ctx.db.get(memberId);
      if (!member) continue;

      // Only notify Manager, Admin, Captain
      if ((member as any).role === "manager" || (member as any).role === "admin" || (member as any).role === "captain") {
        const notificationId: any = await ctx.runMutation(
          api.taskNotifications.createTaskNotification,
          {
            userId: memberId,
            taskId: args.taskId,
            type: "ready_for_review",
            title: "👀 Task Ready for Review",
            message: `${movedBy.name} submitted "${task.title}" for review`,
            priority: "high",
            actionUrl: `/tasks/${args.taskId}`,
            metadata: {
              taskTitle: task.title,
              submittedByName: movedBy.name,
              submittedByRole: movedBy.role,
              storyPoints: task.storyPoints,
            },
          }
        );

        notifications.push(notificationId);
      }
    }

    return notifications;
  },
});

/**
 * Get user notifications
 */
export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    const notifications = await query.collect();

    let filtered = notifications;
    if (args.unreadOnly) {
      filtered = notifications.filter(n => !n.isRead);
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return notifications.length;
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: Date.now(),
      });
    }

    return notifications.length;
  },
});

/**
 * Delete notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

/**
 * Check for overdue tasks (run periodically)
 */
export const checkOverdueTasks = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ checked: number; notified: number }> => {
    const now = Date.now();

    // Get all incomplete tasks with due dates
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.and(
          q.eq(q.field("completed"), false),
          q.neq(q.field("dueDate"), undefined)
        )
      )
      .collect();

    const notifications = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const hoursUntilDue = (task.dueDate - now) / (1000 * 60 * 60);

      // Notify if due within 24 hours
      if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
        const notifs: any = await ctx.runMutation(
          api.taskNotifications.notifyTaskDueSoon,
          { taskId: task._id }
        );
        if (notifs) notifications.push(...notifs);
      }

      // Notify if overdue
      if (hoursUntilDue < 0) {
        const notifs: any = await ctx.runMutation(
          api.taskNotifications.notifyTaskOverdue,
          { taskId: task._id }
        );
        if (notifs) notifications.push(...notifs);
      }
    }

    return { checked: tasks.length, notified: notifications.length };
  },
});
