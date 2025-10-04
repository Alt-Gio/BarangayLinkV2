import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// COMPREHENSIVE DATABASE MANAGER FOR BARANGAYLINK V2
// ============================================================================

// Initialize complete database with all required data
export const initializeDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Starting complete database initialization...");
    
    try {
      // Step 1: Initialize User Levels
      await initUserLevels(ctx);
      
      // Step 2: Initialize Sample Data
      await initSampleData(ctx);
      
      // Step 3: Initialize Chat Rooms
      await initChatRooms(ctx);
      
      // Step 4: Initialize Projects
      await initProjects(ctx);
      
      // Step 5: Initialize Events
      await initEvents(ctx);
      
      console.log("✅ Database initialization completed successfully!");
      
      return {
        success: true,
        message: "Database fully initialized with all required data",
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Initialize User Levels with complete permissions
async function initUserLevels(ctx: any) {
  const existingLevels = await ctx.db.query("userLevels").collect();
  if (existingLevels.length > 0) {
    console.log("📋 User levels already exist, skipping...");
    return;
  }

  const userLevels = [
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
        "documents:read",
        "notifications:read"
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
        "projects:create",
        "tasks:create",
        "tasks:read",
        "tasks:update",
        "tasks:delete",
        "events:read",
        "events:update",
        "events:create",
        "financials:read",
        "financials:create",
        "chat:create",
        "chat:read",
        "chat:moderate",
        "documents:create",
        "documents:read",
        "documents:update",
        "notifications:read",
        "notifications:create"
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
        "users:view",
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
        "financials:approve",
        "chat:create",
        "chat:read",
        "chat:moderate",
        "analytics:read",
        "analytics:view",
        "documents:create",
        "documents:read",
        "documents:update",
        "documents:delete",
        "notifications:read",
        "notifications:create",
        "notifications:manage"
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
        "users:view",
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
        "chat:admin",
        "analytics:read",
        "analytics:view",
        "analytics:manage",
        "documents:create",
        "documents:read",
        "documents:update",
        "documents:delete",
        "notifications:read",
        "notifications:create",
        "notifications:manage",
        "notifications:system"
      ],
      description: "System administrator with full access to all features and settings",
      isActive: true,
    }
  ];

  for (const level of userLevels) {
    await ctx.db.insert("userLevels", level);
  }
  
  console.log("✅ User levels initialized successfully");
}

