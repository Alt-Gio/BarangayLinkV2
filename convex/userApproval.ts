import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./roleBasedAccess";

export const createInvitation = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    department: v.string(),
    position: v.string(),
    phone: v.optional(v.string()),
    userLevelId: v.id("userLevels"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const existingInvitation = await ctx.db
      .query("userInvitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    
    if (existingInvitation) {
      throw new Error("Invitation already sent to this email");
    }

    const token = `INV-${crypto.randomUUID()}`;
    
    const invitationId = await ctx.db.insert("userInvitations", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      department: args.department,
      position: args.position,
      phone: args.phone,
      userLevelId: args.userLevelId,
      invitedBy: currentUser._id,
      invitationToken: token,
      status: "pending",
      assignInitialTasks: false,
      sendWelcomeMessage: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      invitationId,
      token,
      message: "Invitation created successfully",
    };
  },
});

export const validateInvitation = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("userInvitations")
      .withIndex("by_token", (q) => q.eq("invitationToken", args.token))
      .first();
    
    if (!invitation) {
      return { valid: false, message: "Invalid invitation code" };
    }

    if (invitation.status !== "pending") {
      return { valid: false, message: "Invitation has already been used or cancelled" };
    }

    if (invitation.expiresAt < Date.now()) {
      return { valid: false, message: "Invitation has expired" };
    }

    const userLevel = await ctx.db.get(invitation.userLevelId);

    return {
      valid: true,
      invitation: {
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        department: invitation.department,
        position: invitation.position,
        userLevel: userLevel?.name,
      },
    };
  },
});

// Get all invitations (ADMIN only)
export const getAllInvitations = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN" && currentUser.userLevel.name !== "CAPTAIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    let invitations = await ctx.db.query("userInvitations").order("desc").collect();

    // Filter by status if provided
    if (args.status) {
      invitations = invitations.filter(inv => inv.status === args.status);
    }

    // Enrich with user level and inviter details
    const enriched = await Promise.all(
      invitations.map(async (inv) => {
        const userLevel = await ctx.db.get(inv.userLevelId);
        const inviter = await ctx.db.get(inv.invitedBy);
        const acceptedUser = inv.userId ? await ctx.db.get(inv.userId) : null;

        return {
          ...inv,
          userLevelName: userLevel?.name,
          inviterName: inviter?.name,
          acceptedUserName: acceptedUser?.name,
        };
      })
    );

    return enriched;
  },
});

// Cancel invitation (ADMIN only)
export const cancelInvitation = mutation({
  args: { invitationId: v.id("userInvitations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.invitationId, {
      status: "cancelled",
    });

    return { message: "Invitation cancelled successfully" };
  },
});

// Resend invitation (ADMIN only)
export const resendInvitation = mutation({
  args: { invitationId: v.id("userInvitations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    // Extend expiration by 7 days
    await ctx.db.patch(args.invitationId, {
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return { message: "Invitation extended for 7 more days" };
  },
});

// ===== USER APPROVAL SYSTEM =====

// Get all pending users (ADMIN only)
export const getPendingUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN" && currentUser.userLevel.name !== "CAPTAIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Enrich with user level details
    const enriched = await Promise.all(
      pendingUsers.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        const invitation = user.invitationId ? await ctx.db.get(user.invitationId) : null;

        return {
          ...user,
          userLevelDetails: userLevel,
          invitationDetails: invitation,
        };
      })
    );

    return enriched;
  },
});

// Get all rejected users (ADMIN only)
export const getRejectedUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN" && currentUser.userLevel.name !== "CAPTAIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const rejectedUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "rejected"))
      .order("desc")
      .collect();

    // Enrich with user level details and rejection info
    const enriched = await Promise.all(
      rejectedUsers.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        const rejectedBy = user.rejectedBy ? await ctx.db.get(user.rejectedBy) : null;

        return {
          ...user,
          userLevelDetails: userLevel,
          rejectedByDetails: rejectedBy,
        };
      })
    );

    return enriched;
  },
});

