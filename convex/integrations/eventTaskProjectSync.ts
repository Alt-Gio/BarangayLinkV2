import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const linkEventToProject = mutation({
  args: {
    eventId: v.id("events"),
    projectId: v.id("projects"),
    createTasks: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.eventId, {
      projectId: args.projectId,
    });

    if (args.createTasks) {
      const taskIds = await createProjectTasksFromEvent(ctx, args.eventId, args.projectId);
      return { success: true, tasksCreated: taskIds.length, taskIds };
    }

    return { success: true, tasksCreated: 0 };
  },
});

export const syncEventCompletionToProject = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || !event.projectId) {
      return { success: false, reason: "Event not linked to project" };
    }

    const project = await ctx.db.get(event.projectId);
    if (!project) {
      return { success: false, reason: "Project not found" };
    }

    const eventTasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const totalTasks = eventTasks.length;
    const completedTasks = eventTasks.filter((t) => t.status === "done").length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    await ctx.db.insert("projectActivities", {
      projectId: event.projectId,
      userId: event.organizer,
      activityType: "project_updated",
      title: "Event Completed",
      description: `Event "${event.title}" completed with ${completedTasks}/${totalTasks} tasks done`,
      metadata: {},
      timestamp: Date.now(),
    });

    // If event is fully complete (all tasks done), award bonus XP to project team
    if (completionRate === 1.0 && project.assignedTo && project.assignedTo.length > 0) {
      for (const userId of project.assignedTo) {
        const user = await ctx.db.get(userId);
        if (user) {
          const xpBonus = 100; // Event completion bonus
          const newXP = (user.xp || 0) + xpBonus;
          
          await ctx.db.patch(userId, {
            xp: newXP,
            level: calculateLevel(newXP),
          });

          // Notify team member
          await ctx.db.insert("notifications", {
            userId,
            type: "xp_earned",
            title: "Project Event Bonus! 🎉",
            message: `Your project's event "${event.title}" was completed! You earned ${xpBonus} XP!`,
            priority: "normal",
            isRead: false,
            metadata: { xpBonus, eventTitle: event.title, projectName: project.title },
            createdAt: Date.now(),
          });
        }
      }
    }

    return {
      success: true,
      completionRate,
      totalTasks,
      completedTasks,
      bonusAwarded: completionRate === 1.0,
    };
  },
});

// ============================================
// EVENT TASKS ↁEPROJECT MILESTONES
// ============================================

// Link event tasks to project milestone
export const linkEventTasksToMilestone = mutation({
  args: {
    eventId: v.id("events"),
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    const milestone = await ctx.db.get(args.milestoneId);

    if (!event || !milestone) {
      throw new Error("Event or milestone not found");
    }

    // Get all event tasks
    const eventTasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Create project tasks linked to milestone for each event task
    const createdTaskIds = [];
    for (const eventTask of eventTasks) {
      // Convert priority: critical ↁEurgent for tasks table
      const taskPriority = eventTask.priority === "critical" ? "urgent" : eventTask.priority as "low" | "medium" | "high" | "urgent";

      const taskId = await ctx.db.insert("tasks", {
        title: eventTask.title,
        description: eventTask.description,
        status: eventTask.status === "done" ? "done" : "todo",
        priority: taskPriority,
        projectId: milestone.projectId,
        milestoneId: args.milestoneId,
        assignedTo: eventTask.assignedTo,
        createdBy: eventTask.createdBy,
        dueDate: eventTask.dueDate,
        storyPoints: eventTask.storyPoints || 3,
        tags: eventTask.tags,
        difficulty: "medium",
        type: "todo", // Must match task type enum
        userId: eventTask.createdBy, // Required field
        experienceReward: 0,
        goldReward: 0,
        completionCount: 0,
        completed: false,
        isBlocking: false,
        createdAt: Date.now(),
        attachments: [], // Required array
        dependencies: [], // Required array
        subtasks: [], // Required array
        loggedHours: [], // Required array
        metadata: {
          sourceEventTaskId: eventTask._id,
          sourceEventId: args.eventId,
        },
      });
      createdTaskIds.push(taskId);
    }

    // Log activity
    await ctx.db.insert("projectActivities", {
      projectId: milestone.projectId,
      userId: event.organizer,
      activityType: "task_created",
      title: "Tasks Synced",
      description: `Synced ${createdTaskIds.length} event tasks to milestone "${milestone.name || milestone.title}"`,
      metadata: {},
      timestamp: Date.now(),
    });

    return { success: true, tasksCreated: createdTaskIds.length, taskIds: createdTaskIds };
  },
});

