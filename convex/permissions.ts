import { Doc } from "./_generated/dataModel";

/**
 * Role hierarchy and permissions for kanban board
 */

export type UserRole = "admin" | "captain" | "manager" | "builder" | "worker";

// Role hierarchy (higher number = more authority)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  captain: 5,
  manager: 3,
  builder: 2,
  worker: 1,
};

/**
 * Check if user has equal or higher role
 */
export function hasEqualOrHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Check if user has higher role (not equal)
 */
export function hasHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if user can assign task to target user
 */
export function canAssignTask(assignerRole: UserRole, targetRole: UserRole): boolean {
  // Admin/Captain can assign to anyone
  if (assignerRole === "admin" || assignerRole === "captain") {
    return true;
  }
  
  // Manager can assign to Builder and Worker
  if (assignerRole === "manager") {
    return targetRole === "builder" || targetRole === "worker" || targetRole === "manager";
  }
  
  // Builder can assign to Worker only (and minimal tasks to Manager)
  if (assignerRole === "builder") {
    return targetRole === "worker" || targetRole === "builder";
  }
  
  // Worker can only assign to themselves
  if (assignerRole === "worker") {
    return targetRole === "worker";
  }
  
  return false;
}

/**
 * Check if user can move a task
 */
export function canMoveTask(
  userRole: UserRole,
  userId: string,
  task: any,
  targetStatus: string
): { allowed: boolean; reason?: string } {
  // Admin/Captain can move any task
  if (userRole === "admin" || userRole === "captain") {
    // But if task is in DONE and marked by someone, only they or higher can move it
    if (task.status === "completed" && task.completedBy) {
      const completedByRole = task.completedByRole; // We'll need to fetch this
      if (userId !== task.completedBy && !hasEqualOrHigherRole(userRole, completedByRole)) {
        return { allowed: false, reason: "Only the person who marked this done or higher role can move it" };
      }
    }
    return { allowed: true };
  }
  
  // Check if task is assigned to user
  const isAssigned = task.assignedTo?.includes(userId);
  
  // Manager can move Builder/Worker tasks
  if (userRole === "manager") {
    const taskOwnerRole = task.taskOwnerRole; // We'll need to fetch this
    if (taskOwnerRole === "builder" || taskOwnerRole === "worker" || isAssigned) {
      // Cannot move from review if they didn't put it there
      if (task.status === "review" && task.lastMovedBy !== userId && !hasHigherRole(userRole, taskOwnerRole)) {
        return { allowed: false, reason: "Task is in review, waiting for approval" };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: "You can only move tasks assigned to you or from your team" };
  }
  
  // Builder can move their own tasks and Worker tasks they assigned
  if (userRole === "builder") {
    if (task.createdBy === userId || isAssigned) {
      // Cannot move from review once placed there
      if (task.status === "review") {
        return { allowed: false, reason: "Task is in review, waiting for Manager approval" };
      }
      // Can only move to review, not from review
      if (targetStatus === "review") {
        return { allowed: true };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: "You can only move your own tasks" };
  }
  
  // Worker can only move their assigned tasks
  if (userRole === "worker") {
    if (!isAssigned) {
      return { allowed: false, reason: "You can only move tasks assigned to you" };
    }
    // Cannot move from review once placed there
    if (task.status === "review") {
      return { allowed: false, reason: "Task is in review, waiting for approval" };
    }
    // Can move to review
    if (targetStatus === "review") {
      return { allowed: true };
    }
    return { allowed: true };
  }
  
  return { allowed: false, reason: "Insufficient permissions" };
}

/**
 * Check if user can edit a task
 */
export function canEditTask(
  userRole: UserRole,
  userId: string,
  task: any
): boolean {
  // Admin/Captain/Manager can edit any task
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") {
    return true;
  }
  
  // Builder can only edit their own tasks
  if (userRole === "builder") {
    return task.createdBy === userId || task.assignedTo?.includes(userId);
  }
  
  // Worker cannot edit tasks
  if (userRole === "worker") {
    return false;
  }
  
  return false;
}

/**
 * Check if user can create task with given story points
 */
export function canCreateTaskWithStoryPoints(
  userRole: UserRole,
  storyPoints: number
): { allowed: boolean; reason?: string } {
  // Admin/Captain/Manager can create any size task
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") {
    return { allowed: true };
  }
  
  // Builder cannot create high story point tasks (8+)
  if (userRole === "builder") {
    if (storyPoints >= 8) {
      return { allowed: false, reason: "Builders cannot create tasks with 8+ story points" };
    }
    return { allowed: true };
  }
  
  // Worker can only create simple tasks (up to 3 points)
  if (userRole === "worker") {
    if (storyPoints > 3) {
      return { allowed: false, reason: "Workers can only create tasks up to 3 story points" };
    }
    return { allowed: true };
  }
  
  return { allowed: false };
}

/**
 * Check if user can add/remove columns
 */
export function canManageColumns(userRole: UserRole, action: "add" | "remove"): boolean {
  // Admin/Captain/Manager can add and remove
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") {
    return true;
  }
  
  // Builder can only add
  if (userRole === "builder" && action === "add") {
    return true;
  }
  
  return false;
}

/**
 * Check if user can mark task as done/checked
 */
export function canMarkAsDone(
  userRole: UserRole,
  userId: string,
  task: any
): boolean {
  // Admin/Captain/Manager can mark any task as done
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") {
    return true;
  }
  
  // Builder/Worker can mark their own tasks as done
  return task.assignedTo?.includes(userId);
}
