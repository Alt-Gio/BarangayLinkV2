/**
 * CONVEX SCHEDULED JOBS (CRONS)
 * 
 * Automated maintenance tasks to keep the database lean and efficient
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Cleanup old sessions every day at 2 AM
crons.daily(
  "cleanup old sessions",
  { hourUTC: 2, minuteUTC: 0 }, // 2:00 AM UTC
  internal.auditSystem.cleanupOldSessions,
  { daysToKeep: 90 } // Keep 90 days of session data
);

// Cleanup old audit logs every week on Sunday at 3 AM
crons.weekly(
  "cleanup old audit logs",
  { hourUTC: 3, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.auditSystem.cleanupOldAuditLogs,
  { daysToKeep: 180 } // Keep 180 days of audit logs
);

// Cleanup stale sessions (inactive for > 24 hours) every hour
crons.hourly(
  "cleanup stale sessions",
  { minuteUTC: 30 }, // Run at :30 past each hour
  internal.auditSystem.cleanupStaleSessions
);

// Check for upcoming task deadlines every hour
crons.hourly(
  "check task deadlines",
  { minuteUTC: 0 }, // Run at the top of every hour
  internal.deadlineReminderActions.checkTaskDeadlines
);

// Check for upcoming project deadlines daily at 9 AM
crons.daily(
  "check project deadlines",
  { hourUTC: 9, minuteUTC: 0 }, // 9:00 AM UTC
  internal.deadlineReminderActions.checkProjectDeadlines
);

// Send daily digest to all users at 8 AM Philippine Time (midnight UTC)
crons.daily(
  "send daily digest",
  { hourUTC: 0, minuteUTC: 0 }, // 8:00 AM PHT = 0:00 UTC (next day)
  internal.dailyDigest.sendDailyDigestToAll
);

export default crons;
