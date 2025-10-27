import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * HABITICA-STYLE TASK MANAGEMENT SYSTEM
 * 
 * Features:
 * - Todos: One-time tasks
 * - Dailies: Tasks that repeat every day
 * - Milestones: Important project milestones
 * - XP & Gold rewards based on difficulty
 * - Streak tracking
 * - Project integration
 */

/**
 * Get current user's tasks
 */
export const getMyTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();

    return tasks;
  },
});

/**
 * Get user stats (level, XP, streak, gold)
 */
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return null;

    // Get user stats (don't create in query - that's done in mutation)
    const stats = await ctx.db
      .query("userStats")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    // Return default stats if none exist yet
    if (!stats) {
      return {
        _id: "" as any,
        _creationTime: Date.now(),
        userId: user._id,
        level: 1,
        xp: 0,
        gold: 0,
        streak: 0,
        lastCompletedDate: Date.now(),
      };
    }

    return stats;
  },
});

/**
 * Create a new task
 */
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("todo"), v.literal("daily"), v.literal("milestone")),
    difficulty: v.union(
      v.literal("trivial"),
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    storyPoints: v.optional(v.number()),
    projectId: v.id("projects"), // Required: every task must be linked to a project
    milestoneId: v.optional(v.id("milestones")), // Optional: link to a milestone
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.id("users"))), // Optional: assigned users
    status: v.optional(v.string()), // Allow any status for custom columns
    tags: v.optional(v.array(v.string())), // Optional: task tags
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Calculate rewards based on difficulty
    const rewards = {
      trivial: { xp: 5, gold: 1 },
      easy: { xp: 10, gold: 2 },
      medium: { xp: 20, gold: 5 },
      hard: { xp: 50, gold: 10 },
    };
    const reward = rewards[args.difficulty];

    const taskId = await ctx.db.insert("tasks", {
      userId: user._id,
      title: args.title,
      description: args.description || "",
      type: args.type,
      difficulty: args.difficulty,
      status: args.status || "todo",
      priority: args.priority || "medium",
      storyPoints: args.storyPoints || 3,
      projectId: args.projectId,
      milestoneId: args.milestoneId,
      dueDate: args.dueDate,
      completed: false,
      habitScore: undefined,
      createdAt: Date.now(),
      assignedTo: args.assignedTo && args.assignedTo.length > 0 ? args.assignedTo : [user._id],
      createdBy: user._id,
      experienceReward: reward.xp,
      goldReward: reward.gold,
      completionCount: 0,
      tags: args.tags || [],
      attachments: [],
      dependencies: [],
      subtasks: [],
      loggedHours: [],
      isBlocking: false,
    });

    return taskId;
  },
});

/**
 * Complete a task (awards XP and Gold)
 */
export const completeTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== user._id) throw new Error("Not authorized");

    // Get rewards from task
    const xpReward = task.experienceReward;
    const goldReward = task.goldReward;

    // Update task - mark as completed
    await ctx.db.patch(args.taskId, {
      completed: true,
      completedAt: Date.now(),
      completionCount: task.completionCount + 1,
      lastCompleted: Date.now(),
    });

    // Update user stats
    let stats = await ctx.db
      .query("userStats")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!stats) {
      // Create stats if doesn't exist
      const statsId = await ctx.db.insert("userStats", {
        userId: user._id,
        level: 1,
        xp: 0,
        gold: 0,
        streak: 0,
        lastCompletedDate: Date.now(),
      });
      stats = await ctx.db.get(statsId);
    }

    if (!stats) throw new Error("Failed to get stats");

    const newXp = stats.xp + xpReward;
    const newGold = stats.gold + goldReward;
    let newLevel = stats.level;

    // Check for level up (100 XP per level)
    const xpToNextLevel = stats.level * 100;
    if (newXp >= xpToNextLevel) {
      newLevel = stats.level + 1;
    }

    // Update streak (if completed today)
    const today = new Date().setHours(0, 0, 0, 0);
    const lastCompleted = new Date(stats.lastCompletedDate).setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

    let newStreak = stats.streak;
    if (daysDiff === 0) {
      // Same day, keep streak
      newStreak = stats.streak;
    } else if (daysDiff === 1) {
      // Next day, increment streak
      newStreak = stats.streak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    await ctx.db.patch(stats._id, {
      xp: newXp,
      gold: newGold,
      level: newLevel,
      streak: newStreak,
      lastCompletedDate: Date.now(),
    });

    return {
      xpGained: xpReward,
      goldGained: goldReward,
      levelUp: newLevel > stats.level,
      newLevel,
    };
  },
});

