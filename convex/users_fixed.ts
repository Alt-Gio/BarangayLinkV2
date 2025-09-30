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
      .filter((q: any) => q.eq(q.field("clerkId"), clerkId))
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
        .filter((q: any) => q.eq(q.field("name"), "WORKER"))
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

// Get current user (used by dashboard) - creates user if doesn't exist
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    let user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      // User doesn't exist, return null and let the mutation handle creation
      return null;
    }

    // Get user level and permissions
    const userLevel = await ctx.db.get(user.userLevel);
    
    return {
      ...user,
      userLevel,
    };
  },
});

// Create user if doesn't exist (mutation)
export const ensureUserExists = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    let user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (user) {
      return user._id;
    }

    // Get WORKER level
    const workerLevel = await ctx.db
      .query("userLevels")
      .filter((q: any) => q.eq(q.field("name"), "WORKER"))
      .first();

    if (!workerLevel) {
      throw new Error("WORKER user level not found. Please seed user levels first.");
    }

    const now = Date.now();
    
    // Extract profile data from Clerk metadata if available
    const clerkMetadata = (identity as any).unsafeMetadata || {};
    const department = clerkMetadata.department || "General";
    const position = clerkMetadata.jobTitle || "Community Member";
    const phone = clerkMetadata.phone;
    const role = clerkMetadata.role;
    
    // Determine user level based on role from metadata
    let selectedUserLevel = workerLevel;
    if (role) {
      const roleLevel = await ctx.db
        .query("userLevels")
        .filter((q: any) => q.eq(q.field("name"), role.toUpperCase()))
        .first();
      if (roleLevel) {
        selectedUserLevel = roleLevel;
      }
    }
    
    // Create new user with profile data
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || `user-${identity.subject}@temp.com`,
      name: identity.name || identity.nickname || "New User",
      userLevel: selectedUserLevel._id,
      department: department,
      position: position,
      phone: phone,
      isActive: true,
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

    return userId;
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
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const userLevel = await ctx.db.get(user.userLevel);
    return userLevel?.permissions || [];
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { department, position, phone }) => {
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

    await ctx.db.patch(user._id, {
      department,
      position,
      phone,
    });

    return user._id;
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
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
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
  handler: async (ctx, { department, userLevelId }) => {
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
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );

    return usersWithLevels;
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
      .filter((q: any) => q.eq(q.field("userLevel"), args.userLevelId))
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
      .filter((q: any) => q.eq(q.field("department"), args.department))
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

    return usersWithLevels;
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), clerkId))
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

    return usersWithLevels;
  },
});

// Create user invitation (for admin user creation)
export const createUserInvitation = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    phone: v.optional(v.string()),
    userLevelId: v.id("userLevels"),
    assignInitialTasks: v.optional(v.boolean()),
    sendWelcomeMessage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user has admin permissions
    const currentUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const currentUserLevel = await ctx.db.get(currentUser.userLevel);
    if (!currentUserLevel || currentUserLevel.level < 4) {
      throw new Error("Insufficient permissions. Admin level required.");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Get the target user level
    const targetUserLevel = await ctx.db.get(args.userLevelId);
    if (!targetUserLevel) {
      throw new Error("Invalid user level");
    }

    const now = Date.now();
    const fullName = `${args.firstName} ${args.lastName}`;

    // Create user invitation record
    const invitationId = await ctx.db.insert("userInvitations", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      department: args.department || "General",
      position: args.position || "Community Member",
      phone: args.phone,
      userLevelId: args.userLevelId,
      invitedBy: currentUser._id,
      status: "pending",
      assignInitialTasks: args.assignInitialTasks || false,
      sendWelcomeMessage: args.sendWelcomeMessage || true,
      createdAt: now,
      expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Create audit trail
    await ctx.db.insert("analytics", {
      eventType: "user_invitation_created",
      userId: currentUser._id,
      eventData: {
        action: "user_invitation_created",
        metadata: {
          invitationId,
          targetEmail: args.email,
          targetUserLevel: targetUserLevel.name,
          department: args.department || "General",
        },
      },
      sessionId: identity.subject,
      timestamp: now,
    });

    // In a real implementation, you would send an email invitation here
    // For now, we'll just return the invitation ID
    return invitationId;
  },
});

