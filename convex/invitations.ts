import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get invitation by token (public query)
export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("userInvitations")
      .withIndex("by_token", (q) => q.eq("invitationToken", args.token))
      .first();

    if (!invitation) {
      return null;
    }

    // Check if expired
    const isExpired = invitation.expiresAt < Date.now();
    if (isExpired) {
      return { ...invitation, isExpired: true };
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return { ...invitation, isAccepted: true };
    }

    // Get invited by user details
    const invitedByUser = await ctx.db.get(invitation.invitedBy);
    const userLevel = await ctx.db.get(invitation.userLevelId);

    return {
      ...invitation,
      invitedByUser: invitedByUser ? {
        _id: invitedByUser._id,
        name: invitedByUser.name,
        email: invitedByUser.email,
        imageUrl: invitedByUser.imageUrl,
      } : null,
      userLevel,
      isExpired: false,
      isAccepted: false,
    };
  },
});

// Validate invitation token (before showing signup form)
export const validateInvitationToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("userInvitations")
      .withIndex("by_token", (q) => q.eq("invitationToken", args.token))
      .first();

    if (!invitation) {
      return { valid: false, reason: "invalid_token" };
    }

    if (invitation.status === "cancelled") {
      return { valid: false, reason: "cancelled" };
    }

    if (invitation.status === "accepted") {
      return { valid: false, reason: "already_accepted" };
    }

    if (invitation.expiresAt < Date.now()) {
      return { valid: false, reason: "expired" };
    }

    return { 
      valid: true, 
      invitation: {
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        department: invitation.department,
        position: invitation.position,
      }
    };
  },
});

// Accept invitation and create user account
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find invitation
    const invitation = await ctx.db
      .query("userInvitations")
      .withIndex("by_token", (q) => q.eq("invitationToken", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invalid invitation token");
    }

    // Validate invitation
    if (invitation.status === "cancelled") {
      throw new Error("This invitation has been cancelled");
    }

    if (invitation.status === "accepted") {
      throw new Error("This invitation has already been accepted");
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("This invitation has expired");
    }

    if (invitation.email.toLowerCase() !== args.email.toLowerCase()) {
      throw new Error("Email does not match the invitation");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      throw new Error("User account already exists");
    }

    // Get user level details
    const userLevel = await ctx.db.get(invitation.userLevelId);
    if (!userLevel) {
      throw new Error("Invalid user level");
    }

    // Create user account
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: invitation.email,
      name: `${invitation.firstName} ${invitation.lastName}`,
      userLevel: invitation.userLevelId,
      department: invitation.department,
      position: invitation.position ?? "Team Member",
      role: "worker", // Default role
      phone: invitation.phone,
      isActive: true,
      status: "active",
      registeredViaInvitation: true,
      invitationId: invitation._id,
      // Gamification defaults
      level: 1,
      experience: 0,
      gold: 0,
      health: 100,
      mana: 100,
      streakCount: 0,
      // Performance metrics
      totalTasksCompleted: 0,
      totalHoursLogged: 0,
      projectSuccessRate: 0,
    });

    // Update invitation status
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      userId: userId,
    });

    // Send welcome notification to new user
    await ctx.db.insert("notifications", {
      userId: userId,
      title: "Welcome to BarangayLink V2!",
      message: `Welcome aboard! You've been added to ${invitation.department} as ${invitation.position}.`,
      type: "success",
      category: "user_account",
      isRead: false,
      createdAt: Date.now(),
      metadata: {
        priority: "high",
        category: "welcome",
      },
    });

    // Notify the admin who sent the invitation
    await ctx.db.insert("notifications", {
      userId: invitation.invitedBy,
      title: "Invitation Accepted",
      message: `${invitation.firstName} ${invitation.lastName} has accepted your invitation and joined the team!`,
      type: "success",
      category: "user_invitation",
      isRead: false,
      createdAt: Date.now(),
      metadata: {
        priority: "medium",
        category: "invitation_accepted",
        relatedId: String(userId),
        data: {
          newUserId: userId,
          email: invitation.email,
        },
      },
    });

    // If assignInitialTasks is true, create onboarding tasks
    if (invitation.assignInitialTasks) {
      // Create welcome task
      await ctx.db.insert("tasks", {
        userId: userId,
        title: "Complete Your Profile",
        description: "Add a profile picture, bio, and update your skills to help your team get to know you better.",
        type: "todo",
        difficulty: "easy",
        status: "todo",
        priority: "high",
        completed: false,
        createdBy: invitation.invitedBy,
        assignedTo: [userId],
        experienceReward: 20,
        goldReward: 10,
        completionCount: 0,
        tags: ["onboarding", "profile"],
        attachments: [],
        dependencies: [],
        subtasks: [],
        loggedHours: [],
        isBlocking: false,
        createdAt: Date.now(),
      });

      // Create introduction task
      await ctx.db.insert("tasks", {
        userId: userId,
        title: "Introduce Yourself",
        description: "Send a message in the team chat to introduce yourself to your colleagues.",
        type: "todo",
        difficulty: "easy",
        status: "todo",
        priority: "medium",
        completed: false,
        createdBy: invitation.invitedBy,
        assignedTo: [userId],
        experienceReward: 15,
        goldReward: 5,
        completionCount: 0,
        tags: ["onboarding", "team"],
        attachments: [],
        dependencies: [],
        subtasks: [],
        loggedHours: [],
        isBlocking: false,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      userId: userId,
      message: "Account created successfully!",
    };
  },
});

// Resend invitation (admin only)
export const resendInvitationEmail = mutation({
  args: { invitationId: v.id("userInvitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (userLevel?.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    // Reset expiration
    await ctx.db.patch(args.invitationId, {
      status: "pending",
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send email
    try {
      await ctx.scheduler.runAfter(0, "emails:sendInvitationEmail" as any, {
        to: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        invitationToken: invitation.invitationToken,
        invitedByName: currentUser.name,
      });
    } catch (error) {
      console.error("Failed to resend invitation email:", error);
      throw new Error("Failed to send invitation email");
    }

    return { success: true };
  },
});
