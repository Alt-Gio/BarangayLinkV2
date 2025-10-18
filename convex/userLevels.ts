import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all user levels
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const levels = await ctx.db
      .query("userLevels")
      .collect();
    
    // Sort by level number in descending order (ADMIN first, WORKER last)
    return levels.sort((a, b) => b.level - a.level);
  },
});

// Get all user levels (alias for registration page)
export const getAllUserLevels = query({
  args: {},
  handler: async (ctx) => {
    const levels = await ctx.db
      .query("userLevels")
      .collect();
    
    // Sort by level number in descending order (ADMIN first, WORKER last)
    return levels.sort((a, b) => b.level - a.level);
  },
});

// Add ADMIN role (Recovery function)
export const addAdminRole = mutation({
  args: {},
  handler: async (ctx) => {
    const existingLevels = await ctx.db.query("userLevels").collect();
    
    // Check if ADMIN already exists
    const adminExists = existingLevels.find(level => level.name === "ADMIN");
    
    if (adminExists) {
      return { 
        success: false,
        message: "ADMIN role already exists",
        adminId: adminExists._id
      };
    }
    
    // Add ADMIN role at level 5
    const adminLevel = {
      name: "ADMIN",
      level: 5,
      permissions: [
        "tasks.read", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
        "projects.read", "projects.create", "projects.update", "projects.delete", 
        "users.read", "users.create", "users.update", "users.delete", "users.assign_levels",
        "departments.read", "departments.create", "departments.update", "departments.delete",
        "analytics.read", "system.configure", "system.manage"
      ],
      description: "Full system administrator with all permissions",
      isActive: true,
    };
    
    const adminId = await ctx.db.insert("userLevels", adminLevel);
    
    return { 
      success: true,
      message: "✅ ADMIN role restored successfully!",
      adminId,
      totalLevels: existingLevels.length + 1
    };
  },
});

// Fix users with invalid user level references
export const fixInvalidUserLevels = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const allLevels = await ctx.db.query("userLevels").collect();
    
    let fixedCount = 0;
    let errors = [];
    
    // Get valid level IDs
    const validLevelIds = new Set(allLevels.map(l => l._id.toString()));
    
    // Get WORKER level as default
    const workerLevel = allLevels.find(l => l.name === "WORKER");
    if (!workerLevel) {
      return {
        success: false,
        message: "WORKER level not found. Cannot fix user levels."
      };
    }
    
    for (const user of allUsers) {
      // Check if user's level ID is valid
      if (!validLevelIds.has(user.userLevel.toString())) {
        try {
          // Update user to WORKER level
          await ctx.db.patch(user._id, {
            userLevel: workerLevel._id
          });
          fixedCount++;
        } catch (error: any) {
          errors.push(`Failed to fix user ${user.email}: ${error.message}`);
        }
      }
    }
    
    return {
      success: true,
      message: `✅ Fixed ${fixedCount} users with invalid user levels`,
      fixedCount,
      totalUsers: allUsers.length,
      errors: errors.length > 0 ? errors : undefined
    };
  },
});

// Add CAPTAIN role to existing system (Migration function)
export const addCaptainRole = mutation({
  args: {},
  handler: async (ctx) => {
    const existingLevels = await ctx.db.query("userLevels").collect();
    
    // Check if CAPTAIN already exists
    const captainExists = existingLevels.find(level => level.name === "CAPTAIN");
    
    if (captainExists) {
      return { 
        success: false,
        message: "CAPTAIN role already exists",
        captainId: captainExists._id
      };
    }
    
    // Add CAPTAIN role at level 4
    const captainLevel = {
      name: "CAPTAIN",
      level: 4,
      permissions: [
        "tasks.read", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
        "projects.read", "projects.create", "projects.update", "projects.delete",
        "users.read", "users.create", "users.update", "users.assign_levels",
        "departments.read", "departments.create", "departments.update",
        "events.read", "events.create", "events.update", "events.delete",
        "financials.read", "financials.approve",
        "analytics.read",
        "profile.read", "profile.update_own"
      ],
      description: "Barangay Captain with executive oversight and approval authority",
      isActive: true,
    };
    
    const captainId = await ctx.db.insert("userLevels", captainLevel);
    
    // Update ADMIN level from 4 to 5
    const adminLevel = existingLevels.find(level => level.name === "ADMIN");
    if (adminLevel && adminLevel.level === 4) {
      await ctx.db.patch(adminLevel._id, { level: 5 });
    }
    
    return { 
      success: true,
      message: "✅ CAPTAIN role added successfully!",
      captainId,
      totalLevels: existingLevels.length + 1,
      adminUpdated: adminLevel ? true : false
    };
  },
});