// Initialize sample data for development
async function initSampleData(ctx: any) {
  const existingUsers = await ctx.db.query("users").collect();
  if (existingUsers.length > 5) {
    console.log("👥 Sample users already exist, skipping...");
    return;
  }

  const userLevels = await ctx.db.query("userLevels").collect();
  const workerLevel = userLevels.find((level: any) => level.name === "WORKER");
  const builderLevel = userLevels.find((level: any) => level.name === "BUILDER");
  const managerLevel = userLevels.find((level: any) => level.name === "MANAGER");
  const adminLevel = userLevels.find((level: any) => level.name === "ADMIN");

  if (!workerLevel || !builderLevel || !managerLevel || !adminLevel) {
    throw new Error("User levels not found. Please initialize user levels first.");
  }

  const sampleUsers = [
    {
      clerkId: "sample_admin_1",
      email: "admin@barangaylink.local",
      name: "System Administrator",
      userLevel: adminLevel._id,
      department: "Administration",
      position: "System Administrator",
      phone: "+63912345001",
      isActive: true,
      level: 10,
      experience: 5000,
      gold: 1000,
      health: 100,
      mana: 100,
      streakCount: 30,
      lastActiveDate: Date.now(),
      totalTasksCompleted: 50,
      totalHoursLogged: 200,
      projectSuccessRate: 95,
      metadata: {
        lastLogin: Date.now(),
        preferences: { theme: "dark", notifications: true },
      },
    },
    {
      clerkId: "sample_manager_1",
      email: "manager@barangaylink.local",
      name: "Department Manager",
      userLevel: managerLevel._id,
      department: "Community Services",
      position: "Department Manager",
      phone: "+63912345002",
      isActive: true,
      level: 7,
      experience: 3500,
      gold: 750,
      health: 100,
      mana: 80,
      streakCount: 20,
      lastActiveDate: Date.now(),
      totalTasksCompleted: 35,
      totalHoursLogged: 150,
      projectSuccessRate: 88,
      metadata: {
        lastLogin: Date.now(),
        preferences: { theme: "light", notifications: true },
      },
    },
    {
      clerkId: "sample_builder_1",
      email: "builder@barangaylink.local",
      name: "Project Builder",
      userLevel: builderLevel._id,
      department: "Infrastructure",
      position: "Project Coordinator",
      phone: "+63912345003",
      isActive: true,
      level: 5,
      experience: 2500,
      gold: 500,
      health: 100,
      mana: 70,
      streakCount: 15,
      lastActiveDate: Date.now(),
      totalTasksCompleted: 25,
      totalHoursLogged: 100,
      projectSuccessRate: 82,
      metadata: {
        lastLogin: Date.now(),
        preferences: { theme: "dark", notifications: true },
      },
    },
    {
      clerkId: "sample_worker_1",
      email: "worker@barangaylink.local",
      name: "Community Worker",
      userLevel: workerLevel._id,
      department: "General",
      position: "Community Member",
      phone: "+63912345004",
      isActive: true,
      level: 3,
      experience: 1500,
      gold: 300,
      health: 100,
      mana: 50,
      streakCount: 10,
      lastActiveDate: Date.now(),
      totalTasksCompleted: 15,
      totalHoursLogged: 60,
      projectSuccessRate: 75,
      metadata: {
        lastLogin: Date.now(),
        preferences: { theme: "light", notifications: false },
      },
    }
  ];

  for (const user of sampleUsers) {
    await ctx.db.insert("users", user);
  }

  console.log("✅ Sample users initialized successfully");
}

// Initialize chat rooms
async function initChatRooms(ctx: any) {
  const existingRooms = await ctx.db.query("chatRooms").collect();
  if (existingRooms.length > 0) {
    console.log("💬 Chat rooms already exist, skipping...");
    return;
  }

  const adminUser = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), "admin@barangaylink.local")).first();
  if (!adminUser) {
    console.log("⚠️ Admin user not found, skipping chat room creation");
    return;
  }

  const chatRooms = [
    {
      name: "General Discussion",
      type: "general",
      participants: [],
      createdBy: adminUser._id,
      isActive: true,
      lastMessage: "Welcome to BarangayLink! This is the general discussion room.",
      lastMessageAt: Date.now(),
    },
    {
      name: "Project Updates",
      type: "general",
      participants: [],
      createdBy: adminUser._id,
      isActive: true,
      lastMessage: "Share your project updates and progress here.",
      lastMessageAt: Date.now(),
    },
    {
      name: "Community Events",
      type: "general",
      participants: [],
      createdBy: adminUser._id,
      isActive: true,
      lastMessage: "Discuss upcoming community events and activities.",
      lastMessageAt: Date.now(),
    }
  ];

  for (const room of chatRooms) {
    await ctx.db.insert("chatRooms", room);
  }

  console.log("✅ Chat rooms initialized successfully");
}

