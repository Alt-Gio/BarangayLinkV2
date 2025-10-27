import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get comprehensive team workload statistics
 * Shows all users with their task counts, completion rates, and workload status
 */
export const getTeamWorkload = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user and verify permissions
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get user level to check permissions
    const userLevel = await ctx.db.get(currentUser.userLevel);
    
    // Only Admin, Captain, and Manager can view team workload
    const allowedRoles = ["ADMIN", "CAPTAIN", "MANAGER"];
    if (!userLevel || !allowedRoles.includes(userLevel.name)) {
      throw new Error("Insufficient permissions");
    }

    // Get all active users
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get all tasks (both standalone and event tasks)
    const allTasks = await ctx.db.query("tasks").collect();
    const allEventTasks = await ctx.db.query("eventTasks").collect();

    // Get all task assignments
    const allAssignments = await ctx.db.query("eventTaskAssignments").collect();

    // Calculate workload for each user
    const workloadData = await Promise.all(
      allUsers.map(async (user) => {
        // Count standalone tasks assigned to this user
        const standaloneTasks = allTasks.filter(
          (task) =>
            task.assignedTo.includes(user._id) &&
            task.status !== "completed" &&
            task.status !== "cancelled"
        );

        // Count event tasks where user has assignments
        const eventTaskAssignments = allAssignments.filter(
          (assignment) =>
            assignment.userId === user._id &&
            assignment.status !== "verified" &&
            assignment.status !== "completed"
        );

        // Get unique event task IDs from assignments
        const assignedEventTaskIds = new Set(
          eventTaskAssignments.map((a) => a.taskId)
        );

        const assignedEventTasks = allEventTasks.filter(
          (task) =>
            assignedEventTaskIds.has(task._id) &&
            !task.isArchived &&
            task.status !== "done"
        );

        // Count completed tasks
        const completedStandaloneTasks = allTasks.filter(
          (task) =>
            task.assignedTo.includes(user._id) &&
            task.status === "completed"
        );

        const completedEventAssignments = allAssignments.filter(
          (assignment) =>
            assignment.userId === user._id &&
            (assignment.status === "verified" ||
              assignment.status === "completed")
        );

        // Count overdue tasks
        const now = Date.now();
        const overdueTasks = [
          ...standaloneTasks.filter(
            (task) => task.dueDate && task.dueDate < now
          ),
          ...assignedEventTasks.filter(
            (task) => task.dueDate && task.dueDate < now
          ),
        ];

        // Count high priority tasks
        const highPriorityTasks = [
          ...standaloneTasks.filter(
            (task) => task.priority === "urgent" || task.priority === "high"
          ),
          ...assignedEventTasks.filter(
            (task) => task.priority === "critical" || task.priority === "high"
          ),
        ];

        // Calculate stats
        const activeTasks = standaloneTasks.length + assignedEventTasks.length;
        const totalCompleted =
          completedStandaloneTasks.length + completedEventAssignments.length;
        const totalTasks = activeTasks + totalCompleted;
        const completionRate =
          totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

        // Get user level details
        const userLevelData = await ctx.db.get(user.userLevel);

        // Determine workload status
        let workloadStatus: "light" | "optimal" | "heavy" | "overloaded" =
          "light";
        if (activeTasks >= 15) workloadStatus = "overloaded";
        else if (activeTasks >= 10) workloadStatus = "heavy";
        else if (activeTasks >= 5) workloadStatus = "optimal";

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          image: user.imageUrl || "",
          role: userLevelData?.name || "WORKER",
          roleLevel: userLevelData?.level || 1,
          activeTasks,
          completedTasks: totalCompleted,
          totalTasks,
          overdueTasks: overdueTasks.length,
          highPriorityTasks: highPriorityTasks.length,
          completionRate,
          workloadStatus,
          lastActive: user._creationTime,
        };
      })
    );

    // Sort by active tasks (descending) - most overloaded first
    workloadData.sort((a, b) => b.activeTasks - a.activeTasks);

    // Calculate team statistics
    const totalTeamMembers = workloadData.length;
    const totalActiveTasks = workloadData.reduce(
      (sum, user) => sum + user.activeTasks,
      0
    );
    const totalCompletedTasks = workloadData.reduce(
      (sum, user) => sum + user.completedTasks,
      0
    );
    const overloadedCount = workloadData.filter(
      (u) => u.workloadStatus === "overloaded"
    ).length;
    const averageTasksPerPerson =
      totalTeamMembers > 0
        ? Math.round(totalActiveTasks / totalTeamMembers)
        : 0;

    return {
      users: workloadData,
      teamStats: {
        totalMembers: totalTeamMembers,
        totalActiveTasks,
        totalCompletedTasks,
        overloadedMembers: overloadedCount,
        averageTasksPerPerson,
      },
    };
  },
});

/**
 * Get detailed tasks for a specific user
 */
export const getUserTasks = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user and verify permissions
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get user level to check permissions
    const userLevel = await ctx.db.get(currentUser.userLevel);
    
    // Only Admin, Captain, Manager, or the user themselves can view
    const allowedRoles = ["ADMIN", "CAPTAIN", "MANAGER"];
    const isAllowed =
      (userLevel && allowedRoles.includes(userLevel.name)) ||
      currentUser._id === args.userId;

    if (!isAllowed) {
      throw new Error("Insufficient permissions");
    }

    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get standalone tasks - filter in memory since assignedTo is an array
    const allStandaloneTasks = await ctx.db
      .query("tasks")
      .collect();
    
    const standaloneTasks = allStandaloneTasks.filter(
      (task) => task.assignedTo.includes(args.userId)
    );

    // Get event task assignments
    const assignments = await ctx.db
      .query("eventTaskAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get event tasks from assignments
    const eventTasks = await Promise.all(
      assignments.map(async (assignment) => {
        const task = await ctx.db.get(assignment.taskId);
        if (!task || task.isArchived) return null;

        // Get event details
        const event = await ctx.db.get(task.eventId);

        return {
          ...task,
          assignmentStatus: assignment.status,
          eventTitle: event?.title || "Unknown Event",
        };
      })
    );

    const validEventTasks = eventTasks.filter((t) => t !== null);

    return {
      standaloneTasks,
      eventTasks: validEventTasks,
    };
  },
});