// Seed user levels for initial setup
export const seedUserLevels = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if user levels already exist
    const existingLevels = await ctx.db.query("userLevels").collect();
    
    // Check if CAPTAIN already exists
    const captainExists = existingLevels.find(level => level.name === "CAPTAIN");
    
    if (existingLevels.length >= 5 && captainExists) {
      return { message: "All user levels including CAPTAIN already exist", count: existingLevels.length };
    }
    
    // If we have old 4 levels but no CAPTAIN, we need to add it
    if (existingLevels.length > 0 && !captainExists) {
      // Add CAPTAIN role
      const captainLevel = {
        name: "CAPTAIN",
        level: 4,
        permissions: [
          "tasks.read", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
          "projects.read", "projects.create", "projects.update", "projects.delete",
          "users.read", "users.create", "users.update", "users.assign_levels",
          "departments.read", "departments.create", "departments.update",
          "events.read", "events.create", "events.update", "events.delete",
          "financials.read", "financials.approve",
          "analytics.read",
          "profile.read", "profile.update_own"
        ],
        description: "Barangay Captain with executive oversight and approval authority",
        isActive: true,
      };
      
      const captainId = await ctx.db.insert("userLevels", captainLevel);
      
      // Update ADMIN level to 5 if it exists at level 4
      const adminLevel = existingLevels.find(level => level.name === "ADMIN");
      if (adminLevel && adminLevel.level === 4) {
        await ctx.db.patch(adminLevel._id, { level: 5 });
      }
      
      return { 
        message: "CAPTAIN role added successfully", 
        captainId,
        totalLevels: existingLevels.length + 1
      };
    }

    const userLevels = [
      {
        name: "WORKER",
        level: 1,
        permissions: ["tasks.read", "tasks.update_own", "profile.read", "profile.update_own"],
        description: "Community contributor with task execution access",
        isActive: true,
      },
      {
        name: "BUILDER", 
        level: 2,
        permissions: [
          "tasks.read", "tasks.create", "tasks.update", "tasks.assign",
          "projects.read", "projects.create", "projects.update_own",
          "profile.read", "profile.update_own"
        ],
        description: "Project creator with team coordination capabilities",
        isActive: true,
      },
      {
        name: "MANAGER",
        level: 3,
        permissions: [
          "tasks.read", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
          "projects.read", "projects.create", "projects.update", "projects.delete",
          "users.read", "users.assign_levels",
          "profile.read", "profile.update_own", "departments.read"
        ],
        description: "Strategic leader with full project oversight",
        isActive: true,
      },
      {
        name: "CAPTAIN",
        level: 4,
        permissions: [
          "tasks.read", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
          "projects.read", "projects.create", "projects.update", "projects.delete",
          "users.read", "users.create", "users.update", "users.assign_levels",
          "departments.read", "departments.create", "departments.update",
          "events.read", "events.create", "events.update", "events.delete",
          "financials.read", "financials.approve",
          "analytics.read",
          "profile.read", "profile.update_own"
        ],
        description: "Barangay Captain with executive oversight and approval authority",
        isActive: true,
      },
      {
        name: "ADMIN",
        level: 5,
        permissions: [
          "tasks.read", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign",
          "projects.read", "projects.create", "projects.update", "projects.delete", 
          "users.read", "users.create", "users.update", "users.delete", "users.assign_levels",
          "departments.read", "departments.create", "departments.update", "departments.delete",
          "analytics.read", "system.configure", "system.manage"
        ],
        description: "Full system administrator with all permissions",
        isActive: true,
      }
    ];

    const levelIds = [];
    for (const level of userLevels) {
      const id = await ctx.db.insert("userLevels", {
        ...level,
      });
      levelIds.push(id);
    }

    return { 
      message: "User levels seeded successfully", 
      count: levelIds.length,
      levelIds 
    };
  },
});

