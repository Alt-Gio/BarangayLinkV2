import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'BarangayLink <barangaylink@barangaylink.com>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Email sending function with error handling
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

// Welcome Email
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  department?: string;
}) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 25px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to BarangayLink!</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.userName},</h2>
            <p>Welcome to BarangayLink, your comprehensive barangay project management system!</p>
            ${params.department ? `<p>You've been assigned to the <strong>${params.department}</strong> department.</p>` : ''}
            <p>Get started by exploring your dashboard and connecting with your team.</p>
            <center>
              <a href="${BASE_URL}/dashboard" class="button">Go to Dashboard</a>
            </center>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    params.to,
    '🎉 Welcome to BarangayLink!',
    html
  );
}

// Task Assigned Email
export async function sendTaskAssignedEmail(params: {
  to: string;
  userName: string;
  taskTitle: string;
  taskDescription?: string;
  projectName?: string;
  dueDate?: string;
  priority: string;
  assignedBy: string;
  taskId: string;
}) {
  const priorityColor = params.priority === 'high' ? '#ef4444' : params.priority === 'medium' ? '#f59e0b' : '#10b981';
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 25px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .priority { display: inline-block; padding: 4px 12px; border-radius: 4px; color: white; background: ${priorityColor}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Task Assigned</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.userName},</h2>
            <p><strong>${params.assignedBy}</strong> has assigned you a new task:</p>
            <div style="background: #eff6ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <h3>${params.taskTitle}</h3>
              ${params.taskDescription ? `<p>${params.taskDescription}</p>` : ''}
              ${params.projectName ? `<p><strong>Project:</strong> ${params.projectName}</p>` : ''}
              ${params.dueDate ? `<p><strong>Due Date:</strong> ${params.dueDate}</p>` : ''}
              <p><strong>Priority:</strong> <span class="priority">${params.priority.toUpperCase()}</span></p>
            </div>
            <center>
              <a href="${BASE_URL}/tasks/my-duties?taskId=${params.taskId}" class="button">View Task</a>
            </center>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    params.to,
    `📋 New Task Assigned: ${params.taskTitle}`,
    html
  );
}

// Event Reminder Email
export async function sendEventReminderEmail(params: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDescription?: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  eventId: string;
  hoursUntil: number;
}) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 25px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Event Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.userName},</h2>
            <p>This is a reminder for an upcoming event in <strong>${params.hoursUntil} hours</strong>:</p>
            <div style="background: #f5f3ff; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
              <h3>${params.eventTitle}</h3>
              ${params.eventDescription ? `<p>${params.eventDescription}</p>` : ''}
              <p><strong>📆 Date:</strong> ${params.eventDate}</p>
              <p><strong>🕐 Time:</strong> ${params.eventTime}</p>
              ${params.location ? `<p><strong>📍 Location:</strong> ${params.location}</p>` : ''}
            </div>
            <center>
              <a href="${BASE_URL}/events?eventId=${params.eventId}" class="button">View Event</a>
            </center>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    params.to,
    `📅 Event Reminder: ${params.eventTitle}`,
    html
  );
}

// Daily/Weekly Digest Email
export async function sendDigestEmail(params: {
  to: string;
  userName: string;
  period: 'daily' | 'weekly';
  stats: {
    tasksCompleted: number;
    tasksAssigned: number;
    upcomingEvents: number;
    newMessages: number;
    projectUpdates: number;
  };
  recentActivities: Array<{
    type: string;
    title: string;
    time: string;
  }>;
  upcomingDeadlines: Array<{
    title: string;
    dueDate: string;
    priority: string;
  }>;
}) {
  const activitiesHtml = params.recentActivities.map(activity => `
    <div style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
      <strong>${activity.type}:</strong> ${activity.title}
      <br><small style="color: #6b7280;">${activity.time}</small>
    </div>
  `).join('');

  const deadlinesHtml = params.upcomingDeadlines.map(deadline => `
    <div style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
      <strong>${deadline.title}</strong>
      <br><small>Due: ${deadline.dueDate} | Priority: ${deadline.priority}</small>
    </div>
  `).join('');

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 25px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .stat-box { display: inline-block; padding: 15px; margin: 10px; background: #f0fdf4; border-radius: 8px; text-align: center; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your ${params.period === 'daily' ? 'Daily' : 'Weekly'} Digest</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.userName},</h2>
            <p>Here's your ${params.period} summary:</p>
            <div style="text-align: center; margin: 20px 0;">
              <div class="stat-box">
                <h3>${params.stats.tasksCompleted}</h3>
                <p>Tasks Completed</p>
              </div>
              <div class="stat-box">
                <h3>${params.stats.tasksAssigned}</h3>
                <p>New Tasks</p>
              </div>
              <div class="stat-box">
                <h3>${params.stats.upcomingEvents}</h3>
                <p>Events</p>
              </div>
            </div>
            <h3>Recent Activity</h3>
            <div style="background: #f9fafb; padding: 10px; border-radius: 8px; margin: 10px 0;">
              ${activitiesHtml || '<p>No recent activity</p>'}
            </div>
            <h3>Upcoming Deadlines</h3>
            <div style="background: #fef2f2; padding: 10px; border-radius: 8px; margin: 10px 0;">
              ${deadlinesHtml || '<p>No upcoming deadlines</p>'}
            </div>
            <center>
              <a href="${BASE_URL}/dashboard" class="button">View Dashboard</a>
            </center>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    params.to,
    `📊 Your ${params.period === 'daily' ? 'Daily' : 'Weekly'} Digest`,
    html
  );
}

// Project Update Email
export async function sendProjectUpdateEmail(params: {
  to: string;
  userName: string;
  projectName: string;
  updateType: string;
  updateDescription: string;
  projectId: string;
}) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 25px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Project Update</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.userName},</h2>
            <p>There's a new update on <strong>${params.projectName}</strong>:</p>
            <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
              <h3>${params.updateType}</h3>
              <p>${params.updateDescription}</p>
            </div>
            <center>
              <a href="${BASE_URL}/projects/${params.projectId}" class="button">View Project</a>
            </center>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    params.to,
    `📢 Update on ${params.projectName}`,
    html
  );
}

// Notification preferences email
export async function sendNotificationPreferencesEmail(params: {
  to: string;
  userName: string;
}) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 25px; text-align: center; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .option { margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚙️ Notification Preferences</h1>
          </div>
          <div class="content">
            <h2>Hi ${params.userName},</h2>
            <p>Manage your email notification preferences:</p>
            <div class="option">
              <h4>✉️ Email Notifications</h4>
              <p>Choose what notifications you want to receive via email.</p>
            </div>
            <div class="option">
              <h4>📊 Digest Emails</h4>
              <p>Select daily or weekly digest frequency.</p>
            </div>
            <div class="option">
              <h4>📅 Event Reminders</h4>
              <p>Set when to receive event reminders (24h, 1h, etc.)</p>
            </div>
            <center>
              <a href="${BASE_URL}/settings/notifications" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Manage Preferences
              </a>
            </center>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    params.to,
    '⚙️ Manage Your Notification Preferences',
    html
  );
}
