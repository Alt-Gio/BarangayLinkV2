# 📋 Task Status Workflow Guide

## 🎯 All Task Statuses

BarangayLink v2 has **6 task statuses** that follow a logical workflow:

```
BACKLOG → TODO → IN PROGRESS → IN REVIEW → DONE
           ↓         ↓
        BLOCKED   BLOCKED
```

## 📊 Status Definitions

### 1. **BACKLOG** 📦
**Purpose:** Ideas and tasks for future planning

**When to use:**
- Tasks that are planned but not yet ready to start
- Low-priority tasks that may be done later
- Ideas that need more planning before becoming active
- Tasks waiting for approval or resources

**How to set:**
- When creating a task, select "Backlog" as status
- Or drag task to Backlog column in Kanban board

**Visual:**
```
┌────────────────────────┐
│ 📦 BACKLOG            │
│ ┌────────────────────┐│
│ │ Setup WiFi         ││
│ │ [Backlog] [Low]    ││
│ │ Not yet scheduled  ││
│ └────────────────────┘│
└────────────────────────┘
```

**Who can move here:**
- Managers/Admins creating tasks
- Can drag from any status

---

### 2. **TODO** 📝
**Purpose:** Ready to start, waiting for worker assignment

**When to use:**
- Tasks that are fully planned and ready
- Waiting for workers to be assigned
- Next up in the queue

**How to set:**
- Default status when creating tasks
- Drag task to TODO column
- Automatically set when task is created with assignments

**Visual:**
```
┌────────────────────────┐
│ 📝 TODO               │
│ ┌────────────────────┐│
│ │ Install Drainage   ││
│ │ [To Do] [High]     ││
│ │ Ready to start     ││
│ └────────────────────┘│
└────────────────────────┘
```

**Who can move here:**
- Managers (drag from Backlog)
- System (when creating new tasks)

---

### 3. **IN PROGRESS** ⚡
**Purpose:** Active work being done

**When to use:**
- Worker has clocked in
- Actively working on the task
- Making progress

**How to set:**
- **Automatically** when worker clocks in
- Or drag task to "In Progress" column

**Visual:**
```
┌────────────────────────┐
│ ⚡ IN PROGRESS        │
│ ┌────────────────────┐│
│ │ Install Drainage   ││
│ │ [In Progress] [High]│
│ │ ⏱️ Working 01:23:45 ││
│ │ Worker A: 50%      ││
│ └────────────────────┘│
└────────────────────────┘
```

**Who can move here:**
- **Automatic** when clock in
- Workers (if manually dragged)
- Managers

---

### 4. **IN REVIEW** 🔍
**Purpose:** Work completed, waiting for verification

**When to use:**
- Worker marked task as complete
- Ready for manager to verify
- All assigned workers have completed

**How to set:**
- **Automatically** when worker clocks out with "Mark Complete"
- Or drag to "In Review" column

**Visual:**
```
┌────────────────────────┐
│ 🔍 IN REVIEW          │
│ ┌────────────────────┐│
│ │ Install Drainage   ││
│ │ [In Review] [High] ││
│ │ Worker A: 100% ⏰  ││
│ │ Worker B: 100% ⏰  ││
│ │ [Verify] button    ││
│ └────────────────────┘│
└────────────────────────┘
```

**Who can move here:**
- **Automatic** when all workers complete
- Workers (when marking complete)
- Managers

---

### 5. **DONE** ✅
**Purpose:** Verified and completed

**When to use:**
- Manager has verified the work
- All requirements met
- Task successfully completed

**How to set:**
- Manager clicks "Verify" → "Approve"
- Or drag to "Done" column

**Visual:**
```
┌────────────────────────┐
│ ✅ DONE               │
│ ┌────────────────────┐│
│ │ Install Drainage   ││
│ │ [Done] [High]      ││
│ │ Worker A: 100% ✓   ││
│ │ Worker B: 100% ✓   ││
│ │ Verified by Manager││
│ └────────────────────┘│
└────────────────────────┘
```

**Who can move here:**
- **Automatic** when manager approves
- Managers (manual drag)

---

### 6. **BLOCKED** 🚫
**Purpose:** Cannot proceed due to obstacles

**When to use:**
- Waiting for another task to complete
- Missing resources or materials
- External dependency not met
- Technical issues preventing progress

**How to set:**
- Drag task to "Blocked" column
- Worker or Manager marks it blocked

**Visual:**
```
┌────────────────────────┐
│ 🚫 BLOCKED            │
│ ┌────────────────────┐│
│ │ Install Drainage   ││
│ │ [Blocked] [High]   ││
│ │ 🚫 Waiting for     ││
│ │    materials       ││
│ └────────────────────┘│
└────────────────────────┘
```

**Who can move here:**
- Workers (if they encounter blocker)
- Managers

**Can move from:** Any status

---

## 🔄 Complete Workflows

### **Normal Flow (Happy Path):**
```
1. Manager creates task
   Status: TODO
   
2. Manager assigns workers
   Status: TODO (no change)
   
3. Worker clocks in
   Status: IN PROGRESS (auto)
   
4. Worker works and clocks out (marks complete)
   Status: IN REVIEW (auto)
   
5. Manager verifies and approves
   Status: DONE (auto)
```

