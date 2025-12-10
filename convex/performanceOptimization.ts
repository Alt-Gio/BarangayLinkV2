import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getLogStatistics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    const isAdmin = currentUser.role === "admin" || currentUser.role === "captain";
    const hasPermission = userLevel?.permissions.includes("system:manage");
    
    if (!isAdmin && !hasPermission) {
      throw new Error("Insufficient permissions - Admin or Captain access required");
    }

    const userActivityLogs = await ctx.db.query("userActivityLogs").take(10000);
    const userSessions = await ctx.db.query("userSessions").take(5000);
    const auditLogs = await ctx.db.query("auditLogs").take(5000);
    const projectActivities = await ctx.db.query("projectActivities").take(10000);
    const searchHistory = await ctx.db.query("searchHistory").take(5000);
    const messageSyncLog = await ctx.db.query("messageSyncLog").take(5000);

    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    const oldUserActivityLogs = userActivityLogs.filter(log => log.timestamp < thirtyDaysAgo).length;
    const veryOldUserActivityLogs = userActivityLogs.filter(log => log.timestamp < sixtyDaysAgo).length;
    const oldAuditLogs = auditLogs.filter(log => log.timestamp < sixtyDaysAgo).length;
    const oldProjectActivities = projectActivities.filter(log => log.timestamp < sixtyDaysAgo).length;
    const oldSearchHistory = searchHistory.filter(log => log.timestamp < sixtyDaysAgo).length;

    return {
      userActivityLogs: {
        total: userActivityLogs.length,
        olderThan30Days: oldUserActivityLogs,
        olderThan60Days: veryOldUserActivityLogs,
      },
      userSessions: {
        total: userSessions.length,
        active: userSessions.filter(s => s.isActive).length,
        inactive: userSessions.filter(s => !s.isActive).length,
      },
      auditLogs: {
        total: auditLogs.length,
        olderThan60Days: oldAuditLogs,
      },
      projectActivities: {
        total: projectActivities.length,
        olderThan60Days: oldProjectActivities,
      },
      searchHistory: {
        total: searchHistory.length,
        olderThan60Days: oldSearchHistory,
      },
      messageSyncLog: {
        total: messageSyncLog.length,
      },
      recommendations: getRecommendations(
        userActivityLogs.length,
        oldUserActivityLogs,
        auditLogs.length,
        projectActivities.length
      ),
    };
  },
});

function getRecommendations(
  totalActivityLogs: number,
  oldActivityLogs: number,
  totalAuditLogs: number,
  totalProjectActivities: number
) {
  const recommendations = [];

  if (totalActivityLogs > 10000) {
    recommendations.push({
      severity: "high",
      message: `${totalActivityLogs.toLocaleString()} activity logs found (${oldActivityLogs.toLocaleString()} older than 30 days)`,
      action: "Clean up old activity logs immediately",
      impact: "Major performance improvement expected",
    });
  } else if (totalActivityLogs > 5000) {
    recommendations.push({
      severity: "medium",
      message: `${totalActivityLogs.toLocaleString()} activity logs found`,
      action: "Consider cleaning up old logs",
      impact: "Moderate performance improvement",
    });
  }

  if (totalAuditLogs > 20000) {
    recommendations.push({
      severity: "high",
      message: `${totalAuditLogs.toLocaleString()} audit logs found`,
      action: "Archive old audit logs",
      impact: "Improved query performance",
    });
  }

  if (totalProjectActivities > 10000) {
    recommendations.push({
      severity: "medium",
      message: `${totalProjectActivities.toLocaleString()} project activities found`,
      action: "Archive old project activities",
      impact: "Faster project page loading",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      severity: "low",
      message: "System performance is healthy",
      action: "No immediate action needed",
      impact: "Continue monitoring",
    });
  }

  return recommendations;
}

