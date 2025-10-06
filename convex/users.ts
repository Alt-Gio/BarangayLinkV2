import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Sync user from Clerk to Convex
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, firstName, lastName, imageUrl, phone, department, jobTitle, role }) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first();

    const now = Date.now();
    const fullName = `${firstName} ${lastName}`;

    if (existingUser) {
      // Update existing user
      const updateData: any = {
        email,
        name: fullName,
        metadata: {
          ...existingUser.metadata,
          lastLogin: now,
        },
      };
      
      // Only update these fields if they're provided
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (phone !== undefined) updateData.phone = phone;
      if (department !== undefined) updateData.department = department;
      if (jobTitle !== undefined) updateData.position = jobTitle;
      
      // Handle role update
      if (role) {
        const roleLevel = await ctx.db
          .query("userLevels")
          .filter((q) => q.eq(q.field("name"), role.toUpperCase()))
          .first();
        if (roleLevel) {
          updateData.userLevel = roleLevel._id;
        }
      }
      
      await ctx.db.patch(existingUser._id, updateData);
      return existingUser._id;
    } else {
      // Get default WORKER user level
      let selectedUserLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), "WORKER"))
        .first();

      if (!selectedUserLevel) {
        throw new Error("Default WORKER user level not found. Please seed user levels first.");
      }

      // Determine user level based on role
      if (role) {
        const roleLevel = await ctx.db
          .query("userLevels")
          .filter((q) => q.eq(q.field("name"), role.toUpperCase()))
          .first();
        if (roleLevel) {
          selectedUserLevel = roleLevel;
        }
      }

      // Create new user with appropriate level
      const userId = await ctx.db.insert("users", {
        clerkId,
        email,
        name: fullName,
        userLevel: selectedUserLevel._id,
        department: department || "General",
        position: jobTitle || "Community Member",
        phone: phone || undefined,
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
          preferences: {
            notifications: true,
            theme: "light",
          },
        },
        imageUrl: imageUrl || undefined,
      });

      return userId;
    }
  },
});

// Internal mutation to handle Clerk webhook data
export const createOrUpdateFromClerk = internalMutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) => {
    const user = data;
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), user.id))
      .first();

    // Get role from user metadata
    const userRole = user.unsafe_metadata?.role;

    // Get appropriate user level based on role
    let selectedUserLevel = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("name"), "WORKER"))
      .first();

    if (userRole && typeof userRole === 'string') {
      const roleLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), userRole.toUpperCase()))
        .first();
      if (roleLevel) {
        selectedUserLevel = roleLevel;
      }
    }

    if (!selectedUserLevel) {
      throw new Error("WORKER user level not found. Please run database initialization.");
    }

    const now = Date.now();
    const userData = {
      clerkId: user.id,
      email: user.email_addresses?.[0]?.email_address || "",
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "New User",
      userLevel: selectedUserLevel._id,
      department: user.unsafe_metadata?.department || "General",
      position: user.unsafe_metadata?.jobTitle || "Community Member",
      phone: user.unsafe_metadata?.phone || user.phone_numbers?.[0]?.phone_number,
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
      imageUrl: user.image_url,
      metadata: {
        lastLogin: now,
        preferences: {
          notifications: true,
          theme: "light",
        },
      },
    };

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        ...userData,
        metadata: {
          ...existingUser.metadata,
          lastLogin: now,
        },
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", userData);
      
      // Create welcome notification if notifications table exists
      try {
        await ctx.db.insert("notifications", {
          userId,
          title: "Welcome to BarangayLink!",
          message: `Welcome to our community management system. You are now a ${selectedUserLevel.name} in ${userData.department}.`,
          type: "welcome",
          category: "system",
          isRead: false,
          createdAt: now,
        });
      } catch (error) {
        // Notifications table not available, skipping
      }

      return userId;
    }
  },
});

