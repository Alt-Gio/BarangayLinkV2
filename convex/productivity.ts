import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission, checkDepartmentAccess } from "./roleBasedAccess";

export const createProject = mutation({
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
    
    const userRole = currentUser.userLevel.name;
    
    if (userRole === "MANAGER" || userRole === "BUILDER") {
      checkDepartmentAccess(currentUser, args.department);
    }
    
    const initialStatus = userRole === "BUILDER" ? "draft" : "active";

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
  },
});

export const createTask = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    assignedTo: v.array(v.id("users")),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    
    const assignedUsers = await Promise.all(
      args.assignedTo.map(userId => ctx.db.get(userId))
    );
    
    if (assignedUsers.some(u => !u)) throw new Error("One or more assigned users not found");
    
    if (["BUILDER", "MANAGER"].includes(currentUser.userLevel.name)) {
      for (const user of assignedUsers) {
        if (user) checkDepartmentAccess(currentUser, user.department || "");
      }
    }
    
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) throw new Error("Project not found");
      
      if (currentUser.userLevel.name === "BUILDER" && project.createdBy !== currentUser._id) {
        throw new Error("BUILDERs can only create tasks in projects they created");
      }
      
      if (currentUser.userLevel.name === "MANAGER") {
        checkDepartmentAccess(currentUser, project.department);
      }
    }
    const taskId = await ctx.db.insert("tasks", {
      userId: args.assignedTo[0] || currentUser._id,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      type: "todo",
      difficulty: "easy",
      status: "todo",
      priority: args.priority,
      completed: false,
      createdAt: Date.now(),
      assignedTo: args.assignedTo,
      createdBy: currentUser._id,
      dueDate: args.dueDate,
      estimatedHours: args.estimatedHours,
      actualHours: 0,
      loggedHours: [],
      tags: [],
      attachments: [],
      dependencies: [],
      subtasks: [],
      experienceReward: 10,
      goldReward: 5,
      completionCount: 0,
      habitFrequency: undefined,
      positiveHabit: undefined,
      streak: undefined,
      lastCompleted: undefined,
      isBlocking: false,
    });

    for (const userId of args.assignedTo) {
      await ctx.db.insert("notifications", {
        userId: userId,
        type: "info",
        title: "New Task Assigned",
        message: `You have been assigned to task: ${args.title}`,
        isRead: false,
        category: "task_assignment",
        actionUrl: `/tasks/${taskId}`,
        createdAt: Date.now(),
        metadata: {
          priority: args.priority,
          category: "task_assignment",
          relatedId: taskId,
          data: {
            taskTitle: args.title,
          }
        },
      });
    }

    return taskId;
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("completed"), v.literal("cancelled")),
    actualHours: v.optional(v.number()),
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
      if (!["ADMIN"].includes(currentUser.userLevel.name)) {
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
  },
});