// Get all approved/active users (ADMIN only)
export const getApprovedUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN" && currentUser.userLevel.name !== "CAPTAIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const approvedUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    // Enrich with user level details and approval info
    const enriched = await Promise.all(
      approvedUsers.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        const approvedBy = user.approvedBy ? await ctx.db.get(user.approvedBy) : null;

        return {
          ...user,
          userLevelDetails: userLevel,
          approvedByDetails: approvedBy,
        };
      })
    );

    return enriched;
  },
});

// Approve user (ADMIN only)
export const approveUser = mutation({
  args: {
    userId: v.id("users"),
    sendWelcomeEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN" && currentUser.userLevel.name !== "CAPTAIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (user.status !== "pending") {
      throw new Error("User is not pending approval");
    }

    // Update user status to active
    await ctx.db.patch(args.userId, {
      status: "active",
      isActive: true,
      approvedBy: currentUser._id,
      approvedAt: Date.now(),
    });

    // If registered via invitation, mark invitation as accepted
    if (user.invitationId) {
      await ctx.db.patch(user.invitationId, {
        status: "accepted",
        acceptedAt: Date.now(),
        userId: args.userId,
      });
    }

    // Create welcome notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Welcome to BarangayLink!",
      message: "Your account has been approved. You can now access all features.",
      type: "success",
      category: "account",
      isRead: false,
      createdAt: Date.now(),
    });

    return { message: "User approved successfully" };
  },
});

// Reject user (ADMIN only)
export const rejectUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN" && currentUser.userLevel.name !== "CAPTAIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (user.status !== "pending") {
      throw new Error("User is not pending approval");
    }

    // Update user status to rejected
    await ctx.db.patch(args.userId, {
      status: "rejected",
      isActive: false,
      rejectedBy: currentUser._id,
      rejectedAt: Date.now(),
      rejectionReason: args.reason,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Registration Denied",
      message: `Your registration has been denied. Reason: ${args.reason}`,
      type: "error",
      category: "account",
      isRead: false,
      createdAt: Date.now(),
    });

    return { message: "User rejected" };
  },
});

// Revert user to pending (ADMIN ONLY - not CAPTAIN)
export const revertToPending = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    // ONLY ADMIN can change status - NOT Captain
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Only ADMIN can change user status");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (user.status === "pending") {
      throw new Error("User is already pending");
    }

    // Update user status back to pending
    await ctx.db.patch(args.userId, {
      status: "pending",
      isActive: false,
      // Clear approval/rejection data but keep history
      reviewedBy: currentUser._id,
      reviewedAt: Date.now(),
      reviewReason: args.reason || "Status reverted to pending for re-review",
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Account Status Changed",
      message: args.reason || "Your account has been moved to pending status for re-review.",
      type: "info",
      category: "account",
      isRead: false,
      createdAt: Date.now(),
    });

    return { message: "User status reverted to pending" };
  },
});

// Get user approval stats (ADMIN only)
export const getApprovalStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN" && currentUser.userLevel.name !== "CAPTAIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const allUsers = await ctx.db.query("users").collect();
    const allInvitations = await ctx.db.query("userInvitations").collect();

    const pendingUsers = allUsers.filter(u => u.status === "pending").length;
    const activeUsers = allUsers.filter(u => u.status === "active").length;
    const rejectedUsers = allUsers.filter(u => u.status === "rejected").length;
    
    const pendingInvitations = allInvitations.filter(i => i.status === "pending").length;
    const acceptedInvitations = allInvitations.filter(i => i.status === "accepted").length;

    return {
      pendingUsers,
      activeUsers,
      rejectedUsers,
      pendingInvitations,
      acceptedInvitations,
      totalUsers: allUsers.length,
      totalInvitations: allInvitations.length,
    };
  },
});
