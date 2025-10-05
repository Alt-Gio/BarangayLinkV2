import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// EMAIL NOTIFICATION SETTINGS
// ============================================

// Get user's notification preferences
export const getNotificationPreferences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    return user.metadata?.notificationPreferences || {
      email: {
        taskAssigned: true,
        taskCompleted: true,
        projectUpdates: true,
        eventReminders: true,
        messages: true,
        digest: {
          enabled: true,
          frequency: 'weekly', // 'daily' or 'weekly'
        },
      },
      inApp: {
        all: true,
      },
    };
  },
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.any(),
  },
  handler: async (ctx, { userId, preferences }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      metadata: {
        ...user.metadata,
        notificationPreferences: preferences,
      } as any,
    });

    return { success: true };
  },
});

// ============================================
// EMAIL QUEUE SYSTEM
// ============================================

// Queue an email to be sent
export const queueEmail = mutation({
  args: {
    to: v.string(),
    type: v.string(),
    data: v.any(),
    priority: v.optional(v.union(v.literal("high"), v.literal("normal"), v.literal("low"))),
  },
  handler: async (ctx, args) => {
    const emailId = await ctx.db.insert("emailQueue", {
      to: args.to,
      type: args.type,
      data: args.data,
      priority: args.priority || "normal",
      status: "pending",
      attempts: 0,
      createdAt: Date.now(),
    });

    return emailId;
  },
});

// Get pending emails (for processing)
export const getPendingEmails = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const emails = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .take(limit);

    return emails;
  },
});

// Mark email as sent
export const markEmailSent = mutation({
  args: { emailId: v.id("emailQueue") },
  handler: async (ctx, { emailId }) => {
    await ctx.db.patch(emailId, {
      status: "sent",
      sentAt: Date.now(),
    });
  },
});

// Mark email as failed
export const markEmailFailed = mutation({
  args: {
    emailId: v.id("emailQueue"),
    error: v.string(),
  },
  handler: async (ctx, { emailId, error }) => {
    const email = await ctx.db.get(emailId);
    if (!email) return;

    const attempts = email.attempts + 1;
    const maxAttempts = 3;

    await ctx.db.patch(emailId, {
      status: attempts >= maxAttempts ? "failed" : "pending",
      attempts,
      lastError: error,
      lastAttemptAt: Date.now(),
    });
  },
});

// ============================================
// NOTIFICATION ACTIONS
// ============================================

// Send task assignment notification
export const notifyTaskAssigned = action({
  args: {
    taskId: v.id("tasks"),
    assignedToId: v.id("users"),
    assignedById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.tasks.getTaskById, { taskId: args.taskId });
    const assignedTo = await ctx.runQuery(internal.users.getUserById, { userId: args.assignedToId });
    const assignedBy = await ctx.runQuery(internal.users.getUserById, { userId: args.assignedById });

    if (!task || !assignedTo || !assignedBy) return;

    // Check notification preferences
    const prefs = await ctx.runQuery(internal.emailNotifications.getNotificationPreferences, {
      userId: args.assignedToId,
    });

    if (!prefs?.email?.taskAssigned) return;

    // Queue email
    await ctx.runMutation(internal.emailNotifications.queueEmail, {
      to: assignedTo.email,
      type: "task_assigned",
      data: {
        userName: assignedTo.name,
        taskTitle: task.title,
        taskDescription: task.description,
        priority: task.priority,
        assignedBy: assignedBy.name,
        taskId: task._id,
        dueDate: task.dueDate,
      },
      priority: task.priority === "urgent" ? "high" : "normal",
    });
  },
});

// Send event reminder notification
export const notifyEventReminder = action({
  args: {
    eventId: v.id("events"),
    hoursUntil: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.runQuery(internal.events.getEventById, { eventId: args.eventId });
    if (!event) return;

    const attendees = event.attendees || [];

    for (const attendeeId of attendees) {
      const user = await ctx.runQuery(internal.users.getUserById, { userId: attendeeId });
      if (!user) continue;

      const prefs = await ctx.runQuery(internal.emailNotifications.getNotificationPreferences, {
        userId: attendeeId,
      });

      if (!prefs?.email?.eventReminders) continue;

      await ctx.runMutation(internal.emailNotifications.queueEmail, {
        to: user.email,
        type: "event_reminder",
        data: {
          userName: user.name,
          eventTitle: event.title,
          eventDescription: event.description,
          eventDate: new Date(event.date).toLocaleDateString(),
          eventTime: new Date(event.date).toLocaleTimeString(),
          location: event.location,
          eventId: event._id,
          hoursUntil: args.hoursUntil,
        },
        priority: args.hoursUntil <= 1 ? "high" : "normal",
      });
    }
  },
});

// Send welcome email to new user
export const notifyWelcome = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getUserById, { userId: args.userId });
    if (!user) return;

    await ctx.runMutation(internal.emailNotifications.queueEmail, {
      to: user.email,
      type: "welcome",
      data: {
        userName: user.name,
        department: user.department,
      },
      priority: "high",
    });
  },
});

// Send daily/weekly digest
export const notifyDigest = action({
  args: {
    userId: v.id("users"),
    period: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getUserById, { userId: args.userId });
    if (!user) return;

    const prefs = await ctx.runQuery(internal.emailNotifications.getNotificationPreferences, {
      userId: args.userId,
    });

    if (!prefs?.email?.digest?.enabled || prefs?.email?.digest?.frequency !== args.period) return;

    // Gather stats and activities
    const tasks = await ctx.runQuery(internal.tasks.getUserTasks, { userId: args.userId });
    const events = await ctx.runQuery(internal.events.getUserEvents, { userId: args.userId });

    const stats = {
      tasksCompleted: tasks.filter((t: any) => t.status === "completed").length,
      tasksAssigned: tasks.length,
      upcomingEvents: events.filter((e: any) => new Date(e.date) > new Date()).length,
      newMessages: 0, // TODO: Get from messages
      projectUpdates: 0, // TODO: Get from projects
    };

    const recentActivities = tasks.slice(0, 5).map((task: any) => ({
      type: "Task",
      title: task.title,
      time: new Date(task._creationTime).toLocaleString(),
    }));

    const upcomingDeadlines = tasks
      .filter((t: any) => t.dueDate && new Date(t.dueDate) > new Date())
      .slice(0, 5)
      .map((task: any) => ({
        title: task.title,
        dueDate: new Date(task.dueDate).toLocaleDateString(),
        priority: task.priority,
      }));

    await ctx.runMutation(internal.emailNotifications.queueEmail, {
      to: user.email,
      type: "digest",
      data: {
        userName: user.name,
        period: args.period,
        stats,
        recentActivities,
        upcomingDeadlines,
      },
      priority: "low",
    });
  },
});

// Helper to declare internal functions
const internal = {
  tasks: {
    getTaskById: null as any,
    getUserTasks: null as any,
  },
  users: {
    getUserById: null as any,
  },
  events: {
    getEventById: null as any,
    getUserEvents: null as any,
  },
  emailNotifications: {
    getNotificationPreferences: null as any,
    queueEmail: null as any,
  },
};