// Get projects based on user role (deprecated - use getMyProjects from roleBasedQueries instead)
export const getProjects = query({
  args: {
    department: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check authentication - return empty if not authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    let query = ctx.db.query("projects");
    
    // Apply role-based filtering based on user requirements
    // NOTE: assignedTo is now an array, so we need to filter in JS
    const allProjects = await query.order("desc").take(args.limit || 100); // OPTIMIZED: Default 100, max from args
    
    // Get all users to check creator roles for BUILDER filtering
    const allUsers = await ctx.db.query("users").take(200); // OPTIMIZED: Limit user loading
    const userRoles = new Map();
    for (const user of allUsers) {
      if (user.userLevel) {
        const level = await ctx.db.get(user.userLevel);
        if (level) {
          userRoles.set(user._id, level.name);
        }
      }
    }
    
    let filteredProjects = allProjects;
    
    switch(userLevel) {
      case "ADMIN":
      case "CAPTAIN":
        // ADMIN and CAPTAIN can see ALL projects
        break;
        
      case "MANAGER":
        // MANAGER can see all projects in THEIR department OR projects they're assigned to
        filteredProjects = allProjects.filter(project => 
          project.department === currentUser.department || 
          project.assignedTo.includes(currentUser._id)
        );
        break;
        
      case "BUILDER":
        // BUILDER can see:
        // 1. Projects in their department created by MANAGER or higher
        // 2. Projects they're assigned to (any department)
        filteredProjects = allProjects.filter(project => {
          // Always show if assigned
          if (project.assignedTo.includes(currentUser._id)) {
            return true;
          }
          
          // Show projects in their department created by MANAGER, CAPTAIN, or ADMIN
          if (project.department === currentUser.department) {
            const creatorRole = userRoles.get(project.createdBy);
            return creatorRole && ["MANAGER", "CAPTAIN", "ADMIN"].includes(creatorRole);
          }
          
          return false;
        });
        break;
        
      case "WORKER":
        // WORKER can only see projects they're assigned to
        filteredProjects = allProjects.filter(project => 
          project.assignedTo.includes(currentUser._id)
        );
        break;
        
      default:
        return [];
    }

    // Apply additional filters on filteredProjects
    if (args.department && userLevel === "ADMIN") {
      filteredProjects = filteredProjects.filter(p => p.department === args.department);
    }
    if (args.status) {
      filteredProjects = filteredProjects.filter(p => p.status === args.status);
    }

    // Sort by creation time (newest first) and apply limit
    const sortedProjects = filteredProjects
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, args.limit || 50);

    return sortedProjects;
  },
});

// Get tasks for a project
export const getProjectTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Get assignee details for each task (assignedTo is now an array)
    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        const assignees = await Promise.all(
          task.assignedTo.map(userId => ctx.db.get(userId))
        );
        
        return {
          ...task,
          assignees: assignees.filter(a => a !== null).map(a => ({
            _id: a!._id,
            name: a!.name,
            imageUrl: a!.imageUrl,
          })),
        };
      })
    );

    return tasksWithAssignees;
  },
});

