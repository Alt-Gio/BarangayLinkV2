import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required");

  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
    .first();

  if (!user) throw new Error("User not found in database");

  if (user.status === "pending") {
    throw new Error("Your account is pending admin approval. Please wait for approval.");
  }

  if (user.status === "rejected") {
    const reason = user.rejectionReason || "No reason provided";
    throw new Error(`Your account has been rejected. Reason: ${reason}`);
  }

  const userLevel = await ctx.db.get(user.userLevel);
  
  if (!userLevel) {
    const defaultLevel = await ctx.db
      .query("userLevels")
      .filter((q: any) => q.eq(q.field("name"), "WORKER"))
      .first();
    
    if (!defaultLevel) {
      throw new Error("User level not found and no default level available. Please contact administrator.");
    }
    
    return {
      ...user,
      userLevel: defaultLevel,
      _needsUserLevelUpdate: true,
    };
  }

  return {
    ...user,
    userLevel: userLevel,
  };
};

export const checkPermission = async (ctx: any, requiredLevel: string[]) => {
  const currentUser = await getCurrentUser(ctx);
  
  if (!requiredLevel.includes(currentUser.userLevel.name)) {
    throw new Error(`Access denied. Required role: ${requiredLevel.join(' or ')}`);
  }
  
  return currentUser;
};

export const checkDepartmentAccess = (currentUser: any, targetDepartment: string) => {
  const userLevel = currentUser.userLevel.name;
  
  if (userLevel === "ADMIN" || userLevel === "CAPTAIN") return true;
  
  if (currentUser.department !== targetDepartment) {
    throw new Error("Access denied. You can only access your department's data.");
  }
  
  return true;
};

export const createUserLevel = mutation({
  args: { 
    name: v.string(), 
    level: v.number(), 
    permissions: v.array(v.string()),
    description: v.string()
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN"]);
    
    const existingLevel = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();
    
    if (existingLevel) {
      throw new Error("User level already exists");
    }
    
    const levelId = await ctx.db.insert("userLevels", {
      name: args.name,
      level: args.level,
      permissions: args.permissions,
      description: args.description,
      isActive: true
    });
    
    return levelId;
  }
});

export const changeUserRole = mutation({
  args: {
    userId: v.id("users"),
    newUserLevelId: v.id("userLevels")
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN"]);
    
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("Target user not found");
    
    const newLevel = await ctx.db.get(args.newUserLevelId);
    if (!newLevel) throw new Error("New user level not found");
    
    await ctx.db.patch(args.userId, {
      userLevel: args.newUserLevelId
    });
    
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "info",
      title: "Role Updated",
      message: `Your role has been changed to ${newLevel.name}`,
      isRead: false,
      category: "role_change",
      actionUrl: "/profile",
      createdAt: Date.now(),
      metadata: {
        priority: "high",
        category: "role_change",
        relatedId: args.userId,
        data: {
          oldRole: targetUser.userLevel,
          newRole: newLevel.name
        }
      }
    });
    
    return args.userId;
  }
});

export const getSystemAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await checkPermission(ctx, ["ADMIN"]);
    
    const allProjects = await ctx.db.query("projects").collect();
    const allTasks = await ctx.db.query("tasks").collect();
    const allUsers = await ctx.db.query("users").collect();
    
    const departmentStats = allUsers.reduce((acc, user) => {
      const dept = user.department || "Unassigned";
      if (!acc[dept]) {
        acc[dept] = {
          users: 0,
          projects: 0,
          completedTasks: 0,
          totalBudget: 0
        };
      }
      acc[dept].users++;
      return acc;
    }, {} as Record<string, any>);
    
    allProjects.forEach(project => {
      const dept = project.department;
      if (departmentStats[dept]) {
        departmentStats[dept].projects++;
        departmentStats[dept].totalBudget += project.budget;
      }
    });
    
    allTasks.forEach(task => {
      if (task.status === "completed") {
        const project = allProjects.find(p => p._id === task.projectId);
        if (project && departmentStats[project.department]) {
          departmentStats[project.department].completedTasks++;
        }
      }
    });
    
    return {
      totalUsers: allUsers.length,
      totalProjects: allProjects.length,
      totalTasks: allTasks.length,
      totalBudget: allProjects.reduce((sum, p) => sum + p.budget, 0),
      departmentStats,
      projectsByStatus: {
        planning: allProjects.filter(p => p.status === "draft").length,
        active: allProjects.filter(p => p.status === "active").length,
        completed: allProjects.filter(p => p.status === "completed").length,
        cancelled: allProjects.filter(p => p.status === "cancelled").length,
      },
      tasksByStatus: {
        todo: allTasks.filter(t => t.status === "todo").length,
        inProgress: allTasks.filter(t => t.status === "in_progress").length,
        review: allTasks.filter(t => t.status === "review").length,
        completed: allTasks.filter(t => t.status === "completed").length,
        cancelled: allTasks.filter(t => t.status === "cancelled").length,
      }
    };
  }
});

