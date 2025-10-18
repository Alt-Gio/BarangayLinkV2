# ✅ KANBAN VALIDATION RULES & FEATURES

## 🎯 Complete Implementation

All validation rules and visual indicators are now fully implemented!

## 🚫 Status Change Restrictions

### **1. DONE Status - Strict Control**
```
✅ CAN move to DONE:
- Task must be in IN_REVIEW status
- Only Admins, Captains, or Managers can approve
- Automatically records who verified it

❌ CANNOT move to DONE:
- If task is not in IN_REVIEW
- If user is not Admin/Captain/Manager
```

**Example:**
```
Worker tries to drag task from IN PROGRESS → DONE
❌ Error: "Tasks can only be marked as DONE from IN REVIEW status"

Worker completes task → Drags to IN REVIEW ✅
Manager reviews task → Drags to DONE ✅
Task shows: "Verified by Manager Name"
```

### **2. IN PROGRESS - Assignment Required**
```
✅ CAN move to IN PROGRESS:
- At least one person must be assigned

❌ CANNOT move to IN PROGRESS:
- If no users are assigned to task
```

**Example:**
```
Manager creates task
Manager tries to drag from TODO → IN PROGRESS
❌ Error: "Cannot start task - No users assigned yet"

Manager assigns workers ✅
Now anyone can drag to IN PROGRESS ✅
```

### **3. BACKLOG - Only from TODO**
```
✅ CAN move to BACKLOG:
- Task must be in TODO status
- Marks task as "Low Priority - Not urgent"

❌ CANNOT move to BACKLOG:
- If task is already started (IN PROGRESS, IN REVIEW, etc.)
```

**Example:**
```
Task in IN PROGRESS
Manager tries to drag to BACKLOG
❌ Error: "Can only move to BACKLOG from TODO status"

Task in TODO
Manager drags to BACKLOG ✅
Shows: "Low Priority - Not urgent" (even when minimized)
```

### **4. BLOCKED - Reason Required**
```
✅ CAN move to BLOCKED:
- From any status
- Must provide reason why blocked

❌ CANNOT skip reason:
- Dialog will appear asking for reason
- Cannot proceed without entering reason
```

**Example:**
```
Worker encounters problem
Drags task to BLOCKED
Dialog appears: "Why is this task blocked?"
Worker types: "Waiting for cement delivery"
Clicks "Block Task" ✅
Reason shows in red box even when card minimized
```

## 📊 Visual Indicators (Always Visible)

### **1. Blocked Reason - Red Box**
```
When task is BLOCKED:
┌──────────────────────────────────┐
│ Task Title               ▼ ⋮     │
│ [Blocked] [High]                 │
├──────────────────────────────────┤
│ 🚫 BLOCKED                       │
│    Waiting for materials         │ ← Always visible!
│    delivery                      │
└──────────────────────────────────┘
```

**Features:**
- ✅ Red background with red border
- ✅ Shows reason even when minimized
- ✅ Clear "BLOCKED" label with icon
- ✅ Easy to spot in column

### **2. Backlog Label - Gray Box**
```
When task is in BACKLOG:
┌──────────────────────────────────┐
│ Task Title               ▼ ⋮     │
│ [Backlog] [Low]                  │
├──────────────────────────────────┤
│ ⚠️ Low Priority - Not urgent    │ ← Always visible!
└──────────────────────────────────┘
```

**Features:**
- ✅ Gray background with gray border
- ✅ Shows "Low Priority - Not urgent"
- ✅ Visible even when minimized
- ✅ Clear indicator of backlog status

### **3. Verified By - Green Box**
```
When task is DONE (expanded view):
┌──────────────────────────────────┐
│ Task Title               ▲ ⋮     │
│ [Done] [High]                    │
├──────────────────────────────────┤
│ Team Progress     100%           │
│ Assignments                      │
│ ✅ Verified by John Doe         │ ← Shows who approved
└──────────────────────────────────┘
```

**Features:**
- ✅ Green background with green border
- ✅ Shows manager/admin who approved
- ✅ Appears in expanded section
- ✅ Proves task was properly reviewed

## 🔄 Complete Workflows

### **Workflow 1: Normal Task Completion**
```
1. Manager creates task → TODO
2. Manager assigns workers → Still TODO
3. Worker drags to IN PROGRESS ✅
4. Worker completes work
5. Worker drags to IN REVIEW ✅
6. Manager reviews
7. Manager drags to DONE ✅
   → Shows "Verified by Manager Name"
```

### **Workflow 2: Task Gets Blocked**
```
1. Worker working on task → IN PROGRESS
2. Missing materials discovered
3. Worker drags to BLOCKED
4. Dialog: "Why is this task blocked?"
5. Worker types: "Waiting for pipes delivery Oct 25"
6. Clicks "Block Task" ✅
7. Red box appears with reason (always visible)
8. Manager sees it and orders materials
9. Materials arrive
10. Worker drags from BLOCKED → IN PROGRESS ✅
11. Continue work
```

