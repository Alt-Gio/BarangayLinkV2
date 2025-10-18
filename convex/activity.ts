import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Set current activity for a user (with duration tracking like event timers)
export const setCurrentActivity = mutation({
  args: {
    activityType: v.union(
      v.literal("task"),
      v.literal("project"),
      v.literal("none")
    ),
    activityId: v.optional(v.string()),
    activityName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const metadata = (user.metadata as any) || {};
    const previousActivity = metadata.currentActivity;

    // If switching from an activity, log the duration
    if (previousActivity && previousActivity.type !== 'none' && previousActivity.startedAt) {
      const duration = Math.floor((now - previousActivity.startedAt) / 1000 / 60); // minutes
      
      // Check for achievements based on duration
      await checkDurationAchievements(ctx, user._id, duration, previousActivity.type);
    }

    // Update user metadata with current activity
    await ctx.db.patch(user._id, {
      metadata: {
        ...metadata,
        currentActivity: {
          type: args.activityType,
          id: args.activityId,
          name: args.activityName,
          startedAt: args.activityType !== 'none' ? now : undefined,
        },
      } as any,
    });

    return { success: true };
  },
});

// Get current user's activity
export const getCurrentActivity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return null;

    return (user.metadata as any)?.currentActivity || null;
  },
});

// Get recent achievements/milestones for a user (using gamification records)
export const getRecentAchievements = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let targetUserId = args.userId;
    
    if (!targetUserId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), identity.subject))
        .first();
      
      if (!user) return [];
      targetUserId = user._id;
    }

    const user = await ctx.db.get(targetUserId);
    if (!user) return [];

    const metadata = (user.metadata as any) || {};
    const stats = metadata.activityStats || {};
    const achievements = [];

    // LEVEL-BASED ACHIEVEMENTS
    if (user.level && user.level >= 2) {
      achievements.push({ _id: "level2" as any, title: `Level ${user.level}`, icon: "⭐", points: user.level * 50, createdAt: Date.now(), category: 'level' });
    }

    // EXPERIENCE-BASED ACHIEVEMENTS
    if (user.experience) {
      if (user.experience >= 500) {
        achievements.push({ _id: "exp500" as any, title: "500 XP Master", icon: "💎", points: 250, createdAt: Date.now(), category: 'experience' });
      } else if (user.experience >= 100) {
        achievements.push({ _id: "exp100" as any, title: "100 XP Earned", icon: "🏆", points: 100, createdAt: Date.now(), category: 'experience' });
      }
    }

    // TIME-BASED ACHIEVEMENTS (from activity tracking)
    if (stats.totalMinutes >= 600) {
      achievements.push({ _id: "hours10" as any, title: "10 Hours Master", icon: "💎", points: 500, createdAt: Date.now(), category: 'time' });
    } else if (stats.totalMinutes >= 300) {
      achievements.push({ _id: "hours5" as any, title: "5 Hour Champion", icon: "🏅", points: 300, createdAt: Date.now(), category: 'time' });
    } else if (stats.totalMinutes >= 60) {
      achievements.push({ _id: "hour1" as any, title: "First Hour", icon: "⏰", points: 100, createdAt: Date.now(), category: 'time' });
    }

    // SESSION-BASED ACHIEVEMENTS
    if (stats.sessionsCount >= 50) {
      achievements.push({ _id: "sessions50" as any, title: "50 Sessions!", icon: "🎖️", points: 300, createdAt: Date.now(), category: 'sessions' });
    } else if (stats.sessionsCount >= 10) {
      achievements.push({ _id: "sessions10" as any, title: "10 Sessions", icon: "🎯", points: 100, createdAt: Date.now(), category: 'sessions' });
    }

    // FOCUS ACHIEVEMENTS
    if (stats.longestSession >= 180) {
      achievements.push({ _id: "marathon3h" as any, title: "3 Hour Marathon!", icon: "🏃‍♂️", points: 400, createdAt: Date.now(), category: 'focus' });
    } else if (stats.longestSession >= 120) {
      achievements.push({ _id: "marathon2h" as any, title: "2 Hour Marathon", icon: "🏃", points: 200, createdAt: Date.now(), category: 'focus' });
    }

    // STREAK ACHIEVEMENTS (if you have streak data)
    if (metadata.currentStreak >= 7) {
      achievements.push({ _id: "streak7" as any, title: "7 Day Streak!", icon: "🔥", points: 350, createdAt: Date.now(), category: 'streak' });
    } else if (metadata.currentStreak >= 3) {
      achievements.push({ _id: "streak3" as any, title: "3 Day Streak", icon: "🔥", points: 150, createdAt: Date.now(), category: 'streak' });
    }

    // SPECIALTY ACHIEVEMENTS
    if (stats.taskMinutes >= 300) {
      achievements.push({ _id: "taskmaster" as any, title: "Task Master", icon: "📋", points: 250, createdAt: Date.now(), category: 'specialty' });
    }
    if (stats.projectMinutes >= 300) {
      achievements.push({ _id: "projectpro" as any, title: "Project Pro", icon: "📊", points: 250, createdAt: Date.now(), category: 'specialty' });
    }

    // Sort by points (highest first) and return limited amount
    return achievements
      .sort((a, b) => b.points - a.points)
      .slice(0, args.limit || 3);
  },
});

