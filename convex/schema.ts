import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User hierarchy levels (dynamic configuration)
  userLevels: defineTable({
    name: v.string(),
    level: v.number(),
    permissions: v.array(v.string()),
    description: v.string(),
    isActive: v.boolean(),
  }),

  // Departments for organizational structure
  departments: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    head: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    location: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_category", ["category"])
  .index("by_active", ["isActive"]),

  // Users with dynamic roles and gamification
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    userLevel: v.id("userLevels"),
    department: v.optional(v.string()),
    position: v.string(),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    // Gamification stats (Habitica-style)
    level: v.number(),
    experience: v.number(),
    gold: v.number(),
    health: v.number(),
    mana: v.number(),
    streakCount: v.number(),
    lastActiveDate: v.optional(v.number()),
    // Performance metrics
    totalTasksCompleted: v.number(),
    totalHoursLogged: v.number(),
    projectSuccessRate: v.number(), // Percentage of successful projects participated in
    imageUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      lastLogin: v.optional(v.number()),
      preferences: v.optional(v.object({
        notifications: v.optional(v.boolean()),
        theme: v.optional(v.string()),
        language: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })),
    })),
  })
  .index("by_clerk_id", ["clerkId"])
  .index("by_user_level", ["userLevel"])
  .index("by_department", ["department"])
  .index("by_level", ["level"]),

  // Projects with real-time collaboration
  projects: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    budget: v.number(),
    spent: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.optional(v.string()),
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    createdBy: v.id("users"),
    assignedTo: v.array(v.id("users")),
    department: v.string(),
    tags: v.array(v.string()),
    attachments: v.array(v.id("documents")),
    progress: v.number(), // 0-100
    liveblocksRoom: v.string(), // For real-time collaboration
    isPublic: v.boolean(),
  })
  .index("by_status", ["status"])
  .index("by_department", ["department"])
  .index("by_assigned_to", ["assignedTo"])
  .index("by_created_by", ["createdBy"]),

  // Tasks linked to projects (Habitica-style gamified)
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    eventId: v.optional(v.id("events")),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("completed"), v.literal("cancelled")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    difficulty: v.union(v.literal("trivial"), v.literal("easy"), v.literal("medium"), v.literal("hard")), // Habitica-style difficulty
    type: v.union(v.literal("habit"), v.literal("daily"), v.literal("todo"), v.literal("reward")), // Habitica task types
    assignedTo: v.id("users"),
    createdBy: v.id("users"),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    loggedHours: v.array(v.object({
      hours: v.number(),
      date: v.number(),
      userId: v.id("users"),
      description: v.optional(v.string()),
    })),
    tags: v.array(v.string()),
    attachments: v.array(v.id("documents")),
    dependencies: v.array(v.id("tasks")),
    subtasks: v.array(v.object({
      title: v.string(),
      completed: v.boolean(),
      hours: v.optional(v.number()),
    })),
    // Gamification elements
    experienceReward: v.number(), // XP gained on completion
    goldReward: v.number(), // Gold earned
    streak: v.optional(v.number()), // For daily tasks
    lastCompleted: v.optional(v.number()),
    completionCount: v.number(), // Total times completed
    // Habit-specific
    habitFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    positiveHabit: v.optional(v.boolean()), // true for good habits, false for bad habits
    // Project impact scoring
    projectImpactScore: v.optional(v.number()), // How much this task affects project success (1-10)
    isBlocking: v.boolean(), // If this task blocks other tasks/project progress
  })
  .index("by_project", ["projectId"])
  .index("by_event", ["eventId"])
  .index("by_assigned_to", ["assignedTo"])
  .index("by_status", ["status"])
  .index("by_type", ["type"])
  .index("by_due_date", ["dueDate"])
  .index("by_priority", ["priority"]),

  // Events and calendar
  events: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency")),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    organizer: v.id("users"),
    attendees: v.array(v.id("users")),
    maxAttendees: v.optional(v.number()),
    isPublic: v.boolean(),
    requiresApproval: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
    attachments: v.array(v.id("documents")),
    liveblocksRoom: v.optional(v.string()),
  })
  .index("by_start_date", ["startDate"])
  .index("by_organizer", ["organizer"])
  .index("by_type", ["type"]),

  // Document management
  documents: defineTable({
    fileName: v.string(),
    originalName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    storageId: v.string(), // Convex file storage ID
    uploadedBy: v.id("users"),
    category: v.string(),
    tags: v.array(v.string()),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    accessLevel: v.union(v.literal("public"), v.literal("internal"), v.literal("restricted")),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    eventId: v.optional(v.id("events")),
  })
  .index("by_uploaded_by", ["uploadedBy"])
  .index("by_project", ["projectId"])
  .index("by_category", ["category"]),

  // Financial records
  financials: defineTable({
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    projectId: v.optional(v.id("projects")),
    approvedBy: v.optional(v.id("users")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    transactionDate: v.number(),
    receiptUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
  .index("by_project", ["projectId"])
  .index("by_type", ["type"])
  .index("by_status", ["status"])
  .index("by_transaction_date", ["transactionDate"]),

  // Chat system
  chatRooms: defineTable({
    name: v.string(),
    type: v.union(v.literal("general"), v.literal("project"), v.literal("department"), v.literal("direct")),
    projectId: v.optional(v.id("projects")),
    department: v.optional(v.string()),
    participants: v.array(v.id("users")),
    createdBy: v.id("users"),
    isActive: v.boolean(),
    lastMessage: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
  })
  .index("by_type", ["type"])
  .index("by_project", ["projectId"])
  .index("by_participants", ["participants"]),

  messages: defineTable({
    roomId: v.id("chatRooms"),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("file"), v.literal("system")),
    sender: v.id("users"),
    attachments: v.array(v.id("documents")),
    replyTo: v.optional(v.id("messages")),
    isEdited: v.boolean(),
    readBy: v.array(v.object({
      userId: v.id("users"),
      readAt: v.number(),
    })),
  })
  .index("by_room", ["roomId"])
  .index("by_sender", ["sender"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error"), v.literal("welcome")),
    category: v.string(),
    isRead: v.boolean(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      priority: v.optional(v.string()),
      category: v.optional(v.string()),
      relatedId: v.optional(v.string()),
      data: v.optional(v.any()),
    })),
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_read_status", ["userId", "isRead"]),

  // User sessions for tracking login/logout
  userSessions: defineTable({
    userId: v.id("users"),
    clerkSessionId: v.string(),
    loginTime: v.number(),
    logoutTime: v.optional(v.number()),
    isActive: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceInfo: v.optional(v.object({
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
      device: v.optional(v.string()),
    })),
    location: v.optional(v.object({
      city: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
  })
  .index("by_user", ["userId"])
  .index("by_session", ["clerkSessionId"])
  .index("by_active", ["isActive"])
  .index("by_login_time", ["loginTime"]),

  // User activity logs for operational monitoring
  userActivityLogs: defineTable({
    userId: v.id("users"),
    sessionId: v.id("userSessions"),
    activityType: v.union(
      v.literal("login"),
      v.literal("logout"),
      v.literal("page_view"),
      v.literal("action"),
      v.literal("error"),
      v.literal("session_timeout")
    ),
    page: v.optional(v.string()),
    action: v.optional(v.string()),
    details: v.optional(v.object({
      deviceInfo: v.optional(v.object({
        browser: v.optional(v.string()),
        device: v.optional(v.string()),
        os: v.optional(v.string()),
      })),
      location: v.optional(v.object({
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        region: v.optional(v.string()),
        ip: v.optional(v.string()),
      })),
      userAgent: v.optional(v.string()),
      referrer: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      stackTrace: v.optional(v.string()),
      timestamp: v.optional(v.number()), // Allow timestamp in details for compatibility
      action: v.optional(v.string()), // Allow action field in details
      error: v.optional(v.string()), // Allow error field in details
      inactiveTime: v.optional(v.number()), // Allow inactiveTime for heartbeat tracking
    })),
    timestamp: v.number(),
    duration: v.optional(v.number()), // For actions that have duration
  })
  .index("by_user", ["userId"])
  .index("by_session", ["sessionId"])
  .index("by_activity_type", ["activityType"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_timestamp", ["userId", "timestamp"]),

  // System analytics
  analytics: defineTable({
    eventType: v.string(),
    eventData: v.optional(v.object({
      page: v.optional(v.string()),
      action: v.optional(v.string()),
      value: v.optional(v.any()),
      metadata: v.optional(v.any()),
    })),
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    timestamp: v.number(),
  })
  .index("by_event_type", ["eventType"])
  .index("by_timestamp", ["timestamp"]),

  // User invitations for admin-created users
  userInvitations: defineTable({
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    department: v.string(),
    position: v.string(),
    phone: v.optional(v.string()),
    userLevelId: v.id("userLevels"),
    invitedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("cancelled")),
    assignInitialTasks: v.boolean(),
    sendWelcomeMessage: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    userId: v.optional(v.id("users")), // Set when invitation is accepted
  })
  .index("by_email", ["email"])
  .index("by_status", ["status"])
  .index("by_invited_by", ["invitedBy"])
  .index("by_expires_at", ["expiresAt"]),

  // PRODUCTIVITY & PROJECT MANAGEMENT ENHANCEMENTS

  // Project activities for tracking project and task history
  projectActivities: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    activityType: v.union(
      v.literal("project_created"),
      v.literal("project_updated"),
      v.literal("task_created"),
      v.literal("task_assigned"),
      v.literal("task_status_updated"),
      v.literal("task_completed"),
      v.literal("milestone_completed"),
      v.literal("comment_added"),
      v.literal("file_uploaded"),
      v.literal("member_added"),
      v.literal("member_removed")
    ),
    title: v.string(),
    description: v.string(),
    timestamp: v.number(),
    metadata: v.object({
      taskId: v.optional(v.id("tasks")),
      oldStatus: v.optional(v.string()),
      newStatus: v.optional(v.string()),
      progress: v.optional(v.number()),
      priority: v.optional(v.string()),
      category: v.optional(v.string()),
      department: v.optional(v.string()),
      assignedCount: v.optional(v.number()),
      completionNotes: v.optional(v.string()),
      projectTitle: v.optional(v.string()),
      taskTitle: v.optional(v.string()),
    }),
  })
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_activity_type", ["activityType"]),

  // Files table for document and attachment management
  files: defineTable({
    fileName: v.string(),
    originalName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    fileUrl: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    isActive: v.boolean(),
  })
  .index("by_project", ["projectId"])
  .index("by_task", ["taskId"])
  .index("by_uploader", ["uploadedBy"])
  .index("by_file_type", ["fileType"]),

  // Project templates for quick project creation
  projectTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    defaultDuration: v.number(), // in days
    taskTemplates: v.array(v.object({
      title: v.string(),
      description: v.string(),
      taskType: v.string(),
      estimatedHours: v.optional(v.number()),
      dependencies: v.array(v.number()), // Indexes of other tasks
    })),
    objectives: v.array(v.string()),
    deliverables: v.array(v.string()),
    risks: v.array(v.object({
      description: v.string(),
      impact: v.string(),
      mitigation: v.string()
    })),
    createdBy: v.id("users"),
    isActive: v.boolean(),
  })
  .index("by_category", ["category"])
  .index("by_creator", ["createdBy"]),
});