### **Workflow 3: Low Priority Task**
```
1. Manager has many tasks
2. Some not urgent
3. Manager drags from TODO → BACKLOG ✅
4. Gray box shows "Low Priority - Not urgent"
5. Task sits in BACKLOG column
6. When ready to work on it:
7. Manager drags from BACKLOG → TODO ✅
8. Now can be assigned and started
```

### **Workflow 4: Trying to Skip Steps (BLOCKED)**
```
1. Worker completes task
2. Worker tries to drag directly to DONE
3. ❌ Error: "Tasks can only be marked as DONE from IN REVIEW"
4. Worker drags to IN REVIEW instead ✅
5. Manager reviews
6. Manager drags to DONE ✅
```

### **Workflow 5: Starting Unassigned Task (BLOCKED)**
```
1. Task created in TODO
2. Worker tries to drag to IN PROGRESS
3. ❌ Error: "Cannot start - No users assigned yet"
4. Worker clicks "Assign" button
5. Assigns themselves ✅
6. Now can drag to IN PROGRESS ✅
```

## 📋 Permission Matrix

| Action | Worker | Builder | Manager | Captain | Admin |
|--------|--------|---------|---------|---------|-------|
| Create Task | ❌ | ❌ | ✅ | ✅ | ✅ |
| Assign Users | ❌ | ❌ | ✅ | ✅ | ✅ |
| TODO → IN PROGRESS | ✅ (if assigned) | ✅ (if assigned) | ✅ | ✅ | ✅ |
| IN PROGRESS → IN REVIEW | ✅ (if assigned) | ✅ (if assigned) | ✅ | ✅ | ✅ |
| IN REVIEW → DONE | ❌ | ❌ | ✅ | ✅ | ✅ |
| Any → BLOCKED | ✅ (if assigned) | ✅ (if assigned) | ✅ | ✅ | ✅ |
| TODO → BACKLOG | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete Task | ❌ | ❌ | ✅ | ✅ | ✅ |

## 🎨 Status Transition Rules

```
┌─────────────────────────────────────────────────┐
│ VALID TRANSITIONS                               │
├─────────────────────────────────────────────────┤
│ TODO                                            │
│   → IN PROGRESS (if assigned)                   │
│   → BACKLOG ✅                                  │
│   → BLOCKED (with reason)                       │
│                                                 │
│ IN PROGRESS                                     │
│   → IN REVIEW ✅                                │
│   → BLOCKED (with reason)                       │
│   → TODO (if need to restart)                   │
│                                                 │
│ IN REVIEW                                       │
│   → DONE (Managers only) ✅                     │
│   → IN PROGRESS (needs revision)                │
│   → BLOCKED (with reason)                       │
│                                                 │
│ DONE                                            │
│   → IN REVIEW (reopen if needed)                │
│                                                 │
│ BLOCKED                                         │
│   → Any status ✅                               │
│                                                 │
│ BACKLOG                                         │
│   → TODO ✅                                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ INVALID TRANSITIONS                             │
├─────────────────────────────────────────────────┤
│ ❌ TODO → IN PROGRESS (no assignments)         │
│ ❌ TODO → DONE (skips process)                 │
│ ❌ IN PROGRESS → DONE (must review first)      │
│ ❌ IN PROGRESS → BACKLOG (already started)     │
│ ❌ IN REVIEW → BACKLOG (already in review)     │
│ ❌ Any → DONE (by workers)                     │
│ ❌ Any → BACKLOG (except from TODO)            │
│ ❌ Any → BLOCKED (without reason)              │
└─────────────────────────────────────────────────┘
```

## 🎯 Error Messages

### **Clear & Helpful Messages:**
```
❌ "Tasks can only be marked as DONE from IN REVIEW status"
   → Tells user what status is required

❌ "Only Admins, Captains, and Managers can mark tasks as DONE"
   → Explains permission requirement

❌ "Cannot start task - No users assigned yet. Please assign users first."
   → Tells user what to do next

❌ "Can only move to BACKLOG from TODO status"
   → Explains the rule

✅ "Task blocked: Waiting for materials delivery"
   → Confirms action with reason

✅ "Task moved to backlog (low priority)"
   → Confirms action

✅ "Task marked as DONE!"
   → Celebrates completion
```

## ✅ Summary of Features

### **Validation Rules:**
1. ✅ DONE only from IN_REVIEW by managers
2. ✅ IN_PROGRESS only if assigned
3. ✅ BACKLOG only from TODO
4. ✅ BLOCKED requires reason

### **Visual Indicators:**
1. ✅ Blocked reason in red box (always visible)
2. ✅ Backlog label in gray box (always visible)
3. ✅ Verified by name in green box (when done)
4. ✅ All show even when card minimized

### **Database Fields:**
1. ✅ blockedReason: string (optional)
2. ✅ verifiedBy: userId (optional)
3. ✅ Both saved automatically

### **User Experience:**
1. ✅ Clear error messages
2. ✅ Helpful toast notifications
3. ✅ Visual feedback
4. ✅ Permission-based actions
5. ✅ Proper workflow enforcement

**The kanban board now has professional-grade validation and visual feedback!** 🎉
