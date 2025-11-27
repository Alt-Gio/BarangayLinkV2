import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get comprehensive analytics data for the dashboard
 * Includes real milestone data, department stats, and team leaderboard
 */
export const getComprehensiveAnalytics = query({
  args: {
    timeRange: v.optional(v.string()), // "week", "month", "quarter", "year"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const now = Date.now();
    
    // Calculate time range filter
    let startDate = 0;
    switch (args.timeRange) {
      case "week":
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "quarter":
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case "year":
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        startDate = 0; // All time
    }

    // Get all data
    const projects = await ctx.db.query("projects").collect();
    const milestones = await ctx.db.query("milestones").collect();
    const tasks = await ctx.db.query("tasks").collect();
    const eventTasks = await ctx.db.query("eventTasks").collect();
    const users = await ctx.db.query("users").collect();
    const departments = await ctx.db.query("departments").collect();
    const events = await ctx.db.query("events").collect();

    // ========== MILESTONE ANALYTICS ==========
    const milestonesWithProgress = await Promise.all(
      milestones.map(async (milestone) => {
        const project = projects.find(p => p._id === milestone.projectId);
        const milestoneTasks = tasks.filter(t => t.milestoneId === milestone._id);
        // Check both status === "done" AND completed === true
        const completedTasks = milestoneTasks.filter(t => t.status === "done" || t.completed === true).length;
        const totalTasks = milestoneTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          _id: milestone._id,
          title: milestone.title,
          description: milestone.description,
          projectTitle: project?.title || "Unknown Project",
          projectId: milestone.projectId,
          targetDate: milestone.targetDate,
          status: milestone.status || (progress === 100 ? "completed" : progress > 0 ? "in_progress" : "pending"),
          progress,
          completedTasks,
          totalTasks,
          isCritical: milestone.isCritical,
        };
      })
    );

    const completedMilestones = milestonesWithProgress.filter(m => m.progress === 100).length;
    const inProgressMilestones = milestonesWithProgress.filter(m => m.progress > 0 && m.progress < 100).length;
    const pendingMilestones = milestonesWithProgress.filter(m => m.progress === 0).length;
    const totalMilestones = milestonesWithProgress.length;
    
    // Calculate overall milestone progress (weighted average by task count)
    const totalMilestoneTasks = milestonesWithProgress.reduce((sum, m) => sum + m.totalTasks, 0);
    const completedMilestoneTasks = milestonesWithProgress.reduce((sum, m) => sum + m.completedTasks, 0);
    const overallMilestoneProgress = totalMilestoneTasks > 0 
      ? Math.round((completedMilestoneTasks / totalMilestoneTasks) * 100) 
      : 0;
    
    // On-time milestone delivery - milestones completed before or on target date
    const completedOnTimeMilestones = milestonesWithProgress.filter(m => {
      if (m.progress !== 100) return false;
      if (!m.targetDate) return true; // No target = on time by default
      return now <= m.targetDate;
    }).length;
    const milestoneOnTimeRate = completedMilestones > 0 
      ? Math.round((completedOnTimeMilestones / completedMilestones) * 100) 
      : 0;
    
    // Milestones due this month
    const thisMonthEnd = new Date();
    thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
    const upcomingMilestones = milestonesWithProgress
      .filter(m => m.targetDate && m.targetDate <= thisMonthEnd.getTime() && m.progress < 100)
      .sort((a, b) => (a.targetDate || 0) - (b.targetDate || 0));

    // ========== DEPARTMENT ANALYTICS ==========
    const departmentStats = departments.map(dept => {
      const deptProjects = projects.filter(p => p.department === dept.name);
      const deptMilestones = milestones.filter(m => {
        const proj = projects.find(p => p._id === m.projectId);
        return proj?.department === dept.name;
      });
      const deptTasks = tasks.filter(t => {
        const milestone = milestones.find(m => m._id === t.milestoneId);
        const proj = projects.find(p => p._id === milestone?.projectId);
        return proj?.department === dept.name;
      });
      
      const completedTasks = deptTasks.filter(t => t.status === "done").length;
      const inProgressTasks = deptTasks.filter(t => t.status === "in_progress").length;
      const totalTasks = deptTasks.length;
      
      const completedProjects = deptProjects.filter(p => p.status === "completed").length;
      const activeProjects = deptProjects.filter(p => p.status === "active").length;
      
      const totalBudget = deptProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
      
      return {
        name: dept.name,
        description: dept.description,
        totalProjects: deptProjects.length,
        activeProjects,
        completedProjects,
        projectCompletionRate: deptProjects.length > 0 
          ? Math.round((completedProjects / deptProjects.length) * 100) 
          : 0,
        totalMilestones: deptMilestones.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        taskCompletionRate: totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100) 
          : 0,
        totalBudget,
      };
    }).sort((a, b) => b.completedTasks - a.completedTasks);

    // ========== TEAM LEADERBOARD ==========
    const teamLeaderboard = await Promise.all(
      users.map(async (user) => {
        // Count completed milestone tasks
        const userCompletedMilestoneTasks = tasks.filter(t => 
          t.status === "done" && 
          (t.assignedTo?.includes(user._id) || t.completedBy === user._id)
        ).length;
        
        // Count completed event tasks
        const userEventTaskAssignments = await ctx.db
          .query("eventTaskAssignments")
          .withIndex("by_user", q => q.eq("userId", user._id))
          .filter(q => q.eq(q.field("status"), "completed"))
          .collect();
        const userCompletedEventTasks = userEventTaskAssignments.length;
        
        // Count in-progress tasks
        const userInProgressTasks = tasks.filter(t => 
          t.status === "in_progress" && 
          t.assignedTo?.includes(user._id)
        ).length;
        
        // Count total assigned tasks
        const userTotalTasks = tasks.filter(t => 
          t.assignedTo?.includes(user._id)
        ).length;
        
        // Calculate total story points completed
        const totalStoryPoints = tasks
          .filter(t => t.status === "done" && t.assignedTo?.includes(user._id))
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        
        // Get XP from user
        const xp = user.xp || 0;
        const level = user.level || 1;
        
        return {
          _id: user._id,
          name: user.name || "Unknown",
          email: user.email,
          imageUrl: user.imageUrl,
          role: user.role || user.userLevel?.name || "WORKER",
          department: user.department,
          completedTasks: userCompletedMilestoneTasks + userCompletedEventTasks,
          completedMilestoneTasks: userCompletedMilestoneTasks,
          completedEventTasks: userCompletedEventTasks,
          inProgressTasks: userInProgressTasks,
          totalAssignedTasks: userTotalTasks,
          storyPointsCompleted: totalStoryPoints,
          xp,
          level,
          completionRate: userTotalTasks > 0 
            ? Math.round((userCompletedMilestoneTasks / userTotalTasks) * 100) 
            : 0,
        };
      })
    );

    // Sort by completed tasks (descending)
    const sortedLeaderboard = teamLeaderboard
      .filter(u => u.completedTasks > 0 || u.totalAssignedTasks > 0) // Only show users with tasks
      .sort((a, b) => {
        // Primary: completed tasks
        if (b.completedTasks !== a.completedTasks) return b.completedTasks - a.completedTasks;
        // Secondary: story points
        if (b.storyPointsCompleted !== a.storyPointsCompleted) return b.storyPointsCompleted - a.storyPointsCompleted;
        // Tertiary: XP
        return b.xp - a.xp;
      });

    // ========== PROJECT ANALYTICS ==========
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === "active").length;
    const completedProjects = projects.filter(p => p.status === "completed").length;
    const pendingProjects = projects.filter(p => p.status === "pending_approval" || p.status === "planning").length;
    
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const usedBudget = projects
      .filter(p => p.status === "completed" || p.status === "active")
      .reduce((sum, p) => sum + (p.budget || 0), 0);

    // On-time delivery rate
    const onTimeProjects = projects.filter(p => {
      if (p.status !== "completed") return false;
      const actualEnd = p.actualEndDate || p.updatedAt;
      return actualEnd <= (p.endDate || actualEnd);
    }).length;
    const onTimeRate = completedProjects > 0 ? Math.round((onTimeProjects / completedProjects) * 100) : 0;

    // ========== TASK ANALYTICS ==========
    const totalTasks = tasks.length;
    // Check both status === "done" AND completed === true
    const completedTasksCount = tasks.filter(t => t.status === "done" || t.completed === true).length;
    const inProgressTasksCount = tasks.filter(t => t.status === "in_progress").length;
    const todoTasksCount = tasks.filter(t => t.status === "todo" && !t.completed).length;
    const reviewTasksCount = tasks.filter(t => t.status === "in_review").length;

    // ========== EVENT ANALYTICS ==========
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === "completed").length;
    const activeEvents = events.filter(e => e.status === "published" || e.status === "active").length;
    const totalEventTasks = eventTasks.length;
    const completedEventTasks = eventTasks.filter(t => t.status === "done").length;

    return {
      // Summary metrics
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        pendingProjects,
        projectCompletionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
        totalMilestones,
        completedMilestones,
        inProgressMilestones,
        pendingMilestones,
        milestoneCompletionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        overallMilestoneProgress, // Task-based progress
        totalMilestoneTasks,
        completedMilestoneTasks,
        milestoneOnTimeRate,
        completedOnTimeMilestones,
        totalTasks,
        completedTasks: completedTasksCount,
        inProgressTasks: inProgressTasksCount,
        todoTasks: todoTasksCount,
        reviewTasks: reviewTasksCount,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0,
        totalBudget,
        usedBudget,
        onTimeRate,
        onTimeProjects,
        totalEvents,
        activeEvents,
        completedEvents,
        totalEventTasks,
        completedEventTasks,
      },
      // Detailed data
      milestones: milestonesWithProgress,
      upcomingMilestones: upcomingMilestones.slice(0, 10),
      departments: departmentStats,
      leaderboard: sortedLeaderboard.slice(0, 20), // Top 20
      allTeamMembers: sortedLeaderboard, // All members for export
    };
  },
});

