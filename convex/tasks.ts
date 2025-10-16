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
    projectId: v.id("projects"), // Required: every task must be linked to a project
    dueDate: v.optional(v.number()),
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
      status: "todo",
      priority: "medium",
      projectId: args.projectId,
      dueDate: args.dueDate,
      completed: false,
      habitScore: undefined,
      createdAt: Date.now(),
      assignedTo: [user._id], // Wrap in array for multiple assignment support
      createdBy: user._id,
      experienceReward: reward.xp,
      goldReward: reward.gold,
      completionCount: 0,
      tags: [],
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
