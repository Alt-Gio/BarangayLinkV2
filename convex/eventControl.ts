import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get current user with role check
const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
    .unique();

  if (!user || user.status !== "active") throw new Error("User not found or inactive");

  const userLevel = await ctx.db.get(user.userLevel);
  return { ...user, userLevel };
};

// Check if user can assign tasks (MANAGER, ADMIN, CAPTAIN)
const canAssignTasks = (userLevel: any): boolean => {
  return userLevel && (
    userLevel.name === "ADMIN" ||
    userLevel.name === "CAPTAIN" ||
    userLevel.name === "MANAGER" ||
    userLevel.permissions.includes("tasks:assign")
  );
};

// ============================================
// EVENT TASK MANAGEMENT
// ============================================

// Create a new event task
export const createEventTask = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("blocked")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    taskType: v.optional(v.string()),
    assignedTo: v.optional(v.array(v.id("users"))),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    location: v.optional(v.string()),
    requirements: v.optional(v.string()),
    checklistItems: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    parentTaskId: v.optional(v.id("eventTasks")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Verify event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check if event has ended (time-sensitive validation)
    const now = Date.now();
    if (event.endDate < now) {
      throw new Error("Cannot add tasks to past events. This event has already ended.");
    }

    // Warn if event is starting soon
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
    if (event.startDate < threeDaysFromNow && event.startDate > now) {
      // Event starting soon - allowed but noted
    }

    // Get the highest order index for new tasks
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event_status", (q) => 
        q.eq("eventId", args.eventId).eq("status", args.status || "todo")
      )
      .collect();

    const maxOrder = tasks.reduce((max, task) => Math.max(max, task.orderIndex), -1);

    // Process checklist items if provided
    const checklistItems = args.checklistItems?.map((text, index) => ({
      id: `item-${index}-${Date.now()}`,
      text: text.trim(),
      completed: false,
    }));

    const taskId = await ctx.db.insert("eventTasks", {
      eventId: args.eventId,
      title: args.title,
      description: args.description || "",
      status: args.status || "todo",
      priority: args.priority || "medium",
      taskType: args.taskType,
      location: args.location,
      requirements: args.requirements,
      assignedTo: [], // Start with no assignments - use assignment system instead
      createdBy: currentUser._id,
      assignedBy: undefined, // Set only when users are assigned
      reportTo: undefined, // Set only when explicitly assigned a reviewer
      dueDate: args.dueDate,
      estimatedHours: args.estimatedHours,
      category: args.category,
      tags: args.tags || [],
      orderIndex: maxOrder + 1,
      blockedBy: [],
      blocking: [],
      parentTaskId: args.parentTaskId,
      hasSubtasks: false,
      progress: 0,
      checklistItems: checklistItems,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    });

    // If this is a subtask, update parent
    if (args.parentTaskId) {
      const parent = await ctx.db.get(args.parentTaskId);
      if (parent) {
        await ctx.db.patch(args.parentTaskId, {
          hasSubtasks: true,
          subtaskCount: (parent.subtaskCount || 0) + 1,
        });
      }
    }

    // Create activity log
    await ctx.db.insert("eventTaskComments", {
      taskId,
      userId: currentUser._id,
      comment: `Task created: ${args.title}`,
      type: "system",
      mentions: [],
      createdAt: now,
      isEdited: false,
    });

    // Notify assigned users
    if (args.assignedTo && args.assignedTo.length > 0) {
      for (const userId of args.assignedTo) {
        await ctx.db.insert("notifications", {
          userId,
          title: "New Task Assigned",
          message: `You've been assigned to: ${args.title}`,
          type: "info",
          category: "task",
          isRead: false,
          createdAt: now,
        });
      }
    }

    return taskId;
  },
});

// Get all tasks for an event (Kanban board view)
export const getEventTasks = query({
  args: {
    eventId: v.id("events"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Public read access - no auth required to view tasks
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => 
        args.includeArchived ? q.eq(q.field("isArchived"), true) : q.eq(q.field("isArchived"), false)
      )
      .collect();

    // Enrich tasks with user information
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const assignedUsers = await Promise.all(
          task.assignedTo.map(async (userId) => {
            const user = await ctx.db.get(userId);
            return user ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              imageUrl: user.imageUrl,
              position: user.position,
            } : null;
          })
        );

        const creator = await ctx.db.get(task.createdBy);
        
        let parentTask = null;
        if (task.parentTaskId) {
          parentTask = await ctx.db.get(task.parentTaskId);
        }

        let verifiedUser = null;
        if (task.verifiedBy) {
          const verifier = await ctx.db.get(task.verifiedBy);
          verifiedUser = verifier ? {
            _id: verifier._id,
            name: verifier.name,
            email: verifier.email,
            imageUrl: verifier.imageUrl,
          } : null;
        }

        let reportToUser = null;
        if (task.reportTo) {
          const reviewer = await ctx.db.get(task.reportTo);
          reportToUser = reviewer ? {
            _id: reviewer._id,
            name: reviewer.name,
            email: reviewer.email,
            imageUrl: reviewer.imageUrl,
          } : null;
        }

        return {
          ...task,
          assignedUsers: assignedUsers.filter(Boolean),
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            email: creator.email,
            imageUrl: creator.imageUrl,
          } : null,
          parentTask: parentTask ? {
            _id: parentTask._id,
            title: parentTask.title,
          } : null,
          verifiedUser,
          reportToUser,
        };
      })
    );

    // Sort by orderIndex within each status
    return enrichedTasks.sort((a, b) => a.orderIndex - b.orderIndex);
  },
});

