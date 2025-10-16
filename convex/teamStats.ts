import { query } from "./_generated/server";
import { v } from "convex/values";

// Get task statistics for a team member in a specific project
export const getTeamMemberStats = query({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all tasks for this project
    const allTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Filter tasks assigned to this user
    const userTasks = allTasks.filter(t => t.assignedTo.includes(args.userId));

    // Calculate stats
    const completed = userTasks.filter(t => t.status === "completed");
    const inProgress = userTasks.filter(t => 
      t.status === "in_progress" || t.status === "review"
    );
    const todo = userTasks.filter(t => t.status === "todo");
    const cancelled = userTasks.filter(t => t.status === "cancelled");

    // Calculate XP and Gold earned
    const totalXP = completed.reduce((sum, t) => sum + (t.experienceReward || 0), 0);
    const totalGold = completed.reduce((sum, t) => sum + (t.goldReward || 0), 0);

    // Calculate completion rate
    const completionRate = userTasks.length > 0 
      ? (completed.length / userTasks.length) * 100 
      : 0;

    // Calculate hours logged
    const hoursLogged = userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    return {
      total: userTasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      todo: todo.length,
      cancelled: cancelled.length,
      completionRate,
      totalXP,
      totalGold,
      hoursLogged,
      // Last activity (most recent task update)
      lastActivity: userTasks.length > 0 
        ? Math.max(...userTasks.map(t => t.completedAt || t.createdAt || 0))
        : null,
    };
  },
});

// Get all team member stats for a project
export const getAllTeamStats = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    // Get all team members
    const teamMemberIds = project.assignedTo || [];
    
    // Get stats for each member
    const stats = await Promise.all(
      teamMemberIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        // Get task stats
        const allTasks = await ctx.db
          .query("tasks")
          .filter((q) => q.eq(q.field("projectId"), args.projectId))
          .collect();

        const userTasks = allTasks.filter(t => t.assignedTo.includes(userId));
        const completed = userTasks.filter(t => t.status === "completed");
        const inProgress = userTasks.filter(t => 
          t.status === "in_progress" || t.status === "review"
        );

        const completionRate = userTasks.length > 0 
          ? (completed.length / userTasks.length) * 100 
          : 0;

        const totalXP = completed.reduce((sum, t) => sum + (t.experienceReward || 0), 0);
        const totalGold = completed.reduce((sum, t) => sum + (t.goldReward || 0), 0);

        return {
          userId: user._id,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            position: user.position,
            department: user.department,
            level: user.level,
            userLevel: user.userLevel,
          },
          stats: {
            total: userTasks.length,
            completed: completed.length,
            inProgress: inProgress.length,
            completionRate,
            totalXP,
            totalGold,
            hoursLogged: userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
            lastActivity: userTasks.length > 0 
              ? Math.max(...userTasks.map(t => t.completedAt || t.createdAt || 0))
              : null,
          },
          isLead: project.createdBy === userId,
        };
      })
    );

    return stats.filter(s => s !== null);
  },
});
