import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const STORY_POINT_TO_XP: Record<number, number> = {
  1: 10,
  2: 25,
  3: 50,
  5: 100,
  8: 200,
  13: 350,
  21: 600,
};

export const STORY_POINT_TO_GOLD: Record<number, number> = {
  1: 5,
  2: 12,
  3: 25,
  5: 50,
  8: 100,
  13: 175,
  21: 300,
};

export function calculateRewards(storyPoints: number) {
  const xp = STORY_POINT_TO_XP[storyPoints] || storyPoints * 10;
  const gold = STORY_POINT_TO_GOLD[storyPoints] || Math.round(storyPoints * 5);
  
  return { xp, gold };
}

export const getUserWorkload = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const allTasks = await ctx.db.query("tasks").collect();
    
    const userTasks = allTasks.filter((task) => {
      const isAssigned = task.assignedTo.includes(args.userId) || task.userId === args.userId;
      const inRange = task.dueDate && 
        task.dueDate >= args.startDate && 
        task.dueDate <= args.endDate;
      const notCompleted = !task.completed;
      return isAssigned && inRange && notCompleted;
    });

    const totalPoints = userTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const totalTasks = userTasks.length;
    const totalPotentialXP = userTasks.reduce((sum, task) => {
      if (task.storyPoints) {
        return sum + (STORY_POINT_TO_XP[task.storyPoints] || task.experienceReward);
      }
      return sum + task.experienceReward;
    }, 0);

    // Group by day
    const tasksByDay: Record<string, any[]> = {};
    userTasks.forEach((task) => {
      if (task.dueDate) {
        const day = new Date(task.dueDate).toISOString().split('T')[0];
        if (!tasksByDay[day]) tasksByDay[day] = [];
        tasksByDay[day].push(task);
      }
    });

    // Calculate daily story points
    const dailyWorkload = Object.entries(tasksByDay).map(([day, tasks]) => {
      const points = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      return {
        date: day,
        tasks: tasks.length,
        storyPoints: points,
        status: points <= 3 ? 'light' : points <= 5 ? 'normal' : points <= 8 ? 'heavy' : 'overloaded',
      };
    });

    return {
      totalPoints,
      totalTasks,
      totalPotentialXP,
      tasks: userTasks,
      dailyWorkload,
    };
  },
});

/**
 * Update task with story points and recalculate XP
 */
export const updateTaskStoryPoints = mutation({
  args: {
    taskId: v.id("tasks"),
    storyPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Calculate new rewards based on story points
    const { xp, gold } = calculateRewards(args.storyPoints);

    // Update task
    await ctx.db.patch(args.taskId, {
      storyPoints: args.storyPoints,
      experienceReward: xp,
      goldReward: gold,
    });

    return { xp, gold };
  },
});

/**
 * Get workload warnings for user
 */
export const getWorkloadWarnings = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get today's tasks
    const allTasks = await ctx.db.query("tasks").collect();
    const todayTasks = allTasks.filter((task) => {
      const isAssigned = task.assignedTo.includes(args.userId) || task.userId === args.userId;
      const isToday = task.dueDate && task.dueDate >= today.getTime() && task.dueDate < tomorrow.getTime();
      const notCompleted = !task.completed;
      return isAssigned && isToday && notCompleted;
    });

    const todayPoints = todayTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Get week's tasks
    const weekTasks = allTasks.filter((task) => {
      const isAssigned = task.assignedTo.includes(args.userId) || task.userId === args.userId;
      const isThisWeek = task.dueDate && task.dueDate >= today.getTime() && task.dueDate < weekEnd.getTime();
      const notCompleted = !task.completed;
      return isAssigned && isThisWeek && notCompleted;
    });

    const weekPoints = weekTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const avgDailyPoints = Math.round(weekPoints / 7);

    const warnings = [];

    // Today's workload warning
    if (todayPoints > 8) {
      warnings.push({
        type: 'critical',
        message: `Today: ${todayPoints} story points - High risk of burnout!`,
        recommendation: 'Consider delegating or rescheduling some tasks.',
        icon: '🚨',
      });
    } else if (todayPoints > 5) {
      warnings.push({
        type: 'warning',
        message: `Today: ${todayPoints} story points - Heavy workload`,
        recommendation: 'Focus on high-priority tasks first.',
        icon: '⚠️',
      });
    }

    // Weekly workload warning
    if (avgDailyPoints > 8) {
      warnings.push({
        type: 'critical',
        message: `This week: ${avgDailyPoints} pts/day average - Unsustainable pace!`,
        recommendation: 'Reduce sprint commitments or request help.',
        icon: '🚨',
      });
    } else if (avgDailyPoints > 5) {
      warnings.push({
        type: 'warning',
        message: `This week: ${avgDailyPoints} pts/day average - Challenging week`,
        recommendation: 'Monitor your capacity and take breaks.',
        icon: '⚠️',
      });
    }

    // Positive feedback
    if (todayPoints <= 3 && warnings.length === 0) {
      warnings.push({
        type: 'success',
        message: `Workload is healthy! ${todayPoints} points today.`,
        recommendation: 'Great pace - sustainable and productive!',
        icon: '✅',
      });
    }

    return {
      todayPoints,
      weekPoints,
      avgDailyPoints,
      todayTasks: todayTasks.length,
      weekTasks: weekTasks.length,
      warnings,
    };
  },
});

/**
 * Get team workload overview (for managers)
 */
export const getTeamWorkload = query({
  args: {
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get all users
    const users = await ctx.db.query("users").collect();
    
    // Get all tasks
    const allTasks = await ctx.db.query("tasks").collect();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate workload for each user
    const teamWorkload = await Promise.all(
      users
        .filter(u => u.isActive && u.status === 'active')
        .map(async (user) => {
          const userTasks = allTasks.filter((task) => {
            const isAssigned = task.assignedTo.includes(user._id) || task.userId === user._id;
            const isToday = task.dueDate && task.dueDate >= today.getTime() && task.dueDate < tomorrow.getTime();
            const notCompleted = !task.completed;
            return isAssigned && isToday && notCompleted;
          });

          const storyPoints = userTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
          
          let status: 'healthy' | 'moderate' | 'heavy' | 'critical';
          if (storyPoints <= 3) status = 'healthy';
          else if (storyPoints <= 5) status = 'moderate';
          else if (storyPoints <= 8) status = 'heavy';
          else status = 'critical';

          return {
            userId: user._id,
            userName: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            tasksCount: userTasks.length,
            storyPoints,
            status,
            department: user.department,
          };
        })
    );

    // Sort by workload (highest first)
    teamWorkload.sort((a, b) => b.storyPoints - a.storyPoints);

    return {
      team: teamWorkload,
      totalTeamPoints: teamWorkload.reduce((sum, u) => sum + u.storyPoints, 0),
      avgPointsPerPerson: Math.round(
        teamWorkload.reduce((sum, u) => sum + u.storyPoints, 0) / Math.max(1, teamWorkload.length)
      ),
      overloadedMembers: teamWorkload.filter(u => u.status === 'critical').length,
      healthyMembers: teamWorkload.filter(u => u.status === 'healthy').length,
    };
  },
});