// Accept user invitation (called when user signs up via Clerk)
export const acceptUserInvitation = mutation({
  args: {
    email: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find pending invitation
    const invitation = await ctx.db
      .query("userInvitations")
      .filter((q: any) => q.and(
        q.eq(q.field("email"), args.email),
        q.eq(q.field("status"), "pending")
      ))
      .first();

    if (!invitation) {
      // No invitation found, create with default WORKER level
      const workerLevel = await ctx.db
        .query("userLevels")
        .filter((q: any) => q.eq(q.field("name"), "WORKER"))
        .first();

      if (!workerLevel) {
        throw new Error("Default WORKER user level not found");
      }

      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.email.split('@')[0], // Temporary name
        userLevel: workerLevel._id,
        department: "General",
        position: "Community Member",
        phone: undefined,
        isActive: true,
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

      return userId;
    }

    // Check if invitation is expired
    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    const now = Date.now();
    const fullName = `${invitation.firstName} ${invitation.lastName}`;

    // Create user with invitation details
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: fullName,
      userLevel: invitation.userLevelId,
      department: invitation.department,
      position: invitation.position,
      phone: invitation.phone,
      isActive: true,
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

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
      userId: userId,
    });

    // Assign initial tasks if requested
    if (invitation.assignInitialTasks) {
      await assignInitialTasksForUser(ctx, userId, invitation.userLevelId);
    }

    // Create welcome notification if requested
    if (invitation.sendWelcomeMessage) {
      await ctx.db.insert("notifications", {
        userId: userId,
        type: "welcome",
        category: "system",
        title: "Welcome to BarangayLink!",
        message: `Welcome ${fullName}! Your account has been created successfully. Start exploring your dashboard to get familiar with the system.`,
        isRead: false,
        createdAt: now,
      });
    }

    return userId;
  },
});

// Helper function to assign initial tasks
const assignInitialTasksForUser = async (ctx: any, userId: any, userLevelId: any) => {
  const userLevel = await ctx.db.get(userLevelId);
  if (!userLevel) return;

  const now = Date.now();
  const initialTasks = getInitialTasksForLevel(userLevel.name);

  for (const taskData of initialTasks) {
    await ctx.db.insert("tasks", {
      title: taskData.title,
      description: taskData.description,
      assignedTo: userId,
      createdBy: userId, // Self-assigned initial tasks
      status: "pending",
      priority: taskData.priority,
      difficulty: taskData.difficulty,
      experienceReward: taskData.experienceReward,
      goldReward: taskData.goldReward,
      category: taskData.category,
      estimatedHours: taskData.estimatedHours,
      dueDate: now + (taskData.dueDays * 24 * 60 * 60 * 1000),
      createdAt: now,
      metadata: {
        isInitialTask: true,
        userLevel: userLevel.name,
      },
    });
  }
};

// Define initial tasks for each user level
const getInitialTasksForLevel = (levelName: string) => {
  const taskSets = {
    WORKER: [
      {
        title: "Complete Your Profile",
        description: "Add your personal information and preferences to your profile",
        priority: "high",
        difficulty: "easy",
        experienceReward: 50,
        goldReward: 10,
        category: "onboarding",
        estimatedHours: 0.5,
        dueDays: 3,
      },
      {
        title: "Join Community Chat",
        description: "Introduce yourself in the community chat and meet other members",
        priority: "medium",
        difficulty: "easy",
        experienceReward: 25,
        goldReward: 5,
        category: "social",
        estimatedHours: 0.25,
        dueDays: 7,
      },
    ],
    BUILDER: [
      {
        title: "Complete Your Profile",
        description: "Add your personal information and project management preferences",
        priority: "high",
        difficulty: "easy",
        experienceReward: 50,
        goldReward: 10,
        category: "onboarding",
        estimatedHours: 0.5,
        dueDays: 3,
      },
      {
        title: "Create Your First Project",
        description: "Set up a sample project to familiarize yourself with the project management tools",
        priority: "high",
        difficulty: "medium",
        experienceReward: 100,
        goldReward: 25,
        category: "project_management",
        estimatedHours: 1,
        dueDays: 7,
      },
    ],
    MANAGER: [
      {
        title: "Complete Your Profile",
        description: "Add your management information and team preferences",
        priority: "high",
        difficulty: "easy",
        experienceReward: 50,
        goldReward: 10,
        category: "onboarding",
        estimatedHours: 0.5,
        dueDays: 3,
      },
      {
        title: "Review Team Structure",
        description: "Review your department's team structure and member assignments",
        priority: "high",
        difficulty: "medium",
        experienceReward: 75,
        goldReward: 20,
        category: "management",
        estimatedHours: 1,
        dueDays: 5,
      },
    ],
    ADMIN: [
      {
        title: "Complete System Setup",
        description: "Review and configure system-wide settings and preferences",
        priority: "high",
        difficulty: "medium",
        experienceReward: 100,
        goldReward: 30,
        category: "administration",
        estimatedHours: 2,
        dueDays: 3,
      },
      {
        title: "Review User Management",
        description: "Familiarize yourself with user management and permission systems",
        priority: "high",
        difficulty: "medium",
        experienceReward: 75,
        goldReward: 25,
        category: "administration",
        estimatedHours: 1,
        dueDays: 5,
      },
    ],
  };

  return taskSets[levelName as keyof typeof taskSets] || taskSets.WORKER;
};
