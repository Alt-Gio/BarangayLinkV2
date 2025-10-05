import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// DEPARTMENT MANAGEMENT
// ============================================

// Create new department
export const createDepartment = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    head: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can create departments");
    }

    // Check if department name already exists
    const existing = await ctx.db
      .query("departments")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error("Department with this name already exists");
    }

    const departmentId = await ctx.db.insert("departments", {
      name: args.name,
      description: args.description,
      category: args.category || "General",
      head: args.head,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      location: args.location,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return departmentId;
  },
});

// Update department
export const updateDepartment = mutation({
  args: {
    id: v.id("departments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    head: v.optional(v.id("users")),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    location: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can update departments");
    }

    const department = await ctx.db.get(id);
    if (!department) {
      throw new Error("Department not found");
    }

    // Check if new name conflicts with existing
    if (updates.name && updates.name !== department.name) {
      const existing = await ctx.db
        .query("departments")
        .filter((q) => q.eq(q.field("name"), updates.name))
        .first();

      if (existing) {
        throw new Error("Department with this name already exists");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete department
export const deleteDepartment = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can delete departments");
    }

    // Check if department has users
    const usersInDept = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("department"), id))
      .collect();

    if (usersInDept.length > 0) {
      throw new Error(
        `Cannot delete department with ${usersInDept.length} active users. Please reassign users first.`
      );
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// Get department with user count
export const getDepartmentWithStats = query({
  args: { id: v.id("departments") },
  handler: async (ctx, { id }) => {
    const department = await ctx.db.get(id);
    if (!department) return null;

    // Count users
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("department"), department.name))
      .collect();

    // Get head user info
    let headInfo = null;
    if (department.head) {
      // head is stored as a string (user name), not an Id
      headInfo = { name: department.head };
    }

    return {
      ...department,
      userCount: users.length,
      headInfo,
    };
  },
});

// Get all departments with stats
export const getAllDepartmentsWithStats = query({
  args: {},
  handler: async (ctx) => {
    const departments = await ctx.db.query("departments").collect();

    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const users = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("department"), dept.name))
          .collect();

        let headInfo = null;
        if (dept.head) {
          // head is stored as a string (user name), not an Id
          headInfo = { name: dept.head };
        }

        return {
          ...dept,
          userCount: users.length,
          headInfo,
        };
      })
    );

    return departmentsWithStats;
  },
});

// ============================================
// USER LEVEL MANAGEMENT
// ============================================

// Update user level
export const updateUserLevel = mutation({
  args: {
    id: v.id("userLevels"),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    permissions: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can update user levels");
    }

    await ctx.db.patch(id, updates);
    return { success: true };
  },
});

// Get all user levels
export const getAllUserLevels = query({
  args: {},
  handler: async (ctx) => {
    const levels = await ctx.db
      .query("userLevels")
      .order("asc")
      .collect();

    // Count users per level
    const levelsWithCounts = await Promise.all(
      levels.map(async (level) => {
        const users = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userLevel"), level._id))
          .collect();

        return {
          ...level,
          userCount: users.length,
        };
      })
    );

    return levelsWithCounts;
  },
});