// Update task status (drag and drop in Kanban)
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("eventTasks"),
    newStatus: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    newOrderIndex: v.optional(v.number()),
    blockedReason: v.optional(v.string()),
    verifiedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const oldStatus = task.status;
    const now = Date.now();

    const updates: any = {
      status: args.newStatus,
      updatedAt: now,
    };

    if (args.newOrderIndex !== undefined) {
      updates.orderIndex = args.newOrderIndex;
    }

    // If blocking, save reason
    if (args.newStatus === "blocked" && args.blockedReason) {
      updates.blockedReason = args.blockedReason;
    }

    // If marking as done, set completion time, progress, and verifier
    if (args.newStatus === "done" && oldStatus !== "done") {
      updates.completedAt = now;
      updates.progress = 100;
      if (args.verifiedBy) {
        updates.verifiedBy = args.verifiedBy;
      } else {
        updates.verifiedBy = currentUser._id;
      }
    }

    // Clear blocked reason when moving out of blocked status
    if (oldStatus === "blocked" && args.newStatus !== "blocked") {
      updates.blockedReason = undefined;
    }

    await ctx.db.patch(args.taskId, updates);

    // Log status change
    await ctx.db.insert("eventTaskComments", {
      taskId: args.taskId,
      userId: currentUser._id,
      comment: `Status changed from ${oldStatus} to ${args.newStatus}`,
      type: "status_change",
      oldStatus,
      newStatus: args.newStatus,
      mentions: [],
      createdAt: now,
      isEdited: false,
    });

    // Notify assigned users and creator of status change
    const notifyUsers = new Set([...task.assignedTo, task.createdBy]);
    
    for (const userId of notifyUsers) {
      if (userId !== currentUser._id) {
        await ctx.db.insert("notifications", {
          userId,
          title: args.newStatus === "done" ? "Task Completed!" : "Task Status Updated",
          message: `"${task.title}" status changed to ${args.newStatus.replace(/_/g, ' ')} by ${currentUser.name}`,
          type: args.newStatus === "done" ? "success" : args.newStatus === "blocked" ? "warning" : "info",
          category: args.newStatus === "done" ? "task_completed" : "task_updated",
          relatedId: args.taskId,
          relatedType: "eventTask",
          isRead: false,
          createdAt: now,
          actionUrl: "/tasks/my-duties",
          metadata: {
            priority: args.newStatus === "done" ? "high" : args.newStatus === "blocked" ? "high" : "medium",
            category: args.newStatus === "done" ? "task_completed" : "task_updated",
            relatedId: args.taskId,
            data: {
              taskId: args.taskId,
              taskTitle: task.title,
              oldStatus: oldStatus,
              newStatus: args.newStatus,
              changedBy: currentUser.name,
              changedById: currentUser._id,
            }
          }
        });
      }
    }

    return { success: true };
  },
});

// Assign task to users (hierarchy-based)
export const assignTask = mutation({
  args: {
    taskId: v.id("eventTasks"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Check if user can assign tasks
    if (!canAssignTasks(currentUser.userLevel)) {
      throw new Error("You don't have permission to assign tasks");
    }

    // Verify all users exist and have lower or equal level
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user) throw new Error(`User ${userId} not found`);

      const userLevel = await ctx.db.get(user.userLevel);
      if (!userLevel) throw new Error("User level not found");

      // Check hierarchy: can only assign to same or lower level
      if (userLevel.level > currentUser.userLevel.level) {
        throw new Error(`Cannot assign tasks to higher-level users (${user.name})`);
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.taskId, {
      assignedTo: args.userIds,
      assignedBy: currentUser._id,
      updatedAt: now,
    });

    // Log assignment
    await ctx.db.insert("eventTaskComments", {
      taskId: args.taskId,
      userId: currentUser._id,
      comment: `Task assigned to ${args.userIds.length} user(s)`,
      type: "assignment",
      mentions: [],
      createdAt: now,
      isEdited: false,
    });

    // Notify assigned users
    for (const userId of args.userIds) {
      await ctx.db.insert("notifications", {
        userId,
        title: "Task Assigned",
        message: `You've been assigned to: ${task.title}`,
        type: "info",
        category: "task",
        isRead: false,
        createdAt: now,
      });
    }

    return { success: true };
  },
});

