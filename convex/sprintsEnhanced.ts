import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getActiveSprint = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    
    const sprints = await ctx.db
      .query("sprints")
      .filter((q) => 
        q.and(
          q.lte(q.field("startDate"), now),
          q.gte(q.field("endDate"), now),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    const sprint = args.projectId
      ? sprints.find(s => s.projectId === args.projectId)
      : sprints[0];

    if (!sprint) return null;

    const tasks = await ctx.db
      .query("sprintTasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
      .collect();

    const enrichedTasks = await Promise.all(
      tasks.map(async (sprintTask) => {
        const task = await ctx.db.get(sprintTask.taskId);
        if (!task) return null;

        // assignedTo is an array, get first assignee
        const assigneeId = Array.isArray(task.assignedTo) && task.assignedTo.length > 0 
          ? task.assignedTo[0] 
          : null;
        
        const assignee = assigneeId ? await ctx.db.get(assigneeId) : null;

        return {
          ...task,
          sprintStatus: sprintTask.status,
          storyPoints: sprintTask.storyPoints,
          assignee: assignee ? {
            _id: assignee._id,
            name: (assignee as any).name || 'Unknown',
            email: (assignee as any).email || '',
            imageUrl: (assignee as any).imageUrl || '',
          } : null,
        };
      })
    );

    const validTasks = enrichedTasks.filter((t): t is NonNullable<typeof t> => t !== null);

    const totalPoints = validTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = validTasks
      .filter(t => t.sprintStatus === "done")
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    const completedTasks = validTasks.filter(t => t.sprintStatus === "done").length;
    const inProgressTasks = validTasks.filter(t => t.sprintStatus === "in_progress").length;
    const todoTasks = validTasks.filter(t => t.sprintStatus === "todo").length;

    const daysElapsed = Math.max(1, (now - sprint.startDate) / (1000 * 60 * 60 * 24));
    const velocity = completedPoints / daysElapsed;

    const totalDays = (sprint.endDate - sprint.startDate) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, (sprint.endDate - now) / (1000 * 60 * 60 * 24));
    const projectedPoints = completedPoints + (velocity * daysRemaining);

    return {
      ...sprint,
      tasks: validTasks,
      metrics: {
        totalPoints,
        completedPoints,
        remainingPoints: totalPoints - completedPoints,
        totalTasks: validTasks.length,
        completedTasks,
        inProgressTasks,
        todoTasks,
        velocity: Math.round(velocity * 10) / 10,
        projectedCompletion: Math.min(100, Math.round((projectedPoints / totalPoints) * 100)),
        daysElapsed: Math.round(daysElapsed),
        daysRemaining: Math.round(daysRemaining),
        totalDays: Math.round(totalDays),
      },
    };
  },
});

/**
 * Get sprint backlog (unassigned tasks)
 */
export const getBacklog = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get all tasks assigned to sprints
    const assignedTasks = await ctx.db.query("sprintTasks").collect();
    const assignedTaskIds = new Set(assignedTasks.map(st => st.taskId));

    // Get all tasks (filter by project if provided)
    let allTasks = await ctx.db.query("tasks").collect();
    
    if (args.projectId) {
      allTasks = allTasks.filter(t => t.projectId === args.projectId);
    }

    // Filter to unassigned tasks
    const backlogTasks = allTasks.filter(t => !assignedTaskIds.has(t._id));

    // Enrich with assignee details
    const enriched = await Promise.all(
      backlogTasks.map(async (task) => {
        // assignedTo is an array, get first assignee
        const assigneeId = Array.isArray(task.assignedTo) && task.assignedTo.length > 0 
          ? task.assignedTo[0] 
          : null;
        
        const assignee = assigneeId ? await ctx.db.get(assigneeId) : null;
        
        return {
          ...task,
          assignee: assignee ? {
            _id: assignee._id,
            name: (assignee as any).name || 'Unknown',
            email: (assignee as any).email || '',
            imageUrl: (assignee as any).imageUrl || '',
          } : null,
          estimatedPoints: 0, // Can be updated during sprint planning
        };
      })
    );

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return enriched.sort((a, b) => 
      priorityOrder[a.priority as keyof typeof priorityOrder] - 
      priorityOrder[b.priority as keyof typeof priorityOrder]
    );
  },
});

/**
 * Get burndown chart data for active sprint
 */
