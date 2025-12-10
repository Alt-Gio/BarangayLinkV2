import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export type RewardableAction =
  | "task_created" | "task_completed" | "task_on_time"
  | "event_attended" | "event_organized" | "event_volunteered"
  | "milestone_completed" | "project_completed"
  | "helpful_comment" | "code_review" | "document_uploaded"
  | "daily_login" | "streak_maintained" | "poll_participated";

interface RewardConfig {
  xp?: number;
  gold?: number;
  mana?: number;
}

const REWARD_CONFIG: Record<RewardableAction, RewardConfig> = {
  task_created: { xp: 5 },
  task_completed: { xp: 10, gold: 5 },
  task_on_time: { xp: 15, gold: 10 },
  event_attended: { xp: 50 },
  event_organized: { xp: 100, gold: 50 },
  event_volunteered: { xp: 75, gold: 25 },
  milestone_completed: { xp: 100, gold: 50 },
  project_completed: { xp: 500, gold: 250 },
  helpful_comment: { xp: 25 },
  code_review: { xp: 30 },
  document_uploaded: { gold: 10 },
  daily_login: { xp: 10 },
  streak_maintained: { xp: 20 },
  poll_participated: { xp: 5 },
};

export const awardPoints = internalMutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    context: v.optional(v.any()),
    multiplier: v.optional(v.number()), // For streaks, special events
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const baseReward = REWARD_CONFIG[args.action as RewardableAction] || { xp: 0, gold: 0 };
    const multiplier = args.multiplier || 1.0;

    const xpGained = Math.floor((baseReward.xp || 0) * multiplier);
    const goldGained = Math.floor((baseReward.gold || 0) * multiplier);
    const manaGained = Math.floor((baseReward.mana || 0) * multiplier);

    if (xpGained === 0 && goldGained === 0 && manaGained === 0) {
      return null; // No reward for this action
    }

    // Calculate new totals
    const newXP = (user.xp || 0) + xpGained;
    const newGold = (user.gold || 0) + goldGained;
    const newMana = (user.mana || 100) + manaGained;

    // Check for level up
    const currentLevel = user.level || 1;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > currentLevel;

    // Update user
    await ctx.db.patch(args.userId, {
      xp: newXP,
      gold: newGold,
      mana: Math.min(newMana, user.maxMana || 100), // Cap at max mana
      level: newLevel,
    });

    // Log reward history (optional table for tracking)
    // await ctx.db.insert("rewardHistory", { ... });

    // If leveled up, create notification
    if (leveledUp) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "level_up",
        title: `Level Up! You're now Level ${newLevel}! 🎉`,
        message: `Congratulations! You gained ${xpGained} XP and ${goldGained} gold.`,
        priority: "normal",
        isRead: false,
        metadata: {
          oldLevel: currentLevel,
          newLevel: newLevel,
          xpGained,
          goldGained,
        },
        createdAt: Date.now(),
      });
    }

    return {
      xpGained,
      goldGained,
      manaGained,
      leveledUp,
      newLevel,
      newTotals: {
        xp: newXP,
        gold: newGold,
        mana: newMana,
        level: newLevel,
      },
    };
  },
});

// Award XP for event attendance
export const awardEventAttendance: any = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    eventTitle: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Call awardPoints mutation directly
    const result: any = await ctx.runMutation((internal as any).services.gamificationService.awardPoints, {
      userId: args.userId,
      action: "event_attended",
      context: {
        eventId: args.eventId,
        eventTitle: args.eventTitle,
      },
    });

    // Create notification
    if (result) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "xp_earned",
        title: "XP Earned! 🌟",
        message: `You earned ${result.xpGained} XP for attending "${args.eventTitle}"!`,
        priority: "low",
        isRead: false,
        metadata: result,
        createdAt: Date.now(),
      });
    }

    return result;
  },
});

// Award bonus for milestone completion
export const awardMilestoneCompletion: any = mutation({
  args: {
    userId: v.id("users"),
    milestoneId: v.id("milestones"),
    milestoneName: v.string(),
    projectName: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const result: any = await ctx.runMutation((internal as any).services.gamificationService.awardPoints, {
      userId: args.userId,
      action: "milestone_completed",
      context: {
        milestoneId: args.milestoneId,
        milestoneName: args.milestoneName,
        projectName: args.projectName,
      },
    });

    // Create notification
    if (result) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "xp_earned",
        title: "Milestone Bonus! 🏆",
        message: `You earned ${result.xpGained} XP and ${result.goldGained} gold for completing "${args.milestoneName}"!`,
        priority: "normal",
        isRead: false,
        metadata: result,
        createdAt: Date.now(),
      });
    }

    return result;
  },
});