// Get user level by ID
export const getById = query({
  args: { id: v.id("userLevels") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Create new user level (Admin only)
export const create = mutation({
  args: {
    name: v.string(),
    level: v.number(),
    description: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, { name, level, description, permissions }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const currentUserLevel = await ctx.db.get(currentUser.userLevel);
    if (!currentUserLevel || !currentUserLevel.permissions.includes("system:manage")) {
      throw new Error("Insufficient permissions. Admin access required.");
    }

    // Check if level number already exists
    const existingLevel = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("level"), level))
      .first();

    if (existingLevel) {
      throw new Error(`User level with level ${level} already exists`);
    }

    const userLevelId = await ctx.db.insert("userLevels", {
      name: name.toUpperCase(),
      level,
      description,
      permissions,
      isActive: true,
    });

    // Create audit trail
    await ctx.db.insert("analytics", {
      eventType: "user_level_created",
      userId: currentUser._id,
      eventData: {
        action: "user_level_created",
        metadata: {
          entityId: userLevelId,
          name,
          level: level.toString(),
          permissionCount: permissions.length.toString(),
        },
      },
      sessionId: identity.subject,
      timestamp: Date.now(),
    });

    return userLevelId;
  },
});

// Update user level (Admin only)
export const update = mutation({
  args: {
    id: v.id("userLevels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, name, description, permissions, isActive }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const currentUserLevel = await ctx.db.get(currentUser.userLevel);
    if (!currentUserLevel || !currentUserLevel.permissions.includes("system:manage")) {
      throw new Error("Insufficient permissions. Admin access required.");
    }

    const existingLevel = await ctx.db.get(id);
    if (!existingLevel) {
      throw new Error("User level not found");
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    await ctx.db.patch(id, updateData);

    // Create audit trail
    await ctx.db.insert("analytics", {
      eventType: "user_level_updated",
      userId: currentUser._id,
      eventData: {
        action: "user_level_updated",
        metadata: {
          entityId: id,
          changes: Object.keys(updateData).join(", "),
          previousName: existingLevel.name,
          newName: name || existingLevel.name,
        },
      },
      sessionId: identity.subject,
      timestamp: Date.now(),
    });

    return id;
  },
});

// Delete user level (Admin only) - Soft delete by setting isActive to false
export const remove = mutation({
  args: { id: v.id("userLevels") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const currentUserLevel = await ctx.db.get(currentUser.userLevel);
    if (!currentUserLevel || !currentUserLevel.permissions.includes("system:manage")) {
      throw new Error("Insufficient permissions. Admin access required.");
    }

    const userLevel = await ctx.db.get(id);
    if (!userLevel) {
      throw new Error("User level not found");
    }

    // Check if any users are assigned to this level
    const usersWithLevel = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userLevel"), id))
      .collect();

    if (usersWithLevel.length > 0) {
      throw new Error(`Cannot delete user level. ${usersWithLevel.length} users are assigned to this level.`);
    }

    // Soft delete
    await ctx.db.patch(id, { isActive: false });

    // Create audit trail
    await ctx.db.insert("analytics", {
      eventType: "user_level_deleted",
      userId: currentUser._id,
      eventData: {
        action: "user_level_deleted",
        metadata: {
          entityId: id,
          levelName: userLevel.name,
          level: userLevel.level.toString(),
        },
      },
      sessionId: identity.subject,
      timestamp: Date.now(),
    });

    return id;
  },
});

// Get available permissions list
export const getAvailablePermissions = query({
  args: {},
  handler: async () => {
    return [
      // System permissions
      "system:manage",
      
      // User permissions
      "users:create",
      "users:read",
      "users:update",
      "users:delete",
      
      // Project permissions
      "projects:create",
      "projects:read",
      "projects:update",
      "projects:delete",
      
      // Task permissions
      "tasks:create",
      "tasks:read",
      "tasks:update",
      "tasks:delete",
      
      // Event permissions
      "events:create",
      "events:read",
      "events:update",
      "events:delete",
      
      // Financial permissions
      "financials:create",
      "financials:read",
      "financials:update",
      "financials:delete",
      "financials:approve",
      
      // Chat permissions
      "chat:create",
      "chat:read",
      "chat:moderate",
      
      // Document permissions
      "documents:create",
      "documents:read",
      "documents:update",
      "documents:delete",
      
      // Analytics permissions
      "analytics:read",
    ];
  },
});
