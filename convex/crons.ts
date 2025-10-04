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

export default crons;
