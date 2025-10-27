# ✅ Role-Based Permission System - Implementation Status

**Date:** October 27, 2025  
**Status:** 🚧 PHASE 1 COMPLETE - PHASE 2 PENDING  

---

## ✅ **Phase 1: Foundation (COMPLETED)**

### **1. Database Schema ✅**
- Added `completedBy` field to track who marked task as done
- Added `checkedBy` field to track who approved the task
- Added `workingOnIt` field to track who's currently working
- Added `workingOnItStartedAt` field to track when they started

**File:** `convex/schema.ts`

### **2. Permission System ✅**
- Created comprehensive role hierarchy (Admin/Captain/Manager/Builder/Worker)
- Implemented `canAssignTask()` function
- Implemented `canMoveTask()` function with reasons
- Implemented `canEditTask()` function
- Implemented `canCreateTaskWithStoryPoints()` function
- Implemented `canManageColumns()` function

**File:** `convex/permissions.ts`

### **3. "Working On It" Feature ✅**
- Created `toggleWorkingOnIt` mutation
- Added button to task cards
- Shows visual indicator (animated wrench icon)
- Only shows on In Progress and custom columns
- Displays "You" or "Working" based on who's working
- Button states: "Start Working" / "Stop Working"

**Files:** 
- `convex/tasks.ts` (mutation)
- `src/app/milestones/[id]/kanban/page.tsx` (UI)

### **4. Documentation ✅**
- Complete role-based permission guide
- Permission matrix for all roles
- Task assignment rules
- Task movement rules
- Column management rules
- Working On It feature guide

**File:** `ROLE_BASED_PERMISSIONS.md`

---

## 🚧 **Phase 2: Integration (PENDING)**

### **What Still Needs to Be Done:**

### **1. User Role Storage 🚧**

**Need to add:**
```typescript
// In convex/schema.ts - users table
role: v.union(
  v.literal("admin"),
  v.literal("captain"),
  v.literal("manager"),
  v.literal("builder"),
  v.literal("worker")
),
```

**Need to create:**
- Role selection during onboarding
- Role management UI for admins
- Default role assignment (worker)

### **2. Permission Enforcement in Drag Handler 🚧**

**Need to update `handleDragEnd()`:**
```typescript
const handleDragEnd = async (result: any) => {
  // ... existing code ...
  
  // 1. Get current user's role
  const userRole = currentUser?.role;
  
  // 2. Check if user can move this task
  const canMove = canMoveTask(
    userRole,
    currentUser?._id,
    task,
    destination.droppableId
  );
  
  if (!canMove.allowed) {
    toast.error(canMove.reason);
    return; // Block the move
  }
  
  // 3. If moving to Done, mark completedBy and checkedBy
  if (destination.droppableId === 'completed') {
    updates.completedBy = currentUser?._id;
    updates.checkedBy = currentUser?._id;
  }
  
  // ... rest of existing code ...
};
```

### **3. Permission Enforcement in Create Task 🚧**

**Need to update `handleCreateTask()`:**
```typescript
const handleCreateTask = async () => {
  // ... existing validation ...
  
  // 1. Check story point limits
  const canCreate = canCreateTaskWithStoryPoints(
    currentUser?.role,
    taskForm.storyPoints
  );
  
  if (!canCreate.allowed) {
    toast.error(canCreate.reason);
    return;
  }
  
  // 2. Check assignment permissions
  if (taskForm.assignedTo.length > 0) {
    for (const assigneeId of taskForm.assignedTo) {
      const assignee = await getUser(assigneeId);
      const canAssign = canAssignTask(
        currentUser?.role,
        assignee.role
      );
      
      if (!canAssign) {
        toast.error(`You cannot assign tasks to ${assignee.role}s`);
        return;
      }
    }
  }
  
  // ... rest of existing code ...
};
```

### **4. UI Restrictions Based on Role 🚧**

**Need to add:**

**A. Hide/Disable Column Management:**
```typescript
// Only show "+" and "−" buttons if user can manage columns
{canManageColumns(currentUser?.role, "add") && (
  <button onClick={openColumnEditor}>
    <Plus className="w-4 h-4" />
  </button>
)}

{canManageColumns(currentUser?.role, "remove") && (
  <button onClick={deleteColumn}>
    <Minus className="w-4 h-4" />
  </button>
)}
```

**B. Disable Edit Button:**
```typescript
// In task detail panel
{canEditTask(currentUser?.role, currentUser?._id, task) && (
  <Button onClick={openEditModal}>
    Edit Task
  </Button>
)}
```

**C. Filter Assignment Dropdown:**
```typescript
// Only show users the current user can assign to
const assignableUsers = teamMembers.filter(member =>
  canAssignTask(currentUser?.role, member.role)
);
```

