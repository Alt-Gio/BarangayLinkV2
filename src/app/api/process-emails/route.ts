import { NextResponse } from 'next/server';
import { 
  sendWelcomeEmail, 
  sendTaskAssignedEmail, 
  sendEventReminderEmail,
  sendDigestEmail,
  sendProjectUpdateEmail
} from '@/lib/email';

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job (e.g., Vercel Cron or external service)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CRON_SECRET;

    // Verify the request is from an authorized source
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pending emails from Convex
    const pendingEmails = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'emailNotifications:getPendingEmails',
        args: { limit: 10 }
      })
    }).then(res => res.json());

    const results = [];

    for (const email of pendingEmails) {
      try {
        let result;

        switch (email.type) {
          case 'welcome':
            result = await sendWelcomeEmail({
              to: email.to,
              userName: email.data.userName,
              department: email.data.department,
            });
            break;

          case 'task_assigned':
            result = await sendTaskAssignedEmail({
              to: email.to,
              userName: email.data.userName,
              taskTitle: email.data.taskTitle,
              taskDescription: email.data.taskDescription,
              projectName: email.data.projectName,
              dueDate: email.data.dueDate,
              priority: email.data.priority,
              assignedBy: email.data.assignedBy,
              taskId: email.data.taskId,
            });
            break;

          case 'event_reminder':
            result = await sendEventReminderEmail({
              to: email.to,
              userName: email.data.userName,
              eventTitle: email.data.eventTitle,
              eventDescription: email.data.eventDescription,
              eventDate: email.data.eventDate,
              eventTime: email.data.eventTime,
              location: email.data.location,
              eventId: email.data.eventId,
              hoursUntil: email.data.hoursUntil,
            });
            break;

          case 'digest':
            result = await sendDigestEmail({
              to: email.to,
              userName: email.data.userName,
              period: email.data.period,
              stats: email.data.stats,
              recentActivities: email.data.recentActivities,
              upcomingDeadlines: email.data.upcomingDeadlines,
            });
            break;

          case 'project_update':
            result = await sendProjectUpdateEmail({
              to: email.to,
              userName: email.data.userName,
              projectName: email.data.projectName,
              updateType: email.data.updateType,
              updateDescription: email.data.updateDescription,
              projectId: email.data.projectId,
            });
            break;

          default:
            console.warn(`Unknown email type: ${email.type}`);
            continue;
        }

        if (result.success) {
          // Mark as sent
          await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'emailNotifications:markEmailSent',
              args: { emailId: email._id }
            })
          });

          results.push({ email: email._id, status: 'sent' });
        } else {
          // Mark as failed
          await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'emailNotifications:markEmailFailed',
              args: { 
                emailId: email._id,
                error: result.error?.message || 'Unknown error'
              }
            })
          });

          results.push({ email: email._id, status: 'failed', error: result.error });
        }
      } catch (error: any) {
        console.error(`Error processing email ${email._id}:`, error);
        results.push({ email: email._id, status: 'error', error: error.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      results 
    });

  } catch (error: any) {
    console.error('Error in email processing:', error);
    return NextResponse.json({ 
      error: 'Failed to process emails',
      details: error.message 
    }, { status: 500 });
  }
}
