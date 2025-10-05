import { Resend } from 'resend';
import { renderToString } from 'react-dom/server';
import { WelcomeEmail } from '@/emails/templates/WelcomeEmail';
import { TaskAssignedEmail } from '@/emails/templates/TaskAssignedEmail';
import { EventReminderEmail } from '@/emails/templates/EventReminderEmail';
import { DigestEmail } from '@/emails/templates/DigestEmail';
import React from 'react';

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
  const html = renderToString(
    React.createElement(WelcomeEmail, {
      userName: params.userName,
      userEmail: params.to,
      department: params.department,
      dashboardUrl: `${BASE_URL}/dashboard`,
    })
  );

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
  const html = renderToString(
    React.createElement(TaskAssignedEmail, {
      userName: params.userName,
      taskTitle: params.taskTitle,
      taskDescription: params.taskDescription,
      projectName: params.projectName,
      dueDate: params.dueDate,
      priority: params.priority,
      assignedBy: params.assignedBy,
      taskUrl: `${BASE_URL}/tasks/my-tasks?taskId=${params.taskId}`,
    })
  );

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
  const html = renderToString(
    React.createElement(EventReminderEmail, {
      userName: params.userName,
      eventTitle: params.eventTitle,
      eventDescription: params.eventDescription,
      eventDate: params.eventDate,
      eventTime: params.eventTime,
      location: params.location,
      eventUrl: `${BASE_URL}/events?eventId=${params.eventId}`,
      hoursUntil: params.hoursUntil,
    })
  );

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
  const html = renderToString(
    React.createElement(DigestEmail, {
      userName: params.userName,
      period: params.period,
      stats: params.stats,
      recentActivities: params.recentActivities,
      upcomingDeadlines: params.upcomingDeadlines,
      dashboardUrl: `${BASE_URL}/dashboard`,
    })
  );

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
