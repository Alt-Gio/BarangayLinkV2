import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all active users for collaboration
export const getActiveUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get user levels for each user
    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          _id: user._id,
          clerkId: user.clerkId,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          department: user.department,
          position: user.position,
          level: user.level,
          experience: user.experience,
          gold: user.gold,
          userLevel: userLevel ? {
            name: userLevel.name,
            level: userLevel.level,
            permissions: userLevel.permissions
          } : null,
          lastActiveDate: user.lastActiveDate,
          isActive: user.isActive
        };
      })
    );

    return usersWithLevels.sort((a, b) => {
      // Sort by user level (higher level first), then by name
      const levelDiff = (b.userLevel?.level || 0) - (a.userLevel?.level || 0);
      if (levelDiff !== 0) return levelDiff;
      return a.name.localeCompare(b.name);
    });
  },
});

// Get user by Clerk ID for collaboration
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) return null;

    const userLevel = await ctx.db.get(user.userLevel);
    
    return {
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      department: user.department,
      position: user.position,
      level: user.level,
      experience: user.experience,
      gold: user.gold,
      userLevel: userLevel ? {
        name: userLevel.name,
        level: userLevel.level,
        permissions: userLevel.permissions
      } : null,
      lastActiveDate: user.lastActiveDate,
      isActive: user.isActive
    };
  },
});

// Get team members by department
export const getTeamByDepartment = query({
  args: { department: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("users").filter((q) => q.eq(q.field("isActive"), true));
    
    if (args.department) {
      query = query.filter((q) => q.eq(q.field("department"), args.department));
    }
    
    const users = await query.collect();

    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          _id: user._id,
          clerkId: user.clerkId,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          department: user.department,
          position: user.position,
          level: user.level,
          experience: user.experience,
          gold: user.gold,
          userLevel: userLevel ? {
            name: userLevel.name,
            level: userLevel.level,
            permissions: userLevel.permissions
          } : null,
          lastActiveDate: user.lastActiveDate,
          isActive: user.isActive
        };
      })
    );

    return usersWithLevels.sort((a, b) => {
      const levelDiff = (b.userLevel?.level || 0) - (a.userLevel?.level || 0);
      if (levelDiff !== 0) return levelDiff;
      return a.name.localeCompare(b.name);
    });
  },
});

// Get online status and recent activity
export const getUserActivity = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the most recent active session
    const recentSession = await ctx.db
      .query("userSessions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .first();

    // Get recent activity logs
    const recentActivity = await ctx.db
      .query("userActivityLogs")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(5);

    return {
      recentSession,
      recentActivity,
      isOnline: recentSession?.isActive || false,
      lastSeen: recentSession?.loginTime || null
    };
  },
});
