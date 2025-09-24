import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Sync user from Clerk to Convex
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, firstName, lastName, imageUrl }) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first();

    const now = Date.now();
    const fullName = `${firstName} ${lastName}`;

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email,
        name: fullName,
        metadata: {
          lastLogin: now,
          preferences: {},
        },
      });
      return existingUser._id;
    } else {
      // Get default WORKER user level
      const workerLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), "WORKER"))
        .first();

      if (!workerLevel) {
        throw new Error("Default WORKER user level not found. Please seed user levels first.");
      }

      // Create new user with WORKER level
      const userId = await ctx.db.insert("users", {
        clerkId,
        email,
        name: fullName,
        userLevel: workerLevel._id,
        department: "General",
        position: "Community Member",
        phone: undefined,
        isActive: true,
        // Gamification stats
        level: 1,
        experience: 0,
        gold: 50, // Starting gold
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

      return userId;
    }
  },
});

// Get current user with full details including role
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .unique();

    if (!user) return null;

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel) return null;

    return {
      ...user,
      userLevel: userLevel,
      clerkId: identity.subject,
    };
  },
});

// Get users that can be assigned to tasks
export const getAssignableUsers = query({
  args: {
    department: v.string(),
    userRole: v.string()
  },
  handler: async (ctx, args) => {
    // Get all users in the same department with appropriate roles
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("department"), args.department))
      .collect();

    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return { ...user, userLevel };
      })
    );

    // Filter out users with null userLevels and apply role-based filtering
    const validUsersWithLevels = usersWithLevels.filter(u => u.userLevel !== null);

    // Filter based on requesting user's role
    if (args.userRole === "ADMIN") {
      return validUsersWithLevels; // ADMIN can assign to anyone
    } else if (args.userRole === "MANAGER") {
      return validUsersWithLevels.filter(u => u.userLevel && ["WORKER", "BUILDER"].includes(u.userLevel.name));
    } else if (args.userRole === "BUILDER") {
      return validUsersWithLevels.filter(u => u.userLevel && u.userLevel.name === "WORKER");
    }
    
    return [];
  },
});

// Get available users for project team assignment
export const getAvailableProjectMembers = query({
  args: {
    department: v.string(),
    currentMembers: v.array(v.string()),
    userRole: v.string()
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("department"), args.department))
      .collect();

    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return { ...user, userLevel };
      })
    );

    // Filter out current members, null userLevels, and apply role restrictions
    return usersWithLevels.filter(user => 
      user.userLevel !== null &&
      !args.currentMembers.includes(user._id) &&
      (args.userRole === "ADMIN" || user.department === args.department)
    );
  },
});

// Get detailed information for project team members
export const getTeamMembersDetails = query({
  args: {
    userIds: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const members = await Promise.all(
      args.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId as any);
        if (!user) return null;
        
        // Type assertion to ensure user has userLevel property
        const userWithLevel = user as any;
        if (!userWithLevel.userLevel) return null;
        
        const userLevel = await ctx.db.get(userWithLevel.userLevel);
        return { ...userWithLevel, userLevel };
      })
    );

    return members.filter(Boolean);
  },
});

// Get project team members
export const getProjectTeamMembers = query({
  args: {
    projectId: v.id("projects")
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const members = await Promise.all(
      project.assignedTo.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;
        
        const userLevel = await ctx.db.get(user.userLevel);
        return { ...user, userLevel };
      })
    );

    return members.filter(Boolean);
  },
});

// Get user permissions
export const getUserPermissions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const userLevel = await ctx.db.get(user.userLevel);
    return userLevel?.permissions || [];
  },
});


