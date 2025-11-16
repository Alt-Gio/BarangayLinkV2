/**
 * OPTIMIZED AUDIT SYSTEM
 * 
 * This replaces the old userSessions.logActivity approach with a smarter system:
 * - Batches multiple activities into summaries
 * - Only logs significant events
 * - Uses aggregation instead of individual records
 * - Reduces database writes by 90%+
 */

import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ==================== SESSION MANAGEMENT ====================

/**
 * Heartbeat to keep session alive and update activity summary
 * Called every 5 minutes (client-side) instead of every action
 */
export const updateSessionHeartbeat = mutation({
  args: {
    currentPage: v.optional(v.string()),
    activityCount: v.optional(v.number()), // Number of actions since last heartbeat
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    const now = Date.now();

    // Find or create active session
    let session = await ctx.db
      .query("userSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), user._id),
        q.eq(q.field("isActive"), true)
      ))
      .first();

    if (!session) {
      // Create new session with summary tracking
      const sessionId = await ctx.db.insert("userSessions", {
        userId: user._id,
        clerkSessionId: identity.subject,
        loginTime: now,
        isActive: true,
        lastHeartbeat: now,
        activitySummary: {
          totalActions: args.activityCount || 0,
          pagesVisited: args.currentPage ? [args.currentPage] : [],
          lastPage: args.currentPage,
        },
      });
      return sessionId;
    }

    // Update existing session
    const activitySummary = session.activitySummary || { totalActions: 0, pagesVisited: [], lastPage: undefined };
    const updatedPages = activitySummary.pagesVisited || [];
    
    if (args.currentPage && !updatedPages.includes(args.currentPage)) {
      updatedPages.push(args.currentPage);
      // Keep only last 20 unique pages to prevent bloat
      if (updatedPages.length > 20) {
        updatedPages.shift();
      }
    }

    await ctx.db.patch(session._id, {
      lastHeartbeat: now,
      activitySummary: {
        totalActions: (activitySummary.totalActions || 0) + (args.activityCount || 0),
        pagesVisited: updatedPages,
        lastPage: args.currentPage || activitySummary.lastPage,
      },
    });

    return session._id;
  },
});

/**
 * Log ONLY significant events (not every action)
 * Significant = Login, Logout, Errors, Critical Actions
 */
export const logSignificantEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("login"),
      v.literal("logout"),
      v.literal("error"),
      v.literal("project_created"),
      v.literal("project_approved"),
      v.literal("task_completed"),
      v.literal("file_uploaded"),
      v.literal("permission_change"),
      v.literal("data_export")
    ),
    details: v.optional(v.any()),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    const session = await ctx.db
      .query("userSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), user._id),
        q.eq(q.field("isActive"), true)
      ))
      .first();

    // Create audit log entry
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      userName: user.name,
      userRole: user.role || "user",
      sessionId: session?._id,
      eventType: args.eventType,
      severity: args.severity || "medium",
      action: args.eventType, // Use eventType as action for backward compatibility
      description: `User ${user.name} - ${args.eventType}`,
      timestamp: Date.now(),
      details: args.details,
    });
  },
});

// ==================== SMART SESSION TRACKING ====================

/**
 * Start session - called ONLY on login
 */
export const startSession = mutation({
  args: {
    clerkSessionId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceInfo: v.optional(v.object({
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
      device: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn("startSession called without authentication - user may still be signing in");
      return null; // Graceful handling instead of throwing
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      console.warn("startSession called but user not found in database - user may still be syncing");
      return null; // Graceful handling instead of throwing
    }

    const now = Date.now();

    // End any existing active sessions
    const activeSessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), user._id),
        q.eq(q.field("isActive"), true)
      ))
      .collect();

    for (const session of activeSessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        logoutTime: now,
      });
    }

    // Create new session
    const sessionId = await ctx.db.insert("userSessions", {
      userId: user._id,
      clerkSessionId: args.clerkSessionId,
      loginTime: now,
      isActive: true,
      lastHeartbeat: now,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      deviceInfo: args.deviceInfo,
      activitySummary: {
        totalActions: 0,
        pagesVisited: [],
      },
    });

    // Update user's last login
    await ctx.db.patch(user._id, {
      lastActiveDate: now,
    });

    // Log significant event
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      userName: user.name,
      userRole: user.role || "user",
      sessionId,
      eventType: "login",
      severity: "low",
      action: "login",
      description: `User ${user.name} logged in`,
      timestamp: now,
      details: {
        deviceInfo: args.deviceInfo,
        ipAddress: args.ipAddress,
      },
    });

    return sessionId;
  },
});

/**
 * End session - called ONLY on logout
 */