export const approveProject = mutation({
  args: { 
    projectId: v.id("projects"), 
    approved: v.boolean(),
    comments: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "CAPTAIN", "ADMIN"]);
    
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    if (currentUser.userLevel.name === "MANAGER") {
      checkDepartmentAccess(currentUser, project.department);
    }
    
    const newStatus = args.approved ? "active" : "cancelled";
    
    await ctx.db.patch(args.projectId, {
      status: newStatus
    });
    
    await ctx.db.insert("notifications", {
      userId: project.createdBy,
      type: args.approved ? "success" : "warning",
      title: `Project ${args.approved ? "Approved" : "Rejected"}`,
      message: `Your project "${project.title}" has been ${args.approved ? "approved" : "rejected"}${args.comments ? ': ' + args.comments : ''}`,
      isRead: false,
      category: "project_approval",
      actionUrl: `/projects/${project._id}`,
      createdAt: Date.now(),
      metadata: {
        priority: "high",
        category: "project_approval",
        relatedId: project._id,
        data: {
          projectTitle: project.title,
          approved: args.approved,
          comments: args.comments
        }
      }
    });
    
    return args.projectId;
  }
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency")),
    startDate: v.number(),
    endDate: v.number(),
    location: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    department: v.string()
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "CAPTAIN", "ADMIN"]);
    
    if (currentUser.userLevel.name === "MANAGER") {
      checkDepartmentAccess(currentUser, args.department);
    }
    
    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: args.description,
      type: args.type,
      status: "draft",
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location || "",
      coordinates: undefined,
      organizer: currentUser._id,
      attendees: [currentUser._id],
      maxAttendees: args.maxAttendees,
      isPublic: true,
      requiresApproval: false,
      attachments: []
    });
    
    return eventId;
  }
});

// Assign users to projects (MANAGER + CAPTAIN + ADMIN)
export const assignUserToProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "CAPTAIN", "ADMIN"]);
    
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");
    
    // Managers can only assign users from their department (CAPTAIN and ADMIN have all access)
    if (currentUser.userLevel.name === "MANAGER") {
      checkDepartmentAccess(currentUser, project.department);
      checkDepartmentAccess(currentUser, targetUser.department || "");
    }
    
    // Add user to project if not already assigned
    if (!project.assignedTo.includes(args.userId)) {
      await ctx.db.patch(args.projectId, {
        assignedTo: [...project.assignedTo, args.userId]
      });
      
      // Notify assigned user
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "info",
        title: "Assigned to Project",
        message: `You have been assigned to project: ${project.title}`,
        isRead: false,
        category: "project_assignment",
        actionUrl: `/projects/${project._id}`,
        createdAt: Date.now(),
        metadata: {
          priority: "medium",
          category: "project_assignment",
          relatedId: project._id,
          data: {
            projectTitle: project.title
          }
        }
      });
    }
    
    return args.projectId;
  }
});

// ===== BUILDER ROLE FUNCTIONS (Level 2) =====

// Create project (BUILDER + MANAGER + CAPTAIN + ADMIN) - Enhanced version
export const createProjectWithApproval = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    department: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    budget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "CAPTAIN", "ADMIN"]);
    
    // BUILDERs can only create projects in their department
    if (currentUser.userLevel.name === "BUILDER") {
      checkDepartmentAccess(currentUser, args.department);
    }
    
    // Set initial status based on role
    const initialStatus = currentUser.userLevel.name === "BUILDER" ? "draft" : "active";
    
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      department: args.department,
      status: initialStatus,
      priority: "medium",
      urgency: "normal" as const,
      budget: args.budget || 0,
      spent: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      createdBy: currentUser._id,
      assignedTo: [currentUser._id],
      tags: [],
      attachments: [],
      progress: 0,
      liveblocksRoom: `project-${Date.now()}`,
      isPublic: false,
      location: undefined,
      coordinates: undefined,
      approvalStatus: initialStatus === "draft" ? "pending" as const : "approved" as const,
      successCriteria: [],
      milestones: [],
      totalExperienceReward: 0,
      projectLevel: 1,
      impactArea: [],
      publicVisibility: "internal" as const,
      statusHistory: [{ status: initialStatus, changedBy: currentUser._id, changedAt: Date.now() }],
    });
    
    // If created by BUILDER, notify department MANAGER for approval
    if (currentUser.userLevel.name === "BUILDER") {
      const managers = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("department"), args.department))
        .collect();
      
      const departmentManagers = await Promise.all(
        managers.map(async (user) => {
          const userLevel = await ctx.db.get(user.userLevel);
          return userLevel?.name === "MANAGER" ? user : null;
        })
      );
      
      const validManagers = departmentManagers.filter(Boolean);
      
      // Notify all department managers
      for (const manager of validManagers) {
        await ctx.db.insert("notifications", {
          userId: manager!._id,
          type: "info",
          title: "Project Approval Needed",
          message: `${currentUser.name} created project "${args.title}" that needs approval`,
          isRead: false,
          category: "project_approval",
          actionUrl: `/projects/${projectId}`,
          createdAt: Date.now(),
          metadata: {
            priority: "high",
            category: "project_approval",
            relatedId: projectId,
            data: {
              projectTitle: args.title,
              creatorName: currentUser.name
            }
          }
        });
      }
    }
    
    return projectId;
  }
});