/**
 * Get milestone analytics grouped by project
 */
export const getMilestoneAnalyticsByProject = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const projects = await ctx.db.query("projects").collect();
    const milestones = await ctx.db.query("milestones").collect();
    const tasks = await ctx.db.query("tasks").collect();

    return projects.map(project => {
      const projectMilestones = milestones.filter(m => m.projectId === project._id);
      
      const milestonesWithStats = projectMilestones.map(milestone => {
        const milestoneTasks = tasks.filter(t => t.milestoneId === milestone._id);
        // Check both status === "done" AND completed === true
        const completedTasks = milestoneTasks.filter(t => t.status === "done" || t.completed === true).length;
        const totalTasks = milestoneTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          _id: milestone._id,
          title: milestone.title,
          description: milestone.description,
          targetDate: milestone.targetDate,
          progress,
          completedTasks,
          totalTasks,
          status: progress === 100 ? "completed" : progress > 0 ? "in_progress" : "pending",
          isCritical: milestone.isCritical,
        };
      }).sort((a, b) => (a.targetDate || 0) - (b.targetDate || 0));

      const completedMilestones = milestonesWithStats.filter(m => m.progress === 100).length;
      const totalProjectMilestones = milestonesWithStats.length;
      
      return {
        projectId: project._id,
        projectTitle: project.title,
        projectStatus: project.status,
        department: project.department,
        milestones: milestonesWithStats,
        totalMilestones: totalProjectMilestones,
        completedMilestones,
        progress: totalProjectMilestones > 0 
          ? Math.round((completedMilestones / totalProjectMilestones) * 100) 
          : 0,
      };
    }).filter(p => p.totalMilestones > 0);
  },
});