// Award gold for document uploads
export const awardDocumentUpload: any = mutation({
  args: {
    userId: v.id("users"),
    documentName: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runMutation((internal as any).services.gamificationService.awardPoints, {
      userId: args.userId,
      action: "document_uploaded",
      context: {
        documentName: args.documentName,
      },
    });
  },
});

// Award XP for helpful actions (comments, reviews)
export const awardHelpfulComment: any = mutation({
  args: {
    userId: v.id("users"),
    targetType: v.string(), // "task", "event", "project"
    targetName: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runMutation((internal as any).services.gamificationService.awardPoints, {
      userId: args.userId,
      action: "helpful_comment",
      context: {
        targetType: args.targetType,
        targetName: args.targetName,
      },
    });
  },
});

// Calculate daily login streak
export const updateLoginStreak = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const lastLogin = user.lastLoginAt || 0;
    const timeSinceLastLogin = now - lastLogin;

    let currentStreak = user.loginStreak || 0;
    let streakBonus = 0;

    // If logged in within 24 hours, maintain streak
    if (timeSinceLastLogin < oneDayMs * 1.5) {
      currentStreak += 1;
      
      // Award streak bonus every 7 days
      if (currentStreak % 7 === 0) {
        const multiplier = Math.floor(currentStreak / 7);
        await ctx.runMutation((internal as any).services.gamificationService.awardPoints, {
          userId: args.userId,
          action: "streak_maintained",
          multiplier: multiplier,
        });
        streakBonus = REWARD_CONFIG.streak_maintained.xp! * multiplier;
      }
    } else if (timeSinceLastLogin > oneDayMs * 2) {
      // Streak broken if more than 48 hours
      currentStreak = 1;
    }

    // Update user
    await ctx.db.patch(args.userId, {
      lastLoginAt: now,
      loginStreak: currentStreak,
    });

    // Award daily login XP
    await ctx.runMutation((internal as any).services.gamificationService.awardPoints, {
      userId: args.userId,
      action: "daily_login",
    });

    return {
      currentStreak,
      streakBonus,
      streakBroken: timeSinceLastLogin > oneDayMs * 2,
    };
  },
});

// Get user gamification stats
export const getUserStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const xpToNextLevel = calculateXPToNextLevel(user.level || 1);
    const currentLevelXP = calculateLevelXP(user.level || 1);
    const progressToNextLevel = ((user.xp || 0) - currentLevelXP) / (xpToNextLevel - currentLevelXP);

    return {
      xp: user.xp || 0,
      gold: user.gold || 0,
      level: user.level || 1,
      health: user.health || 100,
      mana: user.mana || 100,
      maxHealth: user.maxHealth || 100,
      maxMana: user.maxMana || 100,
      loginStreak: user.loginStreak || 0,
      xpToNextLevel,
      progressToNextLevel: Math.round(progressToNextLevel * 100),
    };
  },
});

// Get leaderboard (top users by XP)
export const getLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
    metric: v.optional(v.string()), // "xp", "gold", "level"
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const metric = args.metric || "xp";

    // Get all users
    const users = await ctx.db.query("users").collect();

    // Sort by metric
    const sorted = users.sort((a, b) => {
      const aValue = (a as any)[metric] || 0;
      const bValue = (b as any)[metric] || 0;
      return bValue - aValue;
    });

    // Take top N and format
    return sorted.slice(0, limit).map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      profilePicture: user.profilePictureUrl,
      role: user.role,
      department: user.department,
      xp: user.xp || 0,
      gold: user.gold || 0,
      level: user.level || 1,
      loginStreak: user.loginStreak || 0,
    }));
  },
});

// Helper: Calculate level from XP (Fibonacci-like curve)
function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  if (xp < 5500) return 10;
  
  // Beyond level 10: +1000 XP per level
  return 10 + Math.floor((xp - 5500) / 1000);
}

// Helper: Calculate XP required for a level
function calculateLevelXP(level: number): number {
  if (level === 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 300;
  if (level === 4) return 600;
  if (level === 5) return 1000;
  if (level === 6) return 1500;
  if (level === 7) return 2100;
  if (level === 8) return 2800;
  if (level === 9) return 3600;
  if (level === 10) return 4500;
  
  return 5500 + ((level - 10) * 1000);
}

// Helper: Calculate XP to next level
function calculateXPToNextLevel(currentLevel: number): number {
  return calculateLevelXP(currentLevel + 1);
}
