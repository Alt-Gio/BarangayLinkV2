import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all user levels
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userLevels")
      .order("desc")
      .collect();
  },
});

// Get all user levels (alias for registration page)
export const getAllUserLevels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userLevels")
      .order("desc")
      .collect();
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