/**
 * Get velocity data for a milestone (story points completed per week)
 */
export const getMilestoneVelocity = query({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", q => q.eq("milestoneId", args.milestoneId))
      .collect();

    // Get completed tasks with their completion dates
    const completedTasks = tasks.filter(t => t.status === "done");
    
    // Group by week
    const weeklyData: Record<string, { points: number; tasks: number }> = {};
    const now = Date.now();
    
    completedTasks.forEach(task => {
      const completedAt = task.updatedAt || now;
      const weekStart = new Date(completedAt);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { points: 0, tasks: 0 };
      }
      weeklyData[weekKey].points += task.storyPoints || 0;
      weeklyData[weekKey].tasks += 1;
    });

    // Convert to sorted array (last 8 weeks)
    const velocityData = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        weekLabel: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        storyPoints: data.points,
        tasksCompleted: data.tasks,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8);

    // Calculate averages
    const totalPoints = velocityData.reduce((sum, v) => sum + v.storyPoints, 0);
    const totalTasks = velocityData.reduce((sum, v) => sum + v.tasksCompleted, 0);
    const avgVelocity = velocityData.length > 0 ? Math.round(totalPoints / velocityData.length) : 0;
    const avgTasksPerWeek = velocityData.length > 0 ? Math.round(totalTasks / velocityData.length) : 0;

    return {
      milestoneTitle: milestone.title,
      velocityData,
      averageVelocity: avgVelocity,
      averageTasksPerWeek: avgTasksPerWeek,
      totalPointsCompleted: totalPoints,
      totalTasksCompleted: totalTasks,
      weeksTracked: velocityData.length,
    };
  },
});

