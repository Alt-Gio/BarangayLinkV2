import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Assign users to a task - Each gets their own progress tracking
 */
export const assignUsersToTask = mutation({
  args: {
    taskId: v.id("eventTasks"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assignedBy = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!assignedBy) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const now = Date.now();
    const newAssignments: Id<"eventTaskAssignments">[] = [];

    // Get all current assignments for this task
    const allAssignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Deactivate assignments for users not in the new list
    for (const assignment of allAssignments) {
      if (!args.userIds.includes(assignment.userId) && assignment.isActive) {
        await ctx.db.patch(assignment._id, {
          isActive: false,
        });
        
        // Log removal
        const user = await ctx.db.get(assignment.userId);
        
        // Send notification to removed user
        await ctx.db.insert("notifications", {
          userId: assignment.userId,
          type: "info",
          title: "Removed from Task",
          message: `You've been removed from "${task.title}"`,
          category: "task_removed",
          relatedId: args.taskId,
          relatedType: "eventTask",
          isRead: false,
          createdAt: now,
          metadata: {
            priority: "medium",
            category: "task_removed",
            relatedId: args.taskId,
            data: {
              taskId: args.taskId,
              taskTitle: task.title,
              removedBy: assignedBy.name,
              removedById: assignedBy._id,
            }
          }
        });
        
        await ctx.db.insert("eventTaskComments", {
          taskId: args.taskId,
          userId: assignedBy._id,
          comment: `Removed ${user?.name || "user"} from this task`,
          type: "assignment",
          mentions: [],
          createdAt: now,
          isEdited: false,
        });
      }
    }

    // Create individual assignment for each user in the new list
    for (const userId of args.userIds) {
      // Check if already assigned
      const existing = await ctx.db
        .query("eventTaskAssignments")
        .withIndex("by_task_user", (q) =>
          q.eq("taskId", args.taskId).eq("userId", userId)
        )
        .first();

      if (existing) {
        if (!existing.isActive) {
          // Reactivate if it was inactive
          await ctx.db.patch(existing._id, {
            isActive: true,
            assignedAt: now,
          });
        }
        continue; // Skip if already active
      }

      // Create new assignment
      const assignmentId = await ctx.db.insert("eventTaskAssignments", {
        taskId: args.taskId,
        userId,
        assignedBy: assignedBy._id,
        status: "assigned",
        progress: 0,
        assignedAt: now,
        isActive: true,
      });

      newAssignments.push(assignmentId);

      // Get user details for notification
      const user = await ctx.db.get(userId);
      if (user) {
        // Create in-app notification
        await ctx.db.insert("notifications", {
          userId,
          type: "task_assigned",
          title: "New Task Assignment",
          message: `You've been assigned to "${task.title}" by ${assignedBy.name}`,
          category: "task_assigned",
          relatedId: args.taskId,
          relatedType: "eventTask",
          isRead: false,
          createdAt: now,
          actionUrl: "/tasks/my-duties",
          metadata: {
            priority: "medium",
            category: "task_assigned",
            relatedId: args.taskId,
            data: {
              taskId: args.taskId,
              taskTitle: task.title,
              assignedByName: assignedBy.name,
              assignedById: assignedBy._id,
            }
          }
        });

        // 🔔 Send push notification
        await ctx.scheduler.runAfter(
          0,
          internal.pushNotifications.sendPushNotification,
          {
            userId,
            title: "📋 New Task Assigned",
            body: `${assignedBy.name} assigned you: "${task.title}"`,
            url: `/tasks/my-duties`,
            icon: "/icon-192x192.png",
            tag: `task-${args.taskId}`,
          }
        );
      }

      // Log assignment activity
      await ctx.db.insert("eventTaskComments", {
        taskId: args.taskId,
        userId: assignedBy._id,
        comment: `Assigned ${user?.name || "user"} to this task`,
        type: "assignment",
        mentions: [],
        createdAt: now,
        isEdited: false,
      });
    }

    // Update task's assigned users array to exactly match the new list
    await ctx.db.patch(args.taskId, {
      assignedTo: args.userIds,
      updatedAt: now,
    });

    // Recalculate overall progress
    await recalculateTaskProgress(ctx, args.taskId);

    return { assignmentIds: newAssignments };
  },
});

/**
 * Helper: Recalculate overall task progress based on individual assignments
 */
