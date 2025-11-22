/**
 * Milestones Management
 * Connects Projects to Sprint Tasks through goal-based milestones
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all milestones for a project
 */
export const getProjectMilestones = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc") // Order by creation
      .take(50); // OPTIMIZED: Limit milestones per project

    // Get tasks for each milestone and calculate progress
    const milestonesWithProgress = await Promise.all(
      milestones.map(async (milestone) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_milestone", (q) => q.eq("milestoneId", milestone._id))
          .take(200); // OPTIMIZED: Limit tasks per milestone

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate total story points
        const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedPoints = tasks.filter(t => t.completed)
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return {
          ...milestone,
          tasks,
          totalTasks,
          completedTasks,
          progress,
          totalPoints,
          completedPoints,
        };
      })
    );

    // Sort by order
    milestonesWithProgress.sort((a, b) => a.order - b.order);

    return milestonesWithProgress;
  },
});

/**
 * Create a new milestone for a project
 */
export const createMilestone = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    targetDate: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get existing milestones to set order
    const existingMilestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(100); // OPTIMIZED

    const nextOrder = existingMilestones.length + 1;

    const milestoneId = await ctx.db.insert("milestones", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      order: nextOrder,
      targetDate: args.targetDate,
      status: "not_started",
      progress: 0,
      createdBy: user._id,
      createdAt: Date.now(),
      isRequired: args.isRequired ?? true,
      dependencies: [],
    });

    return milestoneId;
  },
});

/**
 * Update milestone
 */
export const updateMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    )),
    blockedReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { milestoneId, ...updates } = args;

    await ctx.db.patch(milestoneId, updates);

    return milestoneId;
  },
});

/**
 * Delete milestone
 */
export const deleteMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if milestone has tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();

    if (tasks.length > 0) {
      throw new Error("Cannot delete milestone with existing tasks. Remove tasks first.");
    }

    await ctx.db.delete(args.milestoneId);

    return { success: true };
  },
});

/**
 * Add sprint task to milestone
 */
export const addTaskToMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    title: v.string(),
    description: v.string(),
    storyPoints: v.number(),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get milestone to link to project
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    // Calculate XP and Gold from story points
    const STORY_POINT_TO_XP: Record<number, number> = {
      1: 10, 2: 25, 3: 50, 5: 100, 8: 200, 13: 350, 21: 600
    };
    const STORY_POINT_TO_GOLD: Record<number, number> = {
      1: 5, 2: 12, 3: 25, 5: 50, 8: 100, 13: 175, 21: 300
    };

    const xp = STORY_POINT_TO_XP[args.storyPoints] || args.storyPoints * 10;
    const gold = STORY_POINT_TO_GOLD[args.storyPoints] || Math.round(args.storyPoints * 5);

    const taskId = await ctx.db.insert("tasks", {
      userId: user._id,
      title: args.title,
      description: args.description,
      projectId: milestone.projectId,
      milestoneId: args.milestoneId,
      type: "todo",
      difficulty: args.storyPoints <= 3 ? "easy" : args.storyPoints <= 5 ? "medium" : "hard",
      status: "todo",
      priority: args.priority || "medium",
      completed: false,
      dueDate: args.dueDate,
      createdAt: Date.now(),
      createdBy: user._id,
      assignedTo: [],
      storyPoints: args.storyPoints,
      experienceReward: xp,
      goldReward: gold,
      completionCount: 0,
      tags: [],
      attachments: [],
      dependencies: [],
      subtasks: [],
      loggedHours: [],
      isBlocking: false,
    });

    // Update milestone status to in_progress if it was not_started
    if (milestone.status === "not_started") {
      await ctx.db.patch(args.milestoneId, {
        status: "in_progress",
      });
    }

    return taskId;
  },
});

/**
 * Update milestone progress when tasks change
 * Call this after completing/uncompleting a task
 */
