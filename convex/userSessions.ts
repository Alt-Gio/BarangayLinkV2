import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Start a new user session (called on login)
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
    location: v.optional(v.object({
      city: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user from Convex, create if doesn't exist
    let user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      // User doesn't exist in Convex yet, create them with default WORKER level
      console.log("User not found, creating new user for:", identity.subject);
      
      let workerLevel;
      try {
        workerLevel = await ctx.db
          .query("userLevels")
          .filter((q: any) => q.eq(q.field("name"), "WORKER"))
          .first();

        if (!workerLevel) {
          console.error("WORKER user level not found in database");
          throw new Error("WORKER user level not found in database. Please run seedData:seedUserLevels");
        }

        console.log("Found WORKER level:", workerLevel._id);
      } catch (error) {
        console.error("Error querying userLevels:", error);
        throw new Error(`Failed to query user levels: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (!workerLevel) {
        throw new Error("Worker level is undefined after query");
      }

      const now = Date.now();
      
      try {
        const userId = await ctx.db.insert("users", {
          clerkId: identity.subject,
          email: identity.email || `user-${identity.subject}@temp.com`,
          name: identity.name || identity.nickname || "New User",
          userLevel: workerLevel._id,
          department: "General",
          position: "Community Member",
          role: "worker", // Default role
          phone: undefined,
          isActive: false,
          status: "pending",
          level: 1,
          experience: 0,
          gold: 50,
          health: 100,
          mana: 50,
          streakCount: 0,
          lastActiveDate: now,
          totalTasksCompleted: 0,
          totalHoursLogged: 0,
          projectSuccessRate: 0,
          metadata: {
            lastLogin: now,
            preferences: {},
          },
        });

        console.log("Created user with ID:", userId);
        
        user = await ctx.db.get(userId);
        if (!user) {
          throw new Error("Failed to retrieve created user from database");
        }
        
        console.log("Successfully created and retrieved user:", user.name);
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const now = Date.now();

    // End any existing active sessions for this user
    const activeSessions = await ctx.db
      .query("userSessions")
      .filter((q: any) => q.and(
        q.eq(q.field("userId"), user._id),
        q.eq(q.field("isActive"), true)
      ))
      .collect();

    for (const session of activeSessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        logoutTime: now,
      });

      // Log the session timeout
      await ctx.db.insert("userActivityLogs", {
        userId: user._id,
        sessionId: session._id,
        activityType: "session_timeout",
        timestamp: now,
        details: {
          errorMessage: "New session started",
        },
      });
    }

    // Create new session
    const sessionId = await ctx.db.insert("userSessions", {
      userId: user._id,
      clerkSessionId: args.clerkSessionId,
      loginTime: now,
      isActive: true,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      deviceInfo: args.deviceInfo,
      location: args.location,
    });

    // Update user's last login
    await ctx.db.patch(user._id, {
      metadata: {
        ...user.metadata,
        lastLogin: now,
      },
    });

    // Log the login activity
    await ctx.db.insert("userActivityLogs", {
      userId: user._id,
      sessionId,
      activityType: "login",
      timestamp: now,
      details: {
        userAgent: args.userAgent,
        deviceInfo: args.deviceInfo,
        location: {
          ...args.location,
          ip: args.ipAddress,
        },
      },
    });

    return sessionId;
  },
});

// End user session (called on logout)
export const endSession = mutation({
  args: {
    clerkSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Find active session
    let session;
    if (args.clerkSessionId) {
      session = await ctx.db
        .query("userSessions")
        .filter((q: any) => q.and(
          q.eq(q.field("clerkSessionId"), args.clerkSessionId),
          q.eq(q.field("isActive"), true)
        ))
        .first();
    } else {
      // Find any active session for this user
      session = await ctx.db
        .query("userSessions")
        .filter((q: any) => q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("isActive"), true)
        ))
        .first();
    }

    if (session) {
      // End the session
      await ctx.db.patch(session._id, {
        isActive: false,
        logoutTime: now,
      });

      // Log the logout activity
      await ctx.db.insert("userActivityLogs", {
        userId: user._id,
        sessionId: session._id,
        activityType: "logout",
        timestamp: now,
        duration: now - session.loginTime,
      });
    }

    return session?._id;
  },
});

// Log user activity (page views, actions, etc.)
export const logActivity = mutation({
  args: {
    activityType: v.union(
      v.literal("page_view"),
      v.literal("action"),
      v.literal("error")
    ),
    page: v.optional(v.string()),
    action: v.optional(v.string()),
    details: v.optional(v.object({
      action: v.optional(v.string()), // Added to support tab_visible/tab_hidden actions
      deviceInfo: v.optional(v.object({
        browser: v.optional(v.string()),
        device: v.optional(v.string()),
        os: v.optional(v.string()),
      })),
      location: v.optional(v.object({
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        region: v.optional(v.string()),
        ip: v.optional(v.string()),
      })),
      userAgent: v.optional(v.string()),
      referrer: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      stackTrace: v.optional(v.string()),
      timestamp: v.optional(v.number()),
    })),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        console.warn("logActivity called without authentication");
        return; // Don't throw error, just return silently
      }

      const user = await ctx.db
        .query("users")
        .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
        .first();

      if (!user) {
        console.warn("logActivity called for non-existent user:", identity.subject);
        return; // Don't throw error, just return silently
      }

      // Find current active session or create one if none exists
    let session = await ctx.db
      .query("userSessions")
      .filter((q: any) => q.and(
        q.eq(q.field("userId"), user._id),
        q.eq(q.field("isActive"), true)
      ))
      .first();

      if (!session) {
        // Create a new session if none exists
        const sessionId = await ctx.db.insert("userSessions", {
          userId: user._id,
          clerkSessionId: identity.subject || "unknown",
          loginTime: Date.now(),
          isActive: true,
          deviceInfo: args.details?.deviceInfo || {},
          location: args.details?.location || {},
          userAgent: args.details?.userAgent || "",
        });
        session = await ctx.db.get(sessionId);
      }

      if (session) {
        // Log the activity
        await ctx.db.insert("userActivityLogs", {
          userId: user._id,
          sessionId: session._id,
          activityType: args.activityType,
          page: args.page,
          action: args.action,
          details: args.details,
          timestamp: Date.now(),
          duration: args.duration,
        });
      }
    } catch (error) {
      console.error("Error in logActivity:", error);
      // Don't throw error to prevent system disruption
    }
  },
});

// Get current active sessions
export const getActiveSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin permissions
    const currentUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (!userLevel || !userLevel.permissions.includes("users:view")) {
      throw new Error("Insufficient permissions");
    }

    // Get all active sessions with user details
    const activeSessions = await ctx.db
      .query("userSessions")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(100); // OPTIMIZED: Only load 100 active sessions

    const sessionsWithUsers = await Promise.all(
      activeSessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          ...session,
          user: user ? {
            name: user.name,
            email: user.email,
            department: user.department,
            position: user.position,
          } : null,
        };
      })
    );

    return sessionsWithUsers;
  },
});

// Get user session history
export const getUserSessionHistory = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // If no userId provided, get current user's sessions
    const targetUserId = args.userId || currentUser._id;

    // Check permissions - users can view their own sessions, admins can view all
    if (targetUserId !== currentUser._id) {
      const userLevel = await ctx.db.get(currentUser.userLevel);
      if (!userLevel || !userLevel.permissions.includes("users:view")) {
        throw new Error("Insufficient permissions");
      }
    }

    const sessions = await ctx.db
      .query("userSessions")
      .filter((q: any) => q.eq(q.field("userId"), targetUserId))
      .order("desc")
      .take(args.limit || 50);

    return sessions;
  },
});

// Get user activity logs
export const getUserActivityLogs = query({
  args: {
    userId: v.optional(v.id("users")),
    activityType: v.optional(v.string()),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const targetUserId = args.userId || currentUser._id;

    // Check permissions
    if (targetUserId !== currentUser._id) {
      const userLevel = await ctx.db.get(currentUser.userLevel);
      if (!userLevel || !userLevel.permissions.includes("users:view")) {
        throw new Error("Insufficient permissions");
      }
    }

    let query = ctx.db
      .query("userActivityLogs")
      .filter((q: any) => q.eq(q.field("userId"), targetUserId));

    if (args.activityType) {
      query = query.filter((q: any) => q.eq(q.field("activityType"), args.activityType));
    }

    if (args.startDate !== undefined) {
      query = query.filter((q: any) => q.gte(q.field("timestamp"), args.startDate!));
    }

    if (args.endDate !== undefined) {
      query = query.filter((q: any) => q.lte(q.field("timestamp"), args.endDate!));
    }

    const logs = await query
      .order("desc")
      .take(args.limit || 100);

    return logs;
  },
});

// Get session statistics
export const getSessionStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (!userLevel || !userLevel.permissions.includes("analytics:view")) {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();
    const startDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || now;

    // Get sessions in date range
    const sessions = await ctx.db
      .query("userSessions")
      .filter((q: any) => q.gte(q.field("loginTime"), startDate))
      .filter((q: any) => q.lte(q.field("loginTime"), endDate))
      .take(500); // OPTIMIZED: Limit to 500 sessions

    // Get currently active sessions
    const activeSessions = await ctx.db
      .query("userSessions")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .take(100); // OPTIMIZED: Only load 100 active sessions

    // Calculate statistics
    const totalSessions = sessions.length;
    const activeSessionsCount = activeSessions.length;
    const uniqueUsers = new Set(sessions.map(s => s.userId.toString())).size;
    
    const completedSessions = sessions.filter(s => s.logoutTime);
    const avgSessionDuration = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.logoutTime! - s.loginTime), 0) / completedSessions.length
      : 0;

    return {
      totalSessions,
      activeSessionsCount,
      uniqueUsers,
      avgSessionDuration,
      dateRange: { startDate, endDate },
    };
  },
});