/**
 * Get burndown data for a milestone
 */
export const getMilestoneBurndown = query({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", q => q.eq("milestoneId", args.milestoneId))
      .collect();

    const totalTasks = tasks.length;
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    if (totalTasks === 0) {
      return {
        milestoneTitle: milestone.title,
        burndownData: [],
        totalTasks: 0,
        totalPoints: 0,
        remainingTasks: 0,
        remainingPoints: 0,
        startDate: milestone.createdAt,
        targetDate: milestone.targetDate,
        projectedCompletion: null,
      };
    }

    // Get milestone creation date as start
    const startDate = milestone.createdAt || Date.now() - 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    // Create daily burndown data
    const burndownData: Array<{
      date: string;
      dateLabel: string;
      remainingTasks: number;
      remainingPoints: number;
      idealTasks: number;
      idealPoints: number;
    }> = [];

    // Group completed tasks by date
    const completionsByDate: Record<string, { tasks: number; points: number }> = {};
    tasks.filter(t => t.status === "done").forEach(task => {
      const completedAt = task.updatedAt || now;
      const dateKey = new Date(completedAt).toISOString().split('T')[0];
      if (!completionsByDate[dateKey]) {
        completionsByDate[dateKey] = { tasks: 0, points: 0 };
      }
      completionsByDate[dateKey].tasks += 1;
      completionsByDate[dateKey].points += task.storyPoints || 0;
    });

    // Calculate days between start and target (or now if no target)
    const endDate = milestone.targetDate || now;
    const totalDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    let cumulativeCompletedTasks = 0;
    let cumulativeCompletedPoints = 0;

    // Generate data for each day from start to now
    const currentDate = new Date(startDate);
    const today = new Date(now);
    today.setHours(23, 59, 59, 999);
    
    let dayIndex = 0;
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      
      // Add completions for this day
      if (completionsByDate[dateKey]) {
        cumulativeCompletedTasks += completionsByDate[dateKey].tasks;
        cumulativeCompletedPoints += completionsByDate[dateKey].points;
      }

      // Calculate ideal burndown line
      const idealTasksRemaining = totalDays > 0 
        ? Math.max(0, totalTasks - (totalTasks * (dayIndex + 1) / totalDays))
        : 0;
      const idealPointsRemaining = totalDays > 0 
        ? Math.max(0, totalPoints - (totalPoints * (dayIndex + 1) / totalDays))
        : 0;

      burndownData.push({
        date: dateKey,
        dateLabel: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        remainingTasks: totalTasks - cumulativeCompletedTasks,
        remainingPoints: totalPoints - cumulativeCompletedPoints,
        idealTasks: Math.round(idealTasksRemaining),
        idealPoints: Math.round(idealPointsRemaining),
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    // Calculate projected completion based on current velocity
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const remainingTasks = totalTasks - completedTasks;
    const daysElapsed = Math.max(1, Math.ceil((now - startDate) / (24 * 60 * 60 * 1000)));
    const tasksPerDay = completedTasks / daysElapsed;
    const daysToComplete = tasksPerDay > 0 ? Math.ceil(remainingTasks / tasksPerDay) : null;
    const projectedCompletion = daysToComplete !== null ? now + (daysToComplete * 24 * 60 * 60 * 1000) : null;

    return {
      milestoneTitle: milestone.title,
      burndownData: burndownData.slice(-30), // Last 30 days
      totalTasks,
      totalPoints,
      completedTasks,
      remainingTasks,
      remainingPoints: totalPoints - tasks.filter(t => t.status === "done").reduce((sum, t) => sum + (t.storyPoints || 0), 0),
      startDate,
      targetDate: milestone.targetDate,
      projectedCompletion,
      isOnTrack: projectedCompletion ? projectedCompletion <= (milestone.targetDate || projectedCompletion) : null,
      velocityPerDay: Math.round(tasksPerDay * 100) / 100,
    };
  },
});
