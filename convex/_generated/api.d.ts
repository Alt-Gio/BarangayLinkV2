/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as achievementNotifications from "../achievementNotifications.js";
import type * as activity from "../activity.js";
import type * as adminUserManagement from "../adminUserManagement.js";
import type * as auditSystem from "../auditSystem.js";
import type * as backup from "../backup.js";
import type * as clerk from "../clerk.js";
import type * as collaboration from "../collaboration.js";
import type * as crons from "../crons.js";
import type * as dailyDigest from "../dailyDigest.js";
import type * as dashboards from "../dashboards.js";
import type * as databaseManager from "../databaseManager.js";
import type * as deadlineReminderActions from "../deadlineReminderActions.js";
import type * as deadlineReminders from "../deadlineReminders.js";
import type * as departments from "../departments.js";
import type * as documents from "../documents.js";
import type * as emailNotifications from "../emailNotifications.js";
import type * as emails from "../emails.js";
import type * as eventControl from "../eventControl.js";
import type * as eventReminders from "../eventReminders.js";
import type * as eventTaskAssignments from "../eventTaskAssignments.js";
import type * as eventTaskProgressSync from "../eventTaskProgressSync.js";
import type * as eventTaskTimeTracking from "../eventTaskTimeTracking.js";
import type * as events from "../events.js";
import type * as expenses from "../expenses.js";
import type * as facebook from "../facebook.js";
import type * as gamifiedTasks from "../gamifiedTasks.js";
import type * as habits from "../habits.js";
import type * as http from "../http.js";
import type * as liveblocks from "../liveblocks.js";
import type * as messaging from "../messaging.js";
import type * as messengerWebhook from "../messengerWebhook.js";
import type * as migrateData from "../migrateData.js";
import type * as migrations_migrateTasksAssignedTo from "../migrations/migrateTasksAssignedTo.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as pagination from "../pagination.js";
import type * as presence from "../presence.js";
import type * as productivity from "../productivity.js";
import type * as projects from "../projects.js";
import type * as publicStats from "../publicStats.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as quickActions from "../quickActions.js";
import type * as roleBasedAccess from "../roleBasedAccess.js";
import type * as search from "../search.js";
import type * as seedData from "../seedData.js";
import type * as sprints from "../sprints.js";
import type * as sprintsEnhanced from "../sprintsEnhanced.js";
import type * as storyPointGamification from "../storyPointGamification.js";
import type * as tasks from "../tasks.js";
import type * as teamStats from "../teamStats.js";
import type * as userApproval from "../userApproval.js";
import type * as userLevels from "../userLevels.js";
import type * as userSessions from "../userSessions.js";
import type * as users from "../users.js";
import type * as workTimerNotifications from "../workTimerNotifications.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  achievementNotifications: typeof achievementNotifications;
  activity: typeof activity;
  adminUserManagement: typeof adminUserManagement;
  auditSystem: typeof auditSystem;
  backup: typeof backup;
  clerk: typeof clerk;
  collaboration: typeof collaboration;
  crons: typeof crons;
  dailyDigest: typeof dailyDigest;
  dashboards: typeof dashboards;
  databaseManager: typeof databaseManager;
  deadlineReminderActions: typeof deadlineReminderActions;
  deadlineReminders: typeof deadlineReminders;
  departments: typeof departments;
  documents: typeof documents;
  emailNotifications: typeof emailNotifications;
  emails: typeof emails;
  eventControl: typeof eventControl;
  eventReminders: typeof eventReminders;
  eventTaskAssignments: typeof eventTaskAssignments;
  eventTaskProgressSync: typeof eventTaskProgressSync;
  eventTaskTimeTracking: typeof eventTaskTimeTracking;
  events: typeof events;
  expenses: typeof expenses;
  facebook: typeof facebook;
  gamifiedTasks: typeof gamifiedTasks;
  habits: typeof habits;
  http: typeof http;
  liveblocks: typeof liveblocks;
  messaging: typeof messaging;
  messengerWebhook: typeof messengerWebhook;
  migrateData: typeof migrateData;
  "migrations/migrateTasksAssignedTo": typeof migrations_migrateTasksAssignedTo;
  migrations: typeof migrations;
  notifications: typeof notifications;
  pagination: typeof pagination;
  presence: typeof presence;
  productivity: typeof productivity;
  projects: typeof projects;
  publicStats: typeof publicStats;
  pushNotifications: typeof pushNotifications;
  quickActions: typeof quickActions;
  roleBasedAccess: typeof roleBasedAccess;
  search: typeof search;
  seedData: typeof seedData;
  sprints: typeof sprints;
  sprintsEnhanced: typeof sprintsEnhanced;
  storyPointGamification: typeof storyPointGamification;
  tasks: typeof tasks;
  teamStats: typeof teamStats;
  userApproval: typeof userApproval;
  userLevels: typeof userLevels;
  userSessions: typeof userSessions;
  users: typeof users;
  workTimerNotifications: typeof workTimerNotifications;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
