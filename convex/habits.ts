import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

async function checkLevelUp(ctx: any, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const currentLevel = user.level || 1;
  const currentXP = user.experience || 0;
  
  let xpToNextLevel = currentLevel * 100;
  
  if (currentXP >= xpToNextLevel) {
    let newLevel = currentLevel;
    let remainingXP = currentXP;
    
    while (remainingXP >= xpToNextLevel) {
      remainingXP -= xpToNextLevel;
      newLevel++;
      xpToNextLevel = newLevel * 100;
    }
    
    await ctx.db.patch(userId, {
      level: newLevel,
      experience: remainingXP,
      gold: (user.gold || 0) + ((newLevel - currentLevel) * 50),
    });
    
    return newLevel - currentLevel;
  }
  
  return 0;
}

export const createHabit = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    positive: v.boolean(),
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const habitId = await ctx.db.insert("habits", {
      userId: user._id,
      title: args.title,
      notes: args.notes,
      difficulty: args.difficulty,
      positive: args.positive,
      frequency: args.frequency,
      streak: 0,
      longestStreak: 0,
      createdAt: Date.now(),
    });

    return habitId;
  },
});

export const completeHabit = mutation({
  args: {
    habitId: v.id("habits"),
    isPositive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit) throw new Error("Habit not found");

    const user = await ctx.db.get(habit.userId);
    if (!user) throw new Error("User not found");

    const rewards = {
      easy: { xp: 5, gold: 2, health: 5, mana: 3 },
      medium: { xp: 10, gold: 5, health: 10, mana: 5 },
      hard: { xp: 20, gold: 10, health: 15, mana: 10 },
    };

    const reward = rewards[habit.difficulty];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const lastCompleted = habit.lastCompleted || 0;
    const timeSinceLastComplete = now - lastCompleted;
    const isStreakContinued = timeSinceLastComplete < oneDayMs * 2; // Allow 1 day grace period

    if (timeSinceLastComplete < oneDayMs) {
      throw new Error("Habit is on cooldown. You can only complete this once per day.");
    }

    let newStreak = habit.streak;

    if (args.isPositive && habit.positive) {
      if (isStreakContinued || habit.streak === 0) {
        newStreak = habit.streak + 1;
      } else {
        newStreak = 1;
      }

      await ctx.db.patch(args.habitId, {
        streak: newStreak,
        longestStreak: Math.max(newStreak, habit.longestStreak),
        lastCompleted: now,
      });

      await ctx.db.patch(habit.userId, {
        experience: (user.experience || 0) + reward.xp,
        gold: (user.gold || 0) + reward.gold,
        health: Math.min(100, (user.health || 50) + reward.health),
        mana: Math.min(100, (user.mana || 50) + reward.mana),
      });
      
      await checkLevelUp(ctx, habit.userId);
    } else if (!args.isPositive && !habit.positive) {
      if (isStreakContinued || habit.streak === 0) {
        newStreak = habit.streak + 1;
      } else {
        newStreak = 1;
      }

      await ctx.db.patch(args.habitId, {
        streak: newStreak,
        longestStreak: Math.max(newStreak, habit.longestStreak),
        lastCompleted: now,
      });

      await ctx.db.patch(habit.userId, {
        experience: (user.experience || 0) + reward.xp,
        gold: (user.gold || 0) + reward.gold,
      });
      
      await checkLevelUp(ctx, habit.userId);
    } else if (args.isPositive && !habit.positive) {
      await ctx.db.patch(args.habitId, {
        streak: 0,
        lastCompleted: now,
      });

      await ctx.db.patch(habit.userId, {
        health: Math.max(0, (user.health || 50) - reward.health),
      });
    } else if (!args.isPositive && habit.positive) {
      await ctx.db.patch(args.habitId, {
        streak: 0,
        lastCompleted: now,
      });

      await ctx.db.patch(habit.userId, {
        health: Math.max(0, (user.health || 50) - reward.health),
      });
    }

    return args.habitId;
  },
});

