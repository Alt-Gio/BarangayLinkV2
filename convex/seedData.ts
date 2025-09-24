import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const seedUserLevels = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if user levels already exist
    const existingLevels = await ctx.db.query("userLevels").collect();
    if (existingLevels.length > 0) {
      console.log("User levels already seeded");
      return { success: true, message: "User levels already exist" };
    }

    const now = Date.now();

    const levels = [
      {
        name: "WORKER",
        level: 1,
        permissions: [
          "users:read",
          "projects:read",
          "tasks:read",
          "tasks:update",
          "events:read",
          "financials:read",
          "chat:create",
          "chat:read",
          "documents:read"
        ],
        description: "Community worker with basic task execution permissions",
        isActive: true,
      },
      {
        name: "BUILDER", 
        level: 2,
        permissions: [
          "users:read",
          "projects:read",
          "projects:update",
          "tasks:create",
          "tasks:read",
          "tasks:update",
          "events:read",
          "events:update",
          "financials:read",
          "financials:create",
          "chat:create",
          "chat:read",
          "documents:create",
          "documents:read",
          "documents:update"
        ],
        description: "Project builder and coordinator with execution responsibilities",
        isActive: true,
      },
      {
        name: "MANAGER",
        level: 3, 
        permissions: [
          "users:read",
          "users:update",
          "projects:create",
          "projects:read",
          "projects:update",
          "tasks:create",
          "tasks:read",
          "tasks:update",
          "tasks:delete",
          "events:create",
          "events:read",
          "events:update",
          "events:delete",
          "financials:create",
          "financials:read",
          "financials:update",
          "chat:create",
          "chat:read",
          "chat:moderate",
          "analytics:read",
          "documents:create",
          "documents:read",
          "documents:update"
        ],
        description: "Department manager with oversight responsibilities",
        isActive: true,
      },
      {
        name: "ADMIN",
        level: 4,
        permissions: [
          "system:manage",
          "users:create",
          "users:read",
          "users:update",
          "users:delete",
          "projects:create",
          "projects:read",
          "projects:update",
          "projects:delete",
          "tasks:create",
          "tasks:read",
          "tasks:update",
          "tasks:delete",
          "events:create",
          "events:read",
          "events:update",
          "events:delete",
          "financials:create",
          "financials:read",
          "financials:update",
          "financials:delete",
          "financials:approve",
          "chat:create",
          "chat:read",
          "chat:moderate",
          "analytics:read",
          "documents:create",
          "documents:read",
          "documents:update",
          "documents:delete"
        ],
        description: "System administrator with full access to all features and settings",
        isActive: true,
      }
    ];

    const insertedLevels = [];
    for (const level of levels) {
      const id = await ctx.db.insert("userLevels", level);
      insertedLevels.push({ id, ...level });
    }

    console.log(`Successfully seeded ${insertedLevels.length} user levels`);
    return { 
      success: true, 
      message: `Seeded ${insertedLevels.length} user levels`,
      levels: insertedLevels 
    };
  },
});

// Seed sample data for development/testing
export const seedSampleData = mutation({
  args: {
    includeTestUsers: v.optional(v.boolean()),
  },
  handler: async (ctx, { includeTestUsers = false }) => {
    // First ensure user levels exist
    const existingLevels = await ctx.db.query("userLevels").collect();
    if (existingLevels.length === 0) {
      // Seed user levels first
      const levels = [
        {
          name: "WORKER",
          level: 1,
          permissions: ["users:read", "projects:read", "tasks:read", "tasks:update", "events:read", "financials:read", "chat:create", "chat:read", "documents:read"],
          description: "Community worker with basic task execution permissions",
          isActive: true,
        },
        {
          name: "BUILDER", 
          level: 2,
          permissions: ["users:read", "projects:read", "projects:update", "tasks:create", "tasks:read", "tasks:update", "events:read", "events:update", "financials:read", "financials:create", "chat:create", "chat:read", "documents:create", "documents:read", "documents:update"],
          description: "Project builder and coordinator with execution responsibilities",
          isActive: true,
        },
        {
          name: "MANAGER",
          level: 3, 
          permissions: ["users:read", "users:update", "projects:create", "projects:read", "projects:update", "tasks:create", "tasks:read", "tasks:update", "tasks:delete", "events:create", "events:read", "events:update", "events:delete", "financials:create", "financials:read", "financials:update", "chat:create", "chat:read", "chat:moderate", "analytics:read", "documents:create", "documents:read", "documents:update"],
          description: "Department manager with oversight responsibilities",
          isActive: true,
        },
        {
          name: "ADMIN",
          level: 4,
          permissions: ["system:manage", "users:create", "users:read", "users:update", "users:delete", "projects:create", "projects:read", "projects:update", "projects:delete", "tasks:create", "tasks:read", "tasks:update", "tasks:delete", "events:create", "events:read", "events:update", "events:delete", "financials:create", "financials:read", "financials:update", "financials:delete", "financials:approve", "chat:create", "chat:read", "chat:moderate", "analytics:read", "documents:create", "documents:read", "documents:update", "documents:delete"],
          description: "System administrator with full access to all features and settings",
          isActive: true,
        }
      ];

      for (const level of levels) {
        await ctx.db.insert("userLevels", level);
      }
    }

    const now = Date.now();
    
    // Get user levels for reference
    const userLevels = await ctx.db.query("userLevels").collect();
    const adminLevel = userLevels.find(level => level.name === "ADMIN");
    const workerLevel = userLevels.find(level => level.name === "WORKER");

    if (!adminLevel) {
      throw new Error("Admin user level not found. Please seed user levels first.");
    }

    if (!workerLevel) {
      throw new Error("Worker user level not found. Please seed user levels first.");
    }

    let sampleData = {
      userLevels: userLevels.length,
      sampleUsers: 0,
      chatRooms: 0,
    };

    // Create sample users if requested
    if (includeTestUsers) {
      const sampleUsers = [];
      for (let i = 1; i <= 10; i++) {
        sampleUsers.push({
          clerkId: `clerk_${i}`,
          email: `user${i}@barangay.local`,
          name: `User ${i}`,
          userLevel: workerLevel._id,
          department: "General",
          position: "Worker",
          phone: `+63912345678${i}`,
          isActive: true,
          // Gamification stats
          level: 1,
          experience: 0,
          gold: 50, // Starting gold
          health: 100,
          mana: 50,
          streakCount: 0,
          totalTasksCompleted: 0,
          totalHoursLogged: 0,
          projectSuccessRate: 0,
          metadata: {
            lastLogin: Date.now(),
            preferences: {},
          },
        });
      }

      for (const user of sampleUsers) {
        await ctx.db.insert("users", user);
      }
      sampleData.sampleUsers = sampleUsers.length;

      // Create sample chat room
      const firstUserId = await ctx.db.query("users").first();
      if (firstUserId) {
        await ctx.db.insert("chatRooms", {
          name: "General Discussion",
          type: "general",
          participants: [],
          createdBy: firstUserId._id,
          isActive: true,
          lastMessage: "Welcome to BarangayLink!",
          lastMessageAt: now,
        });
        sampleData.chatRooms = 1;
      }
    }

    console.log("Sample data seeded successfully");
    return {
      success: true,
      message: "Sample data seeded successfully",
      data: sampleData
    };
  },
});