// Initialize sample projects
async function initProjects(ctx: any) {
  const existingProjects = await ctx.db.query("projects").collect();
  if (existingProjects.length > 0) {
    console.log("🏗️ Projects already exist, skipping...");
    return;
  }

  const adminUser = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), "admin@barangaylink.local")).first();
  const managerUser = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), "manager@barangaylink.local")).first();
  
  if (!adminUser || !managerUser) {
    console.log("⚠️ Required users not found, skipping project creation");
    return;
  }

  const projects = [
    {
      title: "Community Garden Expansion",
      description: "Expand the existing community garden to accommodate more families and introduce sustainable farming practices.",
      status: "active",
      priority: "high",
      budget: 50000,
      spent: 15000,
      startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
      location: "Community Center Backyard",
      coordinates: { latitude: 14.5995, longitude: 120.9842 },
      createdBy: adminUser._id,
      assignedTo: [managerUser._id],
      department: "Community Services",
      tags: ["environment", "sustainability", "community"],
      attachments: [],
      progress: 30,
      liveblocksRoom: "project_garden_expansion",
      isPublic: true,
    },
    {
      title: "Youth Sports Program",
      description: "Establish a comprehensive sports program for youth aged 10-18 with regular tournaments and training sessions.",
      status: "draft",
      priority: "medium",
      budget: 75000,
      spent: 5000,
      startDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: Date.now() + (120 * 24 * 60 * 60 * 1000), // 120 days from now
      location: "Barangay Sports Complex",
      coordinates: { latitude: 14.6042, longitude: 120.9822 },
      createdBy: managerUser._id,
      assignedTo: [adminUser._id, managerUser._id],
      department: "Youth Development",
      tags: ["sports", "youth", "health", "community"],
      attachments: [],
      progress: 10,
      liveblocksRoom: "project_youth_sports",
      isPublic: true,
    },
    {
      title: "Senior Center Renovation",
      description: "Complete renovation of the senior center including accessibility improvements and modern facilities.",
      status: "active",
      priority: "high",
      budget: 100000,
      spent: 80000,
      startDate: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      location: "Senior Center Building",
      coordinates: { latitude: 14.5985, longitude: 120.9852 },
      createdBy: adminUser._id,
      assignedTo: [managerUser._id],
      department: "Infrastructure",
      tags: ["renovation", "seniors", "accessibility"],
      attachments: [],
      progress: 85,
      liveblocksRoom: "project_senior_renovation",
      isPublic: true,
    }
  ];

  for (const project of projects) {
    await ctx.db.insert("projects", project);
  }

  console.log("✅ Sample projects initialized successfully");
}

// Initialize sample events
async function initEvents(ctx: any) {
  const existingEvents = await ctx.db.query("events").collect();
  if (existingEvents.length > 0) {
    console.log("📅 Events already exist, skipping...");
    return;
  }

  const adminUser = await ctx.db.query("users").filter((q: any) => q.eq(q.field("email"), "admin@barangaylink.local")).first();
  
  if (!adminUser) {
    console.log("⚠️ Admin user not found, skipping event creation");
    return;
  }

  const events = [
    {
      title: "Monthly Community Meeting",
      description: "Regular monthly meeting to discuss community issues, project updates, and upcoming initiatives.",
      type: "meeting",
      startDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: Date.now() + (7 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000), // 2 hours duration
      location: "Community Center Main Hall",
      coordinates: { latitude: 14.5995, longitude: 120.9842 },
      organizer: adminUser._id,
      attendees: [],
      maxAttendees: 100,
      isPublic: true,
      requiresApproval: false,
      status: "published",
      attachments: [],
    },
    {
      title: "Community Clean-up Drive",
      description: "Join us for our quarterly community clean-up drive. Help keep our barangay clean and beautiful!",
      type: "community",
      startDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days from now
      endDate: Date.now() + (14 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000), // 4 hours duration
      location: "Various locations throughout the barangay",
      coordinates: { latitude: 14.6000, longitude: 120.9840 },
      organizer: adminUser._id,
      attendees: [],
      maxAttendees: 50,
      isPublic: true,
      requiresApproval: false,
      status: "published",
      attachments: [],
    },
    {
      title: "Youth Basketball Tournament",
      description: "Annual basketball tournament for youth aged 15-21. Prizes and trophies for winners!",
      type: "community",
      startDate: Date.now() + (21 * 24 * 60 * 60 * 1000), // 21 days from now
      endDate: Date.now() + (23 * 24 * 60 * 60 * 1000), // 3-day tournament
      location: "Barangay Basketball Court",
      coordinates: { latitude: 14.6010, longitude: 120.9830 },
      organizer: adminUser._id,
      attendees: [],
      maxAttendees: 200,
      isPublic: true,
      requiresApproval: true,
      status: "published",
      attachments: [],
    }
  ];

  for (const event of events) {
    await ctx.db.insert("events", event);
  }

  console.log("✅ Sample events initialized successfully");
}