### **With Blockers:**
```
1. Task in progress
   Status: IN PROGRESS
   
2. Worker encounters missing materials
   Status: BLOCKED (manual)
   
3. Materials arrive
   Status: IN PROGRESS (manual)
   
4. Worker completes
   Status: IN REVIEW (auto)
   
5. Manager approves
   Status: DONE (auto)
```

### **Backlog to Completion:**
```
1. Manager creates idea
   Status: BACKLOG
   
2. Manager plans and moves to queue
   Status: TODO (drag)
   
3. Manager assigns workers
   Status: TODO (no change)
   
4. Worker starts
   Status: IN PROGRESS (auto)
   
5. Worker completes
   Status: IN REVIEW (auto)
   
6. Manager approves
   Status: DONE (auto)
```

## 🎨 Kanban Board Layout

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ BACKLOG  │   TODO   │IN PROGRESS│IN REVIEW │   DONE   │ BLOCKED  │
│    📦    │    📝    │    ⚡    │    🔍    │    ✅    │    🚫    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Future   │ Ready    │ Working  │ Awaiting │ Complete │ Stuck    │
│ ideas    │ to start │ now      │ approval │          │          │
│          │          │          │          │          │          │
│ [Task 1] │ [Task 3] │ [Task 5] │ [Task 7] │ [Task 9] │ [Task 2] │
│ [Task 4] │ [Task 6] │ [Task 8] │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

## 🎯 How to Change Status

### **Method 1: Drag & Drop**
```
1. Click and hold task card
2. Drag to desired status column
3. Drop it
4. Status updates immediately
```

### **Method 2: Clock In/Out (Auto)**
```
Clock In → Status: IN PROGRESS
Clock Out (mark complete) → Status: IN REVIEW
Manager Verify → Status: DONE
```

### **Method 3: Status Dropdown (If Available)**
```
1. Click task card
2. Find status dropdown
3. Select new status
4. Save
```

## 📝 Status Selection Guide

### **When Creating Task:**
```
New project idea? → BACKLOG
Ready to work on? → TODO
Urgent/immediate? → TODO (then assign workers)
```

### **When Managing Tasks:**
```
Not urgent yet? → Keep in BACKLOG
Ready for workers? → Move to TODO
Something blocking? → Move to BLOCKED
Need to pause? → Keep in current status
```

### **When Working:**
```
Starting work? → Clock In (auto → IN PROGRESS)
Finishing? → Clock Out with "Mark Complete" (auto → IN REVIEW)
Can't proceed? → Drag to BLOCKED
```

## ⚡ Auto-Status Changes

**These happen automatically:**

1. ✅ **Clock In** → IN PROGRESS
2. ✅ **Clock Out + Mark Complete** → IN REVIEW
3. ✅ **Manager Approves** → DONE
4. ✅ **All Assignments Verified** → DONE

**These require manual action:**

1. 👉 BACKLOG → TODO (drag)
2. 👉 TODO → BACKLOG (drag)
3. 👉 Any → BLOCKED (drag)
4. 👉 BLOCKED → IN PROGRESS (drag)

## 🔒 Permission Rules

### **Workers Can:**
- ✅ View all tasks
- ✅ Clock in to assigned tasks (IN PROGRESS)
- ✅ Clock out (IN REVIEW if marked complete)
- ✅ Move tasks to BLOCKED
- ❌ Cannot create tasks
- ❌ Cannot delete tasks
- ❌ Cannot verify tasks

### **Managers/Admins Can:**
- ✅ Everything workers can do
- ✅ Create tasks (any status)
- ✅ Assign workers
- ✅ Move tasks between any status
- ✅ Verify completed tasks (DONE)
- ✅ Delete tasks

## 📊 Status Statistics

Tasks are counted by status on dashboard:
```
📦 Backlog: 5 tasks
📝 TODO: 12 tasks
⚡ In Progress: 8 tasks
🔍 In Review: 3 tasks
✅ Done: 45 tasks
🚫 Blocked: 2 tasks
```

## 💡 Best Practices

### **Use BACKLOG for:**
- Future event ideas
- Low-priority improvements
- Tasks needing more planning
- Ideas waiting for budget

### **Use TODO for:**
- High-priority tasks ready to start
- Tasks with all resources available
- Next items in the queue

### **Use BLOCKED when:**
- Missing materials/equipment
- Waiting for another task
- External dependency
- Technical issues

### **Move to IN REVIEW when:**
- All work completed
- Ready for quality check
- Seeking manager approval

## 🎉 Summary

**6 Statuses Available:**
1. 📦 **BACKLOG** - Future tasks
2. 📝 **TODO** - Ready to start
3. ⚡ **IN PROGRESS** - Active work
4. 🔍 **IN REVIEW** - Awaiting verification
5. ✅ **DONE** - Completed & verified
6. 🚫 **BLOCKED** - Cannot proceed

**Key Points:**
- Clock in/out automatically updates status
- Managers can manually drag between any status
- Workers can only clock in to assigned tasks
- Blocked can be set from any status
- Done requires manager approval

**Use the right status to keep your project organized!** 📊
