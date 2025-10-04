import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

// Public stats for landing page (no authentication required)
export const getPublicStats = query({
  args: {},
  handler: async (ctx, args) => {
    try {
      // Get public data only
      const [publicProjects, publicEvents] = await Promise.all([
        ctx.db.query("projects")
          .filter((q) => q.eq(q.field("isPublic"), true))
          .collect(),
        ctx.db.query("events")
          .filter((q) => q.eq(q.field("isPublic"), true))
          .collect()
      ]);

      const activeProjects = publicProjects.filter(p => p.status === "active");
      const upcomingEvents = publicEvents.filter(e => e.startDate > Date.now());

      return {
        systemOverview: {
          totalUsers: 0, // Don't expose user count publicly
          activeUsers: 0,
          totalProjects: publicProjects.length,
          activeProjects: activeProjects.length,
          totalTasks: 0, // Don't expose task count publicly
          completedTasks: 0,
          totalBudget: publicProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
          totalSpent: 0
        },
        recentActivity: upcomingEvents.slice(0, 5).map(event => ({
          type: 'event',
          title: event.title,
          description: event.description,
          timestamp: event.startDate
        }))
      };
    } catch (error) {
      console.error("Error getting public stats:", error);
      return {
        systemOverview: {
          totalUsers: 0,
          activeUsers: 0,
          totalProjects: 0,
          activeProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalBudget: 0,
          totalSpent: 0
        },
        recentActivity: []
      };
    }
  },
});

async function getDepartmentStats(ctx: any, users: any[], projects: any[]) {
  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
  
  return departments.map(dept => {
    const deptUsers = users.filter(u => u.department === dept);
    const deptProjects = projects.filter(p => p.department === dept);
    const completedProjects = deptProjects.filter(p => p.status === "completed");
    
    return {
      name: dept,
      totalUsers: deptUsers.length,
      totalProjects: deptProjects.length,
      activeProjects: deptProjects.filter(p => p.status === "active").length,
      completionRate: deptProjects.length > 0 ? Math.round((completedProjects.length / deptProjects.length) * 100) : 0
    };
  });
}

async function getRecentSystemActivity(ctx: any, oneWeekAgo: number) {
  const activities: any[] = [];
  
  // Get recent projects
  const recentProjects = await ctx.db
    .query("projects")
    .filter((q: any) => q.gte(q.field("_creationTime"), oneWeekAgo))
    .order("desc")
    .take(5);
  
  recentProjects.forEach((project: any) => {
    activities.push({
      title: `New project created: ${project.title}`,
      description: `${project.department} department`,
      timeAgo: getTimeAgo(project._creationTime),
      type: "project"
    });
  });
  
  return activities.slice(0, 10);
}

async function getCriticalAlerts(ctx: any, projects: any[], tasks: any[]) {
  const alerts = [];
  const now = Date.now();
  
  // Overdue projects
  const overdueProjects = projects.filter(p => 
    p.endDate && p.endDate < now && p.status !== "completed"
  );
  
  if (overdueProjects.length > 0) {
    alerts.push({
      type: "overdue_projects",
      message: `${overdueProjects.length} projects are overdue and need attention`
    });
  }
  
  // Budget overruns
  const budgetOverruns = projects.filter(p => 
    p.budget && p.spent && p.spent > p.budget
  );
  
  if (budgetOverruns.length > 0) {
    alerts.push({
      type: "budget_overrun",
      message: `${budgetOverruns.length} projects have exceeded their budget`
    });
  }
  
  return alerts;
}

async function getUserGrowthStats(ctx: any, users: any[], oneWeekAgo: number) {
  const newUsers = users.filter(u => u._creationTime >= oneWeekAgo);
  const totalUsers = users.length;
  
  return {
    newUsersThisWeek: newUsers.length,
    totalUsers,
    growthRate: totalUsers > 0 ? Math.round((newUsers.length / totalUsers) * 100) : 0
  };
}