async function recalculateTaskProgress(ctx: any, taskId: Id<"eventTasks">) {
  const assignments = await ctx.db
    .query("eventTaskAssignments")
    .withIndex("by_task", (q: any) => q.eq("taskId", taskId))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();

  if (assignments.length === 0) {
    await ctx.db.patch(taskId, { progress: 0 });
    return;
  }

  // Calculate average progress
  const totalProgress = assignments.reduce(
    (sum: number, assignment: any) => sum + assignment.progress,
    0
  );
  const averageProgress = Math.round(totalProgress / assignments.length);

  // Update task progress
  await ctx.db.patch(taskId, { progress: averageProgress });

  // If all assignments are verified, mark task as done
  const allVerified = assignments.every((a: any) => a.status === "verified");
  if (allVerified && assignments.length > 0) {
    const task = await ctx.db.get(taskId);
    if (task && task.status !== "done") {
      await ctx.db.patch(taskId, {
        status: "done",
        progress: 100,
      });
    }
  }
}

/**
 * Get all assignments for a task with user details
 */
export const getTaskAssignments = query({
  args: {
    taskId: v.id("eventTasks"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get user details for each assignment
    const assignmentsWithUsers = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await ctx.db.get(assignment.userId);
        const assignedByUser = await ctx.db.get(assignment.assignedBy);
        
        return {
          ...assignment,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                imageUrl: user.imageUrl,
                email: user.email,
                position: user.position,
                department: user.department,
              }
            : null,
          assignedByUser: assignedByUser
            ? {
                _id: assignedByUser._id,
                name: assignedByUser.name,
                imageUrl: assignedByUser.imageUrl,
              }
            : null,
        };
      })
    );

    return assignmentsWithUsers.sort((a, b) => b.assignedAt - a.assignedAt);
  },
});

/**
 * Get all assignments for all tasks in an event
 */
export const getAllEventAssignments = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Get all tasks for this event
    const tasks = await ctx.db
      .query("eventTasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    const taskIds = tasks.map(t => t._id);
    
    // Get all assignments for these tasks
    const allAssignments = await Promise.all(
      taskIds.map(async (taskId) => {
        const assignments = await ctx.db
          .query("eventTaskAssignments")
          .withIndex("by_task", (q) => q.eq("taskId", taskId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();
        return assignments;
      })
    );
    
    // Flatten array of arrays
    return allAssignments.flat();
  },
});

/**
 * Update individual assignment progress
 */
