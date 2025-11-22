/**
 * Authentication & Authorization Middleware
 * SECURITY: Provides permission checking for Convex mutations and queries
 */

import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Get current authenticated user
 * Throws if not authenticated
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Get current user with their user level
 */
export async function getCurrentUserWithLevel(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  const userLevel = await ctx.db.get(user.userLevel);

  if (!userLevel) {
    throw new Error("User level not found");
  }

  return { user, userLevel };
}

/**
 * Require admin or captain permission
 * Throws if user doesn't have permission
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const { user, userLevel } = await getCurrentUserWithLevel(ctx);

  if (!["ADMIN", "CAPTAIN"].includes(userLevel.name)) {
    throw new Error("Unauthorized: Admin or Captain access required");
  }

  return { user, userLevel };
}

/**
 * Require specific role(s)
 * @param allowedRoles - Array of role names (e.g., ["ADMIN", "MANAGER"])
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: string[]
) {
  const { user, userLevel } = await getCurrentUserWithLevel(ctx);

  if (!allowedRoles.includes(userLevel.name)) {
    throw new Error(
      `Unauthorized: Requires one of: ${allowedRoles.join(", ")}`
    );
  }

  return { user, userLevel };
}

/**
 * Check if user has specific role
 * Returns true/false without throwing
 */
export async function hasRole(
  ctx: QueryCtx | MutationCtx,
  roleName: string
): Promise<boolean> {
  try {
    const { userLevel } = await getCurrentUserWithLevel(ctx);
    return userLevel.name === roleName;
  } catch {
    return false;
  }
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  ctx: QueryCtx | MutationCtx,
  roleNames: string[]
): Promise<boolean> {
  try {
    const { userLevel } = await getCurrentUserWithLevel(ctx);
    return roleNames.includes(userLevel.name);
  } catch {
    return false;
  }
}

/**
 * Require manager or higher
 */
export async function requireManager(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["ADMIN", "CAPTAIN", "MANAGER"]);
}

/**
 * Require builder or higher
 */
export async function requireBuilder(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["ADMIN", "CAPTAIN", "MANAGER", "BUILDER"]);
}

/**
 * Check if user is owner or admin
 * Used for checking resource ownership
 */
export async function canModifyResource(
  ctx: QueryCtx | MutationCtx,
  resourceOwnerId: string
): Promise<boolean> {
  try {
    const { user, userLevel } = await getCurrentUserWithLevel(ctx);
    
    // Admins and Captains can modify anything
    if (["ADMIN", "CAPTAIN"].includes(userLevel.name)) {
      return true;
    }
    
    // Otherwise, must be the owner
    return user._id === resourceOwnerId;
  } catch {
    return false;
  }
}
