import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const ACHIEVEMENTS = {
  first_task: {
    id: "first_task",
    title: "Getting Started",
    description: "Complete your first task",
    icon: "✅",
    category: "tasks",
    requirement: { type: "task_count", value: 1 },
    xpReward: 50,
  },
  task_master_10: {
    id: "task_master_10",
    title: "Task Master",
    description: "Complete 10 tasks",
    icon: "🎯",
    category: "tasks",
    requirement: { type: "task_count", value: 10 },
    xpReward: 100,
  },
  task_master_50: {
    id: "task_master_50",
    title: "Task Warrior",
    description: "Complete 50 tasks",
    icon: "⚔️",
    category: "tasks",
    requirement: { type: "task_count", value: 50 },
    xpReward: 500,
  },
  task_master_100: {
    id: "task_master_100",
    title: "Task Legend",
    description: "Complete 100 tasks",
    icon: "🏆",
    category: "tasks",
    requirement: { type: "task_count", value: 100 },
    xpReward: 1000,
  },
  early_bird: {
    id: "early_bird",
    title: "Early Bird",
    description: "Complete 20 tasks before their due date",
    icon: "🌅",
    category: "tasks",
    requirement: { type: "early_completion", value: 20 },
    xpReward: 200,
  },

  first_event: {
    id: "first_event",
    title: "First Event",
    description: "Attend your first event",
    icon: "🎉",
    category: "events",
    requirement: { type: "event_attendance", value: 1 },
    xpReward: 50,
  },
  event_enthusiast: {
    id: "event_enthusiast",
    title: "Event Enthusiast",
    description: "Attend 10 events",
    icon: "🎊",
    category: "events",
    requirement: { type: "event_attendance", value: 10 },
    xpReward: 300,
  },
  perfect_attendance: {
    id: "perfect_attendance",
    title: "Perfect Attendance",
    description: "Attend 30 events",
    icon: "🌟",
    category: "events",
    requirement: { type: "event_attendance", value: 30 },
    xpReward: 1000,
  },

  // Collaboration Achievements
  helpful_hand: {
    id: "helpful_hand",
    title: "Helpful Hand",
    description: "Help 5 teammates with comments or reviews",
    icon: "🤝",
    category: "collaboration",
    requirement: { type: "help_teammates", value: 5 },
    xpReward: 100,
  },
  team_player: {
    id: "team_player",
    title: "Team Player",
    description: "Help 25 teammates",
    icon: "👥",
    category: "collaboration",
    requirement: { type: "help_teammates", value: 25 },
    xpReward: 500,
  },
  mentor: {
    id: "mentor",
    title: "Mentor",
    description: "Help 100 teammates",
    icon: "🎓",
    category: "collaboration",
    requirement: { type: "help_teammates", value: 100 },
    xpReward: 2000,
  },

  // Streak Achievements
  week_warrior: {
    id: "week_warrior",
    title: "Week Warrior",
    description: "Maintain a 7-day login streak",
    icon: "🔥",
    category: "engagement",
    requirement: { type: "login_streak", value: 7 },
    xpReward: 150,
  },
  month_master: {
    id: "month_master",
    title: "Month Master",
    description: "Maintain a 30-day login streak",
    icon: "🌙",
    category: "engagement",
    requirement: { type: "login_streak", value: 30 },
    xpReward: 1000,
  },

  // Milestone Achievements
  milestone_achiever: {
    id: "milestone_achiever",
    title: "Milestone Achiever",
    description: "Complete 5 project milestones",
    icon: "🎖️",
    category: "milestones",
    requirement: { type: "milestone_count", value: 5 },
    xpReward: 500,
  },

  // Document Achievements
  knowledge_sharer: {
    id: "knowledge_sharer",
    title: "Knowledge Sharer",
    description: "Upload 10 documents",
    icon: "📚",
    category: "documents",
    requirement: { type: "document_uploads", value: 10 },
    xpReward: 200,
  },

  // Level Achievements
  level_5: {
    id: "level_5",
    title: "Rising Star",
    description: "Reach Level 5",
    icon: "⭐",
    category: "level",
    requirement: { type: "level", value: 5 },
    xpReward: 0, // No XP (already at level)
  },
  level_10: {
    id: "level_10",
    title: "Elite Member",
    description: "Reach Level 10",
    icon: "💎",
    category: "level",
    requirement: { type: "level", value: 10 },
    xpReward: 0,
  },
} as const;

