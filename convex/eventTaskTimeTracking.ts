import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Clock in to a task - Start work timer
 * Automatically transitions task to "in_progress"
 */
export const clockIn = mutation({
  args: {
    taskId: v.id("eventTasks"),
    startTime: v.optional(v.number()), // Allow custom start time
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user is assigned to this task
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Check if user has an active assignment for this task
    const assignment = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task_user", (q) => 
        q.eq("taskId", args.taskId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!assignment) {
      throw new Error("You are not assigned to this task. Only assigned workers can clock in.");
    }

    // Check if already clocked in to this task
    const existingSession = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("isRunning"), true)
        )
      )
      .first();

    if (existingSession) {
      throw new Error("You are already clocked in to this task");
    }

    // Check if user has any other running timers
    const otherRunningSession = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isRunning"), true))
      .first();

    if (otherRunningSession) {
      throw new Error("Please clock out of your current task first");
    }

    const now = Date.now();
    const startTime = args.startTime || now;

    // Create time entry
    const timeEntryId = await ctx.db.insert("eventTaskTimeEntries", {
      taskId: args.taskId,
      userId: user._id,
      startTime,
      endTime: undefined,
      duration: undefined,
      description: undefined,
      isRunning: true,
      createdAt: now,
    });

    // Update task status to in_progress if not already
    if (task && task.status !== "in_progress" && task.status !== "done") {
      await ctx.db.patch(args.taskId, {
        status: "in_progress",
        startDate: task.startDate || startTime,
        updatedAt: now,
      });

      // Log activity
      await ctx.db.insert("eventTaskComments", {
        taskId: args.taskId,
        userId: user._id,
        comment: `Started working on this task`,
        type: "status_change",
        oldStatus: task.status,
        newStatus: "in_progress",
        mentions: [],
        createdAt: now,
        isEdited: false,
      });
    }

    return { timeEntryId, startTime };
  },
});

/**
 * Clock out from a task - Stop work timer
 * Records duration and marks task for verification
 */
export const clockOut = mutation({
  args: {
    taskId: v.id("eventTasks"),
    description: v.optional(v.string()), // Work description
    markComplete: v.optional(v.boolean()), // Mark task as done
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Find running session - try task-specific first
    let session = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("isRunning"), true)
        )
      )
      .first();

    // Fallback: Find any running session by user
    if (!session) {
      session = await ctx.db
        .query("eventTaskTimeEntries")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("isRunning"), true))
        .first();
      
      // If found a different task, stop that one instead
      if (session && session.taskId !== args.taskId) {
        throw new Error(`You are currently clocked in to a different task. Please clock out from that task first.`);
      }
    }

    if (!session) {
      throw new Error("No active time entry found. Please clock in first.");
    }

    const now = Date.now();
    const duration = Math.round((now - session.startTime) / 60000); // Convert to minutes

    // Update time entry
    await ctx.db.patch(session._id, {
      endTime: now,
      duration,
      description: args.description,
      isRunning: false,
    });

    // Update task's actual hours
    const task = await ctx.db.get(args.taskId);
    if (task) {
      const currentHours = task.actualHours || 0;
      const additionalHours = duration / 60;
      
      await ctx.db.patch(args.taskId, {
        actualHours: currentHours + additionalHours,
        updatedAt: now,
      });

      // Update individual assignment progress
      const estimatedMinutes = task.estimatedHours ? task.estimatedHours * 60 : 480; // Default 8 hours
      const totalTimeSpent = ((currentHours * 60) + duration); // Total minutes worked
      const progressPercent = Math.min(100, Math.round((totalTimeSpent / estimatedMinutes) * 100));

      // Find user's assignment
      const assignment = await ctx.db
        .query("eventTaskAssignments")
        .withIndex("by_task_user", (q: any) => 
          q.eq("taskId", args.taskId).eq("userId", user._id)
        )
        .filter((q: any) => q.eq(q.field("isActive"), true))
        .first();

      if (assignment) {
        // Update assignment progress
        const updates: any = {
          progress: args.markComplete ? 100 : progressPercent,
        };

        if (args.markComplete) {
          updates.status = "completed";
          updates.completedAt = now;
          updates.submissionNote = args.description;
        }

        await ctx.db.patch(assignment._id, updates);

        // Recalculate overall task progress from all assignments
        const allAssignments = await ctx.db
          .query("eventTaskAssignments")
          .withIndex("by_task", (q: any) => q.eq("taskId", args.taskId))
          .filter((q: any) => q.eq(q.field("isActive"), true))
          .collect();

        const totalProgress = allAssignments.reduce((sum: number, a: any) => sum + a.progress, 0);
        const avgProgress = allAssignments.length > 0 
          ? Math.round(totalProgress / allAssignments.length) 
          : 0;

        await ctx.db.patch(args.taskId, {
          progress: avgProgress,
          updatedAt: now,
        });

        // If all assignments completed, move to review
        const allCompleted = allAssignments.every((a: any) => 
          a.status === "completed" || a.status === "verified"
        );
        if (allCompleted && task.status !== "in_review" && task.status !== "done") {
          await ctx.db.patch(args.taskId, {
            status: "in_review",
          });
        }
      }

      // If marking as complete
      if (args.markComplete) {
        // Log completion activity
        await ctx.db.insert("eventTaskComments", {
          taskId: args.taskId,
          userId: user._id,
          comment: args.description || `Completed work on this task (${duration} minutes)`,
          type: "status_change",
          oldStatus: "in_progress",
          newStatus: "completed",
          mentions: [],
          createdAt: now,
          isEdited: false,
        });
      } else {
        // Log time entry
        await ctx.db.insert("eventTaskComments", {
          taskId: args.taskId,
          userId: user._id,
          comment: args.description || `Logged ${duration} minutes of work`,
          type: "comment",
          mentions: [],
          createdAt: now,
          isEdited: false,
        });
      }
    }

    return { duration, endTime: now };
  },
});

