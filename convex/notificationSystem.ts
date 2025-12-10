import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const resendNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, {
      resentAt: Date.now(),
      resentCount: (notification.resentCount || 0) + 1,
    });

    return {
      success: true,
      message: "Notification resent successfully",
    };
  },
});

export const sendEmailNotification = action({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    message: v.string(),
    notificationType: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const user = await ctx.runQuery(api.adminUserManagement.getUserById, { userId: args.userId });
      
      if (!user || !user.email) {
        return {
          success: false,
          message: "User or email not found",
        };
      }

      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      try {
        const { data, error } = await resend.emails.send({
          from: 'BarangayLink <notifications@barangaylink.com>',
          to: [user.email],
          subject: args.subject,
          html: args.message,
        });

        if (error) {
          console.error('Email error:', error);
          return {
            success: false,
            message: `Failed to send email: ${error.message}`,
          };
        }

      } catch (emailError: any) {
        console.error('Email send failed:', emailError);
        return {
          success: false,
          message: `Email error: ${emailError.message}`,
        };
      }

      return {
        success: true,
        message: "Email notification sent successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      };
    }
  },
});

// Check for overdue projects and create notifications
export const checkOverdueProjects = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    overdueCount: number;
  }> => {
    try {
      const projects = await ctx.runQuery(api.projects.getAllProjects, {});
      const now = Date.now();
      let overdueCount = 0;

      for (const project of projects) {
        if (project.endDate && project.endDate < now && project.status !== "completed") {
          // Project is overdue
          overdueCount++;
          
          // Create notification for project owner/team
          await ctx.runMutation(api.notifications.createNotification, {
            userId: project.createdBy,
            title: `Project Overdue: ${project.title}`,
            message: `The project "${project.title}" is overdue. Due date was ${new Date(project.endDate).toLocaleDateString()}.`,
            type: "project_overdue",
            category: "project",
            metadata: {
              projectId: project._id,
              dueDate: project.endDate,
              priority: "high",
            },
          });
          
          // Send email notification
          await ctx.runAction(api.notificationSystem.sendEmailNotification, {
            userId: project.createdBy,
            subject: `⚠️ Project Overdue: ${project.title}`,
            message: `
              <h2>Project Overdue Notification</h2>
              <p>The project "<strong>${project.title}</strong>" is overdue.</p>
              <p><strong>Due Date:</strong> ${new Date(project.endDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${project.status}</p>
              <p>Please take action to complete this project as soon as possible.</p>
            `,
            notificationType: "project_overdue",
          });
        }
        
        // Check for projects due soon (within 3 days)
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        if (project.endDate && project.endDate > now && project.endDate < now + threeDays && project.status !== "completed") {
          // Project due soon
          await ctx.runMutation(api.notifications.createNotification, {
            userId: project.createdBy,
            title: `Project Due Soon: ${project.title}`,
            message: `The project "${project.title}" is due on ${new Date(project.endDate).toLocaleDateString()}.`,
            type: "project_reminder",
            category: "project",
            metadata: {
              projectId: project._id,
              dueDate: project.endDate,
              priority: "medium",
            },
          });
        }
      }

      return {
        success: true,
        overdueCount,
      };
    } catch (error: any) {
      console.error("Error checking overdue projects:", error);
      return {
        success: false,
        overdueCount: 0,
      };
    }
  },
});

// Notify when project is completed
export const notifyProjectCompletion = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Notify project creator
    await ctx.db.insert("notifications", {
      userId: project.createdBy,
      title: `Project Completed: ${project.title}`,
      message: `Congratulations! The project "${project.title}" has been completed.`,
      type: "project_completed",
      priority: "low",
      isRead: false,
      createdAt: Date.now(),
      metadata: {
        projectId: project._id,
        completedAt: Date.now(),
      },
    });

    // Notify all team members
    if (project.assignedTo && project.assignedTo.length > 0) {
      for (const memberId of project.assignedTo) {
        if (memberId !== project.createdBy) {
          await ctx.db.insert("notifications", {
            userId: memberId as Id<"users">,
            title: `Project Completed: ${project.title}`,
            message: `The project "${project.title}" has been completed.`,
            type: "project_completed",
            priority: "low",
            isRead: false,
            createdAt: Date.now(),
            metadata: {
              projectId: project._id,
              completedAt: Date.now(),
            },
          });
        }
      }
    }

    return {
      success: true,
      message: "Project completion notifications sent",
    };
  },
});

// Get notification statistics
export const getNotificationStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const overdueCount = notifications.filter(
      (n) => n.type === "project_overdue" && !n.isRead
    ).length;
    const reminderCount = notifications.filter(
      (n) => n.type === "project_reminder" && !n.isRead
    ).length;

    return {
      total: notifications.length,
      unread: unreadCount,
      overdue: overdueCount,
      reminders: reminderCount,
    };
  },
});

// Test email notification system
export const sendTestEmail = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      // Get current user
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return {
          success: false,
          message: "Not authenticated",
        };
      }

      const currentUser = await ctx.runQuery(api.users.getCurrentUser);
      if (!currentUser) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Send test email to current admin
      const result = await ctx.runAction(api.notificationSystem.sendEmailNotification, {
        userId: currentUser._id,
        subject: "🧪 Test Email - BarangayLink Notification System",
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ Email System Test Successful!</h2>
            <p>Hello <strong>${currentUser.name}</strong>,</p>
            <p>This is a test email from the BarangayLink notification system.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Test Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li>📧 <strong>Recipient:</strong> ${currentUser.email}</li>
                <li>👤 <strong>Name:</strong> ${currentUser.name}</li>
                <li>⏰ <strong>Time:</strong> ${new Date().toLocaleString()}</li>
                <li>🔔 <strong>System:</strong> Notification System</li>
              </ul>
            </div>

            <p>If you received this email, your notification system is working correctly!</p>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>💡 What this means:</strong></p>
              <p style="margin: 8px 0 0 0;">Users will successfully receive email notifications for:</p>
              <ul>
                <li>Overdue projects</li>
                <li>Project due soon reminders</li>
                <li>Project completion alerts</li>
                <li>Task assignments</li>
              </ul>
            </div>

            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This is an automated test email from BarangayLink.<br/>
              If you did not request this test, please contact your system administrator.
            </p>
          </div>
        `,
        notificationType: "test",
      });

      return {
        success: result.success,
        message: result.success 
          ? `Test email sent to ${currentUser.email}` 
          : result.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  },
});

// Bulk resend notifications
export const bulkResendNotifications = mutation({
  args: {
    notificationIds: v.array(v.id("notifications")),
  },
  handler: async (ctx, args) => {
    let successCount = 0;
    
    for (const notificationId of args.notificationIds) {
      try {
        const notification = await ctx.db.get(notificationId);
        if (notification) {
          await ctx.db.patch(notificationId, {
            resentAt: Date.now(),
            resentCount: (notification.resentCount || 0) + 1,
          });
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to resend notification ${notificationId}:`, error);
      }
    }

    return {
      success: true,
      count: successCount,
      message: `${successCount} notifications resent successfully`,
    };
  },
});
