import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user's personal tasks organized by type
export const getMyTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get all user's tasks
    const allTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("assignedTo"), user._id))
      .collect();

    // Organize by type
    const todos = allTasks.filter(t => t.type === "todo" && t.status !== "completed");
    const dailies = allTasks.filter(t => t.type === "daily");
    const habits = allTasks.filter(t => t.type === "habit");
    const rewards = allTasks.filter(t => t.type === "reward");
    const completed = allTasks.filter(t => t.status === "completed").slice(0, 10); // Recent 10

    return {
      todos,
      dailies,
      habits,
      rewards,
      completed,
      user: {
        _id: user._id,
        name: user.name,
        level: user.level,
        experience: user.experience,
        gold: user.gold,
        health: user.health,
        mana: user.mana,
        streakCount: user.streakCount,
      },
    };
  },
});

// Complete a habit (positive or negative)
export const completeHabit = mutation({
  args: {
    taskId: v.id("tasks"),
    positive: v.boolean(), // true for +, false for -
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

    const habitScore = task.habitScore || 0;
    const newScore = args.positive ? habitScore + 1 : habitScore - 1;

    // Calculate rewards/penalties
    const xpChange = args.positive ? task.experienceReward : -Math.floor(task.experienceReward * 0.5);
    const goldChange = args.positive ? task.goldReward : -Math.floor(task.goldReward * 0.5);
    const healthChange = args.positive ? 2 : -5;

    // Update task
    await ctx.db.patch(args.taskId, {
      habitScore: newScore,
      lastCompleted: Date.now(),
      completionCount: task.completionCount + 1,
    });

    // Update user
    const newHealth = Math.max(0, Math.min(100, user.health + healthChange));
    const newXP = Math.max(0, user.experience + xpChange);
    const newGold = Math.max(0, user.gold + goldChange);
    const newLevel = Math.floor(newXP / 100) + 1;

    await ctx.db.patch(user._id, {
      experience: newXP,
      gold: newGold,
      health: newHealth,
      level: newLevel,
    });

    return {
      success: true,
      xpChange,
      goldChange,
      healthChange,
      newScore,
      leveledUp: newLevel > user.level,
    };
  },
});

// Complete a daily task
export const completeDaily = mutation({
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

    const now = Date.now();
    const lastCompleted = task.lastCompleted || 0;
    const daysSinceLastCompleted = (now - lastCompleted) / (1000 * 60 * 60 * 24);

    // Check if already completed today
    if (daysSinceLastCompleted < 1) {
      throw new Error("Daily already completed today");
    }

    // Calculate streak
    let newStreak = 1;
    if (daysSinceLastCompleted <= 1.5) {
      newStreak = (task.streak || 0) + 1;
    }

    const streakBonus = 1 + (newStreak - 1) * 0.1;
    const xpGain = Math.floor(task.experienceReward * streakBonus);
    const goldGain = Math.floor(task.goldReward * streakBonus);

    // Update task
    await ctx.db.patch(args.taskId, {
      lastCompleted: now,
      streak: newStreak,
      completionCount: task.completionCount + 1,
    });

    // Update user
    const newXP = user.experience + xpGain;
    const newLevel = Math.floor(newXP / 100) + 1;

    await ctx.db.patch(user._id, {
      experience: newXP,
      gold: user.gold + goldGain,
      level: newLevel,
      totalTasksCompleted: user.totalTasksCompleted + 1,
      streakCount: Math.max(user.streakCount, newStreak),
    });

    return {
      success: true,
      xpGained: xpGain,
      goldGained: goldGain,
      streak: newStreak,
      leveledUp: newLevel > user.level,
      newLevel,
    };
  },
});

