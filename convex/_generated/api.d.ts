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
import type * as achievements from "../achievements.js";
import type * as activity from "../activity.js";
import type * as adminActions from "../adminActions.js";
import type * as adminUserManagement from "../adminUserManagement.js";
import type * as analytics from "../analytics.js";
import type * as attendance from "../attendance.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auditSystem from "../auditSystem.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as certificateRequests from "../certificateRequests.js";
import type * as certificates from "../certificates.js";
import type * as clerk from "../clerk.js";
import type * as collaboration from "../collaboration.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as dailyDigest from "../dailyDigest.js";
import type * as dashboards from "../dashboards.js";
import type * as databaseManager from "../databaseManager.js";
import type * as deadlineReminderActions from "../deadlineReminderActions.js";
import type * as deadlineReminders from "../deadlineReminders.js";
import type * as departments from "../departments.js";
import type * as documentTagging from "../documentTagging.js";
import type * as documentVersions from "../documentVersions.js";
import type * as documents from "../documents.js";
import type * as emailNotifications from "../emailNotifications.js";
import type * as emailService from "../emailService.js";
import type * as emails from "../emails.js";
import type * as eventAttendees from "../eventAttendees.js";
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
import type * as households from "../households.js";
import type * as http from "../http.js";
import type * as importCalendar from "../importCalendar.js";
import type * as integrations_eventTaskProjectSync from "../integrations/eventTaskProjectSync.js";
import type * as invitationCodes from "../invitationCodes.js";
import type * as invitations from "../invitations.js";
import type * as kanbanColumns from "../kanbanColumns.js";
import type * as landingPage from "../landingPage.js";
import type * as landmarks from "../landmarks.js";
import type * as liveblocks from "../liveblocks.js";
import type * as mapManagement from "../mapManagement.js";
import type * as messaging from "../messaging.js";
import type * as messagingExtended from "../messagingExtended.js";
import type * as messengerWebhook from "../messengerWebhook.js";
import type * as migrateData from "../migrateData.js";
import type * as migrations_migrateTasksAssignedTo from "../migrations/migrateTasksAssignedTo.js";
import type * as migrations from "../migrations.js";
import type * as milestones from "../milestones.js";
import type * as notificationSystem from "../notificationSystem.js";
import type * as notifications from "../notifications.js";
import type * as otp from "../otp.js";
import type * as pagination from "../pagination.js";
import type * as performanceOptimization from "../performanceOptimization.js";
import type * as permissions from "../permissions.js";
import type * as presence from "../presence.js";
import type * as productivity from "../productivity.js";
import type * as projectBudget from "../projectBudget.js";
import type * as projectExpenses from "../projectExpenses.js";
import type * as projectFeedback from "../projectFeedback.js";
import type * as projectProgressMigration from "../projectProgressMigration.js";
import type * as projects from "../projects.js";
import type * as publicStats from "../publicStats.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as queryOptimization from "../queryOptimization.js";
import type * as quickActions from "../quickActions.js";
import type * as residents from "../residents.js";
import type * as roleBasedAccess from "../roleBasedAccess.js";
import type * as search from "../search.js";
import type * as securitySettings from "../securitySettings.js";
import type * as seedData from "../seedData.js";
import type * as seedLandmarks from "../seedLandmarks.js";
import type * as services_activityService from "../services/activityService.js";
import type * as services_gamificationService from "../services/gamificationService.js";
import type * as services_notificationService from "../services/notificationService.js";
import type * as siteSettings from "../siteSettings.js";
import type * as sprints from "../sprints.js";
import type * as sprintsEnhanced from "../sprintsEnhanced.js";
import type * as storyPointGamification from "../storyPointGamification.js";
import type * as taskNotifications from "../taskNotifications.js";
import type * as tasks from "../tasks.js";
import type * as teamStats from "../teamStats.js";
import type * as teamWorkload from "../teamWorkload.js";
import type * as userApproval from "../userApproval.js";
import type * as userLevels from "../userLevels.js";
import type * as userSessions from "../userSessions.js";
import type * as userStats from "../userStats.js";
import type * as users from "../users.js";
import type * as voiceAssistant from "../voiceAssistant.js";
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
  achievements: typeof achievements;
  activity: typeof activity;
  adminActions: typeof adminActions;
  adminUserManagement: typeof adminUserManagement;
  analytics: typeof analytics;
  attendance: typeof attendance;
  auditLogs: typeof auditLogs;
  auditSystem: typeof auditSystem;
  auth: typeof auth;
  backup: typeof backup;
  certificateRequests: typeof certificateRequests;
  certificates: typeof certificates;
  clerk: typeof clerk;
  collaboration: typeof collaboration;
  comments: typeof comments;
  crons: typeof crons;
  dailyDigest: typeof dailyDigest;
  dashboards: typeof dashboards;
  databaseManager: typeof databaseManager;
  deadlineReminderActions: typeof deadlineReminderActions;
  deadlineReminders: typeof deadlineReminders;
  departments: typeof departments;
  documentTagging: typeof documentTagging;
  documentVersions: typeof documentVersions;
  documents: typeof documents;
  emailNotifications: typeof emailNotifications;
  emailService: typeof emailService;
  emails: typeof emails;
  eventAttendees: typeof eventAttendees;
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
  households: typeof households;
  http: typeof http;
  importCalendar: typeof importCalendar;
  "integrations/eventTaskProjectSync": typeof integrations_eventTaskProjectSync;
  invitationCodes: typeof invitationCodes;
  invitations: typeof invitations;
  kanbanColumns: typeof kanbanColumns;
  landingPage: typeof landingPage;
  landmarks: typeof landmarks;
  liveblocks: typeof liveblocks;
  mapManagement: typeof mapManagement;
  messaging: typeof messaging;
  messagingExtended: typeof messagingExtended;
  messengerWebhook: typeof messengerWebhook;
  migrateData: typeof migrateData;
  "migrations/migrateTasksAssignedTo": typeof migrations_migrateTasksAssignedTo;
  migrations: typeof migrations;
  milestones: typeof milestones;
  notificationSystem: typeof notificationSystem;
  notifications: typeof notifications;
  otp: typeof otp;
  pagination: typeof pagination;
  performanceOptimization: typeof performanceOptimization;
  permissions: typeof permissions;
  presence: typeof presence;
  productivity: typeof productivity;
  projectBudget: typeof projectBudget;
  projectExpenses: typeof projectExpenses;
  projectFeedback: typeof projectFeedback;
  projectProgressMigration: typeof projectProgressMigration;
  projects: typeof projects;
  publicStats: typeof publicStats;
  pushNotifications: typeof pushNotifications;
  queryOptimization: typeof queryOptimization;
  quickActions: typeof quickActions;
  residents: typeof residents;
  roleBasedAccess: typeof roleBasedAccess;
  search: typeof search;
  securitySettings: typeof securitySettings;
  seedData: typeof seedData;
  seedLandmarks: typeof seedLandmarks;
  "services/activityService": typeof services_activityService;
  "services/gamificationService": typeof services_gamificationService;
  "services/notificationService": typeof services_notificationService;
  siteSettings: typeof siteSettings;
  sprints: typeof sprints;
  sprintsEnhanced: typeof sprintsEnhanced;
  storyPointGamification: typeof storyPointGamification;
  taskNotifications: typeof taskNotifications;
  tasks: typeof tasks;
  teamStats: typeof teamStats;
  teamWorkload: typeof teamWorkload;
  userApproval: typeof userApproval;
  userLevels: typeof userLevels;
  userSessions: typeof userSessions;
  userStats: typeof userStats;
  users: typeof users;
  voiceAssistant: typeof voiceAssistant;
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
