import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./roleBasedAccess";

// Get all users (Admin only)
export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
    department: v.optional(v.string()),
    userLevel: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    // Only ADMIN can view all users
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    let users = await ctx.db.query("users").order("desc").collect();

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.department?.toLowerCase().includes(searchLower) ||
        u.position?.toLowerCase().includes(searchLower)
      );
    }

    if (args.department) {
      users = users.filter(u => u.department === args.department);
    }

    if (args.userLevel) {
      const userLevel = await ctx.db
        .query("userLevels")
        .filter(q => q.eq(q.field("name"), args.userLevel))
        .first();
      
      if (userLevel) {
        users = users.filter(u => u.userLevel.toString() === userLevel._id.toString());
      }
    }

    // Enrich with user level details
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevelDetails: userLevel,
        };
      })
    );

    return enrichedUsers;
  },
});

// Get user by ID (Admin only)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    
    return {
      ...user,
      userLevelDetails: userLevel,
    };
  },
});

// Update user details (Admin only)
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    phone: v.optional(v.string()),
    userLevelId: v.optional(v.id("userLevels")),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const { userId, userLevelId, ...updateData } = args;
    
    // Build the update object
    const updateObject: any = { ...updateData };
    
    // Only update userLevel if userLevelId is provided
    if (userLevelId) {
      updateObject.userLevel = userLevelId;
    }
    
    // Update user
    await ctx.db.patch(args.userId, updateObject);

    return args.userId;
  },
});

// Delete user (Admin only)
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Prevent self-deletion
    if (currentUser._id.toString() === args.userId.toString()) {
      throw new Error("Cannot delete your own account");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Delete user
    await ctx.db.delete(args.userId);

    return args.userId;
  },
});

// Send invitation
export const sendInvitation = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    department: v.string(),
    position: v.string(),
    phone: v.optional(v.string()),
    userLevelId: v.id("userLevels"),
    assignInitialTasks: v.boolean(),
    sendWelcomeMessage: v.boolean(),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check for pending invitation
    const pendingInvitation = await ctx.db
      .query("userInvitations")
      .filter(q => q.and(
        q.eq(q.field("email"), args.email),
        q.eq(q.field("status"), "pending")
      ))
      .first();

    if (pendingInvitation) {
      throw new Error("Pending invitation already exists for this email");
    }

    // Generate unique invitation token
    const invitationToken = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now()}`;

    // Create invitation (expires in 7 days)
    const invitationId = await ctx.db.insert("userInvitations", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      department: args.department,
      position: args.position,
      phone: args.phone,
      userLevelId: args.userLevelId,
      invitedBy: currentUser._id,
      invitationToken,
      status: "pending",
      assignInitialTasks: args.assignInitialTasks,
      sendWelcomeMessage: args.sendWelcomeMessage,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send invitation email
    try {
      await ctx.scheduler.runAfter(0, "emails:sendInvitationEmail" as any, {
        to: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        invitationToken,
        invitedByName: currentUser.name,
        customMessage: args.customMessage,
      });
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      // Don't fail the whole invitation if email fails
    }

    // Send notification to admin
    await ctx.db.insert("notifications", {
      userId: currentUser._id,
      title: "Invitation Sent",
      message: `Invitation sent to ${args.email}`,
      type: "success",
      category: "user_invitation",
      isRead: false,
      createdAt: Date.now(),
      metadata: {
        priority: "medium",
        category: "invitation",
        relatedId: String(invitationId),
        data: {
          invitationId,
          email: args.email,
          customMessage: args.customMessage,
        },
      },
    });

    return invitationId;
  },
});

// Get all invitations (Admin only)
export const getAllInvitations = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("cancelled"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    let invitations = await ctx.db
      .query("userInvitations")
      .order("desc")
      .collect();

    // Filter by status
    if (args.status && args.status !== "all") {
      invitations = invitations.filter(inv => inv.status === args.status);
    }

    // Enrich with invited by user details
    const enrichedInvitations = await Promise.all(
      invitations.map(async (inv) => {
        const invitedByUser = await ctx.db.get(inv.invitedBy);
        const userLevel = await ctx.db.get(inv.userLevelId);
        const acceptedUser = inv.userId ? await ctx.db.get(inv.userId) : null;

        return {
          ...inv,
          invitedByUser: invitedByUser ? {
            _id: invitedByUser._id,
            name: invitedByUser.name,
            email: invitedByUser.email,
            imageUrl: invitedByUser.imageUrl,
          } : null,
          userLevel,
          acceptedUser: acceptedUser ? {
            _id: acceptedUser._id,
            name: acceptedUser.name,
            email: acceptedUser.email,
          } : null,
        };
      })
    );

    return enrichedInvitations;
  },
});

// Cancel invitation
export const cancelInvitation = mutation({
  args: { invitationId: v.id("userInvitations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    if (invitation.status !== "pending") {
      throw new Error("Can only cancel pending invitations");
    }

    await ctx.db.patch(args.invitationId, { status: "cancelled" });

    return args.invitationId;
  },
});

// Resend invitation
export const resendInvitation = mutation({
  args: { invitationId: v.id("userInvitations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    // Reset expiration and status
    await ctx.db.patch(args.invitationId, {
      status: "pending",
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    });

    // Resend invitation email
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
      // Don't fail the whole operation if email fails
    }

    return args.invitationId;
  },
});

// Get user statistics (Admin dashboard)
export const getUserStats = query({
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const allUsers = await ctx.db.query("users").collect();
    const allInvitations = await ctx.db.query("userInvitations").collect();

    const userLevels = await ctx.db.query("userLevels").collect();
    const usersByLevel = await Promise.all(
      userLevels.map(async (level) => {
        const count = allUsers.filter(u => u.userLevel.toString() === level._id.toString()).length;
        return {
          level: level.name,
          count,
        };
      })
    );

    // Department distribution
    const departments = [...new Set(allUsers.map(u => u.department).filter(Boolean))];
    const usersByDepartment = departments.map(dept => ({
      department: dept,
      count: allUsers.filter(u => u.department === dept).length,
    }));

    return {
      totalUsers: allUsers.length,
      pendingInvitations: allInvitations.filter(i => i.status === "pending").length,
      acceptedInvitations: allInvitations.filter(i => i.status === "accepted").length,
      expiredInvitations: allInvitations.filter(i => i.status === "expired").length,
      usersByLevel,
      usersByDepartment,
      recentUsers: allUsers.slice(0, 5).map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        createdAt: u._creationTime,
        department: u.department,
      })),
    };
  },
});

// Bulk user actions
export const bulkUpdateUsers = mutation({
  args: {
    userIds: v.array(v.id("users")),
    action: v.union(
      v.literal("assign_level"),
      v.literal("assign_department"),
      v.literal("delete")
    ),
    value: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    if (currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    for (const userId of args.userIds) {
      // Prevent self-modification in bulk delete
      if (args.action === "delete" && userId.toString() === currentUser._id.toString()) {
        continue;
      }

      if (args.action === "delete") {
        await ctx.db.delete(userId);
      } else if (args.action === "assign_department" && args.value) {
        await ctx.db.patch(userId, { department: args.value });
      } else if (args.action === "assign_level" && args.value) {
        const userLevel = await ctx.db
          .query("userLevels")
          .filter(q => q.eq(q.field("name"), args.value))
          .first();
        
        if (userLevel) {
          await ctx.db.patch(userId, { userLevel: userLevel._id });
        }
      }
    }

    return { success: true, count: args.userIds.length };
  },
});
