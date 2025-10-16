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
    bio: v.optional(v.string()), // User biography/description
    skills: v.optional(v.array(v.string())), // User skills/competencies
    metadata: v.optional(v.object({
      lastLogin: v.optional(v.number()),
      preferences: v.optional(v.object({
        notifications: v.optional(v.boolean()),
        theme: v.optional(v.string()),
        language: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })),
      typingInRoom: v.optional(v.any()),
      typingAt: v.optional(v.number()),
      notificationPreferences: v.optional(v.any()),
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
    status: v.union(
      v.literal("draft"),           // Initial creation
      v.literal("pending_approval"), // Awaiting manager/admin approval
      v.literal("approved"),         // Approved but not started
      v.literal("active"),           // Currently in progress
      v.literal("on_hold"),          // Temporarily paused
      v.literal("completed"),        // Successfully finished
      v.literal("cancelled"),        // Cancelled/Rejected
      v.literal("archived")          // archived for reference
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    urgency: v.union(v.literal("normal"), v.literal("urgent"), v.literal("emergency")), // Additional urgency field
    budget: v.number(),
    spent: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    actualStartDate: v.optional(v.number()),
    actualEndDate: v.optional(v.number()),
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
    progress: v.number(), // 0-100 calculated from tasks
    liveblocksRoom: v.string(), // For real-time collaboration
    isPublic: v.boolean(),
    
    // Approval workflow
    approvalStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("revision_requested")
    ),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    revisionNotes: v.optional(v.string()),
    
    // Success metrics
    successCriteria: v.array(v.object({
      criterion: v.string(),
      targetValue: v.optional(v.string()),
      achieved: v.boolean(),
      achievedAt: v.optional(v.number()),
    })),
    
    // Milestones
    milestones: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.string(),
      dueDate: v.number(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
      order: v.number(),
    })),
    
    // Gamification
    totalExperienceReward: v.number(), // Total XP for project completion
    projectLevel: v.number(), // Difficulty level (1-10)
    
    // Impact and visibility
    impactArea: v.array(v.string()), // e.g., ["infrastructure", "community", "environment"]
    estimatedBeneficiaries: v.optional(v.number()),
    publicVisibility: v.union(v.literal("public"), v.literal("internal"), v.literal("private")),
    
    // History tracking
    statusHistory: v.array(v.object({
      status: v.string(),
      changedBy: v.id("users"),
      changedAt: v.number(),
      notes: v.optional(v.string()),
    })),
  })
  .index("by_status", ["status"])
  .index("by_approval_status", ["approvalStatus"])
  .index("by_department", ["department"])
  .index("by_assigned_to", ["assignedTo"])
  .index("by_created_by", ["createdBy"])
  .index("by_priority", ["priority"])
  .index("by_urgency", ["urgency"]),

  // Tasks linked to projects (Habitica-style gamified)
  tasks: defineTable({
    userId: v.id("users"), // Owner of the task (for personal tasks)
    title: v.string(),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    eventId: v.optional(v.id("events")),
    type: v.union(v.literal("todo"), v.literal("daily"), v.literal("habit"), v.literal("milestone"), v.literal("reward")), // Task types: todo, daily, habit, milestone, reward
    difficulty: v.union(v.literal("trivial"), v.literal("easy"), v.literal("medium"), v.literal("hard")),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("completed"), v.literal("cancelled")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    // Habit-specific
    habitScore: v.optional(v.number()), // Track positive/negative count
    habitFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    positiveHabit: v.optional(v.boolean()),
    // Time tracking (for project tasks)
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    assignedTo: v.array(v.id("users")), // Multiple users can be assigned to a task
    createdBy: v.id("users"),
    // Gamification
    experienceReward: v.number(),
    goldReward: v.number(),
    streak: v.optional(v.number()),
    lastCompleted: v.optional(v.number()),
    completionCount: v.number(),
    // Additional fields
    tags: v.array(v.string()),
    attachments: v.array(v.id("documents")),
    dependencies: v.array(v.id("tasks")),
    subtasks: v.array(v.object({
      title: v.string(),
      completed: v.boolean(),
      hours: v.optional(v.number()),
    })),
    loggedHours: v.array(v.object({
      hours: v.number(),
      date: v.number(),
      userId: v.id("users"),
      description: v.optional(v.string()),
    })),
    projectImpactScore: v.optional(v.number()),
    isBlocking: v.boolean(),
  })
  .index("by_user", ["userId"])
  .index("by_project", ["projectId"])
  .index("by_event", ["eventId"])
  .index("by_assigned_to", ["assignedTo"])
  .index("by_status", ["status"])
  .index("by_type", ["type"])
  .index("by_due_date", ["dueDate"])
  .index("by_priority", ["priority"]),

  // User stats for gamification (Habitica-style)
  userStats: defineTable({
    userId: v.id("users"),
    level: v.number(),
    xp: v.number(),
    gold: v.number(),
    streak: v.number(),
    lastCompletedDate: v.number(),
    totalTasksCompleted: v.optional(v.number()),
    todosCompleted: v.optional(v.number()),
    dailiesCompleted: v.optional(v.number()),
    habitsTracked: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_level", ["level"]),

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
    allowPublicRSVP: v.optional(v.boolean()), // Allow non-logged-in users to RSVP
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("archived")),
    projectId: v.optional(v.id("projects")), // Link event to project
    imageUrl: v.optional(v.string()), // Event image for visual documentation
    imageDocumentId: v.optional(v.id("documents")), // Link to document library for proper documentation
    attachments: v.array(v.id("documents")),
    publicAttendees: v.optional(v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      phone: v.string(),
      joinedAt: v.number(),
    }))), // Track public RSVP attendees
    liveblocksRoom: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    archivedBy: v.optional(v.id("users")),
  })
  .index("by_start_date", ["startDate"])
  .index("by_organizer", ["organizer"])
  .index("by_type", ["type"])
  .index("by_status", ["status"])
  .index("by_project", ["projectId"]),

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

  // User sessions for tracking login/logout (OPTIMIZED)
  userSessions: defineTable({
    userId: v.id("users"),
    clerkSessionId: v.string(),
    loginTime: v.number(),
    logoutTime: v.optional(v.number()),
    isActive: v.boolean(),
    lastHeartbeat: v.optional(v.number()), // Last activity ping (every 5 min)
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
    // Activity summary instead of individual logs
    activitySummary: v.optional(v.object({
      totalActions: v.optional(v.number()),
      pagesVisited: v.optional(v.array(v.string())),
      lastPage: v.optional(v.string()),
    })),
  })
  .index("by_user", ["userId"])
  .index("by_session", ["clerkSessionId"])
  .index("by_active", ["isActive"])
  .index("by_login_time", ["loginTime"]),

  // Optimized audit logs (ONLY significant events)
  auditLogs: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("userSessions")),
    eventType: v.union(
      v.literal("login"),
      v.literal("logout"),
      v.literal("error"),
      v.literal("project_created"),
      v.literal("project_approved"),
      v.literal("task_completed"),
      v.literal("file_uploaded"),
      v.literal("permission_change"),
      v.literal("data_export")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    timestamp: v.number(),
    details: v.optional(v.any()),
  })
  .index("by_user", ["userId"])
  .index("by_event_type", ["eventType"])
  .index("by_severity", ["severity"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_timestamp", ["userId", "timestamp"]),

  // Online presence tracking for real-time collaboration
  onlinePresence: defineTable({
    userId: v.id("users"),
    clerkId: v.string(),
    lastSeen: v.number(),
    status: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
    currentPage: v.optional(v.string()),
    isActive: v.boolean(),
  })
  .index("by_user", ["userId"])
  .index("by_clerk_id", ["clerkId"])
  .index("by_status", ["status"])
  .index("by_last_seen", ["lastSeen"]),

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

  // Email notification queue
  emailQueue: defineTable({
    to: v.string(),
    type: v.string(), // 'welcome', 'task_assigned', 'event_reminder', 'digest', etc.
    data: v.any(), // Email template data
    priority: v.union(v.literal("high"), v.literal("normal"), v.literal("low")),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    lastAttemptAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
  .index("by_status", ["status"])
  .index("by_priority", ["priority"]),

  // Search history
  searchHistory: defineTable({
    userId: v.id("users"),
    query: v.string(),
    resultType: v.string(), // 'project', 'task', 'user', 'event', 'document'
    resultId: v.string(),
    timestamp: v.number(),
    count: v.number(), // Number of times this search was performed
  })
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"]),

  // Backup metadata
  backups: defineTable({
    timestamp: v.number(),
    createdBy: v.id("users"),
    tables: v.array(v.string()),
    recordCount: v.number(),
    status: v.union(v.literal("completed"), v.literal("failed"), v.literal("in_progress")),
    type: v.union(v.literal("full"), v.literal("partial"), v.literal("scheduled")),
  })
  .index("by_timestamp", ["timestamp"])
  .index("by_creator", ["createdBy"]),

  // Backup schedules
  backupSchedules: defineTable({
    frequency: v.union(v.literal("hourly"), v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    time: v.string(),
    enabled: v.boolean(),
    retentionDays: v.number(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }),

  // Facebook/Messenger Integration
  facebookConnections: defineTable({
    userId: v.id("users"),
    facebookUserId: v.string(), // Facebook Page-Scoped ID (PSID)
    facebookName: v.string(),
    facebookProfilePic: v.optional(v.string()),
    accessToken: v.string(), // Encrypted access token
    pageAccessToken: v.optional(v.string()), // For page messaging
    tokenExpiresAt: v.optional(v.number()),
    pageId: v.optional(v.string()), // If connecting to a page
    isActive: v.boolean(),
    messengerEnabled: v.boolean(),
    notificationsEnabled: v.boolean(),
    connectedAt: v.number(),
    lastSyncedAt: v.optional(v.number()),
    syncStatus: v.union(v.literal("active"), v.literal("error"), v.literal("disconnected")),
    lastError: v.optional(v.string()),
  })
  .index("by_user", ["userId"])
  .index("by_facebook_user_id", ["facebookUserId"])
  .index("by_sync_status", ["syncStatus"]),

  // Message sync tracking between internal and Messenger
  messageSyncLog: defineTable({
    internalMessageId: v.optional(v.id("messages")), // Our internal message ID
    messengerMessageId: v.optional(v.string()), // Facebook Messenger message ID
    roomId: v.id("chatRooms"),
    senderId: v.id("users"),
    recipientId: v.optional(v.id("users")),
    content: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")), // inbound = from Messenger, outbound = to Messenger
    platform: v.union(v.literal("internal"), v.literal("messenger"), v.literal("both")),
    syncStatus: v.union(v.literal("pending"), v.literal("synced"), v.literal("failed")),
    syncedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    timestamp: v.number(),
  })
  .index("by_room", ["roomId"])
  .index("by_messenger_id", ["messengerMessageId"])
  .index("by_internal_id", ["internalMessageId"])
  .index("by_sync_status", ["syncStatus"])
  .index("by_timestamp", ["timestamp"]),

  // Project Expenses for budget tracking
  expenses: defineTable({
    projectId: v.id("projects"),
    description: v.string(),
    amount: v.number(), // In Peso (₱)
    category: v.union(
      v.literal("materials"),
      v.literal("labor"),
      v.literal("equipment"),
      v.literal("transportation"),
      v.literal("permits"),
      v.literal("utilities"),
      v.literal("other")
    ),
    date: v.number(),
    receiptUrl: v.optional(v.id("_storage")), // Optional receipt image
    receiptDocId: v.optional(v.id("documents")), // Link to document library
    createdBy: v.id("users"),
    createdAt: v.number(),
    notes: v.optional(v.string()),
  })
  .index("by_project", ["projectId"])
  .index("by_category", ["category"])
  .index("by_date", ["date"])
  .index("by_created_by", ["createdBy"]),
});