export const deleteHabit = mutation({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.habitId);
    return args.habitId;
  },
});

export const createDaily = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const dailyId = await ctx.db.insert("dailies", {
      userId: user._id,
      title: args.title,
      notes: args.notes,
      difficulty: args.difficulty,
      completed: false,
      streak: 0,
      lastResetDate: Date.now(),
      createdAt: Date.now(),
    });

    return dailyId;
  },
});

export const toggleDaily = mutation({
  args: {
    dailyId: v.id("dailies"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const daily = await ctx.db.get(args.dailyId);
    if (!daily) throw new Error("Daily not found");

    const user = await ctx.db.get(daily.userId);
    if (!user) throw new Error("User not found");

    const rewards = {
      easy: { xp: 5, gold: 2 },
      medium: { xp: 10, gold: 5 },
      hard: { xp: 20, gold: 10 },
    };

    const reward = rewards[daily.difficulty];
    const newCompleted = !daily.completed;

    await ctx.db.patch(args.dailyId, {
      completed: newCompleted,
      completedAt: newCompleted ? Date.now() : undefined,
      streak: newCompleted ? daily.streak + 1 : daily.streak,
    });

    // Award/remove rewards
    if (newCompleted) {
      await ctx.db.patch(daily.userId, {
        experience: (user.experience || 0) + reward.xp,
        gold: (user.gold || 0) + reward.gold,
      });
      
      await checkLevelUp(ctx, daily.userId);
    } else {
      await ctx.db.patch(daily.userId, {
        experience: Math.max(0, (user.experience || 0) - reward.xp),
        gold: Math.max(0, (user.gold || 0) - reward.gold),
      });
    }

    return args.dailyId;
  },
});

export const deleteDaily = mutation({
  args: {
    dailyId: v.id("dailies"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.dailyId);
    return args.dailyId;
  },
});

export const resetDailies = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const dailies = await ctx.db
      .query("dailies")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const daily of dailies) {
      if (now - daily.lastResetDate > oneDayMs) {
        await ctx.db.patch(daily._id, {
          completed: false,
          lastResetDate: now,
          completedAt: undefined,
        });
      }
    }
  },
});

export const createTodo = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const todoId = await ctx.db.insert("todos", {
      userId: user._id,
      title: args.title,
      notes: args.notes,
      difficulty: args.difficulty,
      completed: false,
      createdAt: Date.now(),
    });

    return todoId;
  },
});

export const toggleTodo = mutation({
  args: {
    todoId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const todo = await ctx.db.get(args.todoId);
    if (!todo) throw new Error("Todo not found");

    const user = await ctx.db.get(todo.userId);
    if (!user) throw new Error("User not found");

    const rewards = {
      easy: { xp: 10, gold: 5 },
      medium: { xp: 20, gold: 10 },
      hard: { xp: 40, gold: 20 },
    };

    const reward = rewards[todo.difficulty];
    const newCompleted = !todo.completed;

    await ctx.db.patch(args.todoId, {
      completed: newCompleted,
      completedAt: newCompleted ? Date.now() : undefined,
    });

    if (newCompleted) {
      await ctx.db.patch(todo.userId, {
        experience: (user.experience || 0) + reward.xp,
        gold: (user.gold || 0) + reward.gold,
      });
      
      await checkLevelUp(ctx, todo.userId);
    } else {
      await ctx.db.patch(todo.userId, {
        experience: Math.max(0, (user.experience || 0) - reward.xp),
        gold: Math.max(0, (user.gold || 0) - reward.gold),
      });
    }

    return args.todoId;
  },
});

export const deleteTodo = mutation({
  args: {
    todoId: v.id("todos"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.todoId);
    return args.todoId;
  },
});

export const getMyHabits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return habits;
  },
});

export const getMyDailies = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    const dailies = await ctx.db
      .query("dailies")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return dailies;
  },
});

export const getMyTodos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return todos;
  },
});