/**
 * Uncomplete a task
 */
export const uncompleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.taskId, {
      completed: false,
      completedAt: undefined,
    });

    return { success: true };
  },
});

/**
 * Delete a task
 */
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.taskId);

    return { success: true };
  },
});

/**
 * Get tasks for a specific project
 */
export const getProjectTasks = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get user info for each task
    const tasksWithUsers = await Promise.all(
      tasks.map(async (task) => {
        const user = await ctx.db.get(task.userId);
        return {
          ...task,
          user: user ? {
            _id: user._id,
            name: user.name,
            imageUrl: user.imageUrl,
          } : null,
        };
      })
    );

    return tasksWithUsers;
  },
});

/**
 * Reset dailies (called via cron at midnight)
 */
export const resetDailies = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);

    // Get all daily tasks that were completed yesterday
    const dailyTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("type"), "daily"))
      .collect();

    for (const task of dailyTasks) {
      if (task.completed && task.completedAt) {
        const completedDate = new Date(task.completedAt).setHours(0, 0, 0, 0);
        
        // If completed yesterday or before, reset it
        if (completedDate < today) {
          await ctx.db.patch(task._id, {
            completed: false,
            completedAt: undefined,
          });
        }
      }
    }

    return { reset: dailyTasks.length };
  },
});

/**
 * Update task status and other fields (for kanban drag & drop)
 */
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.optional(v.string()), // Allow any status for custom columns
    completed: v.optional(v.boolean()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    storyPoints: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.id("users"))),
    difficulty: v.optional(v.union(
      v.literal("trivial"),
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    )),
    tags: v.optional(v.array(v.string())),
    type: v.optional(v.union(
      v.literal("todo"),
      v.literal("daily"),
      v.literal("habit"),
      v.literal("milestone"),
      v.literal("reward")
    )),
    // Role-based permission fields
    completedBy: v.optional(v.id("users")),
    completedByRole: v.optional(v.string()),
    lastMovedBy: v.optional(v.id("users")),
    lockedInReview: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Build update object with only provided fields
    const updates: any = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.completed !== undefined) {
      updates.completed = args.completed;
      if (args.completed) {
        updates.completedAt = Date.now();
        
        // Update stats for all assigned users
        if (task.assignedTo && task.assignedTo.length > 0) {
          for (const userId of task.assignedTo) {
            const user = await ctx.db.get(userId);
            if (user) {
              await ctx.db.patch(userId, {
                totalTasksCompleted: ((user as any).totalTasksCompleted || 0) + 1,
              });
            }
          }
        }
      }
    }
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.storyPoints !== undefined) updates.storyPoints = args.storyPoints;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.difficulty !== undefined) updates.difficulty = args.difficulty;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.type !== undefined) updates.type = args.type;
    if (args.completedBy !== undefined) updates.completedBy = args.completedBy;
    if (args.completedByRole !== undefined) updates.completedByRole = args.completedByRole;
    if (args.lastMovedBy !== undefined) updates.lastMovedBy = args.lastMovedBy;
    if (args.lockedInReview !== undefined) updates.lockedInReview = args.lockedInReview;

    // Update the task
    await ctx.db.patch(args.taskId, updates);

    return { success: true };
  },
});

/**
 * Toggle "Working On It" status
 */
export const toggleWorkingOnIt = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Toggle working status
    if (task.workingOnIt === user._id) {
      // Stop working
      await ctx.db.patch(args.taskId, {
        workingOnIt: undefined,
        workingOnItStartedAt: undefined,
      });
      return { working: false, message: "Stopped working on task" };
    } else {
      // Start working
      await ctx.db.patch(args.taskId, {
        workingOnIt: user._id,
        workingOnItStartedAt: Date.now(),
      });
      return { working: true, message: "Started working on task" };
    }
  },
});