// Get complete database status
export const getDatabaseStatus = query({
  args: {},
  handler: async (ctx) => {
    const userLevels = await ctx.db.query("userLevels").collect();
    const users = await ctx.db.query("users").collect();
    const projects = await ctx.db.query("projects").collect();
    const events = await ctx.db.query("events").collect();
    const chatRooms = await ctx.db.query("chatRooms").collect();
    const userSessions = await ctx.db.query("userSessions").collect();
    const messages = await ctx.db.query("messages").collect();
    const notifications = await ctx.db.query("notifications").collect();

    return {
      status: "connected",
      timestamp: Date.now(),
      tables: {
        userLevels: userLevels.length,
        users: users.length,
        projects: projects.length,
        events: events.length,
        chatRooms: chatRooms.length,
        userSessions: userSessions.length,
        messages: messages.length,
        notifications: notifications.length,
      },
      isInitialized: userLevels.length > 0 && users.length > 0,
      lastUpdate: Math.max(
        ...users.map(u => u.metadata?.lastLogin || 0),
        ...userSessions.map(s => s.loginTime || 0)
      )
    };
  },
});

// Sync user data from Clerk to Convex
export const syncUserFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        metadata: {
          ...existingUser.metadata,
          lastLogin: Date.now(),
        },
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    } else {
      // Create new user with WORKER level
      const workerLevel = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("name"), "WORKER"))
        .first();

      if (!workerLevel) {
        throw new Error("WORKER user level not found. Please initialize the database first.");
      }

      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        userLevel: workerLevel._id,
        department: "General",
        position: "Community Member",
        isActive: true,
        level: 1,
        experience: 0,
        gold: 50,
        health: 100,
        mana: 50,
        streakCount: 0,
        lastActiveDate: Date.now(),
        totalTasksCompleted: 0,
        totalHoursLogged: 0,
        projectSuccessRate: 0,
        metadata: {
          lastLogin: Date.now(),
          preferences: {},
        },
        imageUrl: args.imageUrl,
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

      return userId;
    }
  },
});

// Clean up old data (maintenance function)
export const cleanupOldData = mutation({
  args: {
    daysOld: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysOld = args.daysOld || 30;
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    // Clean up old inactive sessions
    const oldSessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), false),
        q.lt(q.field("loginTime"), cutoffDate)
      ))
      .collect();

    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    // Clean up old read notifications
    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.and(
        q.eq(q.field("isRead"), true),
        q.lt(q.field("createdAt"), cutoffDate)
      ))
      .collect();

    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
    }

    return {
      success: true,
      cleaned: {
        sessions: oldSessions.length,
        notifications: oldNotifications.length,
      },
      cutoffDate,
    };
  },
});

// Export all data (backup function)
export const exportAllData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (!userLevel || !userLevel.permissions.includes("system:manage")) {
      throw new Error("Insufficient permissions for data export");
    }

    // Export all data
    const data = {
      userLevels: await ctx.db.query("userLevels").collect(),
      users: await ctx.db.query("users").collect(),
      projects: await ctx.db.query("projects").collect(),
      events: await ctx.db.query("events").collect(),
      chatRooms: await ctx.db.query("chatRooms").collect(),
      messages: await ctx.db.query("messages").collect(),
      notifications: await ctx.db.query("notifications").collect(),
      userSessions: await ctx.db.query("userSessions").collect(),
      exportDate: Date.now(),
      exportedBy: currentUser._id,
    };

    return data;
  },
});
