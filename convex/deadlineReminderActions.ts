import { internalMutation } from "./_generated/server";

// Check for upcoming task deadlines and send notifications
export const checkTaskDeadlines = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // Get all active tasks
    const tasks = await ctx.db
      .query("eventTasks")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .filter((q) => q.neq(q.field("status"), "done"))
      .collect();

    let notificationsSent = 0;

    for (const task of tasks) {
      if (!task.dueDate || !task.assignedTo || task.assignedTo.length === 0) continue;

      const timeUntilDue = task.dueDate - now;

      // Skip if already past due or more than 7 days away
      if (timeUntilDue < 0 || timeUntilDue > oneWeek) continue;

      // Check if we already sent a notification recently for this task
      const recentNotifications = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("category"), "deadline"))
        .filter((q) => q.eq(q.field("relatedId"), task._id))
        .collect();

      // If notification sent in last 23 hours, skip
      const lastNotification = recentNotifications
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      
      if (lastNotification && (now - lastNotification.createdAt) < (23 * 60 * 60 * 1000)) {
        continue;
      }

      let priority: "urgent" | "high" | "medium" = "medium";
      let message = "";

      if (timeUntilDue <= twentyFourHours) {
        priority = "urgent";
        message = `⏰ URGENT: Task "${task.title}" is due in less than 24 hours!`;
      } else if (timeUntilDue <= fortyEightHours) {
        priority = "high";
        message = `⚠️ Task "${task.title}" is due in less than 48 hours`;
      } else if (timeUntilDue <= oneWeek) {
        priority = "medium";
        message = `📅 Reminder: Task "${task.title}" is due within a week`;
      }

      // Send notification to all assigned users
      for (const userId of task.assignedTo) {
        await ctx.db.insert("notifications", {
          userId,
          title: "Deadline Approaching",
          message,
          type: priority === "urgent" ? "warning" : "info",
          category: "deadline",
          relatedId: task._id,
          relatedType: "eventTask",
          isRead: false,
          createdAt: now,
          actionUrl: "/tasks/my-duties",
          metadata: {
            priority,
            category: "deadline",
            relatedId: task._id,
            data: {
              taskId: task._id,
              taskTitle: task.title,
              dueDate: task.dueDate,
              timeRemaining: timeUntilDue,
            }
          }
        });
        notificationsSent++;
      }
    }

    console.log(`Deadline check completed. Sent ${notificationsSent} notifications.`);
    return { notificationsSent };
  },
});

// Check for upcoming project deadlines
export const checkProjectDeadlines = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;

    // Get all active projects
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let notificationsSent = 0;

    for (const project of projects) {
      if (!project.endDate || !project.assignedTo || project.assignedTo.length === 0) continue;

      const timeUntilDue = project.endDate - now;

      // Skip if already past due or more than 2 weeks away
      if (timeUntilDue < 0 || timeUntilDue > twoWeeks) continue;

      // Check if we already sent a notification recently
      const recentNotifications = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("category"), "project_deadline"))
        .filter((q) => q.eq(q.field("relatedId"), project._id))
        .collect();

      const lastNotification = recentNotifications
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      
      // If notification sent in last 24 hours, skip
      if (lastNotification && (now - lastNotification.createdAt) < (24 * 60 * 60 * 1000)) {
        continue;
      }

      let priority: "urgent" | "high" | "medium" = "medium";
      let message = "";

      if (timeUntilDue <= oneWeek) {
        priority = "high";
        message = `⚠️ Project "${project.title}" deadline is within one week!`;
      } else if (timeUntilDue <= twoWeeks) {
        priority = "medium";
        message = `📅 Project "${project.title}" deadline is within two weeks`;
      }

      // Send notification to all team members
      for (const userId of project.assignedTo) {
        await ctx.db.insert("notifications", {
          userId,
          title: "Project Deadline Approaching",
          message,
          type: priority === "high" ? "warning" : "info",
          category: "project_deadline",
          relatedId: project._id,
          relatedType: "project",
          isRead: false,
          createdAt: now,
          actionUrl: `/projects/${project._id}`,
          metadata: {
            priority,
            category: "project_deadline",
            relatedId: project._id,
            data: {
              projectId: project._id,
              projectTitle: project.title,
              endDate: project.endDate,
              timeRemaining: timeUntilDue,
            }
          }
        });
        notificationsSent++;
      }
    }

    console.log(`Project deadline check completed. Sent ${notificationsSent} notifications.`);
    return { notificationsSent };
  },
});