async function getProjectPerformanceStats(ctx: any, projects: any[], tasks: any[]) {
  const activeProjects = projects.filter(p => p.status === "active");
  const completedProjects = projects.filter(p => p.status === "completed");
  
  return {
    onTimeCompletion: Math.round((completedProjects.length / projects.length) * 100),
    averageProjectDuration: calculateAverageProjectDuration(completedProjects),
    budgetEfficiency: calculateBudgetEfficiency(projects)
  };
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function calculateAverageProjectDuration(projects: any[]): number {
  if (projects.length === 0) return 0;
  
  const durations = projects
    .filter(p => p.startDate && p.endDate)
    .map(p => p.endDate - p.startDate);
  
  const avgMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  return Math.round(avgMs / (1000 * 60 * 60 * 24)); // Convert to days
}

function calculateBudgetEfficiency(projects: any[]): number {
  const projectsWithBudget = projects.filter(p => p.budget && p.spent);
  if (projectsWithBudget.length === 0) return 100;
  
  const totalBudget = projectsWithBudget.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projectsWithBudget.reduce((sum, p) => sum + p.spent, 0);
  
  return Math.round((totalBudget / totalSpent) * 100);
}

// Main dashboard queries
export const getAdminDashboard = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser || currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Admin access required");
    }

    const [users, projects, tasks, events, notifications, sessions] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("events").collect(),
      ctx.db.query("notifications").collect(),
      ctx.db.query("userSessions").filter((q: any) => q.eq(q.field("isActive"), true)).collect()
    ]);

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    return {
      systemOverview: {
        totalUsers: users.length,
        activeUsers: sessions.length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === "active").length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === "completed").length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        totalSpent: projects.reduce((sum, p) => sum + (p.spent || 0), 0)
      },
      departmentStats: await getDepartmentStats(ctx, users, projects),
      recentActivity: await getRecentSystemActivity(ctx, oneWeekAgo),
      criticalAlerts: await getCriticalAlerts(ctx, projects, tasks),
      userGrowth: await getUserGrowthStats(ctx, users, oneWeekAgo),
      projectPerformance: await getProjectPerformanceStats(ctx, projects, tasks)
    };
  }
});

export const getManagerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser || currentUser.userLevel.name !== "MANAGER") {
      throw new Error("Manager access required");
    }

    const department = currentUser.department;
    
    const [departmentUsers, departmentProjects, allTasks, pendingApprovals, departmentEvents] = await Promise.all([
      ctx.db.query("users").filter((q: any) => q.eq(q.field("department"), department)).collect(),
      ctx.db.query("projects").filter((q: any) => q.eq(q.field("department"), department)).collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("projects")
        .filter((q: any) => q.eq(q.field("status"), "draft"))
        .filter((q: any) => q.eq(q.field("department"), department))
        .collect(),
      ctx.db.query("events").filter((q: any) => q.eq(q.field("organizer"), currentUser._id)).collect()
    ]);

    // Get tasks for department projects
    const departmentProjectIds = departmentProjects.map(p => p._id);
    const relevantTasks = allTasks.filter(task => 
      task.projectId && departmentProjectIds.includes(task.projectId)
    );

    // Calculate team performance
    const teamPerformance = departmentUsers.map(user => {
      const userTasks = relevantTasks.filter(t => t.assignedTo === user._id);
      const completedTasks = userTasks.filter(t => t.status === "completed");
      
      return {
        userId: user._id,
        name: user.name,
        role: (user.userLevel as any)?.name || "WORKER",
        tasksCompleted: completedTasks.length,
        totalTasks: userTasks.length,
        productivityScore: userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0
      };
    });

    return {
      departmentOverview: {
        teamSize: departmentUsers.length,
        activeProjects: departmentProjects.filter(p => p.status === "active").length,
        completedProjects: departmentProjects.filter(p => p.status === "completed").length,
        totalTasks: relevantTasks.length,
        completedTasks: relevantTasks.filter(t => t.status === "completed").length,
        departmentBudget: departmentProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
        budgetUsed: departmentProjects.reduce((sum, p) => sum + (p.spent || 0), 0)
      },
      teamPerformance,
      pendingApprovals,
      upcomingDeadlines: relevantTasks
        .filter(t => t.dueDate && t.dueDate > Date.now() && t.status !== "completed")
        .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
        .slice(0, 5),
      departmentProjects: departmentProjects.slice(0, 5),
      recentActivity: await getRecentSystemActivity(ctx, Date.now() - (7 * 24 * 60 * 60 * 1000))
    };
  }
});

