# Role-Based Access Control (RBAC) System

## Overview

BarangayLink v2 implements a comprehensive 4-tier role-based access control system designed specifically for barangay operations. The system enforces strict data access and operation permissions based on user roles within the organizational hierarchy.

## Role Hierarchy

```
ADMIN (Level 4)    - System Administrator
    ↓
MANAGER (Level 3)  - Department Head
    ↓
BUILDER (Level 2)  - Project Creator
    ↓
WORKER (Level 1)   - Task Executor
```

## Files Structure

### Core RBAC Files
- `convex/roleBasedAccess.ts` - Main access control functions and permissions
- `convex/roleBasedQueries.ts` - Role-specific data queries
- `convex/productivity.ts` - Updated with role validation (legacy compatibility)

### Helper Functions
- `getCurrentUser(ctx)` - Gets authenticated user with role information
- `checkPermission(ctx, roles[])` - Validates user has required role
- `checkDepartmentAccess(user, department)` - Validates department access

## Role Capabilities

### ADMIN Role (Level 4) - System Administrator

**What they can CREATE:**
- New user levels and permissions
- System-wide configurations
- All projects in any department
- Events across all departments
- Promote/demote user roles

**What they can VIEW/MANAGE:**
- All projects across all departments
- All users and their roles
- System-wide analytics and financials
- All notifications and activities
- Complete user management
- Department statistics

**Key Functions:**
```typescript
// Create new user levels
createUserLevel({ name, level, permissions, description })

// Change user roles
changeUserRole({ userId, newUserLevelId })

// Get system analytics
getSystemAnalytics()
```

### MANAGER Role (Level 3) - Department Head

**What they can CREATE:**
- Events in their department
- Approve/reject project proposals
- Assign users to projects in their department

**What they can VIEW/MANAGE:**
- All projects in their department
- All users in their department
- Approve/reject project proposals from BUILDERs
- Department analytics and budget overview
- Assign BUILDERs to projects

**Key Functions:**
```typescript
// Approve or reject projects
approveProject({ projectId, approved, comments })

// Create events
createEvent({ title, description, type, startDate, endDate, department })

// Assign users to projects
assignUserToProject({ projectId, userId })
```

**Access Restrictions:**
- Can only manage projects in their assigned department
- Cannot access other departments' data
- Cannot create/modify user roles

### BUILDER Role (Level 2) - Project Creator

**What they can CREATE:**
- Projects in their department (requires MANAGER approval)
- Tasks within their projects
- Assign tasks to WORKERs in their department

**What they can VIEW/MANAGE:**
- Projects they created
- Tasks within their projects
- WORKERs assigned to their projects
- Create project templates

**Key Functions:**
```typescript
// Create projects (needs approval)
createProjectWithApproval({ title, description, department, startDate, endDate, budget })

// Assign tasks to workers
assignTaskToWorker({ taskId, workerId })
```

**Access Restrictions:**
- Projects created with "planning" status (needs MANAGER approval)
- Can only create projects in their department
- Can only assign tasks to WORKERs in their department
- Cannot modify projects created by others

### WORKER Role (Level 1) - Task Executor

**What they can DO:**
- Update status of tasks assigned to them
- Join/leave events
- View their task progress and gamification stats

**What they can VIEW:**
- Only tasks assigned to them
- Projects they're involved in
- Community events they can join
- Their own progress and achievements

**Key Functions:**
```typescript
// Update task status (own tasks only)
updateMyTaskStatus({ taskId, status, actualHours })

// Join/leave events
joinEvent({ eventId })
leaveEvent({ eventId })
```

**Access Restrictions:**
- Can only update tasks assigned to them
- Cannot create projects or tasks
- Cannot assign tasks to others
- Limited view of system data

## Role-Based Queries

### Data Access Patterns

