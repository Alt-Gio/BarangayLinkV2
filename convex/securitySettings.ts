import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSecuritySettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("securitySettings").first();
    
    if (!settings) {
      return {
        sessionTimeout: 30,
        passwordMinLength: 8,
        requireMFA: false,
        allowPublicRegistration: false,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        passwordRequireUppercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: true,
        forcePasswordChange: false,
        passwordExpiryDays: 90,
        enableIPWhitelist: false,
        ipWhitelist: [],
        enable2FA: false,
        updatedAt: Date.now(),
        updatedBy: null,
      };
    }
    
    return settings;
  },
});

export const updateSecuritySettings = mutation({
  args: {
    sessionTimeout: v.optional(v.number()),
    passwordMinLength: v.optional(v.number()),
    requireMFA: v.optional(v.boolean()),
    allowPublicRegistration: v.optional(v.boolean()),
    maxLoginAttempts: v.optional(v.number()),
    lockoutDuration: v.optional(v.number()),
    passwordRequireUppercase: v.optional(v.boolean()),
    passwordRequireNumbers: v.optional(v.boolean()),
    passwordRequireSpecialChars: v.optional(v.boolean()),
    forcePasswordChange: v.optional(v.boolean()),
    passwordExpiryDays: v.optional(v.number()),
    enableIPWhitelist: v.optional(v.boolean()),
    ipWhitelist: v.optional(v.array(v.string())),
    enable2FA: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user in database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || (userLevel.name !== "ADMIN" && userLevel.name !== "SUPER_ADMIN")) {
      throw new Error("Unauthorized: Admin access required");
    }

    const existingSettings = await ctx.db.query("securitySettings").first();

    const settingsData = {
      sessionTimeout: args.sessionTimeout ?? existingSettings?.sessionTimeout ?? 30,
      passwordMinLength: args.passwordMinLength ?? existingSettings?.passwordMinLength ?? 8,
      requireMFA: args.requireMFA ?? existingSettings?.requireMFA ?? false,
      allowPublicRegistration: args.allowPublicRegistration ?? existingSettings?.allowPublicRegistration ?? false,
      maxLoginAttempts: args.maxLoginAttempts ?? existingSettings?.maxLoginAttempts ?? 5,
      lockoutDuration: args.lockoutDuration ?? existingSettings?.lockoutDuration ?? 15,
      passwordRequireUppercase: args.passwordRequireUppercase ?? existingSettings?.passwordRequireUppercase ?? true,
      passwordRequireNumbers: args.passwordRequireNumbers ?? existingSettings?.passwordRequireNumbers ?? true,
      passwordRequireSpecialChars: args.passwordRequireSpecialChars ?? existingSettings?.passwordRequireSpecialChars ?? true,
      forcePasswordChange: args.forcePasswordChange ?? existingSettings?.forcePasswordChange ?? false,
      passwordExpiryDays: args.passwordExpiryDays ?? existingSettings?.passwordExpiryDays ?? 90,
      enableIPWhitelist: args.enableIPWhitelist ?? existingSettings?.enableIPWhitelist ?? false,
      ipWhitelist: args.ipWhitelist ?? existingSettings?.ipWhitelist ?? [],
      enable2FA: args.enable2FA ?? existingSettings?.enable2FA ?? false,
      updatedAt: Date.now(),
      updatedBy: user._id,
    };

    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, settingsData);
      return {
        success: true,
        message: "Security settings updated successfully",
        settings: { _id: existingSettings._id, ...settingsData },
      };
    } else {
      // Create new settings
      const settingsId = await ctx.db.insert("securitySettings", settingsData);
      return {
        success: true,
        message: "Security settings created successfully",
        settings: { _id: settingsId, ...settingsData },
      };
    }
  },
});

// Get security audit log
export const getSecurityAuditLog = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const logs = await ctx.db
      .query("auditLogs")
      .filter((q) => 
        q.or(
          q.eq(q.field("eventType"), "login"),
          q.eq(q.field("eventType"), "logout"),
          q.eq(q.field("eventType"), "permission_change"),
          q.eq(q.field("severity"), "high"),
          q.eq(q.field("severity"), "critical")
        )
      )
      .order("desc")
      .take(limit);

    return logs;
  },
});

// Force logout all users (emergency security measure)
export const forceLogoutAllUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user in database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is super admin
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: Super Admin access required");
    }

    // Deactivate all active sessions
    const activeSessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of activeSessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        logoutTime: Date.now(),
      });
    }

    // Log the action
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      userName: user.name,
      userRole: user.role || "admin",
      eventType: "permission_change",
      severity: "critical",
      action: "force_logout_all",
      description: `${user.name} force logged out all users`,
      timestamp: Date.now(),
      details: {
        action: "force_logout_all",
        sessionsTerminated: activeSessions.length,
        reason: "Emergency security measure",
      },
    });

    return {
      success: true,
      message: `Successfully logged out ${activeSessions.length} active sessions`,
      count: activeSessions.length,
    };
  },
});

// Get active sessions count
export const getActiveSessionsCount = query({
  args: {},
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      count: activeSessions.length,
      sessions: activeSessions.slice(0, 10), // Return first 10 for preview
    };
  },
});

// SECURITY: Password validation moved to client-side only
// DO NOT validate actual passwords on the server - use Clerk for auth
// This function now only returns password requirements for client-side validation
export const getPasswordRequirements = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("securitySettings").first();
    
    return {
      minLength: settings?.passwordMinLength ?? 8,
      requireUppercase: settings?.passwordRequireUppercase !== false,
      requireNumbers: settings?.passwordRequireNumbers !== false,
      requireSpecialChars: settings?.passwordRequireSpecialChars !== false,
    };
  },
});

// NOTE: Password validation should be done CLIENT-SIDE ONLY
// Never send actual passwords to this backend - Clerk handles all authentication
// Use the requirements from getPasswordRequirements() to validate on the client
