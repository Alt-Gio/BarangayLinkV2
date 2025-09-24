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
import type * as clerkSync from "../clerkSync.js";
import type * as collaboration from "../collaboration.js";
import type * as dashboards from "../dashboards.js";
import type * as databaseManager from "../databaseManager.js";
import type * as events from "../events.js";
import type * as gamifiedTasks from "../gamifiedTasks.js";
import type * as init from "../init.js";
import type * as liveblocks from "../liveblocks.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as productivity from "../productivity.js";
import type * as projects from "../projects.js";
import type * as roleBasedAccess from "../roleBasedAccess.js";
import type * as roleBasedQueries from "../roleBasedQueries.js";
import type * as sampleData from "../sampleData.js";
import type * as seedData from "../seedData.js";
import type * as testUser from "../testUser.js";
import type * as userLevels from "../userLevels.js";
import type * as userSessions from "../userSessions.js";
import type * as users from "../users.js";
import type * as users_backup_disabled from "../users_backup_disabled.js";
import type * as users_fixed from "../users_fixed.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  clerkSync: typeof clerkSync;
  collaboration: typeof collaboration;
  dashboards: typeof dashboards;
  databaseManager: typeof databaseManager;
  events: typeof events;
  gamifiedTasks: typeof gamifiedTasks;
  init: typeof init;
  liveblocks: typeof liveblocks;
  messages: typeof messages;
  notifications: typeof notifications;
  productivity: typeof productivity;
  projects: typeof projects;
  roleBasedAccess: typeof roleBasedAccess;
  roleBasedQueries: typeof roleBasedQueries;
  sampleData: typeof sampleData;
  seedData: typeof seedData;
  testUser: typeof testUser;
  userLevels: typeof userLevels;
  userSessions: typeof userSessions;
  users: typeof users;
  users_backup_disabled: typeof users_backup_disabled;
  users_fixed: typeof users_fixed;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