```typescript
// Get projects based on role
getMyProjects({ status?, limit? })
// ADMIN: All projects
// MANAGER: Department projects
// BUILDER: Own projects
// WORKER: Assigned projects

// Get tasks based on role  
getMyTasks({ status?, projectId?, limit? })
// ADMIN: All tasks
// MANAGER: Department tasks
// BUILDER: Own created tasks
// WORKER: Assigned tasks

// Get analytics based on role
getRoleBasedAnalytics()
// ADMIN: System-wide data
// MANAGER: Department data
// BUILDER: Own project data
// WORKER: Personal stats + gamification
```

### Team Access

```typescript
// Get team members based on role
getTeamMembers({ department?, role? })
// ADMIN: All users
// MANAGER: Department users
// BUILDER: Department workers only
// WORKER: Department workers only
```

## Workflow Examples

### Project Creation Workflow

1. **BUILDER creates project:**
   - Status: "planning" (needs approval)
   - Notification sent to department MANAGER

2. **MANAGER reviews project:**
   - Can approve (status → "active") or reject (status → "cancelled")
   - Notification sent back to BUILDER

3. **ADMIN override:**
   - Can create projects directly as "active"
   - No approval needed

### Task Assignment Workflow

1. **BUILDER/MANAGER creates task:**
   - Can assign to WORKERs in their department
   - Notification sent to assigned WORKER

2. **WORKER updates task:**
   - Can change status: todo → in_progress → review → completed
   - XP and gold awarded on completion
   - Notification sent to task creator

### Department Access Control

```typescript
// Department validation
checkDepartmentAccess(currentUser, targetDepartment)
// ADMIN: Access all departments
// Others: Only their assigned department
```

## Security Features

### Authentication Flow
1. Clerk authentication provides user identity
2. `getCurrentUser()` retrieves user + role from Convex
3. `checkPermission()` validates required role access
4. Department access validated for non-ADMIN roles

### Error Handling
- Clear error messages for permission denials
- Automatic logging of access attempts
- Graceful fallbacks for unauthorized access

### Data Isolation
- Strict query filtering based on user role
- Department-based data segregation
- No cross-department data leakage

## Integration with Existing Systems

### Dashboard Integration
- Role-specific dashboard components
- Dynamic query loading based on permissions
- Real-time updates with role validation

### Notification System
- Role-based notification targeting
- Workflow notifications (approvals, assignments)
- Achievement notifications for gamification

### Gamification System
- XP/gold rewards for task completion
- Role-based achievement tracking
- Leaderboards with appropriate access levels

## Migration from Legacy System

### Backward Compatibility
- Original `productivity.ts` functions updated with role validation
- Gradual migration to new `roleBasedQueries.ts` functions
- Legacy functions marked as deprecated

### Database Schema
- Leverages existing `userLevels` and `users` tables
- No schema changes required
- Maintains existing relationships

## Usage Examples

### Basic Role Check
```typescript
// In any mutation/query
const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN"]);
```

### Department-Specific Query
```typescript
// MANAGER viewing department projects
const projects = await getMyProjects({ status: "active" });
// Automatically filtered to their department
```

### Cross-Role Assignment
```typescript
// BUILDER assigning task to WORKER
await assignTaskToWorker({ taskId, workerId });
// Validates both users are in same department
```

## Error Messages

- `"Access denied. Required role: MANAGER or ADMIN"`
- `"Access denied. You can only access your department's data"`
- `"You can only update tasks assigned to you"`
- `"BUILDERs can only create tasks in projects they created"`
- `"Can only assign tasks to WORKER role users"`

## Best Practices

1. **Always use role-based queries** instead of raw database queries
2. **Check permissions early** in function handlers
3. **Validate department access** for non-ADMIN operations
4. **Use descriptive error messages** for better UX
5. **Log security events** for audit trails
6. **Test all permission combinations** thoroughly

## Future Enhancements

- Fine-grained permission system beyond roles
- Temporary role assignments
- Multi-department user support
- Role-based UI component rendering
- Advanced audit logging and reporting

---

This RBAC system provides enterprise-level security while maintaining the collaborative nature required for effective barangay operations.