// Complete a todo
export const completeTodo = mutation({
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

    if (task.status === "completed") {
      throw new Error("Task already completed");
    }

    const now = Date.now();
    let timeBonus = 1;
    
    if (task.dueDate && now <= task.dueDate) {
      timeBonus = 1.2; // 20% bonus for on-time completion
    }

    const xpGain = Math.floor(task.experienceReward * timeBonus);
    const goldGain = Math.floor(task.goldReward * timeBonus);

    // Update task
    await ctx.db.patch(args.taskId, {
      status: "completed",
      completed: true,
      completedAt: now,
      lastCompleted: now,
      completionCount: task.completionCount + 1,
    });

    // Update user
    const newXP = user.experience + xpGain;
    const newLevel = Math.floor(newXP / 100) + 1;

    await ctx.db.patch(user._id, {
      experience: newXP,
      gold: user.gold + goldGain,
      level: newLevel,
      totalTasksCompleted: user.totalTasksCompleted + 1,
    });

    return {
      success: true,
      xpGained: xpGain,
      goldGained: goldGain,
      timeBonus: timeBonus > 1,
      leveledUp: newLevel > user.level,
      newLevel,
    };
  },
});

// Purchase/claim a reward
export const claimReward = mutation({
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
    if (!task) throw new Error("Reward not found");

    const cost = task.goldReward;

    if (user.gold < cost) {
      throw new Error(`Not enough gold! Need ${cost}, have ${user.gold}`);
    }

    // Deduct gold
    await ctx.db.patch(user._id, {
      gold: user.gold - cost,
    });

    // Update reward count
    await ctx.db.patch(args.taskId, {
      completionCount: task.completionCount + 1,
      lastCompleted: Date.now(),
    });

    return {
      success: true,
      goldSpent: cost,
      remainingGold: user.gold - cost,
    };
  },
});

// Delete a task
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

    if (task.userId.toString() !== user._id.toString()) {
      throw new Error("You can only delete your own tasks");
    }

    await ctx.db.delete(args.taskId);
    return { success: true };
  },
});

// Daily reset - reset dailies that haven't been completed
export const resetDailies = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Get user's daily tasks
    const dailies = await ctx.db
      .query("tasks")
      .filter((q) =>
        q.and(
          q.eq(q.field("assignedTo"), user._id),
          q.eq(q.field("type"), "daily")
        )
      )
      .collect();

    let missedCount = 0;
    let healthLoss = 0;

    for (const daily of dailies) {
      const lastCompleted = daily.lastCompleted || 0;
      
      // If not completed in last 24 hours
      if (lastCompleted < oneDayAgo) {
        missedCount++;
        healthLoss += 5;
        
        // Reset streak
        await ctx.db.patch(daily._id, {
          streak: 0,
        });
      }
    }

    if (missedCount > 0) {
      const newHealth = Math.max(0, user.health - healthLoss);
      
      await ctx.db.patch(user._id, {
        health: newHealth,
      });

      return {
        success: true,
        missedCount,
        healthLoss,
        newHealth,
      };
    }

    return {
      success: true,
      missedCount: 0,
      healthLoss: 0,
      newHealth: user.health,
    };
  },
});

// Get dashboard stats
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const allTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("assignedTo"), user._id))
      .collect();

    const todos = allTasks.filter(t => t.type === "todo" && t.status !== "completed");
    const dailies = allTasks.filter(t => t.type === "daily");
    const habits = allTasks.filter(t => t.type === "habit");
    
    // Check dailies completion for today
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const completedDailies = dailies.filter(d => 
      d.lastCompleted && d.lastCompleted >= todayStart
    );

    // Get current streak info
    const maxStreak = Math.max(...dailies.map(d => d.streak || 0), 0);

    return {
      user: {
        name: user.name,
        level: user.level,
        experience: user.experience,
        experienceToNextLevel: (user.level * 100),
        experienceProgress: (user.experience % 100) / 100 * 100,
        gold: user.gold,
        health: user.health,
        mana: user.mana,
        maxStreak: maxStreak,
      },
      taskCounts: {
        todos: todos.length,
        dailies: dailies.length,
        dailiesCompleted: completedDailies.length,
        habits: habits.length,
      },
    };
  },
});
