import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Calculate XP and Gold rewards based on difficulty and hours
const calculateRewards = (difficulty: string, hours: number) => {
  const baseXP = { trivial: 5, easy: 10, medium: 20, hard: 40 };
  const baseGold = { trivial: 2, easy: 5, medium: 10, hard: 20 };
  
  const xp = baseXP[difficulty as keyof typeof baseXP] + Math.floor(hours * 2);
  const gold = baseGold[difficulty as keyof typeof baseGold] + Math.floor(hours * 1);
  
  return { xp, gold };
};

// Create a new gamified task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    eventId: v.optional(v.id("events")),
    type: v.union(v.literal("habit"), v.literal("daily"), v.literal("todo"), v.literal("reward")),
    difficulty: v.union(v.literal("trivial"), v.literal("easy"), v.literal("medium"), v.literal("hard")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    assignedTo: v.id("users"),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    tags: v.array(v.string()),
    projectImpactScore: v.optional(v.number()),
    isBlocking: v.boolean(),
    habitFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    positiveHabit: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { xp, gold } = calculateRewards(args.difficulty, args.estimatedHours || 1);

    const taskId = await ctx.db.insert("tasks", {
      userId: user._id,
      title: args.title,
      description: args.description,
      projectId: args.projectId,
      eventId: args.eventId,
      type: args.type,
      difficulty: args.difficulty,
      status: "todo",
      priority: args.priority,
      completed: false,
      createdAt: Date.now(),
      assignedTo: args.assignedTo,
      createdBy: user._id,
      dueDate: args.dueDate,
      estimatedHours: args.estimatedHours,
      actualHours: 0,
      loggedHours: [],
      tags: args.tags,
      attachments: [],
      dependencies: [],
      subtasks: [],
      experienceReward: xp,
      goldReward: gold,
      completionCount: 0,
      habitFrequency: args.habitFrequency,
      positiveHabit: args.positiveHabit,
      projectImpactScore: args.projectImpactScore,
      isBlocking: args.isBlocking,
    });

    // Update project progress if linked
    if (args.projectId) {
      await updateProjectProgress(ctx, args.projectId);
    }

    return taskId;
  },
});

// Log hours for a task (Habitica-style time tracking)
export const logHours = mutation({
  args: {
    taskId: v.id("tasks"),
    hours: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Add hours to logged hours array
    const newLoggedHours = [
      ...task.loggedHours,
      {
        hours: args.hours,
        date: Date.now(),
        userId: user._id,
        description: args.description,
      },
    ];

    // Calculate total logged hours
    const totalLoggedHours = newLoggedHours.reduce((sum, log) => sum + log.hours, 0);

    // Update task
    await ctx.db.patch(args.taskId, {
      loggedHours: newLoggedHours,
      actualHours: totalLoggedHours,
    });

    // Update user's total hours
    await ctx.db.patch(user._id, {
      totalHoursLogged: user.totalHoursLogged + args.hours,
    });

    // Award partial XP for time logging (encourages regular updates)
    const partialXP = Math.floor(args.hours * 1);
    await ctx.db.patch(user._id, {
      experience: user.experience + partialXP,
    });

    return { success: true, hoursLogged: args.hours, xpGained: partialXP };
  },
});