// Check and award achievements for a user
export const checkAchievements = internalMutation({
  args: {
    userId: v.id("users"),
    activityType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Get user's current achievements
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const unlockedIds = userAchievements.map((a) => a.achievementId);

    // Get user stats
    const taskCount = await getCompletedTaskCount(ctx, args.userId);
    const eventCount = await getEventAttendanceCount(ctx, args.userId);
    const helpCount = await getHelpfulActionsCount(ctx, args.userId);
    const documentCount = await getDocumentUploadCount(ctx, args.userId);
    const milestoneCount = await getMilestoneCompletionCount(ctx, args.userId);
    const loginStreak = user.loginStreak || 0;
    const level = user.level || 1;

    // Check each achievement
    const newUnlocks = [];

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (unlockedIds.includes(achievement.id)) continue; // Already unlocked

      let qualified = false;

      switch (achievement.requirement.type) {
        case "task_count":
          qualified = taskCount >= achievement.requirement.value;
          break;
        case "event_attendance":
          qualified = eventCount >= achievement.requirement.value;
          break;
        case "help_teammates":
          qualified = helpCount >= achievement.requirement.value;
          break;
        case "login_streak":
          qualified = loginStreak >= achievement.requirement.value;
          break;
        case "milestone_count":
          qualified = milestoneCount >= achievement.requirement.value;
          break;
        case "document_uploads":
          qualified = documentCount >= achievement.requirement.value;
          break;
        case "level":
          qualified = level >= achievement.requirement.value;
          break;
        case "early_completion":
          // Special case - need to track early completions
          const earlyCount = await getEarlyCompletionCount(ctx, args.userId);
          qualified = earlyCount >= achievement.requirement.value;
          break;
      }

      if (qualified) {
        // Award achievement
        await ctx.db.insert("userAchievements", {
          userId: args.userId,
          achievementId: achievement.id,
          unlockedAt: Date.now(),
        });

        // Award XP if applicable
        if (achievement.xpReward > 0) {
          const newXP = (user.xp || 0) + achievement.xpReward;
          await ctx.db.patch(args.userId, {
            xp: newXP,
            level: calculateLevel(newXP),
          });
        }

        // Create notification
        await ctx.db.insert("notifications", {
          userId: args.userId,
          type: "achievement_unlocked",
          title: `Achievement Unlocked: ${achievement.title}!`,
          message: `${achievement.icon} ${achievement.description}${achievement.xpReward > 0 ? ` (+${achievement.xpReward} XP)` : ""}`,
          priority: "normal",
          isRead: false,
          metadata: {
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            achievementIcon: achievement.icon,
            xpReward: achievement.xpReward,
          },
          createdAt: Date.now(),
        });

        newUnlocks.push(achievement);
      }
    }

    return { newUnlocks: newUnlocks.length, achievements: newUnlocks };
  },
});

// Get user's achievements
export const getUserAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const unlockedIds = userAchievements.map((a) => a.achievementId);

    // Return all achievements with unlock status
    return Object.values(ACHIEVEMENTS).map((achievement) => ({
      ...achievement,
      unlocked: unlockedIds.includes(achievement.id),
      unlockedAt: userAchievements.find((a) => a.achievementId === achievement.id)?.unlockedAt,
    }));
  },
});

// Get achievement statistics
export const getAchievementStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = userAchievements.length;
    const percentage = Math.round((unlockedCount / totalAchievements) * 100);

    // Count by category
    const byCategory: Record<string, { unlocked: number; total: number }> = {};
    
    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      if (!byCategory[achievement.category]) {
        byCategory[achievement.category] = { unlocked: 0, total: 0 };
      }
      byCategory[achievement.category].total++;
      
      if (userAchievements.some((a) => a.achievementId === achievement.id)) {
        byCategory[achievement.category].unlocked++;
      }
    });

    return {
      total: totalAchievements,
      unlocked: unlockedCount,
      locked: totalAchievements - unlockedCount,
      percentage,
      byCategory,
    };
  },
});

// Helper functions to get user stats
async function getCompletedTaskCount(ctx: any, userId: Id<"users">): Promise<number> {
  const activities = await ctx.db
    .query("userActivityLogs")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("action"), "task_completed"))
    .collect();
  return activities.length;
}

async function getEventAttendanceCount(ctx: any, userId: Id<"users">): Promise<number> {
  const activities = await ctx.db
    .query("userActivityLogs")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("action"), "event_checkin"))
    .collect();
  return activities.length;
}

async function getHelpfulActionsCount(ctx: any, userId: Id<"users">): Promise<number> {
  const activities = await ctx.db
    .query("userActivityLogs")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("action"), "helpful_comment"))
    .collect();
  return activities.length;
}

async function getDocumentUploadCount(ctx: any, userId: Id<"users">): Promise<number> {
  const activities = await ctx.db
    .query("userActivityLogs")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("action"), "document_uploaded"))
    .collect();
  return activities.length;
}

async function getMilestoneCompletionCount(ctx: any, userId: Id<"users">): Promise<number> {
  const activities = await ctx.db
    .query("userActivityLogs")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("action"), "milestone_completed"))
    .collect();
  return activities.length;
}

async function getEarlyCompletionCount(ctx: any, userId: Id<"users">): Promise<number> {
  // Count tasks completed before due date
  const tasks = await ctx.db
    .query("tasks")
    .filter((q: any) => 
      q.and(
        q.eq(q.field("completed"), true),
        q.eq(q.field("createdBy"), userId)
      )
    )
    .collect();

  return tasks.filter((task: any) => {
    if (!task.dueDate || !task.completedAt) return false;
    return task.completedAt < task.dueDate;
  }).length;
}

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
  return 10 + Math.floor((xp - 5500) / 1000);
}
