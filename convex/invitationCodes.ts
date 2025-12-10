import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

function generateCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createInvitationCode = mutation({
  args: {
    code: v.optional(v.string()), // Auto-generate if not provided
    description: v.string(),
    userLevelId: v.id("userLevels"),
    department: v.string(),
    maxUses: v.number(), // -1 for unlimited
    expiresAt: v.optional(v.number()), // Optional expiration timestamp
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

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

    let code = args.code || generateCode();
    code = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const existingCode = await ctx.db
      .query("invitationCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (existingCode) {
      throw new Error("Invitation code already exists");
    }

    const codeId = await ctx.db.insert("invitationCodes", {
      code,
      description: args.description,
      userLevelId: args.userLevelId,
      department: args.department,
      maxUses: args.maxUses,
      usedCount: 0,
      status: "active",
      createdBy: user._id,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
      usedBy: [],
    });

    return {
      success: true,
      codeId,
      code,
      message: "Invitation code created successfully",
    };
  },
});

// Get all invitation codes
export const getAllInvitationCodes = query({
  args: {
    status: v.optional(v.union(v.literal("all"), v.literal("active"), v.literal("inactive"), v.literal("expired"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    let codes = await ctx.db.query("invitationCodes").order("desc").collect();

    // Filter by status
    if (args.status && args.status !== "all") {
      codes = codes.filter((c) => c.status === args.status);
    }

    // Enrich with user level and creator info
    const enrichedCodes = await Promise.all(
      codes.map(async (code) => {
        const userLevel = await ctx.db.get(code.userLevelId);
        const creator = await ctx.db.get(code.createdBy);

        // Check if expired
        const isExpired = code.expiresAt && code.expiresAt < Date.now();
        const isMaxedOut = code.maxUses !== -1 && code.usedCount >= code.maxUses;

        return {
          ...code,
          userLevel,
          creator: creator ? { _id: creator._id, name: creator.name } : null,
          isExpired,
          isMaxedOut,
          usagePercentage: code.maxUses === -1 ? 0 : (code.usedCount / code.maxUses) * 100,
        };
      })
    );

    return enrichedCodes;
  },
});

// Validate invitation code (for registration)
export const validateInvitationCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase().trim();

    const invitationCode = await ctx.db
      .query("invitationCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!invitationCode) {
      return {
        valid: false,
        message: "Invalid invitation code",
      };
    }

    // Check if expired
    if (invitationCode.expiresAt && invitationCode.expiresAt < Date.now()) {
      return {
        valid: false,
        message: "This invitation code has expired",
      };
    }

    // Check if inactive
    if (invitationCode.status !== "active") {
      return {
        valid: false,
        message: "This invitation code is no longer active",
      };
    }

    // Check max uses
    if (invitationCode.maxUses !== -1 && invitationCode.usedCount >= invitationCode.maxUses) {
      return {
        valid: false,
        message: "This invitation code has reached its maximum number of uses",
      };
    }

    // Get user level
    const userLevel = await ctx.db.get(invitationCode.userLevelId);

    return {
      valid: true,
      message: "Valid invitation code",
      code: invitationCode,
      userLevel,
    };
  },
});

// Use invitation code (called during registration)
export const useInvitationCode = mutation({
  args: {
    code: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase().trim();

    const invitationCode = await ctx.db
      .query("invitationCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!invitationCode) {
      throw new Error("Invalid invitation code");
    }

    // Validate again
    if (invitationCode.expiresAt && invitationCode.expiresAt < Date.now()) {
      throw new Error("This invitation code has expired");
    }

    if (invitationCode.status !== "active") {
      throw new Error("This invitation code is no longer active");
    }

    if (invitationCode.maxUses !== -1 && invitationCode.usedCount >= invitationCode.maxUses) {
      throw new Error("This invitation code has reached its maximum number of uses");
    }

    // Add user to usedBy array and increment counter
    const usedBy = [...invitationCode.usedBy, args.userId];

    await ctx.db.patch(invitationCode._id, {
      usedCount: invitationCode.usedCount + 1,
      usedBy,
    });

    return {
      success: true,
      userLevelId: invitationCode.userLevelId,
      department: invitationCode.department,
    };
  },
});

// Toggle invitation code status
export const toggleInvitationCodeStatus = mutation({
  args: {
    codeId: v.id("invitationCodes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const code = await ctx.db.get(args.codeId);
    if (!code) {
      throw new Error("Invitation code not found");
    }

    const newStatus = code.status === "active" ? "inactive" : "active";

    await ctx.db.patch(args.codeId, {
      status: newStatus,
    });

    return {
      success: true,
      newStatus,
      message: `Invitation code ${newStatus === "active" ? "activated" : "deactivated"}`,
    };
  },
});

// Delete invitation code
export const deleteInvitationCode = mutation({
  args: {
    codeId: v.id("invitationCodes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

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

    await ctx.db.delete(args.codeId);

    return {
      success: true,
      message: "Invitation code deleted successfully",
    };
  },
});

// Get invitation code statistics
export const getInvitationCodeStats = query({
  args: {},
  handler: async (ctx) => {
    const codes = await ctx.db.query("invitationCodes").collect();

    const stats = {
      total: codes.length,
      active: codes.filter((c) => c.status === "active").length,
      inactive: codes.filter((c) => c.status === "inactive").length,
      expired: codes.filter((c) => c.expiresAt && c.expiresAt < Date.now()).length,
      totalUses: codes.reduce((sum, c) => sum + c.usedCount, 0),
      unlimited: codes.filter((c) => c.maxUses === -1).length,
      maxedOut: codes.filter((c) => c.maxUses !== -1 && c.usedCount >= c.maxUses).length,
    };

    return stats;
  },
});

// Get users who used a specific code
export const getUsersWhoUsedCode = query({
  args: {
    codeId: v.id("invitationCodes"),
  },
  handler: async (ctx, args) => {
    const code = await ctx.db.get(args.codeId);
    if (!code) {
      return [];
    }

    const users = await Promise.all(
      code.usedBy.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        const userLevel = await ctx.db.get(user.userLevel);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          userLevel: userLevel?.name,
          createdAt: user._creationTime,
        };
      })
    );

    return users.filter((u) => u !== null);
  },
});