export const endSession = mutation({
  args: {
    clerkSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    const now = Date.now();

    const session = await ctx.db
      .query("userSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), user._id),
        q.eq(q.field("isActive"), true)
      ))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: false,
        logoutTime: now,
      });

      // Log significant event
      await ctx.db.insert("auditLogs", {
        userId: user._id,
        userName: user.name,
        userRole: user.role || "user",
        sessionId: session._id,
        eventType: "logout",
        severity: "low",
        action: "logout",
        description: `User ${user.name} logged out`,
        timestamp: now,
        details: {
          sessionDuration: now - session.loginTime,
          activitySummary: session.activitySummary,
        },
      });
    }

    return session?._id;
  },
});

// ==================== ANALYTICS & REPORTING ====================

/**
 * Get session summary (aggregated data, not individual actions)
 */
export const getSessionSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const startDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || now;

    // Get sessions in range
    const sessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.gte(q.field("loginTime"), startDate))
      .filter((q) => q.lte(q.field("loginTime"), endDate))
      .collect();

    // Calculate aggregated stats
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isActive).length;
    const totalActions = sessions.reduce((sum, s) => sum + ((s.activitySummary as any)?.totalActions || 0), 0);
    const avgSessionDuration = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.logoutTime ? (s.logoutTime - s.loginTime) : (now - s.loginTime)), 0) / sessions.length
      : 0;

    return {
      totalSessions,
      activeSessions,
      totalActions,
      avgSessionDuration,
      avgActionsPerSession: totalSessions > 0 ? totalActions / totalSessions : 0,
    };
  },
});

/**
 * Get audit trail (only significant events)
 */
export const getAuditTrail = query({
  args: {
    eventType: v.optional(v.string()),
    severity: v.optional(v.string()),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user has permission to view audit logs
    const userLevel = await ctx.db.get(user.userLevel);
    const canViewAllAudits = userLevel?.permissions.includes("analytics:view") || 
                             userLevel?.permissions.includes("users:view");

    // Query audit logs
    let query = ctx.db.query("auditLogs");

    if (!canViewAllAudits) {
      // Regular users can only see their own logs
      query = query.filter((q) => q.eq(q.field("userId"), user._id));
    }

    if (args.eventType) {
      query = query.filter((q) => q.eq(q.field("eventType"), args.eventType));
    }

    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("timestamp"), args.startDate!));
    }

    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("timestamp"), args.endDate!));
    }

    const logs = await query
      .order("desc")
      .take(args.limit || 50);

    // Enrich with user data
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const logUser = await ctx.db.get(log.userId);
        return {
          ...log,
          user: logUser ? {
            name: logUser.name,
            email: logUser.email,
          } : null,
        };
      })
    );

    return enrichedLogs;
  },
});

// ==================== CLEANUP & MAINTENANCE ====================

/**
 * Cleanup old sessions (run via scheduled job)
 * Keeps database lean by archiving old data
 */
export const cleanupOldSessions = internalMutation({
  args: {
    daysToKeep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToKeep = args.daysToKeep || 90; // Keep 90 days by default
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    // Get old sessions
    const oldSessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.lte(q.field("loginTime"), cutoffDate))
      .collect();

    // Delete old sessions
    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    return { deleted: oldSessions.length };
  },
});

/**
 * Cleanup old audit logs (run via scheduled job)
 */
export const cleanupOldAuditLogs = internalMutation({
  args: {
    daysToKeep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToKeep = args.daysToKeep || 180; // Keep 180 days of audit logs
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const oldLogs = await ctx.db
      .query("auditLogs")
      .filter((q) => q.lte(q.field("timestamp"), cutoffDate))
      .collect();

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return { deleted: oldLogs.length };
  },
});

/**
 * Cleanup stale sessions (inactive for > 24 hours)
 */
export const cleanupStaleSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

    // Find active sessions with no recent heartbeat
    const staleSessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    let closedCount = 0;

    for (const session of staleSessions) {
      const lastActivity = session.lastHeartbeat || session.loginTime;
      const inactiveTime = now - lastActivity;

      if (inactiveTime > staleThreshold) {
        // Close the session
        await ctx.db.patch(session._id, {
          isActive: false,
          logoutTime: now,
        });

        // Get user for audit log
        const sessionUser = await ctx.db.get(session.userId);

        // Log the timeout
        await ctx.db.insert("auditLogs", {
          userId: session.userId,
          userName: sessionUser?.name || "Unknown",
          userRole: sessionUser?.role || "user",
          sessionId: session._id,
          eventType: "logout",
          severity: "low",
          action: "logout",
          description: `Session timeout for ${sessionUser?.name || "user"}`,
          timestamp: now,
          details: {
            reason: "session_timeout",
            inactiveTime,
          },
        });

        closedCount++;
      }
    }

    return { closed: closedCount };
  },
});