export const getBuilderDashboard = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser || currentUser.userLevel.name !== "BUILDER") {
      throw new Error("Builder access required");
    }

    const [myProjects, myTasks, myEvents] = await Promise.all([
      ctx.db.query("projects").filter((q: any) => q.eq(q.field("createdBy"), currentUser._id)).collect(),
      ctx.db.query("tasks").filter((q: any) => q.eq(q.field("createdBy"), currentUser._id)).collect(),
      ctx.db.query("events").filter((q: any) => q.eq(q.field("organizer"), currentUser._id)).collect()
    ]);

    // Get assigned workers for my projects - with additional safety checks
    const myProjectIds = myProjects.map(p => p._id).filter(Boolean);
    let projectTasks: any[] = [];
    
    if (myProjectIds.length > 0) {
      try {
        // Get all tasks and filter by project IDs
        const allTasks = await ctx.db.query("tasks").collect();
        projectTasks = allTasks.filter(task => task.projectId && myProjectIds.includes(task.projectId));
      } catch (error) {
        console.error("Error querying project tasks:", error);
        projectTasks = [];
      }
    }
    
    const assignedWorkerIds = [...new Set(projectTasks.map(t => t.assignedTo).filter(Boolean))];
    let assignedWorkers: any[] = [];
    
    if (assignedWorkerIds.length > 0) {
      try {
        assignedWorkers = await Promise.all(
          assignedWorkerIds.map(async (id) => {
            try {
              return await ctx.db.get(id);
            } catch (error) {
              console.error(`Error getting worker ${id}:`, error);
              return null;
            }
          })
        );
        assignedWorkers = assignedWorkers.filter(Boolean);
      } catch (error) {
        console.error("Error getting assigned workers:", error);
        assignedWorkers = [];
      }
    }

    // Calculate worker performance
    const workerPerformance = assignedWorkers.filter(Boolean).map((worker: any) => {
      if (!worker) return null;
      
      const workerTasks = projectTasks.filter(t => t.assignedTo === worker._id);
      const completedTasks = workerTasks.filter(t => t.status === "completed");
      
      return {
        userId: worker._id,
        name: worker.name || 'Unknown',
        tasksCompleted: completedTasks.length,
        completionRate: workerTasks.length > 0 ? Math.round((completedTasks.length / workerTasks.length) * 100) : 0
      };
    }).filter(Boolean);

    // Get upcoming deadlines
    const upcomingDeadlines = myTasks
      .filter(t => t.dueDate && t.dueDate > Date.now() && t.status !== "completed")
      .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
      .slice(0, 5);

    return {
      projectOverview: {
        totalProjects: myProjects.length,
        activeProjects: myProjects.filter(p => p.status === "active").length,
        completedProjects: myProjects.filter(p => p.status === "completed").length,
        assignedWorkers: assignedWorkers.filter(Boolean).length,
        totalBudget: myProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
        budgetUsed: myProjects.reduce((sum, p) => sum + (p.spent || 0), 0)
      },
      taskDistribution: {
        totalTasks: myTasks.length,
        completedTasks: myTasks.filter(t => t.status === "completed").length,
        todoTasks: myTasks.filter(t => t.status === "todo").length,
        inProgressTasks: myTasks.filter(t => t.status === "in_progress").length
      },
      workerPerformance,
      upcomingDeadlines,
      myProjects: myProjects.slice(0, 6)
    };
  }
});

export const getWorkerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser || currentUser.userLevel.name !== "WORKER") {
      throw new Error("Worker access required");
    }

    const [myTasks, availableEvents, myNotifications] = await Promise.all([
      ctx.db.query("tasks").filter((q: any) => q.eq(q.field("assignedTo"), currentUser._id)).collect(),
      ctx.db.query("events").filter((q: any) => q.eq(q.field("isPublic"), true)).collect(),
      ctx.db.query("notifications")
        .filter((q: any) => q.eq(q.field("userId"), currentUser._id))
        .filter((q: any) => q.eq(q.field("isRead"), false))
        .collect()
    ]);

    // Get projects I'm involved in
    const myProjectIds = [...new Set(myTasks.map(t => t.projectId).filter(Boolean))];
    const myProjects = await Promise.all(
      myProjectIds.map(id => id ? ctx.db.get(id) : null)
    );

    return {
      personalStats: {
        level: currentUser.level || 1,
        experience: currentUser.experience || 0,
        gold: currentUser.gold || 0,
        health: currentUser.health || 100,
        totalTasksCompleted: currentUser.totalTasksCompleted || 0,
        streakCount: currentUser.streakCount || 0,
        nextLevelXP: ((currentUser.level || 1) * 1000) - (currentUser.experience || 0)
      },
      taskOverview: {
        totalTasks: myTasks.length,
        todoTasks: myTasks.filter(t => t.status === "todo").length,
        inProgressTasks: myTasks.filter(t => t.status === "in_progress").length,
        completedTasks: myTasks.filter(t => t.status === "completed").length,
        overdueTasks: myTasks.filter(t => 
          t.dueDate && t.dueDate < Date.now() && t.status !== "completed"
        ).length
      },
      myTasks: myTasks.slice(0, 8),
      myProjects: myProjects.filter(Boolean).slice(0, 4),
      upcomingEvents: availableEvents
        .filter(e => e.startDate > Date.now())
        .slice(0, 4),
      unreadNotifications: myNotifications.length
    };
  }
});
