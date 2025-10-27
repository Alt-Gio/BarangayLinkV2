# 🔐 Role-Based Permission System - Complete Guide

**Date:** October 27, 2025  
**Status:** ✅ IMPLEMENTED  

---

## 📋 **Table of Contents**

1. [Role Hierarchy](#role-hierarchy)
2. [Permission Matrix](#permission-matrix)
3. [Task Assignment Rules](#task-assignment-rules)
4. [Task Movement Rules](#task-movement-rules)
5. [Task Editing Rules](#task-editing-rules)
6. [Column Management](#column-management)
7. [Working On It Feature](#working-on-it-feature)
8. [Implementation Details](#implementation-details)

---

## 🎯 **Role Hierarchy**

### **Hierarchy Levels:**
```
Admin/Captain (Level 5) ⭐⭐⭐⭐⭐
    ↓
Manager (Level 3) ⭐⭐⭐
    ↓
Builder (Level 2) ⭐⭐
    ↓
Worker (Level 1) ⭐
```

---

## 📊 **Permission Matrix**

| Permission | Admin/Captain | Manager | Builder | Worker |
|-----------|---------------|---------|---------|--------|
| **Task Assignment** |
| Assign to Admin/Captain | ✅ Self only | ❌ | ❌ | ❌ |
| Assign to Manager | ✅ | ✅ | ✅ (Minimal) | ❌ |
| Assign to Builder | ✅ | ✅ | ✅ | ❌ |
| Assign to Worker | ✅ | ✅ | ✅ | ✅ Self only |
| **Task Movement** |
| Move own tasks | ✅ | ✅ | ✅ | ✅ |
| Move others' tasks | ✅ | ✅ (Builder/Worker) | ✅ (Worker only) | ❌ |
| Move from Done | ✅ (Self marked) | ✅ (Self marked) | ❌ | ❌ |
| Move from Review | ✅ | ✅ | ❌ | ❌ |
| **Task Editing** |
| Edit any task | ✅ | ✅ | ❌ | ❌ |
| Edit own tasks | ✅ | ✅ | ✅ | ❌ |
| Create high SP tasks | ✅ | ✅ | ❌ (8+ SP) | ❌ (4+ SP) |
| **Column Management** |
| Add columns | ✅ | ✅ | ✅ | ❌ |
| Remove columns | ✅ | ✅ | ❌ | ❌ |

---

## 👥 **Detailed Role Descriptions**

### **🏆 Admin & Captain** (Highest Authority)

**Can Do:**
- ✅ Assign tasks to **anyone** on the team
- ✅ Assign tasks to **themselves**
- ✅ Move **any task** to any column
- ✅ Move tasks from **Done** (only if they marked it or same/higher role)
- ✅ Edit **any task**
- ✅ Create tasks with **any story points**
- ✅ **Add & Remove** custom columns
- ✅ Mark any task as Done (becomes "Checked by Admin/Captain")

**Cannot Do:**
- ❌ Be assigned tasks by lower roles (Manager, Builder, Worker)
- ❌ Move tasks marked Done by other Admin/Captain (unless they marked it)

**Special Rules:**
- When they mark a task as Done, it's **locked** - only they or another Admin/Captain can move it
- Tasks in Done show "✅ Checked by [Name]"
- Their tasks can only be moved by themselves or equal/higher roles

---

### **👔 Manager** (Team Lead)

**Can Do:**
- ✅ Assign tasks to **Builders & Workers**
- ✅ Assign tasks to **themselves**
- ✅ Assign tasks to other **Managers**
- ✅ Move Builder & Worker tasks
- ✅ Move tasks from **Review** to Done (approval)
- ✅ Edit **any task** from Builder/Worker
- ✅ Create tasks with **any story points**
- ✅ **Add & Remove** custom columns
- ✅ Mark Builder/Worker tasks as Done (becomes "Checked by Manager")

**Can Be Assigned:**
- ✅ By other Managers
- ✅ By Builders (minimal tasks for checking/approval)

**Cannot Do:**
- ❌ Assign tasks to Admin/Captain
- ❌ Edit Admin/Captain tasks
- ❌ Move Admin/Captain tasks

**Special Rules:**
- When they mark a task as Done, it shows "✅ Checked by Manager [Name]"
- Builders can assign "checking" tasks to Managers
- When Builder puts task in Review, Manager must approve before moving

---

### **🔨 Builder** (Developer/Creator)

**Can Do:**
- ✅ Assign tasks to **Workers only**
- ✅ Assign tasks to **themselves**
- ✅ Assign **minimal checking tasks** to Managers
- ✅ Move their **own tasks**
- ✅ Move **Worker tasks** they assigned
- ✅ Edit **only their own tasks**
- ✅ Create tasks up to **5 story points** (cannot create 8+)
- ✅ **Add** custom columns (but not remove)
- ✅ Put tasks in **Review** (alerts Manager)

**Cannot Do:**
- ❌ Assign tasks to Manager (except minimal checking)
- ❌ Edit others' tasks
- ❌ Remove columns
- ❌ Move tasks from Review (must wait for Manager approval)
- ❌ Create tasks with 8+ story points

**Special Rules:**
- When putting task in Review: **Cannot move it again** - locks until Manager approves
- Review tasks show "🔍 Waiting for Manager approval"
- Manager tasks must have **description** explaining what needs checking
- Can work on high story point tasks if assigned by Manager

---

### **👷 Worker** (Task Executor)

**Can Do:**
- ✅ Work on **assigned tasks**
- ✅ Create tasks for **themselves only** (up to 3 story points)
- ✅ Move **their assigned tasks**
- ✅ Put tasks in **Review** (alerts Manager/Builder)
- ✅ Use "Working On It" button

**Cannot Do:**
- ❌ Assign tasks to anyone (including themselves for new tasks)
- ❌ Edit any tasks
- ❌ Add or remove columns
- ❌ Move tasks from Review
- ❌ Create tasks with 4+ story points

**Special Rules:**
- Can only see and work on tasks assigned to them
- When putting task in Review: **Cannot move it** - must wait for approval
- Review tasks show "🔍 Waiting for approval"
- Focused on execution, not management

---

## 📝 **Task Assignment Rules**

### **Assignment Flow:**

```
Admin/Captain
    ↓ Can assign to anyone
    ├─→ Admin/Captain (self)
    ├─→ Manager
    ├─→ Builder
    └─→ Worker

Manager
    ↓ Can assign to team
    ├─→ Manager (self or others)
    ├─→ Builder
    └─→ Worker

Builder
    ↓ Limited assignment
    ├─→ Builder (self)
    ├─→ Worker
    └─→ Manager (minimal checking only)

Worker
    ↓ Self only
    └─→ Worker (self)
```

### **Special Assignment Rules:**

1. **Minimal Tasks to Manager (Builder → Manager):**
   - Must have description
   - Typically for checking/review
   - Example: "Please review my API implementation"

2. **Cannot Assign UP the Hierarchy:**
   - Workers cannot assign to anyone
   - Builders cannot assign to Admin/Captain
   - Managers cannot assign to Admin/Captain

3. **Self-Assignment:**
   - Everyone can assign tasks to themselves
   - Admin/Captain cannot be assigned by lower roles

---

## 🔄 **Task Movement Rules**

### **Movement by Role:**

#### **To DO → In Progress:**
- **Everyone:** Can move their assigned tasks
- **Admin/Captain:** Can move any task
- **Manager:** Can move Builder/Worker tasks

#### **In Progress → Review:**
- **Builder:** Can move, then **LOCKED** - can't move again
- **Worker:** Can move, then **LOCKED** - can't move again
- **Manager:** Can move anytime
- **Admin/Captain:** Can move anytime

#### **Review → Done:**
- **Manager:** Can approve and move to Done
- **Admin/Captain:** Can approve and move to Done
- **Builder/Worker:** **CANNOT** - must wait for approval

#### **Done → Anywhere:**
- **Only who marked it Done** or **equal/higher role**
- Shows "✅ Checked by [Name]"
- Locked from being moved by lower roles

### **Review Column Behavior:**

```
Builder puts task in Review:
  → Task shows "🔍 Waiting for Manager approval"
  → Builder CANNOT move it
  → Manager can move to Done or back to In Progress
  → Only Manager+ can unlock it

Worker puts task in Review:
  → Task shows "🔍 Waiting for approval"
  → Worker CANNOT move it
  → Builder/Manager can move it
  → Requires approval to proceed
```

### **Done Column Behavior:**

```
Manager marks as Done:
  → Shows "✅ Checked by Manager [Name]"
  → Locked from Builder/Worker
  → Only Manager+ can move it
  → Marks completedBy and checkedBy fields

Admin marks as Done:
  → Shows "✅ Checked by Admin [Name]"
  → Locked from everyone except Admin/Captain
  → Highest level of approval
  → Cannot be moved without permission
```

---

## ✏️ **Task Editing Rules**

### **Edit Permissions:**

| Task Owner | Admin | Manager | Builder | Worker |
|-----------|-------|---------|---------|--------|
| Admin task | ✅ | ❌ | ❌ | ❌ |
| Manager task | ✅ | ✅ | ❌ | ❌ |
| Builder task | ✅ | ✅ | ✅ Self | ❌ |
| Worker task | ✅ | ✅ | ❌ | ❌ |

### **Story Point Restrictions:**

```
Worker:
  ✅ Can create: 1-3 story points
  ❌ Cannot create: 4+ story points
  ✅ Can be assigned: Any story points

Builder:
  ✅ Can create: 1-5 story points
  ❌ Cannot create: 8+ story points (Large/Epic tasks)
  ✅ Can be assigned: Any story points

Manager:
  ✅ Can create: Any story points
  ✅ Can assign: Any story points

Admin/Captain:
  ✅ Can create: Any story points
  ✅ Can assign: Any story points
```

---

## 🏗️ **Column Management**

### **Add Column:**

| Role | Can Add Column | Requirements |
|------|---------------|--------------|
| Admin/Captain | ✅ Yes | No restrictions |
| Manager | ✅ Yes | No restrictions |
| Builder | ✅ Yes | Can add, but cannot remove |
| Worker | ❌ No | Cannot manage columns |

### **Remove Column:**

| Role | Can Remove Column | Requirements |
|------|------------------|--------------|
| Admin/Captain | ✅ Yes | Can remove any custom column |
| Manager | ✅ Yes | Can remove any custom column |
| Builder | ❌ No | Cannot remove columns |
| Worker | ❌ No | Cannot remove columns |

### **Default Columns (Protected):**

These columns **cannot be removed** by anyone:
- 📋 To Do
- ⚡ In Progress
- 👀 In Review
- ✅ Done

---

## 🔧 **Working On It Feature**

### **Purpose:**
Allows team members to signal they're actively working on a task.

### **How It Works:**

1. **Button Visibility:**
   - Shows on tasks in **In Progress**
   - Shows on tasks in **Custom Columns**
   - Does NOT show on To Do, Review, or Done

2. **Button States:**
   ```
   Not Working:
   [🔧 Start Working]
   
   Currently Working:
   [⏸️ Stop Working] (Blue highlighted)
   ```

3. **Visual Indicators:**
   - Task card shows: `🔧 You` (if you're working)
   - Task card shows: `🔧 Working` (if someone else)
   - Animated wrench icon (pulsing)
   - Blue highlighted banner

4. **Who Can Use:**
   - ✅ Anyone assigned to the task
   - ✅ Shows real-time who's working
   - ✅ Tracks start time

### **Benefits:**
- Prevents duplicate work
- Shows task progress
- Team transparency
- Time tracking foundation

---

## 💻 **Implementation Details**

### **Database Schema:**

```typescript
tasks: {
  completedBy: Id<"users">,        // Who marked as done
  checkedBy: Id<"users">,          // Who approved/checked
  workingOnIt: Id<"users">,        // Who's currently working
  workingOnItStartedAt: number,    // When they started
  lastMovedBy: Id<"users">,        // Who last moved the task
}
```

### **Permission Functions:**

```typescript
// Check if user can assign
canAssignTask(assignerRole, targetRole): boolean

// Check if user can move task
canMoveTask(userRole, userId, task, targetStatus): {
  allowed: boolean;
  reason?: string;
}

// Check if user can edit
canEditTask(userRole, userId, task): boolean

// Check story point limits
canCreateTaskWithStoryPoints(userRole, storyPoints): {
  allowed: boolean;
  reason?: string;
}

// Check column management
canManageColumns(userRole, action): boolean
```

### **Validation Points:**

1. **On Drag (Task Movement):**
   ```typescript
   handleDragEnd() {
     // Check role permissions
     // Validate target column
     // Check if task is locked (Review/Done)
     // Update completedBy if moving to Done
   }
   ```

2. **On Create (Task Creation):**
   ```typescript
   handleCreateTask() {
     // Check story point limits
     // Validate assignment targets
     // Check column access
   }
   ```

3. **On Edit (Task Update):**
   ```typescript
   handleEditTask() {
     // Check edit permissions
     // Validate field changes
     // Prevent unauthorized modifications
   }
   ```

---

## 📱 **User Interface**

### **Permission Indicators:**

1. **Task Cards:**
   ```
   ┌──────────────────────────┐
   │ 🎯 TEST  🔧 You         │ ← Working indicator
   │ Test Task               │
   │                         │
   │ [🔧 Start Working]      │ ← Working button
   │                         │
   │ 8 pts  medium  👤       │
   └──────────────────────────┘
   ```

2. **Review State:**
   ```
   ┌──────────────────────────┐
   │ 🔍 In Review            │
   │ Waiting for Manager     │
   │ ⚠️ Locked               │
   └──────────────────────────┘
   ```

3. **Done State:**
   ```
   ┌──────────────────────────┐
   │ ✅ Done                 │
   │ Checked by: John (Mgr)  │
   │ 🔒 Locked               │
   └──────────────────────────┘
   ```

### **Error Messages:**

```typescript
// Insufficient permissions
"❌ You don't have permission to move this task"

// Locked task
"🔒 Task is in review, waiting for Manager approval"

// Story point limit
"⚠️ Builders cannot create tasks with 8+ story points"

// Assignment restriction
"❌ You cannot assign tasks to Admin/Captain"
```

---

## 🎯 **Usage Examples**

### **Example 1: Builder Workflow**

```
1. Builder creates task (5 story points) ✅
2. Assigns to Worker ✅
3. Worker moves to In Progress ✅
4. Worker clicks "Start Working" ✅
5. Worker moves to Review ✅
6. Worker tries to move back ❌ "Locked - waiting for approval"
7. Manager reviews and moves to Done ✅
8. Shows "✅ Checked by Manager Jane"
```

### **Example 2: Worker Workflow**

```
1. Worker sees assigned task
2. Moves to In Progress ✅
3. Clicks "Start Working" ✅
4. Works on task
5. Clicks "Stop Working" ✅
6. Moves to Review ✅
7. Waits for Builder/Manager approval
8. Manager approves → Done ✅
```

### **Example 3: Manager Workflow**

```
1. Manager creates high-priority task (13 SP) ✅
2. Assigns to Builder ✅
3. Builder works and moves to Review ✅
4. Manager reviews task
5. Manager moves to Done ✅
6. Shows "✅ Checked by Manager"
7. Only Manager+ can now move it ✅
```

---

## 🚀 **Benefits of This System**

1. **Clear Authority:** Everyone knows their permissions
2. **Quality Gates:** Review and Done act as checkpoints
3. **Accountability:** Tracked who checked/approved
4. **Prevents Errors:** Cannot accidentally modify critical tasks
5. **Team Transparency:** "Working On It" shows progress
6. **Flexible Workflow:** Custom columns with role-based access

---

## 📚 **Quick Reference**

### **Can I...?**

**Assign task to Admin?**
- Admin: Yes (self)
- Manager: No
- Builder: No
- Worker: No

**Move task from Review?**
- Admin: Yes
- Manager: Yes
- Builder: No
- Worker: No

**Edit any task?**
- Admin: Yes
- Manager: Yes (Builder/Worker tasks)
- Builder: No (only own)
- Worker: No

**Remove columns?**
- Admin: Yes
- Manager: Yes
- Builder: No
- Worker: No

**Use "Working On It"?**
- Everyone: Yes (on assigned tasks)

---

**Your kanban now has professional role-based access control!** 🎯