// Assign task to worker (BUILDER + MANAGER + CAPTAIN + ADMIN)
export const assignTaskToWorker = mutation({
  args: {
    taskId: v.id("tasks"),
    workerId: v.id("users")
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "CAPTAIN", "ADMIN"]);
    
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    const worker = await ctx.db.get(args.workerId);
    if (!worker) throw new Error("Worker not found");
    
    const workerLevel = await ctx.db.get(worker.userLevel);
    if (!workerLevel) throw new Error("Worker level not found");
    
    // Verify worker is WORKER role
    if (workerLevel.name !== "WORKER") {
      throw new Error("Can only assign tasks to WORKER role users");
    }
    
    // Check department access for BUILDER and MANAGER (CAPTAIN and ADMIN have all access)
    if (["BUILDER", "MANAGER"].includes(currentUser.userLevel.name)) {
      checkDepartmentAccess(currentUser, worker.department || "");
    }
    
    await ctx.db.patch(args.taskId, { 
      assignedTo: [args.workerId] // Wrap in array for multiple assignment support
    });
    
    // Notify worker
    await ctx.db.insert("notifications", {
      userId: args.workerId,
      type: "info",
      title: "New Task Assigned",
      message: `You've been assigned task: ${task.title}`,
      isRead: false,
      category: "task_assignment",
      actionUrl: `/tasks/${task._id}`,
      createdAt: Date.now(),
      metadata: {
        priority: task.priority,
        category: "task_assignment",
        relatedId: task._id,
        data: {
          taskTitle: task.title,
          assignedBy: currentUser.name
        }
      }
    });
    
    return args.taskId;
  }
});

// ===== WORKER ROLE FUNCTIONS (Level 1) =====

// Update task status (WORKER for own tasks, others for tasks they created/manage)
export const updateMyTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("in_progress"), v.literal("review"), v.literal("completed")),
    actualHours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    // WORKERs can only update tasks assigned to them
    if (currentUser.userLevel.name === "WORKER" && task.assignedTo !== currentUser._id) {
      throw new Error("You can only update tasks assigned to you");
    }
    
    // Others can update tasks they created or manage
    if (currentUser.userLevel.name !== "WORKER" && task.createdBy !== currentUser._id) {
      // Check if they have permission to manage this task
      if (!["ADMIN", "CAPTAIN"].includes(currentUser.userLevel.name)) {
        const project = task.projectId ? await ctx.db.get(task.projectId) : null;
        if (project && currentUser.userLevel.name === "MANAGER") {
          checkDepartmentAccess(currentUser, project.department);
        }
      }
    }
    
    const oldStatus = task.status;
    
    await ctx.db.patch(args.taskId, {
      status: args.status,
      actualHours: args.actualHours ?? task.actualHours,
    });
    
    // Award XP and gold if completed for the first time
    if (args.status === "completed" && oldStatus !== "completed") {
      // Award all assigned users
      for (const userId of task.assignedTo) {
        const assignedUser = await ctx.db.get(userId);
        if (assignedUser) {
          await ctx.db.patch(userId, {
            experience: assignedUser.experience + (task.experienceReward || 10),
            gold: assignedUser.gold + (task.goldReward || 5),
            totalTasksCompleted: assignedUser.totalTasksCompleted + 1
          });
        }
      }
      
      // Notify task creator if not in assignee list
      if (!task.assignedTo.includes(task.createdBy)) {
        await ctx.db.insert("notifications", {
          userId: task.createdBy,
          type: "success",
          title: "Task Completed",
          message: `${currentUser.name} completed task: ${task.title}`,
          isRead: false,
          category: "task_completion",
          actionUrl: `/tasks/${task._id}`,
          createdAt: Date.now(),
          metadata: {
            priority: "medium",
            category: "task_completion",
            relatedId: task._id,
            data: {
              taskTitle: task.title,
              completedBy: currentUser.name
            }
          }
        });
      }
    }
    
    return args.taskId;
  }
});

// Join event (All roles)
export const joinEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    
    // Check if already joined
    if (event.attendees.includes(currentUser._id)) {
      throw new Error("Already joined this event");
    }
    
    // Check max attendees limit
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      throw new Error("Event is full");
    }
    
    await ctx.db.patch(args.eventId, {
      attendees: [...event.attendees, currentUser._id]
    });
    
    return args.eventId;
  }
});

// Leave event (All roles)
export const leaveEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    
    // Remove user from attendees
    await ctx.db.patch(args.eventId, {
      attendees: event.attendees.filter(id => id !== currentUser._id)
    });
    
    return args.eventId;
  }
});