// Update milestone progress when event tasks complete
export const updateMilestoneFromEventTasks = mutation({
  args: {
    eventId: v.id("events"),
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Get all tasks in milestone that came from this event
    const milestoneTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("milestoneId"), args.milestoneId))
      .collect();

    const eventSourcedTasks = milestoneTasks.filter(
      (t) => t.metadata?.sourceEventId === args.eventId
    );

    if (eventSourcedTasks.length === 0) {
      return { success: false, reason: "No tasks from this event in milestone" };
    }

    const completedTasks = eventSourcedTasks.filter((t) => t.status === "done").length;
    const totalTasks = eventSourcedTasks.length;
    const progress = Math.round((completedTasks / totalTasks) * 100);

    // Update milestone progress (weighted by event tasks contribution)
    const allMilestoneTasks = milestoneTasks.length;
    const eventTaskWeight = eventSourcedTasks.length / allMilestoneTasks;
    const overallCompleted = milestoneTasks.filter((t) => t.status === "done").length;
    const overallProgress = Math.round((overallCompleted / allMilestoneTasks) * 100);

    await ctx.db.patch(args.milestoneId, {
      progress: overallProgress,
    });

    return {
      success: true,
      eventTasksProgress: progress,
      milestoneProgress: overallProgress,
      eventTasksCompleted: completedTasks,
      eventTasksTotal: totalTasks,
    };
  },
});

// ============================================
// ATTENDEE ↁETASK ASSIGNMENT
// ============================================

// Assign event attendees to event tasks
export const assignAttendeesToTasks = mutation({
  args: {
    eventId: v.id("events"),
    taskAssignments: v.array(
      v.object({
        attendeeId: v.id("eventAttendees"),
        taskIds: v.array(v.id("eventTasks")),
      })
    ),
  },
  handler: async (ctx, args) => {
    let assignmentCount = 0;

    for (const assignment of args.taskAssignments) {
      const attendee = await ctx.db.get(assignment.attendeeId);
      if (!attendee || !attendee.userId) continue;

      for (const taskId of assignment.taskIds) {
        const task = await ctx.db.get(taskId);
        if (!task) continue;

        // Add user to task's assignedTo array if not already there
        const currentAssigned = task.assignedTo || [];
        if (!currentAssigned.includes(attendee.userId)) {
          await ctx.db.patch(taskId, {
            assignedTo: [...currentAssigned, attendee.userId],
          });

          // Get current user identity for assignment
          const identity = await ctx.auth.getUserIdentity();
          if (identity) {
            const currentUser = await ctx.db
              .query("users")
              .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
              .first();

            if (currentUser) {
              // Create task assignment entry
              await ctx.db.insert("eventTaskAssignments", {
                taskId,
                userId: attendee.userId,
                assignedBy: currentUser._id,
                status: "assigned",
                progress: 0,
                assignedAt: Date.now(),
                isActive: true,
              });

              assignmentCount++;

              // Notify attendee
              await ctx.db.insert("notifications", {
                userId: attendee.userId,
                type: "task_assigned",
                title: "Event Task Assigned",
                message: `You've been assigned to task "${task.title}" for the event`,
                priority: "normal",
                isRead: false,
                metadata: {},
                createdAt: Date.now(),
              });
            }
          }
        }
      }
    }

    return { success: true, assignmentsCreated: assignmentCount };
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Create project tasks from event
async function createProjectTasksFromEvent(
  ctx: any,
  eventId: Id<"events">,
  projectId: Id<"projects">
): Promise<Id<"tasks">[]> {
  const event = await ctx.db.get(eventId);
  if (!event) return [];

  // Get event tasks
  const eventTasks = await ctx.db
    .query("eventTasks")
    .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
    .collect();

  const taskIds: Id<"tasks">[] = [];

  // Create project task for each event task
  for (const eventTask of eventTasks) {
    const taskId = await ctx.db.insert("tasks", {
      title: `[Event] ${eventTask.title}`,
      description: eventTask.description,
      status: "todo",
      priority: eventTask.priority,
      projectId,
      assignedTo: eventTask.assignedTo,
      createdBy: eventTask.createdBy,
      dueDate: eventTask.dueDate || event.startDate,
      storyPoints: eventTask.storyPoints || 3,
      tags: [...eventTask.tags, "event-task"],
      difficulty: "medium",
      type: "event",
      metadata: {
        sourceEventId: eventId,
        sourceEventTaskId: eventTask._id,
      },
    });
    taskIds.push(taskId);
  }

  return taskIds;
}

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
