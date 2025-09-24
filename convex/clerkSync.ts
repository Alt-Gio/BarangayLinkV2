import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Manually sync all existing Clerk users to Convex
export const syncAllClerkUsers = mutation({
  args: {
    users: v.array(v.object({
      clerkId: v.string(),
      email: v.string(),
      name: v.string(),
      imageUrl: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    console.log(`🔄 Starting sync of ${args.users.length} users from Clerk...`);
    
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
    };

    for (const userData of args.users) {
      try {
        // Check if user already exists
        const existingUser = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("clerkId"), userData.clerkId))
          .first();

        if (existingUser) {
          // Update existing user
          await ctx.db.patch(existingUser._id, {
            email: userData.email,
            name: userData.name,
            imageUrl: userData.imageUrl,
            metadata: {
              ...existingUser.metadata,
              lastLogin: Date.now(),
            },
          });
          results.updated++;
          console.log(`✅ Updated user: ${userData.email}`);
        } else {
          // Create new user with WORKER level
          const workerLevel = await ctx.db
            .query("userLevels")
            .filter((q) => q.eq(q.field("name"), "WORKER"))
            .first();

          if (!workerLevel) {
            throw new Error("WORKER user level not found. Please initialize user levels first.");
          }

          const userId = await ctx.db.insert("users", {
            clerkId: userData.clerkId,
            email: userData.email,
            name: userData.name,
            userLevel: workerLevel._id,
            department: "General",
            position: "Community Member",
            isActive: true,
            level: 1,
            experience: 0,
            gold: 100,
            health: 100,
            mana: 50,
            streakCount: 0,
            lastActiveDate: Date.now(),
            totalTasksCompleted: 0,
            totalHoursLogged: 0,
            projectSuccessRate: 0,
            imageUrl: userData.imageUrl,
            metadata: {
              lastLogin: Date.now(),
              preferences: {
                notifications: true,
                theme: "light",
              },
            },
          });

          // Create welcome notification
          await ctx.db.insert("notifications", {
            userId,
            title: "Welcome to BarangayLink!",
            message: "Welcome to our community management system. Start by exploring your dashboard and joining community activities.",
            type: "welcome",
            category: "system",
            isRead: false,
            createdAt: Date.now(),
          });

          results.created++;
          console.log(`✅ Created user: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync user ${userData.email}:`, error);
        results.errors++;
      }
    }

    console.log(`🎉 Sync completed: ${results.created} created, ${results.updated} updated, ${results.errors} errors`);
    return results;
  },
});

// Get all users from Convex for comparison
export const getAllConvexUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      createdAt: user._creationTime,
    }));
  },
});

// Check sync status between Clerk and Convex
export const getSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    const convexUsers = await ctx.db.query("users").collect();
    const userLevels = await ctx.db.query("userLevels").collect();
    
    return {
      convexUserCount: convexUsers.length,
      userLevelsCount: userLevels.length,
      userLevels: userLevels.map(level => ({
        name: level.name,
        permissions: level.permissions,
      })),
      recentUsers: convexUsers
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 5)
        .map(user => ({
          email: user.email,
          name: user.name,
          createdAt: new Date(user._creationTime).toISOString(),
        })),
    };
  },
});
