import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create sample projects and tasks for testing dashboard
export const createSampleContent = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found. Please ensure user exists first.");
    }

    const now = Date.now();

    // Create sample projects
    const project1 = await ctx.db.insert("projects", {
      title: "Community Garden Initiative",
      description: "Establish a community garden to promote sustainable living and food security",
      status: "active",
      priority: "high",
      startDate: now,
      endDate: now + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      budget: 15000,
      spent: 5000,
      createdBy: user._id,
      assignedTo: [user._id],
      department: "Community Services",
      tags: ["environment", "community", "sustainability"],
      progress: 35,
      location: "Barangay Central Park",
      attachments: [],
      liveblocksRoom: `project_${Date.now()}_1`,
      isPublic: true,
    });

    const project2 = await ctx.db.insert("projects", {
      title: "Digital Literacy Program",
      description: "Provide computer and internet literacy training for residents",
      status: "planning",
      priority: "medium",
      startDate: now + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: now + (60 * 24 * 60 * 60 * 1000), // 60 days from now
      budget: 8000,
      spent: 2000,
      createdBy: user._id,
      assignedTo: [user._id],
      department: "Education",
      tags: ["education", "technology", "training"],
      progress: 10,
      location: "Community Center",
      attachments: [],
      liveblocksRoom: `project_${Date.now()}_2`,
      isPublic: true,
    });

    // Create sample tasks
    const task1 = await ctx.db.insert("tasks", {
      title: "Soil Testing and Preparation",
      description: "Test soil quality and prepare garden beds for planting",
      status: "in_progress",
      priority: "high",
      projectId: project1,
      assignedTo: user._id,
      createdBy: user._id,
      dueDate: now + (7 * 24 * 60 * 60 * 1000),
      estimatedHours: 16,
      actualHours: 8,
      tags: ["preparation", "testing"],
      dependencies: [],
      subtasks: [],
      loggedHours: [],
      attachments: [],
      experienceReward: 120,
      goldReward: 30,
      completionCount: 0,
      type: "todo",
      difficulty: "medium",
      isBlocking: false,
    });

    const task2 = await ctx.db.insert("tasks", {
      title: "Purchase Garden Supplies",
      description: "Buy seeds, tools, and irrigation equipment",
      status: "todo",
      priority: "medium",
      projectId: project1,
      assignedTo: user._id,
      createdBy: user._id,
      dueDate: now + (5 * 24 * 60 * 60 * 1000),
      actualHours: 0,
      loggedHours: [],
      tags: ["maintenance", "urgent"],
      attachments: [],
      dependencies: [],
      subtasks: [],
      experienceReward: 100,
      goldReward: 25,
      completionCount: 0,
      type: "todo",
      difficulty: "medium",
      isBlocking: false,
    });

    const task3 = await ctx.db.insert("tasks", {
      title: "Curriculum Development",
      description: "Develop training materials for digital literacy program",
      status: "todo",
      priority: "high",
      projectId: project2,
      assignedTo: user._id,
      createdBy: user._id,
      dueDate: now + (14 * 24 * 60 * 60 * 1000),
      estimatedHours: 20,
      actualHours: 0,
      tags: ["education", "curriculum"],
      dependencies: [],
      subtasks: [],
      loggedHours: [],
      attachments: [],
      experienceReward: 150,
      goldReward: 30,
      completionCount: 0,
      type: "todo",
      difficulty: "hard",
      isBlocking: false,
    });

    // Create sample events
    const event1 = await ctx.db.insert("events", {
      title: "Community Garden Kickoff",
      description: "Launch event for the community garden project",
      type: "community",
      status: "published",
      startDate: now + (10 * 24 * 60 * 60 * 1000),
      endDate: now + (10 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000), // 4 hours
      location: "Barangay Central Park",
      maxAttendees: 100,
      attendees: [],
      organizer: user._id,
      isPublic: true,
      requiresApproval: false,
      attachments: [],
    });

    return {
      success: true,
      created: {
        projects: 2,
        tasks: 3,
        events: 1,
      },
      projectIds: [project1, project2],
      taskIds: [task1, task2, task3],
      eventIds: [event1],
    };
  },
});