// Update task details
export const updateTask = mutation({
  args: {
    taskId: v.id("eventTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    progress: v.optional(v.number()),
    reportTo: v.optional(v.id("users")), // Assign reviewer/checker
    location: v.optional(v.string()),
    requirements: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Can update if: creator, assigned, or has permission
    const canUpdate = 
      task.createdBy === currentUser._id ||
      task.assignedTo.includes(currentUser._id) ||
      canAssignTasks(currentUser.userLevel);

    if (!canUpdate) {
      throw new Error("You don't have permission to update this task");
    }

    const { taskId, ...updates } = args;
    const now = Date.now();
    
    await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: now,
    });

    // Notify assigned users and creator of significant changes
    const hasSignificantChange = updates.priority || updates.dueDate || updates.title;
    
    if (hasSignificantChange) {
      const notifyUsers = new Set([...task.assignedTo, task.createdBy]);
      notifyUsers.delete(currentUser._id); // Don't notify the updater
      
      let changeDescription = [];
      if (updates.priority) changeDescription.push(`priority changed to ${updates.priority}`);
      if (updates.dueDate) changeDescription.push(`due date updated`);
      if (updates.title) changeDescription.push(`title changed`);
      
      for (const userId of notifyUsers) {
        await ctx.db.insert("notifications", {
          userId,
          title: "Task Updated",
          message: `"${task.title}" was updated by ${currentUser.name}: ${changeDescription.join(', ')}`,
          type: updates.priority === "critical" || updates.priority === "high" ? "warning" : "info",
          category: "task_updated",
          relatedId: taskId,
          relatedType: "eventTask",
          isRead: false,
          createdAt: now,
          actionUrl: "/tasks/my-duties",
          metadata: {
            priority: updates.priority === "critical" ? "urgent" : updates.priority === "high" ? "high" : "medium",
            category: "task_updated",
            relatedId: taskId,
            data: {
              taskId: taskId,
              taskTitle: task.title,
              updatedBy: currentUser.name,
              updatedById: currentUser._id,
              changes: updates,
            }
          }
        });
      }
    }

    return { success: true };
  },
});

// Archive task (soft delete)
export const archiveTask = mutation({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Only admins, captains, managers, or task creator can archive
    const canArchive =
      task.createdBy === currentUser._id ||
      currentUser.userLevel?.name === "ADMIN" ||
      currentUser.userLevel?.name === "CAPTAIN" ||
      currentUser.userLevel?.name === "MANAGER";

    if (!canArchive) {
      throw new Error("You don't have permission to archive this task");
    }

    await ctx.db.patch(args.taskId, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Add comment to task
export const addTaskComment = mutation({
  args: {
    taskId: v.id("eventTasks"),
    comment: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const now = Date.now();

    const commentId = await ctx.db.insert("eventTaskComments", {
      taskId: args.taskId,
      userId: currentUser._id,
      comment: args.comment,
      type: "comment",
      mentions: args.mentions || [],
      createdAt: now,
      isEdited: false,
    });

    // Notify task owner and assigned users (except commenter)
    const notifyUsers = new Set([task.createdBy, ...task.assignedTo]);
    notifyUsers.delete(currentUser._id); // Don't notify the commenter
    
    for (const userId of notifyUsers) {
      await ctx.db.insert("notifications", {
        userId,
        title: "New Comment on Task",
        message: `${currentUser.name} commented on "${task.title}"`,
        type: "info",
        category: "task_comment",
        relatedId: args.taskId,
        relatedType: "eventTask",
        isRead: false,
        createdAt: now,
        actionUrl: "/tasks/my-duties",
        metadata: {
          priority: "medium",
          category: "task_comment",
          relatedId: args.taskId,
          data: {
            taskId: args.taskId,
            taskTitle: task.title,
            commenterName: currentUser.name,
            commenterId: currentUser._id,
            commentPreview: args.comment.substring(0, 100),
          }
        }
      });
    }

    // Notify mentioned users with higher priority
    if (args.mentions && args.mentions.length > 0) {
      for (const userId of args.mentions) {
        await ctx.db.insert("notifications", {
          userId,
          title: "You Were Mentioned!",
          message: `${currentUser.name} mentioned you in "${task.title}"`,
          type: "info",
          category: "mention",
          relatedId: args.taskId,
          relatedType: "eventTask",
          isRead: false,
          createdAt: now,
          actionUrl: "/tasks/my-duties",
          metadata: {
            priority: "high",
            category: "mention",
            relatedId: args.taskId,
            data: {
              taskId: args.taskId,
              taskTitle: task.title,
              mentionedBy: currentUser.name,
              mentionedById: currentUser._id,
              commentPreview: args.comment.substring(0, 100),
            }
          }
        });
      }
    }

    return commentId;
  },
});

// Get task comments and activity
export const getTaskComments = query({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("eventTaskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect();

    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: user ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
          } : null,
        };
      })
    );

    return enrichedComments;
  },
});

