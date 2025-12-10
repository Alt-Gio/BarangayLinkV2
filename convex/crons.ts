import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup old sessions",
  { hourUTC: 2, minuteUTC: 0 }, // 2:00 AM UTC
  internal.auditSystem.cleanupOldSessions,
  { daysToKeep: 90 } // Keep 90 days of session data
);

crons.weekly(
  "cleanup old audit logs",
  { hourUTC: 3, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.auditSystem.cleanupOldAuditLogs,
  { daysToKeep: 180 } // Keep 180 days of audit logs
);

crons.hourly(
  "cleanup stale sessions",
  { minuteUTC: 30 }, // Run at :30 past each hour
  internal.auditSystem.cleanupStaleSessions
);

crons.hourly(
  "check task deadlines",
  { minuteUTC: 0 }, // Run at the top of every hour
  internal.deadlineReminderActions.checkTaskDeadlines
);

crons.daily(
  "check project deadlines",
  { hourUTC: 9, minuteUTC: 0 }, // 9:00 AM UTC
  internal.deadlineReminderActions.checkProjectDeadlines
);

crons.daily(
  "send daily digest",
  { hourUTC: 0, minuteUTC: 0 }, // 8:00 AM PHT = 0:00 UTC (next day)
  internal.dailyDigest.sendDailyDigestToAll
);

crons.hourly(
  "check overdue tasks",
  { minuteUTC: 15 }, // Run at :15 past each hour
  internal.taskNotifications.checkOverdueTasks
);

crons.hourly(
  "security: auto-fix missing roles",
  { minuteUTC: 5 }, // Run at :05 past each hour
  internal.migrations.autoFixMissingRoles
);

crons.daily(
  "update user statistics",
  { hourUTC: 22, minuteUTC: 0 }, // 6:00 AM PHT = 22:00 UTC (previous day)
  internal.userStats.recalculateAllUserStatsInternal
);

export default crons;