// Helper function to check and award duration-based achievements
async function checkDurationAchievements(ctx: any, userId: any, durationMinutes: number, activityType: string) {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const metadata = (user.metadata as any) || {};
  const stats = metadata.activityStats || {
    totalMinutes: 0,
    taskMinutes: 0,
    projectMinutes: 0,
    sessionsCount: 0,
    longestSession: 0,
  };

  // Update stats
  stats.totalMinutes += durationMinutes;
  stats.sessionsCount += 1;
  if (activityType === 'task') stats.taskMinutes += durationMinutes;
  if (activityType === 'project') stats.projectMinutes += durationMinutes;
  if (durationMinutes > stats.longestSession) stats.longestSession = durationMinutes;

  // Update user metadata with new stats
  await ctx.db.patch(userId, {
    metadata: {
      ...metadata,
      activityStats: stats,
    } as any,
  });

  // Check for milestone achievements (these could trigger notifications)
  const achievements = [];
  if (stats.totalMinutes >= 60 && stats.totalMinutes < 65) {
    achievements.push({ type: 'first_hour', title: '1 Hour Focused!', icon: '⏰' });
  }
  if (stats.totalMinutes >= 300 && stats.totalMinutes < 310) {
    achievements.push({ type: 'five_hours', title: '5 Hours Champion!', icon: '🏅' });
  }
  if (stats.totalMinutes >= 600 && stats.totalMinutes < 610) {
    achievements.push({ type: 'ten_hours', title: '10 Hours Master!', icon: '💎' });
  }
  if (stats.sessionsCount === 10) {
    achievements.push({ type: 'ten_sessions', title: '10 Sessions!', icon: '🎯' });
  }
  if (stats.longestSession >= 120) {
    achievements.push({ type: 'marathon', title: '2 Hour Marathon!', icon: '🏃' });
  }

  return achievements;
}

// Get activity statistics for a user
export const getActivityStats = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    let targetUserId = args.userId;
    if (!targetUserId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), identity.subject))
        .first();
      if (!user) return null;
      targetUserId = user._id;
    }

    const user = await ctx.db.get(targetUserId);
    if (!user) return null;

    const metadata = (user.metadata as any) || {};
    const stats = metadata.activityStats || {
      totalMinutes: 0,
      taskMinutes: 0,
      projectMinutes: 0,
      sessionsCount: 0,
      longestSession: 0,
    };

    return {
      totalHours: Math.floor(stats.totalMinutes / 60),
      totalMinutes: stats.totalMinutes,
      taskHours: Math.floor(stats.taskMinutes / 60),
      projectHours: Math.floor(stats.projectMinutes / 60),
      sessionsCount: stats.sessionsCount,
      longestSessionMinutes: stats.longestSession,
      averageSessionMinutes: stats.sessionsCount > 0 ? Math.floor(stats.totalMinutes / stats.sessionsCount) : 0,
    };
  },
});

// Helper function to get icon for action type
function getActionIcon(action: string): string {
  if (action.includes('task') || action.includes('Task')) return '📋';
  if (action.includes('project') || action.includes('Project')) return '📊';
  if (action.includes('comment') || action.includes('Comment')) return '💬';
  if (action.includes('message') || action.includes('Message')) return '✉️';
  if (action.includes('level') || action.includes('Level')) return '⭐';
  if (action.includes('streak') || action.includes('Streak')) return '🔥';
  if (action.includes('hour') || action.includes('Hour')) return '⏰';
  if (action.includes('session') || action.includes('Session')) return '🎯';
  if (action.includes('marathon') || action.includes('Marathon')) return '🏃';
  if (action.includes('champion') || action.includes('Champion')) return '🏅';
  if (action.includes('master') || action.includes('Master')) return '💎';
  return '🏆';
}