// Get dashboard analytics (deprecated - use getRoleBasedAnalytics from roleBasedQueries instead)
export const getDashboardAnalytics = query({
  args: { 
    department: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check authentication - return empty analytics if not authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalBudget: 0,
        projects: [],
        tasks: [],
      };
    }
    
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    let projectQuery = ctx.db.query("projects");
    let taskQuery = ctx.db.query("tasks");
    
    // Apply role-based filtering
    switch(userLevel) {
      case "ADMIN":
        // ADMIN sees system-wide data
        if (args.department) {
          projectQuery = projectQuery.filter((q) => q.eq(q.field("department"), args.department));
        }
        // Note: userId filtering for assignedTo (which is now an array) will be done after collecting
        break;
        
      case "MANAGER":
        // MANAGER sees department data
        projectQuery = projectQuery.filter((q) => q.eq(q.field("department"), currentUser.department));
        // For tasks, get tasks from projects in their department
        const deptProjects = await ctx.db
          .query("projects")
          .filter((q) => q.eq(q.field("department"), currentUser.department))
          .collect();
        const deptProjectIds = deptProjects.map(p => p._id);
        const allTasks = await ctx.db.query("tasks").collect();
        const deptTasks = allTasks.filter(task => 
          task.projectId && deptProjectIds.includes(task.projectId)
        );
        
        const projects = await projectQuery.collect();
        
        const taskStats = {
          total: deptTasks.length,
          todo: deptTasks.filter(t => t.status === "todo").length,
          inProgress: deptTasks.filter(t => t.status === "in_progress").length,
          review: deptTasks.filter(t => t.status === "review").length,
          completed: deptTasks.filter(t => t.status === "completed").length,
          overdue: deptTasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "completed").length,
        };
        
        // Upcoming deadlines (next 7 days)
        const nextWeek = Date.now() + (7 * 24 * 60 * 60 * 1000);
        const upcomingDeadlines = deptTasks
          .filter(t => t.dueDate && t.dueDate > Date.now() && t.dueDate <= nextWeek && t.status !== "completed")
          .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
          .slice(0, 10);
        
        return {
          projectStats: {
            total: projects.length,
            planning: projects.filter(p => p.status === "draft").length,
            active: projects.filter(p => p.status === "active").length,
            completed: projects.filter(p => p.status === "completed").length,
            cancelled: projects.filter(p => p.status === "cancelled").length,
          },
          taskStats,
          upcomingDeadlines,
          totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        };
        
      case "BUILDER":
        // BUILDER sees their project data
        projectQuery = projectQuery.filter((q) => q.eq(q.field("createdBy"), currentUser._id));
        taskQuery = taskQuery.filter((q) => q.eq(q.field("createdBy"), currentUser._id));
        break;
        
      case "WORKER":
        // WORKER sees their task data (assignedTo is now an array, filter in JS)
        const allWorkerTasks = await taskQuery.collect();
        const workerTasks = allWorkerTasks.filter(t => t.assignedTo.includes(currentUser._id));
        const workerProjectIds = [...new Set(workerTasks.map(t => t.projectId).filter(Boolean))];
        const workerProjects = await Promise.all(
          workerProjectIds.map(id => id ? ctx.db.get(id) : null)
        );
        const validWorkerProjects = workerProjects.filter(Boolean);
        
        return {
          projectStats: {
            total: validWorkerProjects.length,
            planning: validWorkerProjects.filter(p => p?.status === "draft").length,
            active: validWorkerProjects.filter(p => p?.status === "active").length,
            completed: validWorkerProjects.filter(p => p?.status === "completed").length,
            cancelled: validWorkerProjects.filter(p => p?.status === "cancelled").length,
          },
          taskStats: {
            total: workerTasks.length,
            todo: workerTasks.filter(t => t.status === "todo").length,
            inProgress: workerTasks.filter(t => t.status === "in_progress").length,
            review: workerTasks.filter(t => t.status === "review").length,
            completed: workerTasks.filter(t => t.status === "completed").length,
            overdue: workerTasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "completed").length,
          },
          upcomingDeadlines: workerTasks
            .filter(t => t.dueDate && t.dueDate > Date.now() && t.dueDate <= Date.now() + (7 * 24 * 60 * 60 * 1000) && t.status !== "completed")
            .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
            .slice(0, 10),
          totalBudget: 0, // Workers don't see budget info
          userStats: {
            experience: currentUser.experience,
            gold: currentUser.gold,
            level: currentUser.level,
            tasksCompleted: currentUser.totalTasksCompleted,
          }
        };
        
      default:
        return {
          projectStats: { total: 0, planning: 0, active: 0, completed: 0, cancelled: 0 },
          taskStats: { total: 0, todo: 0, inProgress: 0, review: 0, completed: 0, overdue: 0 },
          upcomingDeadlines: [],
          totalBudget: 0,
        };
    }

    const projects = await projectQuery.collect();
    let tasks = await taskQuery.collect();
    
    // Filter by userId if specified (assignedTo is now an array)
    if (args.userId) {
      tasks = tasks.filter(t => t.assignedTo.includes(args.userId!));
    }

    // Project statistics
    const projectStats = {
      total: projects.length,
      planning: projects.filter(p => p.status === "draft").length,
      active: projects.filter(p => p.status === "active").length,
      completed: projects.filter(p => p.status === "completed").length,
      cancelled: projects.filter(p => p.status === "cancelled").length,
    };

    // Task statistics
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "todo").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      review: tasks.filter(t => t.status === "review").length,
      completed: tasks.filter(t => t.status === "completed").length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "completed").length,
    };

    // Upcoming deadlines (next 7 days)
    const nextWeek = Date.now() + (7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = tasks
      .filter(t => t.dueDate && t.dueDate > Date.now() && t.dueDate <= nextWeek && t.status !== "completed")
      .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
      .slice(0, 10);

    return {
      projectStats,
      taskStats,
      upcomingDeadlines,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    };
  },
});
