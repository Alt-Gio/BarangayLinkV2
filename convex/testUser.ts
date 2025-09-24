import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Test mutation to create a user manually for debugging
export const createTestUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    // Get WORKER level
    const workerLevel = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("name"), "WORKER"))
      .first();

    if (!workerLevel) {
      throw new Error("WORKER level not found");
    }

    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      name,
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
  },
});

// Test query to get all users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Test query to get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first();
  },
});
