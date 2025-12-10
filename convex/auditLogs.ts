import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllLogs = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    return logs;
  },
});

export const getLogsByEntity = query({
  args: {
    entity: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_entity", (q) => 
        q.eq("entity", args.entity).eq("entityId", args.entityId)
      )
      .order("desc")
      .take(limit);
    
    return logs;
  },
});

export const getLogsByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    return logs;
  },
});

// Get logs by action type
export const getLogsByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .order("desc")
      .take(limit);
    
    return logs;
  },
});

// Search logs
export const searchLogs = query({
  args: {
    searchTerm: v.optional(v.string()),
    entity: v.optional(v.string()),
    action: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 200);
    
    // Filter by entity
    if (args.entity) {
      logs = logs.filter((log) => log.entity === args.entity);
    }
    
    // Filter by action
    if (args.action) {
      logs = logs.filter((log) => log.action === args.action);
    }
    
    // Filter by user
    if (args.userId) {
      logs = logs.filter((log) => log.userId === args.userId);
    }
    
    // Filter by date range
    if (args.startDate) {
      logs = logs.filter((log) => log.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      logs = logs.filter((log) => log.timestamp <= args.endDate!);
    }
    
    // Filter by search term
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      logs = logs.filter(
        (log) =>
          (log.description && log.description.toLowerCase().includes(term)) ||
          (log.userName && log.userName.toLowerCase().includes(term)) ||
          (log.entityId && log.entityId.toLowerCase().includes(term))
      );
    }
    
    return logs;
  },
});

// Get audit statistics
export const getAuditStats = query({
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(1000); // Last 1000 logs
    
    const totalLogs = logs.length;
    
    // Count by action
    const byAction: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.action) {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
      }
    });
    
    // Count by entity
    const byEntity: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.entity) {
        byEntity[log.entity] = (byEntity[log.entity] || 0) + 1;
      }
    });
    
    // Count by user
    const byUser: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.userName) {
        byUser[log.userName] = (byUser[log.userName] || 0) + 1;
      }
    });
    
    // Activity by day (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter((log) => log.timestamp >= sevenDaysAgo);
    
    return {
      totalLogs,
      recentLogs: recentLogs.length,
      byAction,
      byEntity,
      byUser,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create audit log
export const createLog = mutation({
  args: {
    action: v.string(),
    entity: v.optional(v.string()),
    entityId: v.optional(v.string()),
    description: v.string(),
    changes: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // For system actions, log without user - use a placeholder user ID
      // Note: In production, you might want to create a system user
      return { success: false, error: "Not authenticated" };
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");
    
    await ctx.db.insert("auditLogs", {
      action: args.action,
      entity: args.entity,
      entityId: args.entityId,
      userId: user._id,
      userName: user.name,
      userRole: user.role || "user",
      description: args.description,
      changes: args.changes,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: Date.now(),
    });
    
    return { success: true };
  },
});

// Bulk create audit logs
export const createBulkLogs = mutation({
  args: {
    logs: v.array(
      v.object({
        action: v.string(),
        entity: v.optional(v.string()),
        entityId: v.optional(v.string()),
        description: v.string(),
        changes: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");
    
    for (const log of args.logs) {
      await ctx.db.insert("auditLogs", {
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userId: user._id,
        userName: user.name,
        userRole: user.role || "user",
        description: log.description,
        changes: log.changes,
        timestamp: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Delete old logs (cleanup)
export const deleteOldLogs = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;
    
    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();
    
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }
    
    return { deleted: oldLogs.length };
  },
});
