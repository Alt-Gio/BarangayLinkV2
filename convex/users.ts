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
    console.log('createOrUpdateUser called:', { email, department, role });
    
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
          console.log('Updated user level to:', roleLevel.name);
        }
      }
      
      await ctx.db.patch(existingUser._id, updateData);
      console.log('Updated existing user:', email);
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
        console.log('Looking for role level:', role.toUpperCase());
        const roleLevel = await ctx.db
          .query("userLevels")
          .filter((q) => q.eq(q.field("name"), role.toUpperCase()))
          .first();
        if (roleLevel) {
          selectedUserLevel = roleLevel;
          console.log('Found and assigned user level:', roleLevel.name);
        } else {
          console.log('Role level not found, using WORKER as default');
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

      console.log('Created new user:', { 
        email, 
        department: department || "General", 
        role: selectedUserLevel.name 
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
    console.log('Webhook data received for user:', user.email_addresses?.[0]?.email_address);
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), user.id))
      .first();

    // Get role from user metadata
    const userRole = user.unsafe_metadata?.role;
    console.log('User role from webhook:', userRole);

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
        console.log('Webhook: Using role level:', roleLevel.name);
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
      console.log('Webhook: Updated existing user');
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
        console.log('Webhook: Created welcome notification');
      } catch (error) {
        console.log("Webhook: Notifications table not available, skipping welcome notification");
      }

      console.log('Webhook: Created new user:', {
        email: userData.email,
        department: userData.department,
        role: selectedUserLevel.name
      });
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
    console.log('🔄 syncUserFromClerk called with:', {
      email: args.email,
      department: args.department,
      role: args.role,
      jobTitle: args.jobTitle
    });

    // Get appropriate user level based on exact role match
    let userLevel = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("name"), "WORKER"))
      .first();

    if (args.role && typeof args.role === 'string') {
      const roleUpperCase = args.role.toUpperCase();
      console.log('🔍 Looking for user level:', roleUpperCase);
      
      const roleLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), roleUpperCase))
        .first();
      
      if (roleLevel) {
        userLevel = roleLevel;
        console.log('✅ Found user level:', roleLevel.name, 'Level:', roleLevel.level);
      } else {
        console.log('❌ User level not found for role:', roleUpperCase);
        // List available user levels for debugging
        const allLevels = await ctx.db.query("userLevels").collect();
        console.log('Available user levels:', allLevels.map(l => l.name));
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

    console.log('📝 Final user data to be saved:', {
      email: userData.email,
      department: userData.department,
      userLevelId: userLevel._id,
      userLevelName: userLevel.name,
      position: userData.position
    });

    if (existingUser) {
      await ctx.db.patch(existingUser._id, userData);
      console.log('✅ Updated existing user in database');
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
        console.log('✅ Created welcome notification');
      } catch (error) {
        console.log("⚠️ Notifications table not available, skipping welcome notification");
      }

      console.log('🎉 Successfully created new user:', {
        userId,
        email: userData.email,
        department: userData.department,
        role: userLevel.name
      });
      
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
      console.log('🗑️ Deleted user:', user.email);
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
      console.log("Analytics table not available, skipping audit trail");
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
      console.log("Analytics table not available, skipping audit trail");
    }
    return userId;
  },
});

// Debug function to check user levels (for development)
export const debugUserLevels = query({
  args: {},
  handler: async (ctx) => {
    const userLevels = await ctx.db.query("userLevels").collect();
    console.log('Available user levels:', userLevels.map(l => ({
      name: l.name,
      level: l.level,
      id: l._id
    })));
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