/**
 * Get active time entry for current user
 */
export const getActiveTimeEntry = query({
  args: {
    taskId: v.optional(v.id("eventTasks")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    let query = ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isRunning"), true));

    const sessions = await query.collect();
    
    if (args.taskId) {
      return sessions.find(s => s.taskId === args.taskId) || null;
    }

    return sessions[0] || null;
  },
});

/**
 * Get all time entries for a task
 */
export const getTaskTimeEntries = query({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect();

    // Get user details for each entry
    const entriesWithUsers = await Promise.all(
      entries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          ...entry,
          user: user ? {
            _id: user._id,
            name: user.name,
            imageUrl: user.imageUrl,
          } : null,
        };
      })
    );

    return entriesWithUsers;
  },
});

/**
 * Get total time logged for a task
 */
export const getTaskTotalTime = query({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const totalMinutes = entries.reduce((sum, entry) => {
      if (entry.isRunning) {
        // Calculate current duration for running entries
        const currentDuration = Math.round((Date.now() - entry.startTime) / 60000);
        return sum + currentDuration;
      }
      return sum + (entry.duration || 0);
    }, 0);

    return {
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(2),
      entryCount: entries.length,
    };
  },
});

/**
 * Get user's work history (for attendance tracking)
 */
export const getUserWorkHistory = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let userId = args.userId;
    
    if (!userId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      
      if (!user) return [];
      userId = user._id;
    }

    let query = ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const entries = await query.collect();

    // Filter by date range if provided
    const filtered = entries.filter(entry => {
      if (args.startDate && entry.startTime < args.startDate) return false;
      if (args.endDate && entry.startTime > args.endDate) return false;
      return true;
    });

    // Get task details for each entry
    const entriesWithTasks = await Promise.all(
      filtered.map(async (entry) => {
        const task = await ctx.db.get(entry.taskId);
        let event = null;
        if (task?.eventId) {
          event = await ctx.db.get(task.eventId);
        }
        return {
          ...entry,
          task: task ? {
            _id: task._id,
            title: task.title,
            status: task.status,
            eventId: task.eventId,
          } : null,
          event: event ? {
            _id: event._id,
            title: event.title,
          } : null,
        };
      })
    );

    return entriesWithTasks.sort((a, b) => b.startTime - a.startTime);
  },
});

/**
 * Verify/Approve completed task
 */
export const verifyTask = mutation({
  args: {
    taskId: v.id("eventTasks"),
    approved: v.boolean(),
    feedback: v.optional(v.string()),
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

    const now = Date.now();

    if (args.approved) {
      // Mark as done
      await ctx.db.patch(args.taskId, {
        status: "done",
        completedAt: now,
        progress: 100,
        updatedAt: now,
      });

      await ctx.db.insert("eventTaskComments", {
        taskId: args.taskId,
        userId: user._id,
        comment: args.feedback || "Task verified and approved",
        type: "status_change",
        oldStatus: "in_review",
        newStatus: "done",
        mentions: [],
        createdAt: now,
        isEdited: false,
      });
    } else {
      // Send back to in_progress
      await ctx.db.patch(args.taskId, {
        status: "in_progress",
        updatedAt: now,
      });

      await ctx.db.insert("eventTaskComments", {
        taskId: args.taskId,
        userId: user._id,
        comment: args.feedback || "Task needs revision",
        type: "status_change",
        oldStatus: "in_review",
        newStatus: "in_progress",
        mentions: [],
        createdAt: now,
        isEdited: false,
      });
    }

    return { success: true };
  },
});
