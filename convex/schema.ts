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
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("captain"),
      v.literal("manager"),
      v.literal("builder"),
      v.literal("worker")
    )), // Role-based permissions for kanban (optional temporarily for migration)
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    // Registration approval system
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("rejected")),
    registeredViaInvitation: v.optional(v.boolean()),
    invitationId: v.optional(v.id("userInvitations")),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.id("users")),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    // Status change tracking (for reverting to pending)
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewReason: v.optional(v.string()),
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
    profilePictureUrl: v.optional(v.string()), // Alternative profile picture field
    bio: v.optional(v.string()), // User biography/description
    skills: v.optional(v.array(v.string())), // User skills/competencies
    xp: v.optional(v.number()), // Experience points for gamification
    maxHealth: v.optional(v.number()), // Maximum health points
    maxMana: v.optional(v.number()), // Maximum mana points
    loginStreak: v.optional(v.number()), // Consecutive login days
    lastLoginAt: v.optional(v.number()), // Last login timestamp
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
      // Activity tracking for sidebar display
      currentActivity: v.optional(v.object({
        type: v.union(v.literal("task"), v.literal("project"), v.literal("none")),
        id: v.optional(v.string()),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        priority: v.optional(v.string()),
        eventInfo: v.optional(v.object({
          id: v.string(),
          title: v.string(),
          type: v.string(),
        })),
        startedAt: v.optional(v.number()),
      })),
      // Activity statistics for achievements
      activityStats: v.optional(v.object({
        totalMinutes: v.number(),
        taskMinutes: v.number(),
        projectMinutes: v.number(),
        sessionsCount: v.number(),
        longestSession: v.number(),
      })),
      // Daily streak tracking
      currentStreak: v.optional(v.number()),
      longestStreak: v.optional(v.number()),
      lastActivityDate: v.optional(v.number()),
    })),
  })
  .index("by_clerk_id", ["clerkId"])
  .index("by_user_level", ["userLevel"])
  .index("by_department", ["department"])
  .index("by_level", ["level"])
  .index("by_status", ["status"])
  .index("by_email", ["email"]),

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
    isFeatured: v.optional(v.boolean()), // Highlight on landing page
    featuredOrder: v.optional(v.number()), // Display order for featured projects
    featuredImage: v.optional(v.string()), // Custom image for landing page display
    featuredImageStorageId: v.optional(v.string()), // Convex storage ID for image
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

  // Milestones - Project goals that contain sprint tasks
  milestones: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    name: v.optional(v.string()), // Alternative field name for backward compatibility
    description: v.string(),
    order: v.number(), // Display order (1, 2, 3...)
    targetDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
    progress: v.number(), // 0-100, calculated from tasks
    createdBy: v.id("users"),
    createdAt: v.number(),
    // Milestone metadata
    isRequired: v.boolean(), // Must complete for project to finish
    blockedReason: v.optional(v.string()),
    dependencies: v.array(v.id("milestones")), // Must complete these first
  })
  .index("by_project", ["projectId"])
  .index("by_status", ["status"])
  .index("by_order", ["order"]),

  // Tasks linked to projects (Habitica-style gamified)
  tasks: defineTable({
    userId: v.id("users"), // Owner of the task (for personal tasks)
    title: v.string(),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    milestoneId: v.optional(v.id("milestones")), // Link to milestone
    eventId: v.optional(v.id("events")),
    type: v.union(v.literal("todo"), v.literal("daily"), v.literal("habit"), v.literal("milestone"), v.literal("reward")), // Task types: todo, daily, habit, milestone, reward
    difficulty: v.union(v.literal("trivial"), v.literal("easy"), v.literal("medium"), v.literal("hard")),
    status: v.string(), // Allow any status for custom columns
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.id("users")), // Who marked it as done
    completedByRole: v.optional(v.string()), // Role of person who marked done
    checkedBy: v.optional(v.id("users")), // Who checked/approved it
    workingOnIt: v.optional(v.id("users")), // Who is currently working on it
    workingOnItStartedAt: v.optional(v.number()), // When they started working
    lastMovedBy: v.optional(v.id("users")), // Who last moved the task
    lockedInReview: v.optional(v.boolean()), // Task locked in review column
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
    // Story Points (JIRA integration)
    storyPoints: v.optional(v.number()), // Fibonacci: 1,2,3,5,8,13,21
    sprintId: v.optional(v.id("sprints")), // Link to active sprint
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
    metadata: v.optional(v.any()), // For storing additional task metadata (e.g., sourceEventId for synced tasks)
  })
  .index("by_user", ["userId"])
  .index("by_project", ["projectId"])
  .index("by_milestone", ["milestoneId"])
  .index("by_event", ["eventId"])
  .index("by_assigned_to", ["assignedTo"])
  .index("by_status", ["status"])
  .index("by_type", ["type"])
  .index("by_due_date", ["dueDate"])
  .index("by_priority", ["priority"]),

  // Kanban columns (customizable per milestone)
  kanbanColumns: defineTable({
    milestoneId: v.id("milestones"),
    title: v.string(),
    statusKey: v.string(), // Unique key for this status (e.g., "in_progress", "custom_review")
    color: v.string(), // Tailwind color class (e.g., "blue", "purple", "green")
    order: v.number(), // Display order (0, 1, 2, etc.)
    isDefault: v.boolean(), // Cannot be deleted if true
    rules: v.object({
      requiresAssignment: v.optional(v.boolean()),
      requiresDescription: v.optional(v.boolean()),
      requiresStoryPoints: v.optional(v.boolean()),
      minStoryPoints: v.optional(v.number()),
      requiresPriority: v.optional(v.boolean()),
      requiresDueDate: v.optional(v.boolean()),
      requiresReviewer: v.optional(v.boolean()),
    }),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
  .index("by_milestone", ["milestoneId"])
  .index("by_order", ["milestoneId", "order"])
  .index("by_status_key", ["statusKey"]),

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
    type: v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency"), v.literal("milestone")),
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
    allowDocumentUpload: v.optional(v.boolean()), // Require document upload for RSVP (e.g., proof of citizenship)
    // Easy Attendance System (name-only join via code/QR)
    enableEasyAttendance: v.optional(v.boolean()),
    joinCode: v.optional(v.string()), // 4-digit code for quick join
    welcomeMessage: v.optional(v.string()), // Custom welcome message from organizer
    checkInInfoText: v.optional(v.string()), // Info text displayed during check-in
    // Smart Vision Capture (camera with hand detection)
    enableSmartVision: v.optional(v.boolean()),
    // Guest attendees (name-only, no account required)
    guestAttendees: v.optional(v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      joinedAt: v.number(),
      joinMethod: v.union(v.literal("code"), v.literal("qr"), v.literal("camera"), v.literal("scanner")),
      photoUrl: v.optional(v.string()), // For Smart Vision captures
      message: v.optional(v.string()), // Custom message from attendee
    }))),
    status: v.union(v.literal("draft"), v.literal("pending"), v.literal("published"), v.literal("cancelled"), v.literal("archived")),
    projectId: v.optional(v.id("projects")), // Link event to project
    imageUrl: v.optional(v.string()), // Event image for visual documentation
    imageDocumentId: v.optional(v.id("documents")), // Link to document library for proper documentation
    attachments: v.array(v.id("documents")),
    publicAttendees: v.optional(v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(), // Email for verification
      joinedAt: v.number(),
      documentId: v.optional(v.string()), // Uploaded document (proof of citizenship, etc.)
      documentStorageId: v.optional(v.string()), // Convex storage ID
    }))), // Track public RSVP attendees
    liveblocksRoom: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    archivedBy: v.optional(v.id("users")),
    // Milestone-specific fields
    milestoneTaskCount: v.optional(v.number()), // Required tasks to complete for milestone achievement
    eventCategory: v.optional(v.string()), // Additional categorization for events
  })
  .index("by_start_date", ["startDate"])
  .index("by_organizer", ["organizer"])
  .index("by_type", ["type"])
  .index("by_status", ["status"])
  .index("by_project", ["projectId"])
  .index("by_join_code", ["joinCode"]),

  // Habits system (Habitica-inspired)
  habits: defineTable({
    userId: v.id("users"),
    title: v.string(),
    notes: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    positive: v.boolean(), // true for good habits, false for bad habits
    streak: v.number(), // Current streak count
    longestStreak: v.number(), // Record streak
    lastCompleted: v.optional(v.number()), // Timestamp of last completion
    frequency: v.union(v.literal("daily"), v.literal("weekly")), // How often
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_and_type", ["userId", "positive"]),

  // Daily tasks (auto-reset daily)
  dailies: defineTable({
    userId: v.id("users"),
    title: v.string(),
    notes: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    streak: v.number(), // Days in a row completed
    lastResetDate: v.number(), // Last time it was reset (for tracking)
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_and_completed", ["userId", "completed"]),

  // To-dos (one-time tasks)
  todos: defineTable({
    userId: v.id("users"),
    title: v.string(),
    notes: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_and_completed", ["userId", "completed"]),

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
    // Group admin features
    admins: v.optional(v.array(v.id("users"))), // Group admins
    description: v.optional(v.string()), // Group description
    avatar: v.optional(v.string()), // Group avatar URL
    settings: v.optional(v.object({
      onlyAdminsCanSend: v.boolean(),
      onlyAdminsCanAddMembers: v.boolean(),
      joinApprovalRequired: v.boolean(),
    })),
    // Pinned messages
    pinnedMessages: v.optional(v.array(v.id("messages"))), // Up to 10 pinned
  })
  .index("by_type", ["type"])
  .index("by_project", ["projectId"])
  .index("by_participants", ["participants"]),

  messages: defineTable({
    roomId: v.id("chatRooms"),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("file"), v.literal("system"), v.literal("poll")),
    sender: v.id("users"),
    attachments: v.array(v.id("documents")),
    replyTo: v.optional(v.id("messages")),
    isEdited: v.boolean(),
    readBy: v.array(v.object({
      userId: v.id("users"),
      readAt: v.number(),
    })),
    // Message reactions
    reactions: v.optional(v.array(v.object({
      emoji: v.string(), // 👍, ❤️, 😂, etc.
      userId: v.id("users"),
      addedAt: v.number(),
    }))),
    // Link preview data
    linkPreview: v.optional(v.object({
      url: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
      domain: v.optional(v.string()),
    })),
    // Poll data (if messageType is "poll")
    pollData: v.optional(v.object({
      question: v.string(),
      options: v.array(v.object({
        text: v.string(),
        votes: v.array(v.id("users")),
      })),
      allowMultiple: v.boolean(),
      expiresAt: v.optional(v.number()),
    })),
  })
  .index("by_room", ["roomId"])
  .index("by_sender", ["sender"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"), 
      v.literal("success"), 
      v.literal("warning"), 
      v.literal("error"), 
      v.literal("welcome"),
      v.literal("task_assigned"),
      v.literal("task_completed"),
      v.literal("task_verified"),
      v.literal("task_rejected"),
      v.literal("project_overdue"),
      v.literal("project_reminder"),
      v.literal("project_completed"),
      // New task notification types
      v.literal("assigned"),
      v.literal("due_soon"),
      v.literal("overdue"),
      v.literal("working_on_it"),
      v.literal("ready_for_review"),
      v.literal("review_approved"),
      v.literal("review_rejected"),
      v.literal("unassigned"),
      v.literal("task_updated"),
      // Additional notification types
      v.literal("expense_pending"),
      v.literal("expense_approved"),
      v.literal("expense_rejected"),
      v.literal("level_up"),
      v.literal("xp_earned"),
      v.literal("message_mention"),
      v.literal("message_reaction"),
      v.literal("event_rsvp"),
      v.literal("poll_completed"),
      v.literal("milestone_completed"),
      v.literal("achievement_unlocked"),
      // Budget and gamification notifications
      v.literal("budget_alert"),
      v.literal("gold_earned")
    ),
    priority: v.optional(v.string()), // "low", "medium", "high", "urgent"
    category: v.optional(v.string()),
    isRead: v.boolean(),
    readAt: v.optional(v.number()), // When notification was read
    actionUrl: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    relatedTaskId: v.optional(v.id("tasks")), // Direct reference to task
    metadata: v.optional(v.object({
      priority: v.optional(v.string()),
      category: v.optional(v.string()),
      relatedId: v.optional(v.string()),
      projectId: v.optional(v.string()),
      taskTitle: v.optional(v.string()), // Added for task notifications
      dueDate: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      data: v.optional(v.any()),
      // Expense notifications
      expenseId: v.optional(v.string()),
      amount: v.optional(v.number()),
      // Gamification notifications
      oldLevel: v.optional(v.number()),
      newLevel: v.optional(v.number()),
      xpGained: v.optional(v.number()),
      // Message notifications
      messageContent: v.optional(v.string()),
      emoji: v.optional(v.string()),
      // Event notifications
      eventId: v.optional(v.string()),
      eventTitle: v.optional(v.string()),
      rsvpStatus: v.optional(v.string()),
      // Poll notifications
      pollTitle: v.optional(v.string()),
      pollId: v.optional(v.string()),
      // Milestone notifications
      milestoneId: v.optional(v.string()),
      milestoneTitle: v.optional(v.string()),
      // Achievement notifications
      achievementTitle: v.optional(v.string()),
      achievementDescription: v.optional(v.string()),
      achievementId: v.optional(v.string()),
      achievementIcon: v.optional(v.string()),
      // Additional metadata fields
      roomId: v.optional(v.string()),
      roomName: v.optional(v.string()),
      attendeeName: v.optional(v.string()),
      milestoneName: v.optional(v.string()),
      xpBonus: v.optional(v.number()),
      goldGained: v.optional(v.number()),
      goldReward: v.optional(v.number()),
      threshold: v.optional(v.number()),
      reason: v.optional(v.string()),
      // More metadata fields
      xpReward: v.optional(v.number()),
      fileName: v.optional(v.string()),
      projectName: v.optional(v.string()),
      senderId: v.optional(v.string()),
      messagePreview: v.optional(v.string()),
      utilization: v.optional(v.number()),
      mentionerId: v.optional(v.string()),
      totalVotes: v.optional(v.number()),
      // Final metadata fields
      senderName: v.optional(v.string()),
      reactorId: v.optional(v.string()),
      goldBonus: v.optional(v.number()),
      spent: v.optional(v.number()),
      mentionerName: v.optional(v.string()),
      completedBy: v.optional(v.string()),
      reactorName: v.optional(v.string()),
      total: v.optional(v.number()),
      // Task submission metadata
      storyPoints: v.optional(v.number()),
      submittedByName: v.optional(v.string()),
      submittedByRole: v.optional(v.string()),
      completedByName: v.optional(v.string()),
      completedByRole: v.optional(v.string()),
      workingUserName: v.optional(v.string()),
    })),
    createdAt: v.number(),
    // Resend tracking
    resentAt: v.optional(v.number()),
    resentCount: v.optional(v.number()),
    emailSent: v.optional(v.boolean()),
    emailSentAt: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_user_read", ["userId", "isRead"])
  .index("by_type", ["type"])
  .index("by_priority", ["priority"]),

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

  // Comprehensive audit logs (supports both legacy and new resident system)
  auditLogs: defineTable({
    userId: v.id("users"),
    userName: v.optional(v.string()), // Cached for display - OPTIONAL for backward compatibility
    userRole: v.optional(v.string()), // Cached user role - OPTIONAL for backward compatibility
    sessionId: v.optional(v.id("userSessions")),
    
    // Legacy fields (for existing audit system)
    eventType: v.optional(v.union(
      v.literal("login"),
      v.literal("logout"),
      v.literal("error"),
      v.literal("project_created"),
      v.literal("project_approved"),
      v.literal("task_completed"),
      v.literal("file_uploaded"),
      v.literal("permission_change"),
      v.literal("data_export")
    )),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    details: v.optional(v.any()),
    
    // New fields (for resident management system) - OPTIONAL for backward compatibility
    action: v.optional(v.string()), // e.g., "CREATE_RESIDENT", "UPDATE_HOUSEHOLD", "APPROVE_CERTIFICATE"
    entity: v.optional(v.string()), // e.g., "residents", "households", "certificates"
    entityId: v.optional(v.string()), // ID of the affected entity
    description: v.optional(v.string()), // Human-readable description
    changes: v.optional(v.any()), // JSON of what changed (before/after)
    
    // Context
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    
    timestamp: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_event_type", ["eventType"])
  .index("by_severity", ["severity"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_timestamp", ["userId", "timestamp"])
  .index("by_entity", ["entity", "entityId"])
  .index("by_action", ["action"]),

  // Online presence tracking for real-time collaboration
  onlinePresence: defineTable({
    userId: v.id("users"),
    clerkId: v.string(),
    lastSeen: v.number(),
    status: v.union(
      v.literal("online"), 
      v.literal("away"), 
      v.literal("offline"),
      v.literal("busy"),
      v.literal("dnd"), // Do not disturb
      v.literal("meeting"),
      v.literal("wfh") // Working from home
    ),
    currentPage: v.optional(v.string()),
    isActive: v.boolean(),
    // Custom status message
    customStatus: v.optional(v.object({
      message: v.string(), // "In a meeting", "Out for lunch", etc.
      emoji: v.optional(v.string()), // 🍕, 💼, 🏠, etc.
      expiresAt: v.optional(v.number()), // Auto-clear time
    })),
  })
  .index("by_user", ["userId"])
  .index("by_clerk_id", ["clerkId"])
  .index("by_status", ["status"])
  .index("by_last_seen", ["lastSeen"]),

  // User activity logs for operational monitoring
  userActivityLogs: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("userSessions")), // Optional for backward compatibility
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
    targetType: v.optional(v.string()), // For activity filtering
    targetId: v.optional(v.string()), // For activity filtering
    metadata: v.optional(v.any()), // For activity metadata
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
    position: v.optional(v.string()), // Job position/title
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    userLevelId: v.id("userLevels"),
    invitedBy: v.id("users"),
    invitationToken: v.string(), // Unique token for invitation link
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
  .index("by_expires_at", ["expiresAt"])
  .index("by_token", ["invitationToken"]),

  // Invitation codes for bulk user registration
  invitationCodes: defineTable({
    code: v.string(), // Unique code like "ADMIN2024", "BUILD123"
    description: v.string(),
    userLevelId: v.id("userLevels"),
    department: v.string(),
    maxUses: v.number(), // -1 for unlimited
    usedCount: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("expired")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration
    usedBy: v.array(v.id("users")), // Track who used this code
  })
  .index("by_code", ["code"])
  .index("by_status", ["status"])
  .index("by_created_by", ["createdBy"])
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

  // Event Tasks (Jira/Monday.com-style task management)
  eventTasks: defineTable({
    eventId: v.id("events"),
    title: v.string(),
    description: v.string(),
    
    // Status workflow (Kanban columns)
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    blockedReason: v.optional(v.string()), // Why task is blocked
    verifiedBy: v.optional(v.id("users")), // Who verified/approved the task
    
    // Priority and effort
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    storyPoints: v.optional(v.number()), // Agile story points
    
    // Assignment and hierarchy
    assignedTo: v.array(v.id("users")),
    createdBy: v.id("users"),
    assignedBy: v.optional(v.id("users")), // Who assigned this task
    reportTo: v.optional(v.id("users")), // Task supervisor/reviewer
    
    // Dates and deadlines
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    
    // Organization
    category: v.optional(v.string()), // e.g., "Setup", "Logistics", "Marketing"
    taskType: v.optional(v.string()), // e.g., "general", "setup", "logistics", "documentation"
    location: v.optional(v.string()), // Physical location where task takes place
    requirements: v.optional(v.string()), // Materials/resources needed
    tags: v.array(v.string()),
    orderIndex: v.number(), // For drag-and-drop ordering within columns
    
    // Dependencies
    blockedBy: v.array(v.id("eventTasks")), // Tasks that must be completed first
    blocking: v.array(v.id("eventTasks")), // Tasks that depend on this
    
    // Subtasks
    parentTaskId: v.optional(v.id("eventTasks")),
    hasSubtasks: v.boolean(),
    subtaskCount: v.optional(v.number()),
    completedSubtasks: v.optional(v.number()),
    
    // Progress
    progress: v.number(), // 0-100
    checklistItems: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
      completedBy: v.optional(v.id("users")),
    }))),
    
    // Attachments and links
    attachments: v.array(v.id("documents")),
    links: v.optional(v.array(v.object({
      url: v.string(),
      title: v.string(),
    }))),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    isArchived: v.boolean(),
  })
  .index("by_event", ["eventId"])
  .index("by_status", ["status"])
  .index("by_event_status", ["eventId", "status"])
  .index("by_assigned", ["assignedTo"])
  .index("by_created_by", ["createdBy"])
  .index("by_parent", ["parentTaskId"])
  .index("by_due_date", ["dueDate"])
  .index("by_priority", ["priority"]),

  // Event Task Comments & Activity
  eventTaskComments: defineTable({
    taskId: v.id("eventTasks"),
    userId: v.id("users"),
    comment: v.string(),
    
    // Comment type
    type: v.union(
      v.literal("comment"),
      v.literal("status_change"),
      v.literal("assignment"),
      v.literal("mention"),
      v.literal("system")
    ),
    
    // For status changes
    oldStatus: v.optional(v.string()),
    newStatus: v.optional(v.string()),
    
    // For assignments
    assignedUser: v.optional(v.id("users")),
    
    // Mentions
    mentions: v.array(v.id("users")),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isEdited: v.boolean(),
    
    // Reactions
    reactions: v.optional(v.array(v.object({
      emoji: v.string(),
      userId: v.id("users"),
    }))),
  })
  .index("by_task", ["taskId"])
  .index("by_user", ["userId"])
  .index("by_created_at", ["createdAt"]),

  // Event Task Time Tracking
  eventTaskTimeEntries: defineTable({
    taskId: v.id("eventTasks"),
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()), // in minutes
    description: v.optional(v.string()),
    isRunning: v.boolean(),
    createdAt: v.number(),
  })
  .index("by_task", ["taskId"])
  .index("by_user", ["userId"])
  .index("by_running", ["isRunning"]),

  // Individual Task Assignments - Each user has their own progress
  eventTaskAssignments: defineTable({
    taskId: v.id("eventTasks"),
    userId: v.id("users"),
    assignedBy: v.id("users"),
    
    // Individual progress
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("verified")
    ),
    progress: v.number(), // 0-100
    
    // Time tracking
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    
    // Feedback
    submissionNote: v.optional(v.string()),
    verificationNote: v.optional(v.string()),
    
    // Metadata
    assignedAt: v.number(),
    isActive: v.boolean(), // Can be removed from assignment
  })
  .index("by_task", ["taskId"])
  .index("by_user", ["userId"])
  .index("by_task_user", ["taskId", "userId"])
  .index("by_status", ["status"])
  .index("by_assigned_by", ["assignedBy"]),

  // Public Project Feedback - Allow community to comment on projects
  projectFeedback: defineTable({
    projectId: v.id("projects"),
    // Submitter information (public users don't need accounts)
    submitterName: v.string(),
    submitterEmail: v.optional(v.string()),
    submitterPhone: v.optional(v.string()),
    // Feedback content
    feedbackType: v.union(
      v.literal("comment"),
      v.literal("suggestion"),
      v.literal("concern"),
      v.literal("appreciation")
    ),
    rating: v.optional(v.number()), // 1-5 stars
    message: v.string(),
    // Moderation
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("spam")
    ),
    moderatedBy: v.optional(v.id("users")),
    moderatedAt: v.optional(v.number()),
    moderationNote: v.optional(v.string()),
    // Metadata
    isPublic: v.boolean(), // Show on public page
    submittedAt: v.number(),
    ipAddress: v.optional(v.string()), // For spam prevention
    userAgent: v.optional(v.string()),
  })
  .index("by_project", ["projectId"])
  .index("by_status", ["status"])
  .index("by_project_status", ["projectId", "status"])
  .index("by_submitted_at", ["submittedAt"]),

  // Push Notification Subscriptions (FCM tokens)
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    token: v.string(), // FCM token
    createdAt: v.number(),
    updatedAt: v.number(),
    deviceInfo: v.optional(v.object({
      userAgent: v.optional(v.string()),
      platform: v.optional(v.string()),
    })),
  })
  .index("by_user", ["userId"])
  .index("by_token", ["token"]),

  // ==================== SPRINT MANAGEMENT (JIRA-like) ====================

  // Sprints - Time-boxed iterations for agile project management
  sprints: defineTable({
    name: v.string(), // e.g., "Sprint 1", "Q1 Planning Sprint"
    goal: v.string(), // Sprint goal/objective
    startDate: v.number(),
    endDate: v.number(),
    capacity: v.number(), // Total story points capacity
    projectId: v.optional(v.id("projects")), // Link to project (optional)
    
    // Status management
    status: v.union(
      v.literal("planning"),  // Sprint being planned
      v.literal("active"),    // Currently running
      v.literal("completed"), // Finished
      v.literal("cancelled")  // Cancelled
    ),
    
    // Metadata
    createdBy: v.id("users"),
    createdAt: v.number(),
    actualStartDate: v.optional(v.number()), // When sprint actually started
    completedAt: v.optional(v.number()),    // When sprint was completed
  })
  .index("by_project", ["projectId"])
  .index("by_status", ["status"])
  .index("by_dates", ["startDate", "endDate"])
  .index("by_creator", ["createdBy"]),

  // Sprint Tasks - Junction table linking tasks to sprints with additional metadata
  sprintTasks: defineTable({
    sprintId: v.id("sprints"),
    taskId: v.id("tasks"),
    storyPoints: v.number(), // Estimated complexity (Fibonacci: 1,2,3,5,8,13,21)
    
    // Sprint-specific status (for Kanban board)
    status: v.union(
      v.literal("todo"),        // Backlog/To Do
      v.literal("in_progress"), // Currently working
      v.literal("in_review"),   // Under review/testing
      v.literal("done")         // Completed
    ),
    
    // Metadata
    addedAt: v.number(),      // When task was added to sprint
    updatedAt: v.optional(v.number()), // Last status update
    movedToDone: v.optional(v.number()), // When task was completed
  })
  .index("by_sprint", ["sprintId"])
  .index("by_task", ["taskId"])
  .index("by_sprint_status", ["sprintId", "status"])
  .index("by_status", ["status"]),

  // Sprint Backlog - Prioritized list of tasks not yet in a sprint
  // Note: Tasks not in sprintTasks table are considered backlog
  // This table stores additional planning metadata
  backlogItems: defineTable({
    taskId: v.id("tasks"),
    projectId: v.optional(v.id("projects")),
    estimatedPoints: v.optional(v.number()), // Story point estimate
    priority: v.number(), // Manual priority order (lower = higher priority)
    
    // Planning poker results
    estimates: v.optional(v.array(v.object({
      userId: v.id("users"),
      points: v.number(),
      estimatedAt: v.number(),
    }))),
    
    // Metadata
    addedToBacklog: v.number(),
    lastUpdated: v.number(),
  })
  .index("by_task", ["taskId"])
  .index("by_project", ["projectId"])
  .index("by_priority", ["priority"]),

  // Comments system for collaboration
  comments: defineTable({
    resourceType: v.string(), // 'project', 'event', 'task', 'sprint', 'document'
    resourceId: v.string(), // ID of the resource
    body: v.string(),
    category: v.string(), // 'general', 'question', 'feedback', 'bug', 'feature'
    priority: v.string(), // 'low', 'medium', 'high'
    parentId: v.optional(v.id("comments")), // For threaded replies
    userId: v.id("users"),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    resolved: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_resource", ["resourceType", "resourceId"])
  .index("by_user", ["userId"])
  .index("by_parent", ["parentId"])
  .index("by_resolved", ["resolved"]),

  // System backups for data backup and restore
  systemBackups: defineTable({
    type: v.union(v.literal("manual"), v.literal("automatic"), v.literal("archive")),
    description: v.optional(v.string()),
    status: v.string(), // "in_progress", "completed", "failed"
    recordCount: v.number(),
    tables: v.object({
      users: v.number(),
      departments: v.number(),
      userLevels: v.number(),
      projects: v.number(),
      events: v.number(),
    }),
    dataJson: v.string(), // Full JSON backup data
    timestamp: v.number(),
    createdBy: v.optional(v.id("users")),
    creatorName: v.string(),
  })
  .index("by_type", ["type"])
  .index("by_timestamp", ["timestamp"])
  .index("by_creator", ["createdBy"]),

  // Security settings for system-wide security configuration
  securitySettings: defineTable({
    sessionTimeout: v.number(), // Minutes before auto-logout
    passwordMinLength: v.number(),
    requireMFA: v.boolean(),
    allowPublicRegistration: v.boolean(),
    maxLoginAttempts: v.number(),
    lockoutDuration: v.number(), // Minutes
    passwordRequireUppercase: v.boolean(),
    passwordRequireNumbers: v.boolean(),
    passwordRequireSpecialChars: v.boolean(),
    forcePasswordChange: v.boolean(), // Force users to change password on next login
    passwordExpiryDays: v.number(), // Days until password expires
    enableIPWhitelist: v.boolean(),
    ipWhitelist: v.array(v.string()),
    enable2FA: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }),

  // OTP Verifications for email verification (feedback, event RSVP)
  otpVerifications: defineTable({
    email: v.string(),
    otp: v.string(),
    purpose: v.union(v.literal("feedback"), v.literal("event_rsvp")),
    expiresAt: v.number(),
    verified: v.boolean(),
    attempts: v.number(),
  })
  .index("by_email", ["email"])
  .index("by_purpose", ["purpose"])
  .index("by_email_purpose", ["email", "purpose"]),

  // Landmarks for map display (SM City, Yashano Mall, Mayon, etc.)
  landmarks: defineTable({
    name: v.string(),
    icon: v.string(), // Emoji icon
    color: v.string(), // Hex color
    latitude: v.number(),
    longitude: v.number(),
    googleMapsUrl: v.string(),
    description: v.optional(v.string()), // Optional description
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // System Settings (key-value store for various settings)
  systemSettings: defineTable({
    key: v.string(), // e.g., "barangayHallCoordinates"
    value: v.any(), // Flexible value storage
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_key", ["key"]),

  // ============================================
  // RESIDENT MANAGEMENT SYSTEM
  // ============================================

  // Households - Family units in the barangay
  households: defineTable({
    householdNumber: v.string(), // e.g., "H-2024-001"
    
    // Address
    houseNumber: v.string(),
    street: v.string(),
    purok: v.string(), // Zone/Purok
    barangay: v.string(), // "Barangay 37 - Bitano"
    city: v.string(), // "Legazpi City"
    province: v.string(), // "Albay"
    zipCode: v.string(),
    
    // Household Info
    householdHeadId: v.optional(v.id("residents")), // Reference to resident who is head
    totalMembers: v.number(),
    yearEstablished: v.optional(v.number()),
    
    // Economic Status
    monthlyIncome: v.optional(v.string()), // Range: "<5000", "5000-10000", etc.
    isIndigent: v.boolean(),
    is4PsBeneficiary: v.boolean(),
    
    // Utilities
    hasElectricity: v.boolean(),
    hasWater: v.boolean(),
    hasInternet: v.boolean(),
    
    // Meta
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_household_number", ["householdNumber"])
  .index("by_purok", ["purok"])
  .index("by_created_at", ["createdAt"]),

  // Residents - Individual people in the barangay
  residents: defineTable({
    // Barangay ID
    barangayIdNumber: v.string(), // e.g., "BIT-2024-001"
    qrCode: v.optional(v.string()), // QR code data for ID verification
    
    // Personal Information
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    suffix: v.optional(v.string()), // Jr., Sr., III, IV
    nickname: v.optional(v.string()),
    
    // Birth Information
    birthdate: v.number(), // timestamp
    age: v.number(), // auto-calculated
    placeOfBirth: v.optional(v.string()),
    
    // Identification
    gender: v.union(v.literal("Male"), v.literal("Female")),
    civilStatus: v.union(
      v.literal("Single"),
      v.literal("Married"),
      v.literal("Widowed"),
      v.literal("Separated"),
      v.literal("Annulled")
    ),
    nationality: v.string(), // Default: "Filipino"
    religion: v.optional(v.string()),
    bloodType: v.optional(v.union(
      v.literal("A+"), v.literal("A-"),
      v.literal("B+"), v.literal("B-"),
      v.literal("AB+"), v.literal("AB-"),
      v.literal("O+"), v.literal("O-")
    )),
    
    // Contact Information
    phoneNumber: v.string(),
    email: v.optional(v.string()),
    
    // Clerk Authentication Link
    clerkUserId: v.optional(v.string()), // Links to Clerk authenticated user
    
    // Household & Family
    householdId: v.id("households"),
    relationToHead: v.union(
      v.literal("Head"),
      v.literal("Spouse"),
      v.literal("Child"),
      v.literal("Parent"),
      v.literal("Sibling"),
      v.literal("Grandchild"),
      v.literal("Grandparent"),
      v.literal("Other Relative"),
      v.literal("Non-Relative")
    ),
    
    // Government IDs
    philHealthNumber: v.optional(v.string()),
    sssNumber: v.optional(v.string()),
    gsissNumber: v.optional(v.string()),
    tinNumber: v.optional(v.string()),
    votersIdNumber: v.optional(v.string()),
    nationalIdNumber: v.optional(v.string()),
    
    // Residency Information
    yearsOfResidency: v.number(),
    residencyType: v.union(
      v.literal("Owner"),
      v.literal("Renter"),
      v.literal("Living with Family"),
      v.literal("Other")
    ),
    previousAddress: v.optional(v.string()),
    
    // Status Flags
    isVoter: v.boolean(),
    isSeniorCitizen: v.boolean(), // auto-set if age >= 60
    isPWD: v.boolean(),
    isIndigent: v.boolean(),
    is4PsBeneficiary: v.boolean(),
    isOFW: v.boolean(),
    isSoloParent: v.boolean(),
    
    // Occupation & Education
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    monthlyIncome: v.optional(v.string()),
    educationalAttainment: v.optional(v.union(
      v.literal("Elementary"),
      v.literal("Elementary Graduate"),
      v.literal("High School"),
      v.literal("High School Graduate"),
      v.literal("Vocational"),
      v.literal("College"),
      v.literal("College Graduate"),
      v.literal("Post Graduate")
    )),
    
    // Emergency Contact
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    
    // Medical Information (optional)
    disabilities: v.optional(v.array(v.string())), // Array of disability types
    medicalConditions: v.optional(v.array(v.string())), // Chronic conditions
    
    // Photo
    photoUrl: v.optional(v.string()), // URL to uploaded photo
    photoStorageId: v.optional(v.string()), // Convex storage ID
    
    // Verification & Status
    isVerified: v.boolean(),
    verifiedBy: v.optional(v.id("users")), // Admin who verified
    verifiedAt: v.optional(v.number()),
    isActive: v.boolean(), // For soft delete
    deactivatedReason: v.optional(v.string()),
    
    // Notes
    notes: v.optional(v.string()),
    
    // Meta
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_barangay_id", ["barangayIdNumber"])
  .index("by_household", ["householdId"])
  .index("by_name", ["lastName", "firstName"])
  .index("by_verified", ["isVerified"])
  .index("by_active", ["isActive"])
  .index("by_created_at", ["createdAt"])
  .index("by_email", ["email"])
  .index("by_clerk_user", ["clerkUserId"]),

  // Certificate Requests - Residents request certificates
  certificateRequests: defineTable({
    controlNumber: v.string(), // Unique: CR-2024-001
    
    // Requester Information
    residentId: v.id("residents"),
    requestedBy: v.string(), // Resident name (cached)
    
    // Certificate Details
    certificateType: v.union(
      v.literal("Barangay Clearance"),
      v.literal("Certificate of Indigency"),
      v.literal("Certificate of Residency"),
      v.literal("Certificate of Good Moral"),
      v.literal("Business Permit"),
      v.literal("COMELEC Certification"),
      v.literal("First Time Job Seeker"),
      v.literal("Certificate of No Income")
    ),
    purpose: v.string(), // Purpose of the certificate
    
    // Request Status
    status: v.union(
      v.literal("Pending"),
      v.literal("For Review"),
      v.literal("Approved"),
      v.literal("Released"),
      v.literal("Rejected"),
      v.literal("Cancelled")
    ),
    
    // Processing
    requestedAt: v.number(),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    releasedBy: v.optional(v.id("users")),
    releasedAt: v.optional(v.number()),
    
    // Rejection/Cancellation
    rejectionReason: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
    
    // Payment (for future)
    amount: v.optional(v.number()),
    isPaid: v.boolean(),
    paidAt: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    orNumber: v.optional(v.string()), // Official Receipt number
    
    // Certificate Details (after generation)
    certificateId: v.optional(v.id("certificates")),
    
    // Notes
    notes: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    
    // Meta
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_resident", ["residentId"])
  .index("by_status", ["status"])
  .index("by_control_number", ["controlNumber"])
  .index("by_created_at", ["createdAt"]),

  // Certificates - Generated certificates
  certificates: defineTable({
    certificateNumber: v.string(), // Unique: BC-2024-001
    qrCode: v.string(), // QR code for verification
    
    // Certificate Details
    certificateType: v.union(
      v.literal("Barangay Clearance"),
      v.literal("Certificate of Indigency"),
      v.literal("Certificate of Residency"),
      v.literal("Certificate of Good Moral"),
      v.literal("Business Permit"),
      v.literal("COMELEC Certification"),
      v.literal("First Time Job Seeker"),
      v.literal("Certificate of No Income")
    ),
    
    // Recipient
    residentId: v.id("residents"),
    residentName: v.string(), // Cached for display
    
    // Content
    purpose: v.string(),
    validUntil: v.optional(v.number()), // Expiration date
    
    // Signatories
    issuedBy: v.id("users"), // Admin/Official who issued
    issuedByName: v.string(), // Cached name
    issuedByPosition: v.string(), // e.g., "Barangay Captain"
    
    // Additional signatories
    notedBy: v.optional(v.string()),
    notedByPosition: v.optional(v.string()),
    
    // Document Details
    pdfUrl: v.optional(v.string()), // Generated PDF URL
    pdfStorageId: v.optional(v.string()), // Convex storage ID
    
    // Verification
    isValid: v.boolean(), // Can be invalidated
    invalidatedBy: v.optional(v.id("users")),
    invalidatedAt: v.optional(v.number()),
    invalidationReason: v.optional(v.string()),
    
    // Fees
    amount: v.optional(v.number()),
    orNumber: v.optional(v.string()),
    
    // Linked Request
    requestId: v.optional(v.id("certificateRequests")),
    
    // Meta
    issuedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_certificate_number", ["certificateNumber"])
  .index("by_resident", ["residentId"])
  .index("by_type", ["certificateType"])
  .index("by_valid", ["isValid"])
  .index("by_qr_code", ["qrCode"])
  .index("by_issued_at", ["issuedAt"]),

  // Document version control for tracking changes and history
  documentVersions: defineTable({
    documentId: v.id("documents"),
    versionNumber: v.number(),
    title: v.string(),
    content: v.string(),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    changeDescription: v.optional(v.string()),
    changeType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("restored"),
      v.literal("auto_save")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    isCurrentVersion: v.boolean(),
    editingLockedBy: v.optional(v.id("users")),
    editingLockedAt: v.optional(v.number()),
  })
    .index("by_document", ["documentId"])
    .index("by_created_by", ["createdBy"])
    .index("by_version_number", ["documentId", "versionNumber"])
    .index("by_current", ["documentId", "isCurrentVersion"]),

  // Project budgets for financial tracking
  projectBudgets: defineTable({
    projectId: v.id("projects"),
    totalBudget: v.number(),
    allocated: v.number(),
    spent: v.number(),
    currency: v.string(), // "PHP", "USD", etc.
    alertThresholds: v.array(v.number()), // [75, 90, 100]
    alertsSent: v.array(v.number()),
    approvers: v.array(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_created_by", ["createdBy"]),

  // Project expenses for tracking spending
  projectExpenses: defineTable({
    projectId: v.id("projects"),
    category: v.string(), // "supplies", "labor", "equipment", "transportation", "food", "other"
    amount: v.number(),
    description: v.string(),
    receiptUrl: v.string(),
    vendor: v.string(),
    submittedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    submittedAt: v.number(),
    approvedAt: v.optional(v.number()),
    expenseDate: v.number(),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_submitted_by", ["submittedBy"])
    .index("by_status", ["status"]),

  // Event attendees for RSVP and attendance tracking
  eventAttendees: defineTable({
    eventId: v.id("events"),
    userId: v.optional(v.id("users")), // Null for public/guest attendees
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    rsvpStatus: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("declined"),
      v.literal("maybe"),
      v.literal("waitlist")
    ),
    attendanceStatus: v.optional(v.union(
      v.literal("attended"),
      v.literal("no-show"),
      v.literal("cancelled")
    )),
    registeredAt: v.number(),
    confirmedAt: v.optional(v.number()),
    checkedInAt: v.optional(v.number()),
    emailSent: v.boolean(),
    lastEmailSentAt: v.optional(v.number()),
    remindersSent: v.number(),
    lastReminderSentAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    specialRequirements: v.optional(v.string()),
    ticketCode: v.optional(v.string()),
    registrationSource: v.optional(v.string()), // "web", "manual_invite", "public_rsvp"
    isPublicRSVP: v.optional(v.boolean()),
    // QR code and check-in tracking
    qrCodeSent: v.optional(v.boolean()),
    qrCodeSentAt: v.optional(v.number()),
    checkInMethod: v.optional(v.string()), // "qr_scan", "manual"
    scannedBy: v.optional(v.id("users")), // Who scanned the QR code
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_rsvp_status", ["eventId", "rsvpStatus"])
    .index("by_ticket_code", ["ticketCode"]),

  // User Achievements for gamification
  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.string(),
    unlockedAt: v.number(),
    progress: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_achievement", ["achievementId"])
    .index("by_user_achievement", ["userId", "achievementId"]),

  // Committees for organizational structure
  committees: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    members: v.array(v.id("users")),
    chairperson: v.optional(v.id("users")),
    chairman: v.optional(v.string()), // String ID for backward compatibility with imports
    chairmanPosition: v.optional(v.string()), // Chairman's position/title
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Site Settings for editable content
  siteSettings: defineTable({
    key: v.string(), // Unique key like 'mission', 'vision', 'copyright', 'version'
    value: v.string(), // The actual content
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
  .index("by_key", ["key"]),
});