export const updateAssignmentProgress = mutation({
  args: {
    assignmentId: v.id("eventTaskAssignments"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Only the assigned user can update their own progress
    if (assignment.userId !== user._id) {
      throw new Error("You can only update your own assignment");
    }

    const now = Date.now();
    const updates: any = {
      progress: Math.min(100, Math.max(0, args.progress)),
    };

    // Auto-update status based on progress
    if (args.progress > 0 && assignment.status === "assigned") {
      updates.status = "in_progress";
      updates.startedAt = now;
    }

    await ctx.db.patch(args.assignmentId, updates);

    // Recalculate overall task progress
    await recalculateTaskProgress(ctx, assignment.taskId);

    return { success: true };
  },
});

/**
 * Mark individual assignment as completed (100%) and submit for review
 */
export const completeAssignment = mutation({
  args: {
    assignmentId: v.id("eventTaskAssignments"),
    submissionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    if (assignment.userId !== user._id) {
      throw new Error("You can only complete your own assignment");
    }

    const now = Date.now();

    // Mark as completed
    await ctx.db.patch(args.assignmentId, {
      status: "completed",
      progress: 100,
      completedAt: now,
      submissionNote: args.submissionNote,
    });

    // Recalculate overall task progress
    await recalculateTaskProgress(ctx, assignment.taskId);

    // Get task details
    const task = await ctx.db.get(assignment.taskId);
    if (!task) return { success: true };

    // Notify task creator and assigner
    const notifyUsers = [task.createdBy];
    if (assignment.assignedBy !== task.createdBy) {
      notifyUsers.push(assignment.assignedBy);
    }

    for (const notifyUserId of notifyUsers) {
      await ctx.db.insert("notifications", {
        userId: notifyUserId,
        type: "task_completed",
        title: "Task Completion Pending Review",
        message: `${user.name} has completed their part of "${task.title}". Please review.`,
        relatedId: assignment.taskId,
        relatedType: "eventTask",
        isRead: false,
        createdAt: now,
      });
    }

    // Log activity
    await ctx.db.insert("eventTaskComments", {
      taskId: assignment.taskId,
      userId: user._id,
      comment:
        args.submissionNote ||
        `Completed their assignment (${user.name})`,
      type: "status_change",
      mentions: [],
      createdAt: now,
      isEdited: false,
    });

    // Check if task should move to in_review
    const allAssignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task", (q) => q.eq("taskId", assignment.taskId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const anyCompleted = allAssignments.some((a) => a.status === "completed");
    if (anyCompleted && task.status !== "in_review" && task.status !== "done") {
      await ctx.db.patch(assignment.taskId, {
        status: "in_review",
      });
    }

    return { success: true };
  },
});

/**
 * Verify/Approve individual assignment (by task creator or higher-up)
 */
export const verifyAssignment = mutation({
  args: {
    assignmentId: v.id("eventTaskAssignments"),
    approved: v.boolean(),
    verificationNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const verifier = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!verifier) throw new Error("User not found");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const task = await ctx.db.get(assignment.taskId);
    if (!task) throw new Error("Task not found");

    // Check permission: must be task creator, assigner, or higher level
    const verifierLevel = verifier.userLevel ? await ctx.db.get(verifier.userLevel) : null;
    const canVerify =
      task.createdBy === verifier._id ||
      assignment.assignedBy === verifier._id ||
      ["ADMIN", "CAPTAIN", "MANAGER"].includes(verifierLevel?.name || "");

    if (!canVerify) {
      throw new Error("You don't have permission to verify this assignment");
    }

    const now = Date.now();

    if (args.approved) {
      // Approve and verify
      await ctx.db.patch(args.assignmentId, {
        status: "verified",
        progress: 100,
        verifiedAt: now,
        verifiedBy: verifier._id,
        verificationNote: args.verificationNote,
      });

      // Notify the assigned user
      await ctx.db.insert("notifications", {
        userId: assignment.userId,
        type: "task_verified",
        title: "Assignment Verified!",
        message: `Your work on "${task.title}" has been verified by ${verifier.name}`,
        relatedId: assignment.taskId,
        relatedType: "eventTask",
        isRead: false,
        createdAt: now,
      });
    } else {
      // Reject - send back to in_progress
      await ctx.db.patch(args.assignmentId, {
        status: "in_progress",
        progress: 50, // Reset to partial
        verificationNote: args.verificationNote,
      });

      // Notify the assigned user
      await ctx.db.insert("notifications", {
        userId: assignment.userId,
        type: "task_rejected",
        title: "Assignment Needs Revision",
        message: `${verifier.name} has requested changes on "${task.title}"`,
        relatedId: assignment.taskId,
        relatedType: "eventTask",
        isRead: false,
        createdAt: now,
      });
    }

    // Log activity
    const assignedUser = await ctx.db.get(assignment.userId);
    await ctx.db.insert("eventTaskComments", {
      taskId: assignment.taskId,
      userId: verifier._id,
      comment: args.approved
        ? `Verified ${assignedUser?.name || "user"}'s work`
        : `Requested revision from ${assignedUser?.name || "user"}`,
      type: "status_change",
      mentions: [],
      createdAt: now,
      isEdited: false,
    });

    // Recalculate overall task progress
    await recalculateTaskProgress(ctx, assignment.taskId);

    return { success: true };
  },
});

/**
 * Remove user from assignment
 */
export const removeAssignment = mutation({
  args: {
    assignmentId: v.id("eventTaskAssignments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const task = await ctx.db.get(assignment.taskId);
    if (!task) throw new Error("Task not found");

    // Only task creator, assigner, or admin can remove
    const userLevel = user.userLevel ? await ctx.db.get(user.userLevel) : null;
    const canRemove =
      task.createdBy === user._id ||
      assignment.assignedBy === user._id ||
      userLevel?.name === "ADMIN";

    if (!canRemove) {
      throw new Error("You don't have permission to remove this assignment");
    }

    // Mark as inactive instead of deleting
    await ctx.db.patch(args.assignmentId, {
      isActive: false,
    });

    // Update task's assigned users array
    const remainingAssignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task", (q) => q.eq("taskId", assignment.taskId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const remainingUserIds = remainingAssignments.map((a) => a.userId);
    await ctx.db.patch(assignment.taskId, {
      assignedTo: remainingUserIds,
      updatedAt: Date.now(),
    });

    // Recalculate progress
    await recalculateTaskProgress(ctx, assignment.taskId);

    return { success: true };
  },
});

/**
 * Get user's assignments
 */
export const getMyAssignments = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    let query = ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true));

    const assignments = await query.collect();

    // Filter by status if provided
    const filtered = args.status
      ? assignments.filter((a) => a.status === args.status)
      : assignments;

    // Get task details for each assignment
    const assignmentsWithTasks = await Promise.all(
      filtered.map(async (assignment) => {
        const task = await ctx.db.get(assignment.taskId);
        const assignedByUser = await ctx.db.get(assignment.assignedBy);

        return {
          ...assignment,
          task,
          assignedByUser: assignedByUser
            ? {
                _id: assignedByUser._id,
                name: assignedByUser.name,
                imageUrl: assignedByUser.imageUrl,
              }
            : null,
        };
      })
    );

    return assignmentsWithTasks.sort((a, b) => b.assignedAt - a.assignedAt);
  },
});
