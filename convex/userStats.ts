import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * User Statistics Tracking
 * Makes totalHoursLogged, totalTasksCompleted, streakCount, projectSuccessRate functional
 */

/**
 * Update total tasks completed when a task is marked as done
 */
export const incrementTasksCompleted = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    await ctx.db.patch(args.userId, {
      totalTasksCompleted: ((user as any).totalTasksCompleted || 0) + 1,
    });
  },
});

/**
 * Update total hours logged when work time is tracked
 */
export const addHoursLogged = internalMutation({
  args: {
    userId: v.id("users"),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    await ctx.db.patch(args.userId, {
      totalHoursLogged: ((user as any).totalHoursLogged || 0) + args.hours,
    });
  },
});

/**
 * Update streak count when user completes daily tasks
 */
export const updateStreak = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const now = Date.now();
    const lastActiveDate = (user as any).lastActiveDate || 0;
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Check if user was active yesterday or today
    const daysSinceActive = Math.floor((now - lastActiveDate) / oneDay);
    
    let newStreak = (user as any).streakCount || 0;
    
    if (daysSinceActive <= 1) {
      // Continue streak
      newStreak += 1;
    } else {
      // Reset streak
      newStreak = 1;
    }

    await ctx.db.patch(args.userId, {
      streakCount: newStreak,
      lastActiveDate: now,
    });
  },
});

/**
 * Calculate and update project success rate
 */
export const updateProjectSuccessRate = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all projects where user is assigned - OPTIMIZED
    const allProjects = await ctx.db.query("projects").take(500); // Limit to 500 projects
    const userProjects = allProjects.filter((p: any) => 
      p.assignedTo?.includes(args.userId) || p.createdBy === args.userId
    );

    if (userProjects.length === 0) {
      await ctx.db.patch(args.userId, {
        projectSuccessRate: 0,
      });
      return;
    }

    // Count completed vs total
    const completedProjects = userProjects.filter((p: any) => p.status === "completed");
    const successRate = (completedProjects.length / userProjects.length) * 100;

    await ctx.db.patch(args.userId, {
      projectSuccessRate: Math.round(successRate),
    });
  },
});

/**
 * Get user statistics
 */
export const getUserStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      totalTasksCompleted: (user as any).totalTasksCompleted || 0,
      totalHoursLogged: (user as any).totalHoursLogged || 0,
      streakCount: (user as any).streakCount || 0,
      projectSuccessRate: (user as any).projectSuccessRate || 0,
      level: (user as any).level || 1,
      experience: (user as any).experience || 0,
      gold: (user as any).gold || 0,
    };
  },
});

/**
 * Recalculate all stats for a user (manual refresh)
 */
export const recalculateUserStats = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // 1. Calculate total tasks completed - OPTIMIZED
    const allTasks = await ctx.db.query("tasks").take(1000); // Limit to 1000 tasks
    const completedTasks = allTasks.filter((t: any) => 
      t.completed && 
      (t.assignedTo?.includes(args.userId) || t.createdBy === args.userId)
    );

    // 2. Calculate total hours from work sessions - OPTIMIZED
    const allSessions = await ctx.db.query("userSessions").take(500); // Limit to 500 sessions
    const userSessions = allSessions.filter((s: any) => s.userId === args.userId);
    
    let totalHours = 0;
    for (const session of userSessions) {
      if ((session as any).logoutTime) {
        const hours = ((session as any).logoutTime - (session as any).loginTime) / (1000 * 60 * 60);
        totalHours += hours;
      }
    }

    // 3. Calculate project success rate - OPTIMIZED
    const allProjects = await ctx.db.query("projects").take(500); // Limit to 500 projects
    const userProjects = allProjects.filter((p: any) => 
      p.assignedTo?.includes(args.userId) || p.createdBy === args.userId
    );
    const completedProjects = userProjects.filter((p: any) => p.status === "completed");
    const successRate = userProjects.length > 0 
      ? (completedProjects.length / userProjects.length) * 100 
      : 0;

    // Update all stats
    await ctx.db.patch(args.userId, {
      totalTasksCompleted: completedTasks.length,
      totalHoursLogged: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      projectSuccessRate: Math.round(successRate),
    });

    return {
      success: true,
      stats: {
        totalTasksCompleted: completedTasks.length,
        totalHoursLogged: Math.round(totalHours * 10) / 10,
        projectSuccessRate: Math.round(successRate),
      },
    };
  },
});

/**
 * Recalculate stats for ALL users (internal - no auth required for initial setup)
 */
export const recalculateAllUserStatsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allUsers = await ctx.db.query("users").take(100); // OPTIMIZED: Only 100 users at a time
    let updatedCount = 0;

    // OPTIMIZED: Load data ONCE instead of per-user loop
    const allTasks = await ctx.db.query("tasks").take(1000);
    const allProjects = await ctx.db.query("projects").take(500);

    for (const user of allUsers) {
      try {
        // Calculate tasks completed
        const completedTasks = allTasks.filter((t: any) => 
          t.completed && 
          (t.assignedTo?.includes(user._id) || t.createdBy === user._id)
        );

        // Calculate project success rate
        const userProjects = allProjects.filter((p: any) => 
          p.assignedTo?.includes(user._id) || p.createdBy === user._id
        );
        const completedProjects = userProjects.filter((p: any) => p.status === "completed");
        const successRate = userProjects.length > 0 
          ? (completedProjects.length / userProjects.length) * 100 
          : 0;

        await ctx.db.patch(user._id, {
          totalTasksCompleted: completedTasks.length,
          projectSuccessRate: Math.round(successRate),
        });

        updatedCount++;
      } catch (error) {
        console.error(`Failed to update stats for user ${user._id}:`, error);
      }
    }

    return {
      success: true,
      message: `Successfully recalculated stats for ${updatedCount} users`,
      updatedCount,
      totalUsers: allUsers.length,
    };
  },
});

/**
 * Recalculate stats for ALL users (admin function with auth)
 */
export const recalculateAllUserStats = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser || (currentUser as any).role !== "admin") {
      throw new Error("Only admins can recalculate all user stats");
    }

    const allUsers = await ctx.db.query("users").take(100); // OPTIMIZED: Only 100 users at a time
    let updatedCount = 0;

    // OPTIMIZED: Load data ONCE instead of per-user loop
    const allTasks = await ctx.db.query("tasks").take(1000);
    const allProjects = await ctx.db.query("projects").take(500);

    for (const user of allUsers) {
      try {
        // Calculate tasks completed
        const completedTasks = allTasks.filter((t: any) => 
          t.completed && 
          (t.assignedTo?.includes(user._id) || t.createdBy === user._id)
        );

        // Calculate project success rate
        const userProjects = allProjects.filter((p: any) => 
          p.assignedTo?.includes(user._id) || p.createdBy === user._id
        );
        const completedProjects = userProjects.filter((p: any) => p.status === "completed");
        const successRate = userProjects.length > 0 
          ? (completedProjects.length / userProjects.length) * 100 
          : 0;

        await ctx.db.patch(user._id, {
          totalTasksCompleted: completedTasks.length,
          projectSuccessRate: Math.round(successRate),
        });

        updatedCount++;
      } catch (error) {
        console.error(`Failed to update stats for user ${user._id}:`, error);
      }
    }

    return {
      success: true,
      message: `Successfully recalculated stats for ${updatedCount} users`,
      updatedCount,
      totalUsers: allUsers.length,
    };
  },
});
