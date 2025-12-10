import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

    const stats = await ctx.db
      .query("userStats")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

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
    projectId: v.id("projects"),
    milestoneId: v.optional(v.id("milestones")),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.id("users"))),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

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

    await ctx.scheduler.runAfter(0, "tasks:syncProjectProgress" as any, {
      projectId: args.projectId,
    });

    return taskId;
  },
});

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

    const xpReward = task.experienceReward;
    const goldReward = task.goldReward;

    await ctx.db.patch(args.taskId, {
      completed: true,
      completedAt: Date.now(),
      completionCount: task.completionCount + 1,
      lastCompleted: Date.now(),
    });

    if (task.projectId) {
      await ctx.scheduler.runAfter(0, "tasks:syncProjectProgress" as any, {
        projectId: task.projectId,
      });
    }

    let stats = await ctx.db
      .query("userStats")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!stats) {
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
    const xpToNextLevel = stats.level * 100;
    if (newXp >= xpToNextLevel) {
      newLevel = stats.level + 1;
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const lastCompleted = new Date(stats.lastCompletedDate).setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

    let newStreak = stats.streak;
    if (daysDiff === 0) {
      newStreak = stats.streak;
    } else if (daysDiff === 1) {
      newStreak = stats.streak + 1;
    } else {
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

    if (task.projectId) {
      await ctx.scheduler.runAfter(0, "tasks:syncProjectProgress" as any, {
        projectId: task.projectId,
      });
    }

    return { success: true };
  },
});

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

    const projectId = task.projectId;
    
    await ctx.db.delete(args.taskId);

    if (projectId) {
      await ctx.scheduler.runAfter(0, "tasks:syncProjectProgress" as any, {
        projectId: projectId,
      });
    }

    return { success: true };
  },
});

export const getProjectTasks = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

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

export const resetDailies = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);

    const dailyTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("type"), "daily"))
      .collect();

    for (const task of dailyTasks) {
      if (task.completed && task.completedAt) {
        const completedDate = new Date(task.completedAt).setHours(0, 0, 0, 0);
        
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

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.optional(v.string()),
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

    const updates: any = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.completed !== undefined) {
      updates.completed = args.completed;
      if (args.completed) {
        updates.completedAt = Date.now();
        
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

    await ctx.db.patch(args.taskId, updates);

    if ((args.status !== undefined || args.completed !== undefined) && task.projectId) {
      await ctx.scheduler.runAfter(0, "tasks:syncProjectProgress" as any, {
        projectId: task.projectId,
      });
    }

    if ((args.status !== undefined || args.completed !== undefined) && task.milestoneId) {
      await ctx.scheduler.runAfter(0, "milestones:updateMilestoneProgress" as any, {
        milestoneId: task.milestoneId,
      });
    }

    return { success: true };
  },
});

export const syncProjectProgress = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (tasks.length === 0) {
      await ctx.db.patch(args.projectId, { progress: 0 });
      return { progress: 0, totalTasks: 0, completedTasks: 0 };
    }

    const completedTasks = tasks.filter(
      (t) => t.status === "done" || t.status === "completed" || t.completed === true
    ).length;

    const progress = Math.round((completedTasks / tasks.length) * 100);
    await ctx.db.patch(args.projectId, { progress });

    return { progress, totalTasks: tasks.length, completedTasks };
  },
});

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

    if (task.workingOnIt === user._id) {
      await ctx.db.patch(args.taskId, {
        workingOnIt: undefined,
        workingOnItStartedAt: undefined,
      });
      return { working: false, message: "Stopped working on task" };
    } else {
      await ctx.db.patch(args.taskId, {
        workingOnIt: user._id,
        workingOnItStartedAt: Date.now(),
      });
      return { working: true, message: "Started working on task" };
    }
  },
});