export const getSprintBurndown = query({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error("Sprint not found");

    // Get sprint tasks
    const sprintTasks = await ctx.db
      .query("sprintTasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Calculate ideal burndown line
    const startDate = sprint.startDate;
    const endDate = sprint.endDate;
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const idealLine = Array.from({ length: totalDays + 1 }, (_, day) => ({
      day,
      date: startDate + (day * 24 * 60 * 60 * 1000),
      ideal: totalPoints * (1 - day / totalDays),
      actual: null as number | null,
    }));

    // Calculate actual burndown from task completion history
    // This would ideally come from a task_history table tracking status changes
    // For now, we'll calculate based on current state
    const now = Date.now();
    const daysElapsed = Math.min(
      totalDays,
      Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
    );

    const completedPoints = sprintTasks
      .filter(t => t.status === "done")
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Fill in actual line (simplified - would be better with history)
    idealLine.forEach((point, index) => {
      if (index <= daysElapsed) {
        // Linear estimation (would be better with actual history)
        point.actual = totalPoints - (completedPoints * index / daysElapsed);
      }
    });

    return {
      sprintName: sprint.name,
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      burndown: idealLine,
    };
  },
});

/**
 * Get sprint velocity history (for planning)
 */
export const getVelocityHistory = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get completed sprints
    const completedSprints = await ctx.db
      .query("sprints")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(args.limit || 10);

    const velocityData = await Promise.all(
      completedSprints.map(async (sprint) => {
        const tasks = await ctx.db
          .query("sprintTasks")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .collect();

        const completedPoints = tasks
          .filter(t => t.status === "done")
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        const committedPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return {
          sprintName: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          committedPoints,
          completedPoints,
          completionRate: Math.round((completedPoints / committedPoints) * 100),
        };
      })
    );

    // Calculate average velocity
    const avgVelocity = velocityData.length > 0
      ? Math.round(velocityData.reduce((sum, s) => sum + s.completedPoints, 0) / velocityData.length)
      : 0;

    return {
      history: velocityData,
      averageVelocity: avgVelocity,
      sprintCount: velocityData.length,
    };
  },
});

// ==================== SPRINT MUTATIONS ====================

/**
 * Create a new sprint
 */
export const createSprint = mutation({
  args: {
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    capacity: v.number(), // Story points
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const sprintId = await ctx.db.insert("sprints", {
      name: args.name,
      goal: args.goal || "",
      startDate: args.startDate,
      endDate: args.endDate,
      capacity: args.capacity,
      projectId: args.projectId,
      status: "active", // Start sprint immediately so it shows up
      createdBy: user._id,
      createdAt: Date.now(),
      actualStartDate: Date.now(), // Record when started
    });

    return sprintId;
  },
});

/**
 * Add task to sprint with story points
 */
export const addTaskToSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
    taskId: v.id("tasks"),
    storyPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if task already in a sprint
    const existing = await ctx.db
      .query("sprintTasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .first();

    if (existing) {
      throw new Error("Task already assigned to a sprint");
    }

    // Add to sprint
    const sprintTaskId = await ctx.db.insert("sprintTasks", {
      sprintId: args.sprintId,
      taskId: args.taskId,
      storyPoints: args.storyPoints,
      status: "todo", // todo | in_progress | in_review | done
      addedAt: Date.now(),
    });

    return sprintTaskId;
  },
});

/**
 * Remove task from sprint
 */
export const removeTaskFromSprint = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sprintTask = await ctx.db
      .query("sprintTasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .first();

    if (!sprintTask) {
      throw new Error("Task not in any sprint");
    }

    await ctx.db.delete(sprintTask._id);
  },
});

/**
 * Update task status in sprint (for Kanban board)
 */
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    newStatus: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sprintTask = await ctx.db
      .query("sprintTasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .first();

    if (!sprintTask) {
      throw new Error("Task not in any sprint");
    }

    await ctx.db.patch(sprintTask._id, {
      status: args.newStatus,
      updatedAt: Date.now(),
    });

    // Also update the main task status
    await ctx.db.patch(args.taskId, {
      status: args.newStatus === "done" ? "completed" : "in_progress",
    });
  },
});

/**
 * Update task story points
 */
export const updateStoryPoints = mutation({
  args: {
    taskId: v.id("tasks"),
    storyPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sprintTask = await ctx.db
      .query("sprintTasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .first();

    if (!sprintTask) {
      throw new Error("Task not in any sprint");
    }

    await ctx.db.patch(sprintTask._id, {
      storyPoints: args.storyPoints,
    });
  },
});

/**
 * Start sprint (move from planning to active)
 */
export const startSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.sprintId, {
      status: "active",
      actualStartDate: Date.now(),
    });
  },
});

/**
 * Complete sprint
 */
export const completeSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.sprintId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});