// Clean up old activity logs (older than X days)
export const cleanupOldActivityLogs = mutation({
  args: {
    daysToKeep: v.optional(v.number()), // Default: 30 days
    dryRun: v.optional(v.boolean()), // If true, just count without deleting
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    const isAdmin = currentUser.role === "admin" || currentUser.role === "captain";
    const hasPermission = userLevel?.permissions.includes("system:manage");
    
    if (!isAdmin && !hasPermission) {
      throw new Error("Insufficient permissions - Admin or Captain access required");
    }

    const daysToKeep = args.daysToKeep || 30;
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const isDryRun = args.dryRun || false;

    // Get old activity logs
    const oldLogs = await ctx.db
      .query("userActivityLogs")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    if (isDryRun) {
      return {
        success: true,
        dryRun: true,
        message: `Found ${oldLogs.length} activity logs older than ${daysToKeep} days`,
        count: oldLogs.length,
      };
    }

    // Delete in batches (Convex limits)
    let deleted = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deleted++;
      
      // Batch limit safety
      if (deleted >= 1000) break;
    }

    return {
      success: true,
      dryRun: false,
      message: `Deleted ${deleted} activity logs older than ${daysToKeep} days`,
      deleted,
      remaining: Math.max(0, oldLogs.length - deleted),
    };
  },
});

// Clean up old search history
export const cleanupOldSearchHistory = mutation({
  args: {
    daysToKeep: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    const isAdmin = currentUser.role === "admin" || currentUser.role === "captain";
    const hasPermission = userLevel?.permissions.includes("system:manage");
    
    if (!isAdmin && !hasPermission) {
      throw new Error("Insufficient permissions - Admin or Captain access required");
    }

    const daysToKeep = args.daysToKeep || 60;
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const isDryRun = args.dryRun || false;

    const oldSearches = await ctx.db
      .query("searchHistory")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    if (isDryRun) {
      return {
        success: true,
        dryRun: true,
        message: `Found ${oldSearches.length} search records older than ${daysToKeep} days`,
        count: oldSearches.length,
      };
    }

    let deleted = 0;
    for (const search of oldSearches) {
      await ctx.db.delete(search._id);
      deleted++;
      if (deleted >= 1000) break;
    }

    return {
      success: true,
      dryRun: false,
      message: `Deleted ${deleted} search records older than ${daysToKeep} days`,
      deleted,
      remaining: Math.max(0, oldSearches.length - deleted),
    };
  },
});

// Clean up old project activities
export const cleanupOldProjectActivities = mutation({
  args: {
    daysToKeep: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    const isAdmin = currentUser.role === "admin" || currentUser.role === "captain";
    const hasPermission = userLevel?.permissions.includes("system:manage");
    
    if (!isAdmin && !hasPermission) {
      throw new Error("Insufficient permissions - Admin or Captain access required");
    }

    const daysToKeep = args.daysToKeep || 90; // Keep project activities longer
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const isDryRun = args.dryRun || false;

    const oldActivities = await ctx.db
      .query("projectActivities")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    if (isDryRun) {
      return {
        success: true,
        dryRun: true,
        message: `Found ${oldActivities.length} project activities older than ${daysToKeep} days`,
        count: oldActivities.length,
      };
    }

    let deleted = 0;
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
      deleted++;
      if (deleted >= 1000) break;
    }

    return {
      success: true,
      dryRun: false,
      message: `Deleted ${deleted} project activities older than ${daysToKeep} days`,
      deleted,
      remaining: Math.max(0, oldActivities.length - deleted),
    };
  },
});

// Clean up inactive sessions (older than 7 days)
export const cleanupInactiveSessions = mutation({
  args: {
    daysToKeep: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    const isAdmin = currentUser.role === "admin" || currentUser.role === "captain";
    const hasPermission = userLevel?.permissions.includes("system:manage");
    
    if (!isAdmin && !hasPermission) {
      throw new Error("Insufficient permissions - Admin or Captain access required");
    }

    const daysToKeep = args.daysToKeep || 7;
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const isDryRun = args.dryRun || false;

    const oldSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .filter((q) => q.lt(q.field("loginTime"), cutoffDate))
      .collect();

    if (isDryRun) {
      return {
        success: true,
        dryRun: true,
        message: `Found ${oldSessions.length} inactive sessions older than ${daysToKeep} days`,
        count: oldSessions.length,
      };
    }

    let deleted = 0;
    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
      deleted++;
      if (deleted >= 1000) break;
    }

    return {
      success: true,
      dryRun: false,
      message: `Deleted ${deleted} inactive sessions older than ${daysToKeep} days`,
      deleted,
      remaining: Math.max(0, oldSessions.length - deleted),
    };
  },
});

