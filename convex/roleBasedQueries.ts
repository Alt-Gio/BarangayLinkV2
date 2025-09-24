import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkDepartmentAccess } from "./roleBasedAccess";

// ===== ROLE-BASED DATA QUERIES =====

// Get projects based on user role
export const getMyProjects = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    let query = ctx.db.query("projects");
    
    // Apply role-based filtering
    switch(userLevel) {
      case "ADMIN":
        // ADMIN can see all projects
        break;
        
      case "MANAGER":
        // MANAGER can see all projects in their department
        query = query.filter((q) => q.eq(q.field("department"), currentUser.department));
        break;
        
      case "BUILDER":
        // BUILDER can see projects they created
        query = query.filter((q) => q.eq(q.field("createdBy"), currentUser._id));
        break;
        
      case "WORKER":
        // WORKER can see projects they're assigned to
        query = query.filter((q) => q.eq(q.field("assignedTo"), currentUser._id));
        break;
        
      default:
        return [];
    }
    
    // Apply status filter if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const projects = await query
      .order("desc")
      .take(args.limit || 50);
    
    // Enrich with creator information
    const projectsWithCreators = await Promise.all(
      projects.map(async (project) => {
        const creator = await ctx.db.get(project.createdBy);
        return {
          ...project,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            imageUrl: creator.imageUrl,
          } : null,
        };
      })
    );
    
    return projectsWithCreators;
  }
});

// Get tasks based on user role
export const getMyTasks = query({
  args: {
    status: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    let query = ctx.db.query("tasks");
    
    // Apply role-based filtering
    switch(userLevel) {
      case "ADMIN":
        // ADMIN can see all tasks
        break;
        
      case "MANAGER":
        // MANAGER can see tasks in projects from their department
        const departmentProjects = await ctx.db
          .query("projects")
          .filter((q) => q.eq(q.field("department"), currentUser.department))
          .collect();
        
        const departmentProjectIds = departmentProjects.map(p => p._id);
        
        if (departmentProjectIds.length > 0) {
          // Filter tasks by project IDs in their department
          const allTasks = await ctx.db.query("tasks").collect();
          const departmentTasks = allTasks.filter(task => 
            task.projectId && departmentProjectIds.includes(task.projectId)
          );
          
          // Apply additional filters
          let filteredTasks = departmentTasks;
          
          if (args.status) {
            filteredTasks = filteredTasks.filter(t => t.status === args.status);
          }
          
          if (args.projectId) {
            filteredTasks = filteredTasks.filter(t => t.projectId === args.projectId);
          }
          
          return filteredTasks
            .sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0))
            .slice(0, args.limit || 50);
        }
        return [];
        
      case "BUILDER":
        // BUILDER can see tasks they created
        query = query.filter((q) => q.eq(q.field("createdBy"), currentUser._id));
        break;
        
      case "WORKER":
        // WORKER can see tasks assigned to them
        query = query.filter((q) => q.eq(q.field("assignedTo"), currentUser._id));
        break;
        
      default:
        return [];
    }
    
    // Apply filters for non-MANAGER roles
    if (userLevel !== "MANAGER") {
      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }
      
      if (args.projectId) {
        query = query.filter((q) => q.eq(q.field("projectId"), args.projectId));
      }
    }
    
    const tasks = await query
      .order("desc")
      .take(args.limit || 50);
    
    // Enrich with assignee and creator information
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const assignee = await ctx.db.get(task.assignedTo);
        const creator = await ctx.db.get(task.createdBy);
        
        return {
          ...task,
          assignee: assignee ? {
            _id: assignee._id,
            name: assignee.name,
            imageUrl: assignee.imageUrl,
          } : null,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            imageUrl: creator.imageUrl,
          } : null,
        };
      })
    );
    
    return tasksWithDetails;
  }
});

// Get events based on user role
export const getMyEvents = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    let query = ctx.db.query("events");
    
    // Apply role-based filtering
    switch(userLevel) {
      case "ADMIN":
        // ADMIN can see all events
        break;
        
      case "MANAGER":
        // MANAGER can see all events (since events don't have department field)
        // or events they organized
        break;
        
      case "BUILDER":
      case "WORKER":
        // BUILDER and WORKER can see public events or events they created/joined
        const allEvents = await ctx.db.query("events").collect();
        const accessibleEvents = allEvents.filter(event => 
          event.isPublic || 
          event.organizer === currentUser._id || 
          event.attendees.includes(currentUser._id)
        );
        
        let filteredEvents = accessibleEvents;
        
        if (args.type) {
          filteredEvents = filteredEvents.filter(e => e.type === args.type);
        }
        
        return filteredEvents
          .sort((a, b) => b.startDate - a.startDate)
          .slice(0, args.limit || 50);
        
      default:
        return [];
    }
    
    // Apply type filter
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    const events = await query
      .order("desc")
      .take(args.limit || 50);
    
    return events;
  }
});

