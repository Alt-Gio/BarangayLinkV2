import { Doc } from "./_generated/dataModel";

export type UserRole = "admin" | "captain" | "manager" | "builder" | "worker";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  captain: 5,
  manager: 3,
  builder: 2,
  worker: 1,
};

export function hasEqualOrHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

export function hasHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export function canAssignTask(assignerRole: UserRole, targetRole: UserRole): boolean {
  if (assignerRole === "admin" || assignerRole === "captain") return true;
  if (assignerRole === "manager") return targetRole === "builder" || targetRole === "worker" || targetRole === "manager";
  if (assignerRole === "builder") return targetRole === "worker" || targetRole === "builder";
  if (assignerRole === "worker") return targetRole === "worker";
  return false;
}

export function canMoveTask(
  userRole: UserRole,
  userId: string,
  task: any,
  targetStatus: string
): { allowed: boolean; reason?: string } {
  if (userRole === "admin" || userRole === "captain") {
    if (task.status === "completed" && task.completedBy) {
      const completedByRole = task.completedByRole;
      if (userId !== task.completedBy && !hasEqualOrHigherRole(userRole, completedByRole)) {
        return { allowed: false, reason: "Only the person who marked this done or higher role can move it" };
      }
    }
    return { allowed: true };
  }
  
  const isAssigned = task.assignedTo?.includes(userId);
  
  if (userRole === "manager") {
    const taskOwnerRole = task.taskOwnerRole;
    if (taskOwnerRole === "builder" || taskOwnerRole === "worker" || isAssigned) {
      if (task.status === "review" && task.lastMovedBy !== userId && !hasHigherRole(userRole, taskOwnerRole)) {
        return { allowed: false, reason: "Task is in review, waiting for approval" };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: "You can only move tasks assigned to you or from your team" };
  }
  
  if (userRole === "builder") {
    if (task.createdBy === userId || isAssigned) {
      if (task.status === "review") {
        return { allowed: false, reason: "Task is in review, waiting for Manager approval" };
      }
      if (targetStatus === "review") return { allowed: true };
      return { allowed: true };
    }
    return { allowed: false, reason: "You can only move your own tasks" };
  }
  
  if (userRole === "worker") {
    if (!isAssigned) return { allowed: false, reason: "You can only move tasks assigned to you" };
    if (task.status === "review") return { allowed: false, reason: "Task is in review, waiting for approval" };
    if (targetStatus === "review") return { allowed: true };
    return { allowed: true };
  }
  
  return { allowed: false, reason: "Insufficient permissions" };
}

export function canEditTask(userRole: UserRole, userId: string, task: any): boolean {
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") return true;
  if (userRole === "builder") return task.createdBy === userId || task.assignedTo?.includes(userId);
  return false;
}

export function canCreateTaskWithStoryPoints(userRole: UserRole, storyPoints: number): { allowed: boolean; reason?: string } {
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") return { allowed: true };
  if (userRole === "builder") {
    if (storyPoints >= 8) return { allowed: false, reason: "Builders cannot create tasks with 8+ story points" };
    return { allowed: true };
  }
  if (userRole === "worker") {
    if (storyPoints > 3) return { allowed: false, reason: "Workers can only create tasks up to 3 story points" };
    return { allowed: true };
  }
  return { allowed: false };
}

export function canManageColumns(userRole: UserRole, action: "add" | "remove"): boolean {
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") return true;
  if (userRole === "builder" && action === "add") return true;
  return false;
}

export function canMarkAsDone(userRole: UserRole, userId: string, task: any): boolean {
  if (userRole === "admin" || userRole === "captain" || userRole === "manager") return true;
  return task.assignedTo?.includes(userId);
}