// Get event dashboard (overview stats)
export const getEventDashboard = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    const stats = {
      total: tasks.length,
      backlog: tasks.filter(t => t.status === "backlog").length,
      todo: tasks.filter(t => t.status === "todo").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      inReview: tasks.filter(t => t.status === "in_review").length,
      done: tasks.filter(t => t.status === "done").length,
      blocked: tasks.filter(t => t.status === "blocked").length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "done").length,
      highPriority: tasks.filter(t => t.priority === "high" || t.priority === "critical").length,
      avgProgress: tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length : 0,
    };

    return stats;
  },
});

// Get event progress (for display on cards)
export const getEventProgress = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    if (tasks.length === 0) {
      return { progress: 0, completedTasks: 0, totalTasks: 0 };
    }

    const completedTasks = tasks.filter(t => t.status === "done").length;
    const progress = Math.round((completedTasks / tasks.length) * 100);

    return {
      progress,
      completedTasks,
      totalTasks: tasks.length,
    };
  },
});

// Get user's assigned event tasks (for Duties page)
export const getMyEventTasks = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_assigned", (q) => q.eq("assignedTo", [currentUser._id]))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Enrich with event and user information
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const event = await ctx.db.get(task.eventId);
        const creator = await ctx.db.get(task.createdBy);
        
        return {
          ...task,
          event: event ? {
            _id: event._id,
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
          } : null,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            imageUrl: creator.imageUrl,
          } : null,
        };
      })
    );

    return enrichedTasks.filter(t => t.event !== null);
  },
});

// Delete task
export const deleteTask = mutation({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Only creator or admins can delete
    const canDelete = 
      task.createdBy === currentUser._id ||
      canAssignTasks(currentUser.userLevel);

    if (!canDelete) {
      throw new Error("You don't have permission to delete this task");
    }

    // Check if task has subtasks
    if (task.hasSubtasks) {
      throw new Error("Cannot delete task with subtasks. Delete subtasks first.");
    }

    await ctx.db.delete(args.taskId);

    // Update parent if this was a subtask
    if (task.parentTaskId) {
      const parent = await ctx.db.get(task.parentTaskId);
      if (parent) {
        const newSubtaskCount = Math.max(0, (parent.subtaskCount || 1) - 1);
        await ctx.db.patch(task.parentTaskId, {
          subtaskCount: newSubtaskCount,
          hasSubtasks: newSubtaskCount > 0,
        });
      }
    }

    return { success: true };
  },
});

// Start time tracking
export const startTimeTracking = mutation({
  args: {
    taskId: v.id("eventTasks"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Check if there's already a running timer for this user
    const runningEntry = await ctx.db
      .query("eventTaskTimeEntries")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("isRunning"), true))
      .first();

    if (runningEntry) {
      throw new Error("You already have a running timer. Stop it first.");
    }

    const now = Date.now();

    const entryId = await ctx.db.insert("eventTaskTimeEntries", {
      taskId: args.taskId,
      userId: currentUser._id,
      startTime: now,
      description: args.description,
      isRunning: true,
      createdAt: now,
    });

    return entryId;
  },
});

// Stop time tracking
export const stopTimeTracking = mutation({
  args: {
    entryId: v.id("eventTaskTimeEntries"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const entry = await ctx.db.get(args.entryId);
    
    if (!entry) throw new Error("Time entry not found");
    if (entry.userId !== currentUser._id) throw new Error("Not your time entry");
    if (!entry.isRunning) throw new Error("Timer is not running");

    const now = Date.now();
    const duration = Math.floor((now - entry.startTime) / 1000 / 60); // Convert to minutes

    await ctx.db.patch(args.entryId, {
      endTime: now,
      duration,
      isRunning: false,
    });

    // Update task actual hours
    const task = await ctx.db.get(entry.taskId);
    if (task) {
      const newActualHours = (task.actualHours || 0) + (duration / 60);
      await ctx.db.patch(entry.taskId, {
        actualHours: newActualHours,
      });
    }

    return { duration };
  },
});

export default {
  createEventTask,
  getEventTasks,
  updateTaskStatus,
  assignTask,
  updateTask,
  addTaskComment,
  getTaskComments,
  getEventDashboard,
  deleteTask,
  startTimeTracking,
  stopTimeTracking,
};