// Get dashboard analytics based on user role
export const getRoleBasedAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    let projectQuery;
    let taskQuery;
    
    switch(userLevel) {
      case "ADMIN":
        // ADMIN sees system-wide data
        projectQuery = ctx.db.query("projects");
        taskQuery = ctx.db.query("tasks");
        break;
        
      case "MANAGER":
        // MANAGER sees department data
        projectQuery = ctx.db.query("projects")
          .filter((q) => q.eq(q.field("department"), currentUser.department));
        
        // For tasks, need to get tasks from projects in their department
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
        
        return {
          projectStats: {
            total: projects.length,
            planning: projects.filter(p => p.status === "planning").length,
            active: projects.filter(p => p.status === "active").length,
            completed: projects.filter(p => p.status === "completed").length,
            cancelled: projects.filter(p => p.status === "cancelled").length,
          },
          taskStats: {
            total: deptTasks.length,
            todo: deptTasks.filter(t => t.status === "todo").length,
            inProgress: deptTasks.filter(t => t.status === "in_progress").length,
            review: deptTasks.filter(t => t.status === "review").length,
            completed: deptTasks.filter(t => t.status === "completed").length,
            overdue: deptTasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "completed").length,
          },
          totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
          department: currentUser.department,
        };
        
      case "BUILDER":
        // BUILDER sees their project data
        projectQuery = ctx.db.query("projects")
          .filter((q) => q.eq(q.field("createdBy"), currentUser._id));
        taskQuery = ctx.db.query("tasks")
          .filter((q) => q.eq(q.field("createdBy"), currentUser._id));
        break;
        
      case "WORKER":
        // WORKER sees their task data
        const workerTasks = await ctx.db
          .query("tasks")
          .filter((q) => q.eq(q.field("assignedTo"), currentUser._id))
          .collect();
        
        const workerProjectIds = [...new Set(workerTasks.map(t => t.projectId).filter(Boolean))];
        const workerProjects = await Promise.all(
          workerProjectIds.map(id => id ? ctx.db.get(id) : null)
        );
        const validWorkerProjects = workerProjects.filter(Boolean);
        
        return {
          projectStats: {
            total: validWorkerProjects.length,
            planning: validWorkerProjects.filter(p => p?.status === "planning").length,
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
          totalBudget: 0,
        };
    }
    
    if (userLevel !== "MANAGER" && userLevel !== "WORKER") {
      const projects = await projectQuery.collect();
      const tasks = await taskQuery.collect();
      
      return {
        projectStats: {
          total: projects.length,
          planning: projects.filter(p => p.status === "planning").length,
          active: projects.filter(p => p.status === "active").length,
          completed: projects.filter(p => p.status === "completed").length,
          cancelled: projects.filter(p => p.status === "cancelled").length,
        },
        taskStats: {
          total: tasks.length,
          todo: tasks.filter(t => t.status === "todo").length,
          inProgress: tasks.filter(t => t.status === "in_progress").length,
          review: tasks.filter(t => t.status === "review").length,
          completed: tasks.filter(t => t.status === "completed").length,
          overdue: tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "completed").length,
        },
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      };
    }
    
    return {
      projectStats: { total: 0, planning: 0, active: 0, completed: 0, cancelled: 0 },
      taskStats: { total: 0, todo: 0, inProgress: 0, review: 0, completed: 0, overdue: 0 },
      totalBudget: 0,
    };
  }
});

// Get team members based on user role and department
export const getTeamMembers = query({
  args: {
    department: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    let query = ctx.db.query("users");
    
    // Apply role-based filtering
    switch(userLevel) {
      case "ADMIN":
        // ADMIN can see all users
        break;
        
      case "MANAGER":
        // MANAGER can see users in their department
        query = query.filter((q) => q.eq(q.field("department"), currentUser.department));
        break;
        
      case "BUILDER":
        // BUILDER can see workers in their department
        const allUsers = await ctx.db.query("users").collect();
        const deptUsers = allUsers.filter(user => user.department === currentUser.department);
        
        const accessibleUsers = await Promise.all(
          deptUsers.map(async (user) => {
            const userLevel = await ctx.db.get(user.userLevel);
            return userLevel?.name === "WORKER" ? user : null;
          })
        );
        
        return accessibleUsers.filter(Boolean);
        
      case "WORKER":
        // WORKER can see other workers in their department
        const workerUsers = await ctx.db.query("users").collect();
        const departmentWorkers = workerUsers.filter(user => user.department === currentUser.department);
        
        const workers = await Promise.all(
          departmentWorkers.map(async (user) => {
            const userLevel = await ctx.db.get(user.userLevel);
            return userLevel?.name === "WORKER" ? user : null;
          })
        );
        
        return workers.filter(Boolean);
        
      default:
        return [];
    }
    
    // Apply department filter if provided
    if (args.department && userLevel === "ADMIN") {
      query = query.filter((q) => q.eq(q.field("department"), args.department));
    }
    
    const users = await query.collect();
    
    // Filter by role if provided
    if (args.role) {
      const filteredUsers = await Promise.all(
        users.map(async (user) => {
          const userLevel = await ctx.db.get(user.userLevel);
          return userLevel?.name === args.role ? user : null;
        })
      );
      
      return filteredUsers.filter(Boolean);
    }
    
    // Enrich with user level information
    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          ...user,
          userLevelName: userLevel?.name || "Unknown",
          userLevelDetails: userLevel,
        };
      })
    );
    
    return usersWithLevels;
  }
});

// Get notifications based on user role
export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    let query = ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("userId"), currentUser._id));
    
    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }
    
    const notifications = await query
      .order("desc")
      .take(args.limit || 50);
    
    return notifications;
  }
});

// Get pending approvals (MANAGER + ADMIN only)
export const getPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    const userLevel = currentUser.userLevel.name;
    
    if (!["MANAGER", "ADMIN"].includes(userLevel)) {
      throw new Error("Access denied. Manager or Admin role required.");
    }
    
    let query = ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("status"), "planning"));
    
    // MANAGER can only see approvals in their department
    if (userLevel === "MANAGER") {
      query = query.filter((q) => q.eq(q.field("department"), currentUser.department));
    }
    
    const pendingProjects = await query.collect();
    
    // Enrich with creator information
    const projectsWithCreators = await Promise.all(
      pendingProjects.map(async (project) => {
        const creator = await ctx.db.get(project.createdBy);
        return {
          ...project,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            imageUrl: creator.imageUrl,
          } : null,
        };
      })
    );
    
    return projectsWithCreators;
  }
});
