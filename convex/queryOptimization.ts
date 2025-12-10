import { v } from "convex/values";

export type UserSummary = {
  _id: string;
  name: string;
  imageUrl?: string;
  department?: string;
  position?: string;
};

export type ProjectSummary = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  department: string;
  progress: number;
  startDate: number;
  endDate: number;
  budget?: number;
  spent?: number;
};

export type TaskSummary = {
  _id: string;
  title: string;
  status: string;
  priority?: string;
  storyPoints?: number;
  dueDate?: number;
  assignedTo: any[];
};

export type MessageSummary = {
  _id: string;
  content: string;
  sender: string;
  _creationTime: number;
  readBy: any[];
};

export const conditionalArgs = <T extends Record<string, any>>(
  condition: boolean,
  args: T
): T | "skip" => {
  return condition ? args : "skip";
};

export const createSearchArgs = (searchTerm: string, minLength: number = 2) => {
  return searchTerm.length >= minLength ? { searchTerm } : "skip";
};

export const QUERY_LIMITS = {
  USER_LIST: 50,
  PROJECT_LIST: 30,
  TASK_LIST: 50,
  DASHBOARD_ITEMS: 10,
  RECENT_ACTIVITY: 5,
  CHAT_ROOMS: 50,
  MESSAGES: 50,
  CHAT_SEARCH: 20,
  DROPDOWN: 20,
  AUTOCOMPLETE: 10,
  
  PUBLIC_PROJECTS: 12,
  PUBLIC_EVENTS: 10,
  MAX_SAFE: 100,
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function normalizeLimit(limit?: number, max: number = MAX_PAGE_SIZE): number {
  if (!limit) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, limit), max);
}

export function createPaginationParams(args: { page?: number; limit?: number }) {
  const page = Math.max(1, args.page || 1);
  const limit = normalizeLimit(args.limit);
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

export function extractUserSummary(user: any): UserSummary {
  return {
    _id: user._id,
    name: user.name,
    imageUrl: user.imageUrl,
    department: user.department,
    position: user.position,
  };
}

/**
 * Extract project summary from full project object
 */
export function extractProjectSummary(project: any): ProjectSummary {
  return {
    _id: project._id,
    title: project.title,
    status: project.status,
    priority: project.priority,
    department: project.department,
    progress: project.progress || 0,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: project.budget,
    spent: project.spent,
  };
}

/**
 * Extract task summary from full task object
 */
export function extractTaskSummary(task: any): TaskSummary {
  return {
    _id: task._id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    storyPoints: task.storyPoints,
    dueDate: task.dueDate,
    assignedTo: task.assignedTo || [],
  };
}

// ============================================
// BATCH OPTIMIZATION
// ============================================

/**
 * Batch fetch with limit - prevents over-fetching related data
 * 
 * Example:
 * // BAD: Fetches ALL user levels
 * const usersWithLevels = await Promise.all(users.map(u => getUserLevel(u.userLevelId)));
 * 
 * // GOOD: Limits to displayed items
 * const displayedUsers = users.slice(0, 20);
 * const usersWithLevels = await Promise.all(displayedUsers.map(u => getUserLevel(u.userLevelId)));
 */
export async function batchFetchLimited<T, R>(
  items: T[],
  fetcher: (item: T) => Promise<R>,
  limit: number = 50
): Promise<R[]> {
  const limitedItems = items.slice(0, limit);
  return Promise.all(limitedItems.map(fetcher));
}

/**
 * Deduplicate IDs before batch fetching
 */
export function deduplicateIds(ids: (string | undefined)[]): string[] {
  return Array.from(new Set(ids.filter((id): id is string => !!id)));
}

// ============================================
// USAGE EXAMPLES & DOCUMENTATION
// ============================================

/**
 * EXAMPLE 1: Optimized User List Query
 * 
 * // Before (loads ALL users, ~2-5MB for 1000 users)
 * export const getAllUsers = query({
 *   args: {},
 *   handler: async (ctx) => {
 *     const users = await ctx.db.query("users").collect();
 *     return users; // Returns EVERYTHING
 *   }
 * });
 * 
 * // After (loads 20 users, ~50KB)
 * export const getUsersPaginated = query({
 *   args: { page: v.optional(v.number()), limit: v.optional(v.number()) },
 *   handler: async (ctx, args) => {
 *     const { limit, offset } = createPaginationParams(args);
 *     const users = await ctx.db.query("users")
 *       .order("desc")
 *       .take(limit + offset);
 *     
 *     // Return only displayed items
 *     return users.slice(offset, offset + limit);
 *   }
 * });
 * 
 * BANDWIDTH SAVED: ~95% (2-5MB → 50KB)
 */

/**
 * EXAMPLE 2: Optimized Project List with Field Selection
 * 
 * // Before (loads full projects with all fields)
 * const projects = await ctx.db.query("projects").collect();
 * 
 * // After (loads limited fields for limited items)
 * const projects = await ctx.db.query("projects")
 *   .order("desc")
 *   .take(QUERY_LIMITS.PROJECT_LIST);
 * 
 * return projects.map(extractProjectSummary);
 * 
 * BANDWIDTH SAVED: ~70% (full objects → summaries only)
 */

/**
 * EXAMPLE 3: Conditional Queries (React)
 * 
 * // Before (always loads data)
 * const allUsers = useQuery(api.users.getAll);
 * 
 * // After (only loads when needed)
 * const [showUsers, setShowUsers] = useState(false);
 * const users = useQuery(
 *   api.users.getAll,
 *   showUsers ? { limit: 20 } : "skip"
 * );
 * 
 * BANDWIDTH SAVED: 100% when collapsed (no query made)
 */

export default {
  QUERY_LIMITS,
  normalizeLimit,
  createPaginationParams,
  extractUserSummary,
  extractProjectSummary,
  extractTaskSummary,
  batchFetchLimited,
  deduplicateIds,
  conditionalArgs,
  createSearchArgs,
};