**D. Show Role Badges:**
```typescript
// On task cards and user avatars
<Badge className={roleColors[user.role]}>
  {roleIcons[user.role]} {user.role}
</Badge>
```

### **5. Review Column Locking 🚧**

**Need to add:**
```typescript
// When moving to Review
if (destination.droppableId === 'review') {
  updates.lastMovedBy = currentUser?._id;
  updates.lockedInReview = true;
}

// Check if task is locked in review
if (task.lockedInReview && !hasHigherRole(userRole, task.lastMovedByRole)) {
  toast.error("Task is in review, waiting for approval");
  return;
}
```

### **6. Done Column Locking 🚧**

**Need to add:**
```typescript
// When moving from Done
if (task.status === 'completed' && task.completedBy) {
  // Only person who marked it or equal/higher role can move
  if (currentUser?._id !== task.completedBy) {
    const completedByUser = await getUser(task.completedBy);
    if (!hasEqualOrHigherRole(currentUser?.role, completedByUser.role)) {
      toast.error("Only the person who marked this done or higher role can move it");
      return;
    }
  }
}
```

### **7. Visual Indicators for Locked Tasks 🚧**

**Need to add:**
```typescript
// On task cards in Review
{task.status === 'review' && task.lockedInReview && (
  <div className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
    🔒 Waiting for {requiredApproverRole} approval
  </div>
)}

// On task cards in Done
{task.status === 'completed' && task.checkedBy && (
  <div className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
    ✅ Checked by {checkedByUser.name} ({checkedByUser.role})
  </div>
)}
```

---

## 📋 **Implementation Checklist**

### **Backend:**
- [x] Add schema fields (completedBy, checkedBy, workingOnIt)
- [x] Create permission functions
- [x] Add toggleWorkingOnIt mutation
- [ ] Add role field to users table
- [ ] Update createTask mutation with permission checks
- [ ] Update updateTask mutation with permission checks
- [ ] Add getUserRole query
- [ ] Add canPerformAction query

### **Frontend:**
- [x] Add "Working On It" button
- [x] Show working indicator
- [ ] Add role fetching in useOfflineData
- [ ] Implement drag permission checks
- [ ] Implement create permission checks
- [ ] Add role-based UI restrictions
- [ ] Add locked task indicators
- [ ] Add approval flow UI
- [ ] Filter assignment dropdown by role
- [ ] Add role badges to users

### **Database:**
- [ ] Run schema migration
- [ ] Assign default roles to existing users
- [ ] Update project memberships with roles

---

## 🚀 **Next Steps**

### **Step 1: Add Role to Users**
```typescript
// 1. Update schema.ts
// 2. Run: npx convex dev
// 3. Migration script to assign default roles
```

### **Step 2: Fetch User Role**
```typescript
// Update useOfflineData to include role
const currentUser = useQuery(api.users.getCurrentUser);
// Now currentUser.role is available
```

### **Step 3: Implement Permission Checks**
```typescript
// Import permission functions
import {
  canMoveTask,
  canEditTask,
  canAssignTask,
  canManageColumns,
} from '../../../convex/permissions';

// Use in handlers
if (!canMoveTask(currentUser.role, currentUser._id, task, targetStatus).allowed) {
  return;
}
```

### **Step 4: Add UI Restrictions**
```typescript
// Conditionally render based on permissions
{canManageColumns(currentUser.role, "remove") && (
  <DeleteColumnButton />
)}
```

### **Step 5: Test Each Role**
```
1. Create test users with each role
2. Test task assignment
3. Test task movement
4. Test column management
5. Test locked states
```

---

## 📝 **What Works Now:**

1. ✅ "Working On It" button fully functional
2. ✅ Shows who's working on tasks
3. ✅ Permission logic is ready to use
4. ✅ Database schema supports all features

## 📝 **What Needs Work:**

1. 🚧 Role assignment to users
2. 🚧 Permission checks in drag handler
3. 🚧 Permission checks in create/edit
4. 🚧 UI restrictions based on role
5. 🚧 Visual indicators for locked tasks

---

## 💡 **Quick Implementation Guide**

**To fully activate the system:**

1. **Add role to user schema** → Deploy
2. **Assign roles to users** → Migration
3. **Import permission functions** → In kanban page
4. **Add checks to handlers** → handleDragEnd, handleCreateTask
5. **Add UI restrictions** → Conditional rendering
6. **Test with different roles** → Verify permissions

**Estimated Time:** 2-3 hours for full implementation

---

**Current Status: Foundation Complete, Integration Pending** 🚀