// Complete a task (Habitica-style rewards)
export const completeTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status === "completed") {
      throw new Error("Task already completed");
    }

    const now = Date.now();
    let streakBonus = 1;

    // Handle different task types
    if (task.type === "daily") {
      // Check if completed within streak window
      const lastCompleted = task.lastCompleted || 0;
      const daysSinceLastCompleted = (now - lastCompleted) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastCompleted <= 1.5) { // Allow some flexibility
        streakBonus = 1 + (task.streak || 0) * 0.1; // 10% bonus per streak day
        await ctx.db.patch(args.taskId, {
          streak: (task.streak || 0) + 1,
        });
      } else {
        // Reset streak
        await ctx.db.patch(args.taskId, {
          streak: 1,
        });
      }
    }

    // Calculate rewards with streak bonus
    const baseXP = task.experienceReward * streakBonus;
    const baseGold = task.goldReward * streakBonus;

    // Bonus for completing on time
    let timeBonus = 1;
    if (task.dueDate && now <= task.dueDate) {
      timeBonus = 1.2; // 20% bonus for on-time completion
    }

    const finalXP = Math.floor(baseXP * timeBonus);
    const finalGold = Math.floor(baseGold * timeBonus);

    // Update task
    await ctx.db.patch(args.taskId, {
      status: "completed",
      lastCompleted: now,
      completionCount: task.completionCount + 1,
    });

    // Update user stats
    const newXP = user.experience + finalXP;
    const newGold = user.gold + finalGold;
    const newLevel = Math.floor(newXP / 100) + 1; // Level up every 100 XP
    const leveledUp = newLevel > user.level;

    await ctx.db.patch(user._id, {
      experience: newXP,
      gold: newGold,
      level: newLevel,
      totalTasksCompleted: user.totalTasksCompleted + 1,
      streakCount: leveledUp ? user.streakCount + 1 : user.streakCount,
    });

    // Update project progress if linked
    if (task.projectId) {
      await updateProjectProgress(ctx, task.projectId);
    }

    // Update event progress if linked
    if (task.eventId) {
      await updateEventProgress(ctx, task.eventId);
    }

    return {
      success: true,
      xpGained: finalXP,
      goldGained: finalGold,
      leveledUp,
      newLevel,
      streakBonus: streakBonus > 1,
    };
  },
});

// Update project progress based on task completion
const updateProjectProgress = async (ctx: any, projectId: any) => {
  const project = await ctx.db.get(projectId);
  if (!project) return;

  const allTasks = await ctx.db
    .query("tasks")
    .filter((q: any) => q.eq(q.field("projectId"), projectId))
    .collect();

  const completedTasks = allTasks.filter((t: any) => t.status === "completed");
  const blockingTasks = allTasks.filter((t: any) => t.isBlocking && t.status !== "completed");
  
  let progress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
  
  // Reduce progress if blocking tasks are incomplete
  if (blockingTasks.length > 0) {
    progress = Math.min(progress, 50); // Cap at 50% if blocking tasks remain
  }

  // Calculate project success score based on task impact scores
  const impactScore = allTasks.reduce((sum: number, task: any) => {
    if (task.status === "completed" && task.projectImpactScore) {
      return sum + task.projectImpactScore;
    }
    return sum;
  }, 0);

  await ctx.db.patch(projectId, {
    progress: Math.floor(progress),
  });

  // Update project status based on progress
  if (progress >= 100) {
    await ctx.db.patch(projectId, {
      status: "completed",
    });
    
    // Award bonus XP to all project participants
    const participants = [...project.assignedTo, project.createdBy];
    for (const userId of participants) {
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.patch(userId, {
          experience: user.experience + 50, // Project completion bonus
          projectSuccessRate: calculateSuccessRate(user._id, ctx),
        });
      }
    }
  }
};

// Update event progress based on task completion
const updateEventProgress = async (ctx: any, eventId: any) => {
  const event = await ctx.db.get(eventId);
  if (!event) return;

  const eventTasks = await ctx.db
    .query("tasks")
    .filter((q: any) => q.eq(q.field("eventId"), eventId))
    .collect();

  const completedTasks = eventTasks.filter((t: any) => t.status === "completed");
  const progress = eventTasks.length > 0 ? (completedTasks.length / eventTasks.length) * 100 : 0;

  // Events are considered successful if 80% of tasks are completed
  if (progress >= 80 && event.status !== "completed") {
    // Award event completion bonuses
    const participants = event.attendees;
    for (const userId of participants) {
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.patch(userId, {
          experience: user.experience + 25, // Event completion bonus
          gold: user.gold + 15,
        });
      }
    }
  }
};