// One-click optimization (runs all cleanup tasks)
export const optimizeSystem = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    const isAdmin = currentUser.role === "admin" || currentUser.role === "captain";
    const hasPermission = userLevel?.permissions.includes("system:manage");
    
    if (!isAdmin && !hasPermission) {
      throw new Error("Insufficient permissions - Admin or Captain access required");
    }

    const isDryRun = args.dryRun || false;

    // Run all cleanup tasks
    const results = {
      activityLogs: { deleted: 0, remaining: 0 },
      searchHistory: { deleted: 0, remaining: 0 },
      projectActivities: { deleted: 0, remaining: 0 },
      inactiveSessions: { deleted: 0, remaining: 0 },
      totalDeleted: 0,
    };

    // Activity logs (keep 30 days) - OPTIMIZED: Only fetch 500 records at a time
    const cutoff30 = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const oldActivityLogs = await ctx.db
      .query("userActivityLogs")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff30))
      .take(500); // Only fetch 500 instead of collecting all

    if (!isDryRun) {
      let count = 0;
      for (const log of oldActivityLogs) {
        await ctx.db.delete(log._id);
        count++;
      }
      results.activityLogs.deleted = count;
      results.activityLogs.remaining = oldActivityLogs.length - count;
      results.totalDeleted += count;
    } else {
      results.activityLogs.deleted = 0;
      results.activityLogs.remaining = oldActivityLogs.length;
    }

    // Search history (keep 60 days) - OPTIMIZED
    const cutoff60 = Date.now() - (60 * 24 * 60 * 60 * 1000);
    const oldSearches = await ctx.db
      .query("searchHistory")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff60))
      .take(300); // Only fetch 300

    if (!isDryRun) {
      let count = 0;
      for (const search of oldSearches) {
        await ctx.db.delete(search._id);
        count++;
      }
      results.searchHistory.deleted = count;
      results.searchHistory.remaining = oldSearches.length - count;
      results.totalDeleted += count;
    } else {
      results.searchHistory.deleted = 0;
      results.searchHistory.remaining = oldSearches.length;
    }

    // Project activities (keep 90 days) - OPTIMIZED
    const cutoff90 = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const oldActivities = await ctx.db
      .query("projectActivities")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff90))
      .take(300); // Only fetch 300

    if (!isDryRun) {
      let count = 0;
      for (const activity of oldActivities) {
        await ctx.db.delete(activity._id);
        count++;
      }
      results.projectActivities.deleted = count;
      results.projectActivities.remaining = oldActivities.length - count;
      results.totalDeleted += count;
    } else {
      results.projectActivities.deleted = 0;
      results.projectActivities.remaining = oldActivities.length;
    }

    // Inactive sessions (keep 7 days) - OPTIMIZED
    const cutoff7 = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const oldSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .filter((q) => q.lt(q.field("loginTime"), cutoff7))
      .take(200); // Only fetch 200

    if (!isDryRun) {
      let count = 0;
      for (const session of oldSessions) {
        await ctx.db.delete(session._id);
        count++;
      }
      results.inactiveSessions.deleted = count;
      results.inactiveSessions.remaining = oldSessions.length - count;
      results.totalDeleted += count;
    } else {
      results.inactiveSessions.deleted = 0;
      results.inactiveSessions.remaining = oldSessions.length;
    }

    return {
      success: true,
      dryRun: isDryRun,
      message: isDryRun 
        ? `Would delete ${oldActivityLogs.length + oldSearches.length + oldActivities.length + oldSessions.length} total records`
        : `Deleted ${results.totalDeleted} records successfully`,
      results,
    };
  },
});
