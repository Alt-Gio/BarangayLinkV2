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
import type * as adminUserManagement from "../adminUserManagement.js";
import type * as auditSystem from "../auditSystem.js";
import type * as backup from "../backup.js";
import type * as clerk from "../clerk.js";
import type * as collaboration from "../collaboration.js";
import type * as crons from "../crons.js";
import type * as dashboards from "../dashboards.js";
import type * as databaseManager from "../databaseManager.js";
import type * as departments from "../departments.js";
import type * as documents from "../documents.js";
import type * as emailNotifications from "../emailNotifications.js";
import type * as events from "../events.js";
import type * as gamifiedTasks from "../gamifiedTasks.js";
import type * as http from "../http.js";
import type * as liveblocks from "../liveblocks.js";
import type * as messaging from "../messaging.js";
import type * as notifications from "../notifications.js";
import type * as pagination from "../pagination.js";
import type * as presence from "../presence.js";
import type * as productivity from "../productivity.js";
import type * as projects from "../projects.js";
import type * as publicStats from "../publicStats.js";
import type * as roleBasedAccess from "../roleBasedAccess.js";
import type * as search from "../search.js";
import type * as seedData from "../seedData.js";
import type * as tasks from "../tasks.js";
import type * as userLevels from "../userLevels.js";
import type * as userSessions from "../userSessions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminUserManagement: typeof adminUserManagement;
  auditSystem: typeof auditSystem;
  backup: typeof backup;
  clerk: typeof clerk;
  collaboration: typeof collaboration;
  crons: typeof crons;
  dashboards: typeof dashboards;
  databaseManager: typeof databaseManager;
  departments: typeof departments;
  documents: typeof documents;
  emailNotifications: typeof emailNotifications;
  events: typeof events;
  gamifiedTasks: typeof gamifiedTasks;
  http: typeof http;
  liveblocks: typeof liveblocks;
  messaging: typeof messaging;
  notifications: typeof notifications;
  pagination: typeof pagination;
  presence: typeof presence;
  productivity: typeof productivity;
  projects: typeof projects;
  publicStats: typeof publicStats;
  roleBasedAccess: typeof roleBasedAccess;
  search: typeof search;
  seedData: typeof seedData;
  tasks: typeof tasks;
  userLevels: typeof userLevels;
  userSessions: typeof userSessions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
