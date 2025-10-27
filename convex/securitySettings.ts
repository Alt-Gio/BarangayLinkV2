import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get security settings
export const getSecuritySettings = query({
  args: {},
  handler: async (ctx) => {
    // Get the first (and should be only) security settings record
    const settings = await ctx.db.query("securitySettings").first();
    
    // Return default settings if none exist
    if (!settings) {
      return {
        sessionTimeout: 30, // minutes
        passwordMinLength: 8,
        requireMFA: false,
        allowPublicRegistration: false,
        maxLoginAttempts: 5,
        lockoutDuration: 15, // minutes
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

// Update security settings
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

    // Check if user is admin
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || (userLevel.name !== "ADMIN" && userLevel.name !== "SUPER_ADMIN")) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get existing settings
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
      eventType: "permission_change",
      severity: "critical",
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

// Validate password against security settings
export const validatePassword = query({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("securitySettings").first();
    
    const errors: string[] = [];
    
    // Check minimum length
    const minLength = settings?.passwordMinLength ?? 8;
    if (args.password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    // Check uppercase requirement
    if (settings?.passwordRequireUppercase !== false) {
      if (!/[A-Z]/.test(args.password)) {
        errors.push("Password must contain at least one uppercase letter");
      }
    }
    
    // Check number requirement
    if (settings?.passwordRequireNumbers !== false) {
      if (!/[0-9]/.test(args.password)) {
        errors.push("Password must contain at least one number");
      }
    }
    
    // Check special character requirement
    if (settings?.passwordRequireSpecialChars !== false) {
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(args.password)) {
        errors.push("Password must contain at least one special character");
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
});
