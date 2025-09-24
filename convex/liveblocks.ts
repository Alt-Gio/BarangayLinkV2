import { query } from "./_generated/server";
import { v } from "convex/values";

// Simple function to get active users for collaboration
export const getActiveUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return users.map(user => ({
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      department: user.department,
      position: user.position,
    }));
  },
});

// Get user by Clerk ID with user level
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) return null;

    // Get user level details
    const userLevel = await ctx.db.get(user.userLevel);

    return {
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      department: user.department,
      position: user.position,
      level: user.level,
      experience: user.experience,
      userLevel: userLevel,
    };
  },
});