// Public mutation for manual user creation/sync (MAIN REGISTRATION FUNCTION)
export const syncUserFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    role: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get appropriate user level based on exact role match
    let userLevel = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("name"), "WORKER"))
      .first();

    if (args.role && typeof args.role === 'string') {
      const roleUpperCase = args.role.toUpperCase();
      
      const roleLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), roleUpperCase))
        .first();
      
      if (roleLevel) {
        userLevel = roleLevel;
      }
    }

    if (!userLevel) {
      throw new Error("User level not found. Please run database initialization.");
    }

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    const now = Date.now();
    const userData = {
      clerkId: args.clerkId,
      email: args.email,
      name: `${args.firstName} ${args.lastName}`.trim(),
      userLevel: userLevel._id,
      department: args.department || "General", // Exact department match
      position: args.jobTitle || "Community Member",
      phone: args.phone,
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
      imageUrl: args.imageUrl,
      metadata: {
        lastLogin: now,
        preferences: {
          notifications: true,
          theme: "light",
        },
      },
    };

    if (existingUser) {
      await ctx.db.patch(existingUser._id, userData);
      return existingUser._id;
    } else {
      const userId = await ctx.db.insert("users", userData);
      
      // Create welcome notification if possible
      try {
        await ctx.db.insert("notifications", {
          userId,
          title: "Welcome to BarangayLink!",
          message: `Welcome to our community management system. You are now a ${userLevel.name} in the ${userData.department} department.`,
          type: "welcome",
          category: "system",
          isRead: false,
          createdAt: now,
        });
      } catch (error) {
        // Notifications table not available
      }
      
      return userId;
    }
  },
});

// Delete user (for webhook)
export const deleteUser = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkUserId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
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

    // Create audit trail if analytics table exists
    try {
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
    } catch (error) {
      // Analytics table not available
    }

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

    // Create audit trail if analytics table exists
    try {
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
    } catch (error) {
      // Analytics table not available
    }
    return userId;
  },
});

// Debug function to check user levels (for development)
export const debugUserLevels = query({
  args: {},
  handler: async (ctx) => {
    const userLevels = await ctx.db.query("userLevels").collect();
    return userLevels;
  },
});

// Get user level by ID
export const getUserLevel = query({
  args: { levelId: v.id("userLevels") },
  handler: async (ctx, { levelId }) => {
    return await ctx.db.get(levelId);
  },
});

// Create user if doesn't exist (for dashboard initialization)
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
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (user) {
      return user._id;
    }

    // Get WORKER level
    const workerLevel = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("name"), "WORKER"))
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
        .filter((q) => q.eq(q.field("name"), role.toUpperCase()))
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
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
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
      .filter((q) => q.eq(q.field("email"), args.email))
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
    try {
      await ctx.db.insert("analytics", {
        eventType: "user_invitation_created",
        userId: currentUser._id,
        eventData: {
          action: "user_invitation_created",
          metadata: {
            invitationId,
            targetEmail: args.email,
          },
        },
        sessionId: identity.subject,
        timestamp: now,
      });
    } catch (error) {
      // Analytics table might not exist
    }

    return invitationId;
  },
});

// ============================================
// PAGINATED QUERIES (Performance Optimized)
// ============================================

import { createPaginatedResponse, getPaginationParams, paginationArgs } from "./pagination";

// Get paginated users
export const getPaginatedUsers = query({
  args: {
    ...paginationArgs,
    department: v.optional(v.string()),
    userLevelId: v.optional(v.id("userLevels")),
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { page, limit } = getPaginationParams(args.page, args.limit);
    
    // Build filter query
    let query = ctx.db.query("users");
    
    // Collect all users (we'll filter in memory for now)
    let users = await query.collect();
    
    // Apply filters
    if (args.department) {
      users = users.filter(u => u.department === args.department);
    }
    if (args.userLevelId) {
      users = users.filter(u => u.userLevel === args.userLevelId);
    }
    if (args.isActive !== undefined) {
      users = users.filter(u => u.isActive === args.isActive);
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    if (args.sortBy === "name") {
      users.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      users.sort((a, b) => b._creationTime - a._creationTime);
    }
    
    if (args.sortOrder === "asc") {
      users.reverse();
    }
    
    return createPaginatedResponse(users, page, limit);
  },
});

// Get paginated users with level details
export const getPaginatedUsersWithLevels = query({
  args: paginationArgs,
  handler: async (ctx, args) => {
    const { page, limit } = getPaginationParams(args.page, args.limit);
    
    const users = await ctx.db.query("users").collect();
    
    // Enrich with user level details
    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );
    
    // Sort by creation time
    usersWithLevels.sort((a, b) => b._creationTime - a._creationTime);
    
    return createPaginatedResponse(usersWithLevels, page, limit);
  },
});