// Calculate user's project success rate
const calculateSuccessRate = async (userId: any, ctx: any) => {
  const userProjects = await ctx.db
    .query("projects")
    .filter((q: any) => q.or(
      q.eq(q.field("createdBy"), userId),
      q.eq(q.field("assignedTo"), userId)
    ))
    .collect();

  const completedProjects = userProjects.filter((p: any) => p.status === "completed");
  return userProjects.length > 0 ? (completedProjects.length / userProjects.length) * 100 : 0;
};

// Get user's gamification stats
export const getUserStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const targetUserId = args.userId || currentUser._id;
    const user = await ctx.db.get(targetUserId);
    
    if (!user) {
      throw new Error("Target user not found");
    }

    // Get user's tasks
    const userTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("assignedTo"), targetUserId))
      .collect();

    const completedTasks = userTasks.filter(t => t.status === "completed");
    const activeTasks = userTasks.filter(t => t.status !== "completed" && t.status !== "cancelled");

    return {
      user: {
        name: user.name,
        level: user.level,
        experience: user.experience,
        gold: user.gold,
        health: user.health,
        mana: user.mana,
        streakCount: user.streakCount,
        totalTasksCompleted: user.totalTasksCompleted,
        totalHoursLogged: user.totalHoursLogged,
        projectSuccessRate: user.projectSuccessRate,
      },
      tasks: {
        total: userTasks.length,
        completed: completedTasks.length,
        active: activeTasks.length,
        completionRate: userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0,
      },
      nextLevelXP: (user.level * 100) - user.experience,
    };
  },
});

// Get tasks with gamification info
export const getGamifiedTasks = query({
  args: {
    userId: v.optional(v.id("users")),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let query = ctx.db.query("tasks");

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("assignedTo"), args.userId));
    } else {
      query = query.filter((q) => q.eq(q.field("assignedTo"), user._id));
    }

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), args.projectId));
    }

    const tasks = await query.collect();

    // Apply limit if provided
    const limitedTasks = args.limit ? tasks.slice(0, args.limit) : tasks;

    // Enrich tasks with project and user info
    const enrichedTasks = await Promise.all(
      limitedTasks.map(async (task) => {
        const project = task.projectId ? await ctx.db.get(task.projectId) : null;
        const assignedUser = await ctx.db.get(task.assignedTo);
        
        return {
          ...task,
          project: project ? { title: project.title, status: project.status } : null,
          assignedUser: assignedUser ? { name: assignedUser.name } : null,
          totalLoggedHours: task.loggedHours.reduce((sum, log) => sum + log.hours, 0),
        };
      })
    );

    return enrichedTasks;
  },
});

// Get leaderboard
export const getLeaderboard = query({
  args: {
    type: v.union(v.literal("level"), v.literal("experience"), v.literal("tasks"), v.literal("hours")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const limit = args.limit || 10;
    let users;

    switch (args.type) {
      case "level":
        users = await ctx.db.query("users").order("desc").take(limit);
        break;
      case "experience":
        users = await ctx.db.query("users").order("desc").take(limit);
        break;
      case "tasks":
        users = await ctx.db.query("users").order("desc").take(limit);
        break;
      case "hours":
        users = await ctx.db.query("users").order("desc").take(limit);
        break;
      default:
        users = await ctx.db.query("users").order("desc").take(limit);
    }

    return users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      level: user.level,
      experience: user.experience,
      totalTasksCompleted: user.totalTasksCompleted,
      totalHoursLogged: user.totalHoursLogged,
      projectSuccessRate: user.projectSuccessRate,
    }));
  },
});

// ============================================
// PROJECT-TASK INTEGRATION FUNCTIONS
// ============================================

// Get all tasks for a specific project with enriched data
export const getProjectTasks = query({
  args: { 
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Enrich with user info
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const assignedUser = await ctx.db.get(task.assignedTo);
        return {
          ...task,
          assignedUser: assignedUser ? {
            _id: assignedUser._id,
            name: assignedUser.name,
            imageUrl: assignedUser.imageUrl,
            level: assignedUser.level,
          } : null,
        };
      })
    );

    return enrichedTasks;
  },
});

