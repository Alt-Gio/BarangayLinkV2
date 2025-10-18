import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Update individual assignment progress when user clocks out
 * This syncs time tracking with assignment progress
 */
export const updateAssignmentFromTimeTracking = mutation({
  args: {
    taskId: v.id("eventTasks"),
    userId: v.id("users"),
    progress: v.number(),
    markComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Find the user's assignment for this task
    const assignment = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_task_user", (q) => 
        q.eq("taskId", args.taskId).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!assignment) {
      // No assignment exists, create one automatically
      const task = await ctx.db.get(args.taskId);
      if (!task) return;

      const now = Date.now();
      await ctx.db.insert("eventTaskAssignments", {
        taskId: args.taskId,
        userId: args.userId,
        assignedBy: task.createdBy, // Auto-assigned by task creator
        status: args.markComplete ? "completed" : "in_progress",
        progress: args.markComplete ? 100 : Math.min(100, Math.max(0, args.progress)),
        startedAt: now,
        completedAt: args.markComplete ? now : undefined,
        assignedAt: now,
        isActive: true,
      });
    } else {
      // Update existing assignment
      const now = Date.now();
      const updates: any = {
        progress: args.markComplete ? 100 : Math.min(100, Math.max(0, args.progress)),
      };

      if (args.markComplete) {
        updates.status = "completed";
        updates.completedAt = now;
      } else if (args.progress > 0 && assignment.status === "assigned") {
        updates.status = "in_progress";
        updates.startedAt = now;
      }

      await ctx.db.patch(assignment._id, updates);
    }

    // Recalculate overall task progress
    await recalculateTaskProgress(ctx, args.taskId);
  },
});

/**
 * Recalculate overall task progress based on active assignments
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
  await ctx.db.patch(taskId, { 
    progress: averageProgress,
    updatedAt: Date.now(),
  });

  // If all assignments are verified, mark task as done
  const allVerified = assignments.every((a: any) => a.status === "verified");
  if (allVerified && assignments.length > 0) {
    const task = await ctx.db.get(taskId);
    if (task && task.status !== "done") {
      await ctx.db.patch(taskId, {
        status: "done",
        progress: 100,
        completedAt: Date.now(),
      });
    }
  }
}