// Assign user level (Admin/Manager only)
export const assignUserLevel = mutation({
  args: {
    userId: v.id("users"),
    newUserLevelId: v.id("userLevels"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user and check permissions
    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const currentUserLevel = await ctx.db.get(currentUser.userLevel);
    if (!currentUserLevel || currentUserLevel.level < 3) {
      throw new Error("Insufficient permissions. Manager level or higher required.");
    }

    // Get target user and new user level
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    const targetUserLevel = await ctx.db.get(targetUser.userLevel);
    const newUserLevel = await ctx.db.get(args.newUserLevelId);

    if (!targetUserLevel || !newUserLevel) {
      throw new Error("User levels not found");
    }

    // Cannot assign a level higher than your own
    if (newUserLevel.level >= currentUserLevel.level) {
      throw new Error("Cannot assign a user level equal to or higher than your own");
    }

    // Update user level
    await ctx.db.patch(args.userId, {
      userLevel: args.newUserLevelId,
    });

    // Create audit trail
    await ctx.db.insert("analytics", {
      eventType: "user_level_changed",
      userId: currentUser._id,
      eventData: {
        action: "user_level_changed",
        metadata: {
          previousValue: targetUserLevel.name,
          newValue: newUserLevel.name,
          reason: args.reason || "No reason provided",
          targetUserId: args.userId,
        },
      },
      sessionId: identity.subject,
      timestamp: Date.now(),
    });

    return args.userId;
  },
});

// Get all users with their levels (Manager+ only)
export const getAllUsers = query({
  args: {
    department: v.optional(v.string()),
    userLevelId: v.optional(v.id("userLevels")),
  },
  handler: async (ctx: any, { department, userLevelId }: { department?: string; userLevelId?: any }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check permissions
    const currentUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const currentUserLevel = await ctx.db.get(currentUser.userLevel);
    if (!currentUserLevel || currentUserLevel.level < 3) {
      throw new Error("Insufficient permissions. Manager level or higher required.");
    }

    // Build query
    let query = ctx.db.query("users");

    if (department) {
      query = query.filter((q: any) => q.eq(q.field("department"), department));
    }

    if (userLevelId) {
      query = query.filter((q: any) => q.eq(q.field("userLevel"), userLevelId));
    }

    const users = await query.collect();

    // Get user levels for all users
    const usersWithLevels = await Promise.all(
      users.map(async (user: any) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );

    // Filter out users with null userLevels
    return usersWithLevels.filter(user => user.userLevel !== null);
  },
});

// Get users by level
export const getUsersByLevel = query({
  args: {
    userLevelId: v.id("userLevels"),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userLevel"), args.userLevelId))
      .collect();

    return users;
  },
});

// Get users by department
export const getUsersByDepartment = query({
  args: {
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("department"), args.department))
      .collect();

    // Get user levels for each user
    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );

    // Filter out users with null userLevels
    return usersWithLevels.filter(user => user.userLevel !== null);
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first();

    if (!user) {
      return null;
    }

    const userLevel = await ctx.db.get(user.userLevel);
    
    return {
      ...user,
      userLevel,
    };
  },
});

// Get all users with their levels
export const getAllUsersWithLevels = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );

    // Filter out users with null userLevels
    return usersWithLevels.filter(user => user.userLevel !== null);
  },
});

// Update user profile (Enhanced for admin use)
export const updateUserProfile = mutation({
  args: {
    userId: v.optional(v.id("users")),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { userId, department, position, phone }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let targetUserId = userId;

    // If no userId provided, update current user
    if (!targetUserId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), identity.subject))
        .first();

      if (!user) {
        throw new Error("User not found");
      }
      targetUserId = user._id;
    } else {
      // If updating another user, check permissions
      const currentUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), identity.subject))
        .first();

      if (!currentUser) {
        throw new Error("Current user not found");
      }

      const currentUserLevel = await ctx.db.get(currentUser.userLevel);
      if (!currentUserLevel || currentUserLevel.level < 3) {
        throw new Error("Insufficient permissions. Manager level or higher required.");
      }
    }

    const updateData: any = {};
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (phone !== undefined) updateData.phone = phone;

    await ctx.db.patch(targetUserId, updateData);

    return targetUserId;
  },
});

// Update user status (Admin/Manager only)
export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { userId, isActive }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check permissions
    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const currentUserLevel = await ctx.db.get(currentUser.userLevel);
    if (!currentUserLevel || currentUserLevel.level < 3) {
      throw new Error("Insufficient permissions. Manager level or higher required.");
    }

    // Get target user
    const targetUser = await ctx.db.get(userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Update user status
    await ctx.db.patch(userId, {
      isActive,
    });

    // Create audit trail
    await ctx.db.insert("analytics", {
      eventType: "user_status_changed",
      userId: currentUser._id,
      eventData: {
        action: "user_status_changed",
        metadata: {
          targetUserId: userId,
          previousStatus: targetUser.isActive,
          newStatus: isActive,
        },
      },
      sessionId: identity.subject,
      timestamp: Date.now(),
    });

    return userId;
  },
});
