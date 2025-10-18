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
        isActive: false,
        status: "pending",
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
    
    // DEBUG: Log the entire user object to see what we're receiving
    console.log("🔍 WEBHOOK RECEIVED - Full user data:", JSON.stringify({
      id: user.id,
      email: user.email_addresses?.[0]?.email_address,
      firstName: user.first_name,
      lastName: user.last_name,
      unsafeMetadata: user.unsafe_metadata,
      publicMetadata: user.public_metadata,
    }, null, 2));
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), user.id))
      .first();

    // Get role from user metadata - THIS DETERMINES THE ACTUAL USER LEVEL
    const userRole = user.unsafe_metadata?.role;
    const department = user.unsafe_metadata?.department;
    const jobTitle = user.unsafe_metadata?.jobTitle;
    const phone = user.unsafe_metadata?.phone;

    // DEBUG: Log what we extracted
    console.log("📋 EXTRACTED DATA:", {
      userRole,
      department,
      jobTitle,
      phone,
      existingUser: !!existingUser
    });

    // IMPORTANT: Only use defaults if user has NOT provided data during registration
    // If user selected a role, use that exact role - don't default to WORKER
    let selectedUserLevel = null;

    if (userRole && typeof userRole === 'string') {
      // User selected a role during registration - use their choice
      console.log("🔎 Looking for role:", userRole.toUpperCase());
      const roleLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), userRole.toUpperCase()))
        .first();
      if (roleLevel) {
        selectedUserLevel = roleLevel;
        console.log("✅ Found role level:", roleLevel.name, "- Level", roleLevel.level);
      } else {
        console.log("❌ Role not found in database:", userRole.toUpperCase());
      }
    }

    // Only if no role was provided, default to WORKER
    if (!selectedUserLevel) {
      console.log("⚠️ No role found, defaulting to WORKER");
      selectedUserLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), "WORKER"))
        .first();
    }

    if (!selectedUserLevel) {
      throw new Error("User level not found. Please run database initialization.");
    }

    const now = Date.now();
    const userData = {
      clerkId: user.id,
      email: user.email_addresses?.[0]?.email_address || "",
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "New User",
      userLevel: selectedUserLevel._id,
      // Use exact user selections - only default if truly not provided
      department: department || "General",
      position: jobTitle || "Community Member", // jobTitle → position (this is the Job Title they entered)
      phone: phone || user.phone_numbers?.[0]?.phone_number || undefined,
      isActive: false,
      status: "pending" as const,
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

    // DEBUG: Log what we're about to save
    console.log("💾 SAVING TO DATABASE:", {
      name: userData.name,
      email: userData.email,
      department: userData.department,
      position: userData.position,
      phone: userData.phone,
      userLevelName: selectedUserLevel.name,
      userLevelId: selectedUserLevel._id,
    });

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
    // IMPORTANT: Prioritize user's selected role - don't default to WORKER first
    let userLevel = null;

    // If user provided a role, use that exact role
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

    // Only default to WORKER if no role was provided
    if (!userLevel) {
      userLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), "WORKER"))
        .first();
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
      // Use exact values provided by user - position is the Job Title
      department: args.department || "General",
      position: args.jobTitle || "Community Member", // jobTitle from form → position in database
      phone: args.phone || undefined,
      isActive: false,
      status: "pending" as const,
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

    const now = Date.now();
    
    // Extract profile data from Clerk metadata if available
    const clerkMetadata = (identity as any).unsafeMetadata || {};
    const department = clerkMetadata.department;
    const jobTitle = clerkMetadata.jobTitle;
    const phone = clerkMetadata.phone;
    const role = clerkMetadata.role;
    const imageUrl = (identity as any).imageUrl;
    
    // IMPORTANT: Prioritize user's selected role - don't default to WORKER first
    let selectedUserLevel = null;
    
    // If user provided a role during registration, use that exact role
    if (role) {
      const roleLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), role.toUpperCase()))
        .first();
      if (roleLevel) {
        selectedUserLevel = roleLevel;
      }
    }
    
    // Only if no role was provided, default to WORKER
    if (!selectedUserLevel) {
      selectedUserLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), "WORKER"))
        .first();
    }

    if (!selectedUserLevel) {
      throw new Error("User level not found. Please seed user levels first.");
    }
    
    // Check if user has an invitation
    const invitation = await ctx.db
      .query("userInvitations")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    
    // Check for invitation code in metadata
    const invitationCode = clerkMetadata.invitationCode;
    let validInvitation = invitation;
    
    if (invitationCode && !validInvitation) {
      validInvitation = await ctx.db
        .query("userInvitations")
        .withIndex("by_token", (q) => q.eq("invitationToken", invitationCode))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();
    }
    
    // ALWAYS set to pending - admin must approve ALL new users
    const userStatus = "pending";
    const isActive = false;
    
    // If invited, use invitation details
    const finalDepartment = validInvitation?.department || department || "General";
    const finalPosition = validInvitation?.position || jobTitle || "Community Member";
    const finalUserLevel = validInvitation?.userLevelId || selectedUserLevel._id;
    
    // Create new user with profile data from registration
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || `user-${identity.subject}@temp.com`,
      name: identity.name || identity.nickname || "New User",
      userLevel: finalUserLevel,
      // Use exact user selections from registration
      department: finalDepartment,
      position: finalPosition,
      phone: phone || validInvitation?.phone || undefined,
      imageUrl: imageUrl || undefined,
      isActive: isActive,
      status: userStatus,
      registeredViaInvitation: validInvitation ? true : false,
      invitationId: validInvitation?._id,
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
    
    // If user registered with invitation, mark it as accepted
    if (validInvitation) {
      await ctx.db.patch(validInvitation._id, {
        status: "accepted",
        acceptedAt: now,
        userId: userId,
      });
    }
    
    // Always create pending notification - ALL users need admin approval
    await ctx.db.insert("notifications", {
      userId: userId,
      title: "Registration Submitted",
      message: "Your registration is pending admin approval. You will be notified once approved.",
      type: "info",
      category: "account",
      isRead: false,
      createdAt: now,
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

    // Generate unique invitation token
    const invitationToken = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${now}`;

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
      invitationToken,
      status: "pending",
      assignInitialTasks: args.assignInitialTasks || false,
      sendWelcomeMessage: args.sendWelcomeMessage || true,
      createdAt: now,
      expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send invitation email
    try {
      await ctx.scheduler.runAfter(0, "emails:sendInvitationEmail" as any, {
        to: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        invitationToken,
        invitedByName: currentUser.name,
      });
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      // Don't fail the whole invitation if email fails
    }

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

// Search users for adding to projects
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    department: v.optional(v.string()),
    excludeUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("users").collect();

    // Filter by search term (if provided and not empty)
    if (args.searchTerm && args.searchTerm.trim().length > 0) {
      const searchLower = args.searchTerm.toLowerCase().trim();
      users = users.filter(u =>
        (u.name?.toLowerCase().includes(searchLower)) ||
        (u.email?.toLowerCase().includes(searchLower)) ||
        (u.position?.toLowerCase().includes(searchLower)) ||
        (u.department?.toLowerCase().includes(searchLower))
      );
    }

    // Filter by department if specified
    if (args.department) {
      users = users.filter(u => u.department === args.department);
    }

    // Exclude specific users (e.g., already on team)
    if (args.excludeUserIds && args.excludeUserIds.length > 0) {
      users = users.filter(u => !args.excludeUserIds!.includes(u._id));
    }

    // Only active users
    users = users.filter(u => u.isActive);

    // Enrich with user level
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );

    // Sort by name
    enrichedUsers.sort((a, b) => a.name.localeCompare(b.name));

    // Limit results to 50
    return enrichedUsers.slice(0, 50);
  },
});

// Get project team members
export const getProjectTeamMembers = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const teamMemberIds = project.assignedTo || [];

    const members = await Promise.all(
      teamMemberIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );

    return members.filter(m => m !== null);
  },
});

// Get all active users (for debugging/admin)
export const getAllActiveUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevel,
        };
      })
    );

    return enrichedUsers.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get current user status without throwing errors (for status checking)
export const getCurrentUserStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Get user level details
    const userLevel = await ctx.db.get(user.userLevel);

    // Return user with level details - DO NOT throw errors for pending/rejected
    return {
      ...user,
      userLevel: userLevel,
    };
  },
});