export const updateMilestoneProgress = mutation({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update status based on progress
    let status: "not_started" | "in_progress" | "completed" | "blocked" = "not_started";
    if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    }

    const milestone = await ctx.db.get(args.milestoneId);
    const wasJustCompleted = milestone && milestone.status !== "completed" && status === "completed";

    if (milestone && milestone.status !== "blocked") {
      await ctx.db.patch(args.milestoneId, {
        progress,
        status,
        completedAt: status === "completed" ? Date.now() : undefined,
      });
    }

    // 🎮 INTEGRATION: Award bonus XP and gold for milestone completion
    if (wasJustCompleted && milestone) {
      const project = await ctx.db.get(milestone.projectId);
      const xpBonus = 100;
      const goldBonus = 50;

      // Award to all team members
      if (project && project.assignedTo && project.assignedTo.length > 0) {
        for (const userId of project.assignedTo) {
          const user = await ctx.db.get(userId);
          if (user) {
            const newXP = (user.xp || 0) + xpBonus;
            const newGold = (user.gold || 0) + goldBonus;

            await ctx.db.patch(userId, {
              xp: newXP,
              gold: newGold,
              level: calculateLevel(newXP),
            });

            // Log activity
            await ctx.db.insert("userActivityLogs", {
              userId,
              activityType: "action",
              action: "milestone_completed",
              targetType: "milestone",
              targetId: args.milestoneId,
              metadata: {
                milestoneName: milestone.title,
                projectName: project.title,
                xpBonus,
                goldBonus,
              },
              timestamp: Date.now(),
            });

            // Create notification
            await ctx.db.insert("notifications", {
              userId,
              type: "milestone_completed",
              title: "Milestone Complete! 🏆",
              message: `Your team completed milestone "${milestone.title}"! You earned ${xpBonus} XP and ${goldBonus} gold!`,
              priority: "normal",
              isRead: false,
              metadata: {
                milestoneName: milestone.title,
                projectName: project.title,
                xpBonus,
                goldBonus,
              },
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    // Update project progress
    if (milestone) {
      await updateProjectProgress(ctx, milestone.projectId);
    }

    return { progress, status, milestoneCompleted: wasJustCompleted };
  },
});

// Helper: Calculate level from XP
function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  if (xp < 5500) return 10;
  return 10 + Math.floor((xp - 5500) / 1000);
}

/**
 * Helper function to update project progress based on milestones
 */
async function updateProjectProgress(ctx: any, projectId: Id<"projects">) {
  const milestones = await ctx.db
    .query("milestones")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .collect();

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m: any) => m.status === "completed").length;
  const projectProgress = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  await ctx.db.patch(projectId, {
    progress: projectProgress,
  });

  return projectProgress;
}

/**
 * Reorder milestones
 */
export const reorderMilestones = mutation({
  args: {
    milestoneId: v.id("milestones"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.milestoneId, {
      order: args.newOrder,
    });

    return { success: true };
  },
});

/**
 * Get milestone with all its tasks (for detail view)
 */
export const getMilestoneDetails = query({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();

    // Get assignee details for each task
    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        const assignees = await Promise.all(
          task.assignedTo.map(userId => ctx.db.get(userId))
        );
        return {
          ...task,
          assignees: assignees.filter(a => a !== null),
        };
      })
    );

    // Get project details
    const project = await ctx.db.get(milestone.projectId);

    return {
      ...milestone,
      tasks: tasksWithAssignees,
      projectName: project?.title || "Unknown Project",
      projectDepartment: project?.department || "Unassigned",
    };
  },
});

/**
 * Get all active milestones (for Sprint Board)
 */
export const getActiveMilestones = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const now = Date.now();
    const allMilestones = await ctx.db.query("milestones").take(100); // OPTIMIZED

    // Filter active milestones (have targetDate and not completed)
    const activeMilestones = allMilestones.filter(
      (m: any) =>
        m.targetDate &&
        m.targetDate >= now &&
        m.status !== "completed"
    );

    // Enrich with project and task data
    const enriched = await Promise.all(
      activeMilestones.map(async (milestone) => {
        const project = await ctx.db.get(milestone.projectId);
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_milestone", (q) => q.eq("milestoneId", milestone._id))
          .collect();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.completed).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate health
        const daysLeft = milestone.targetDate 
          ? Math.ceil((milestone.targetDate - now) / (1000 * 60 * 60 * 24))
          : 0;
        let health: "on-track" | "at-risk" | "behind" = "on-track";
        if (milestone.targetDate) {
          if (daysLeft <= 3 && progress < 80) {
            health = "behind";
          } else if (daysLeft <= 7 && progress < 50) {
            health = "at-risk";
          }
        }

        return {
          ...milestone,
          projectName: project?.title || "Unknown",
          projectDepartment: project?.department || "Unassigned",
          totalTasks,
          completedTasks,
          progress,
          health,
          daysLeft,
        };
      })
    );

    return enriched.sort((a, b) => a.targetDate! - b.targetDate!);
  },
});

/**
 * Get upcoming milestones (for Sprint Board)
 */
export const getUpcomingMilestones = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const now = Date.now();
    const allMilestones = await ctx.db.query("milestones").take(100); // OPTIMIZED

    // Get milestones with future target dates
    const upcomingMilestones = allMilestones.filter(
      (m: any) =>
        m.targetDate &&
        m.targetDate > now &&
        m.status === "not_started"
    );

    const enriched = await Promise.all(
      upcomingMilestones.map(async (milestone) => {
        const project = await ctx.db.get(milestone.projectId);
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_milestone", (q) => q.eq("milestoneId", milestone._id))
          .collect();

        return {
          ...milestone,
          projectName: project?.title || "Unknown",
          projectDepartment: project?.department || "Unassigned",
          totalTasks: tasks.length,
        };
      })
    );

    return enriched.sort((a, b) => a.targetDate! - b.targetDate!);
  },
});

/**
 * Get completed milestones (for Sprint Board)
 */
export const getCompletedMilestones = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const allMilestones = await ctx.db.query("milestones").collect();

    const completedMilestones = allMilestones.filter(
      (m: any) => m.status === "completed"
    );

    const enriched = await Promise.all(
      completedMilestones.map(async (milestone) => {
        const project = await ctx.db.get(milestone.projectId);
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_milestone", (q) => q.eq("milestoneId", milestone._id))
          .collect();

        return {
          ...milestone,
          projectName: project?.title || "Unknown",
          projectDepartment: project?.department || "Unassigned",
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.completed).length,
        };
      })
    );

    return enriched.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  },
});

/**
 * Get milestone statistics (for Sprint Board)
 */
export const getMilestoneStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { active: 0, upcoming: 0, completed: 0, total: 0 };

    const now = Date.now();
    const allMilestones = await ctx.db.query("milestones").take(100); // OPTIMIZED

    const active = allMilestones.filter(
      (m: any) =>
        m.targetDate &&
        m.targetDate >= now &&
        m.status !== "completed"
    );

    const upcoming = allMilestones.filter(
      (m: any) =>
        m.targetDate &&
        m.targetDate > now &&
        m.status === "not_started"
    );

    const completed = allMilestones.filter((m: any) => m.status === "completed");

    return {
      active: active.length,
      upcoming: upcoming.length,
      completed: completed.length,
      total: allMilestones.length,
    };
  },
});