// Get project progress stats (XP, Gold, Completion)
export const getProjectStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    const completed = tasks.filter(t => t.status === "completed");
    const total = tasks.length;

    // Calculate gamification stats
    const xpEarned = completed.reduce((sum, t) => sum + t.experienceReward, 0);
    const goldEarned = completed.reduce((sum, t) => sum + t.goldReward, 0);
    const xpPossible = tasks.reduce((sum, t) => sum + t.experienceReward, 0);
    const goldPossible = tasks.reduce((sum, t) => sum + t.goldReward, 0);

    // By difficulty
    const byDifficulty = {
      trivial: { 
        total: tasks.filter(t => t.difficulty === "trivial").length, 
        completed: completed.filter(t => t.difficulty === "trivial").length 
      },
      easy: { 
        total: tasks.filter(t => t.difficulty === "easy").length, 
        completed: completed.filter(t => t.difficulty === "easy").length 
      },
      medium: { 
        total: tasks.filter(t => t.difficulty === "medium").length, 
        completed: completed.filter(t => t.difficulty === "medium").length 
      },
      hard: { 
        total: tasks.filter(t => t.difficulty === "hard").length, 
        completed: completed.filter(t => t.difficulty === "hard").length 
      },
    };

    // By type
    const byType = {
      todo: tasks.filter(t => t.type === "todo").length,
      daily: tasks.filter(t => t.type === "daily").length,
      habit: tasks.filter(t => t.type === "habit").length,
      milestone: tasks.filter(t => t.type === "milestone").length,
      reward: tasks.filter(t => t.type === "reward").length,
    };

    return {
      total,
      completed: completed.length,
      pending: total - completed.length,
      completionRate: total > 0 ? (completed.length / total) * 100 : 0,
      xpEarned,
      goldEarned,
      xpPossible,
      goldPossible,
      xpProgress: xpPossible > 0 ? (xpEarned / xpPossible) * 100 : 0,
      goldProgress: goldPossible > 0 ? (goldEarned / goldPossible) * 100 : 0,
      byDifficulty,
      byType,
    };
  },
});

// Update task difficulty and recalculate rewards
export const updateTaskDifficulty = mutation({
  args: {
    taskId: v.id("tasks"),
    difficulty: v.union(v.literal("trivial"), v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const { xp, gold } = calculateRewards(args.difficulty, task.estimatedHours || 1);

    await ctx.db.patch(args.taskId, {
      difficulty: args.difficulty,
      experienceReward: xp,
      goldReward: gold,
    });

    // Update project progress if linked
    if (task.projectId) {
      await updateProjectProgress(ctx, task.projectId);
    }

    return { taskId: args.taskId, newXP: xp, newGold: gold };
  },
});

// Assign or reassign task to a user
export const assignTask = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, {
      assignedTo: args.userId,
    });

    return args.taskId;
  },
});

// Get user's tasks grouped by project
export const getMyProjectTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("assignedTo"), user._id))
      .collect();

    // Group by project
    const projectGroups: any = {};
    
    for (const task of tasks) {
      if (task.projectId) {
        const projectId = task.projectId.toString();
        
        if (!projectGroups[projectId]) {
          const project = await ctx.db.get(task.projectId);
          projectGroups[projectId] = {
            project,
            tasks: [],
            totalXP: 0,
            earnedXP: 0,
            totalGold: 0,
            earnedGold: 0,
            completed: 0,
            total: 0,
          };
        }
        
        projectGroups[projectId].tasks.push(task);
        projectGroups[projectId].total++;
        projectGroups[projectId].totalXP += task.experienceReward;
        projectGroups[projectId].totalGold += task.goldReward;
        
        if (task.status === "completed") {
          projectGroups[projectId].completed++;
          projectGroups[projectId].earnedXP += task.experienceReward;
          projectGroups[projectId].earnedGold += task.goldReward;
        }
      }
    }

    return Object.values(projectGroups);
  },
});
