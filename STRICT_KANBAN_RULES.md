# 🔒 STRICT KANBAN VALIDATION RULES

## ✅ ALL RULES IMPLEMENTED

Complete workflow enforcement with strict validation rules!

## 🚫 LOCKED: DONE Status

### **DONE Tasks Cannot Be Moved**
```
Once a task is DONE, it is LOCKED forever!

❌ Cannot drag DONE tasks anywhere
❌ Cannot change status
❌ Task is permanently completed

Error: "Completed tasks cannot be modified. Task is locked."
```

**Why:** Completed work should remain completed. No accidental changes!

---

## 🔄 STRICT STATUS TRANSITIONS

### **1. TODO → Where Can It Go?**

✅ **ALLOWED:**
- TODO → IN PROGRESS (if users assigned)
- TODO → BACKLOG

❌ **BLOCKED:**
- TODO → IN REVIEW (Error: "Work must be started and completed first")
- TODO → BLOCKED (Error: "Assign users and start work first")
- TODO → DONE (Error: "Follow workflow: TODO → IN PROGRESS → IN REVIEW → DONE")

**Example:**
```
Manager creates task in TODO
Manager tries to drag to IN REVIEW
❌ Error: "Cannot move to IN REVIEW from TODO. Work must be started and completed first."

Correct flow:
TODO → Assign users → IN PROGRESS → work → IN REVIEW
```

---

### **2. BACKLOG → Where Can It Go?**

✅ **ALLOWED:**
- BACKLOG → TODO (only!)

❌ **BLOCKED:**
- BACKLOG → IN PROGRESS (Error: "Move to TODO first")
- BACKLOG → IN REVIEW (Error: "Move to TODO first")
- BACKLOG → BLOCKED (Error: "Move to TODO and start work first")
- BACKLOG → DONE (Error: "Move to TODO first")

**Example:**
```
Task in BACKLOG
Manager assigns worker
Worker tries to drag to IN PROGRESS
❌ Error: "Tasks in BACKLOG can only be moved to TODO. Move to TODO first, then assign users."

Correct flow:
BACKLOG → TODO → Assign → IN PROGRESS
```

**Why:** Backlog is for ideas. Must go through TODO first!

---

### **3. IN PROGRESS → Where Can It Go?**

✅ **ALLOWED:**
- IN PROGRESS → IN REVIEW (work completed)
- IN PROGRESS → BLOCKED (with reason)
- IN PROGRESS → TODO (restart if needed)

❌ **BLOCKED:**
- IN PROGRESS → DONE (Error: "Must review first")
- IN PROGRESS → BACKLOG (Error: "Already started")

**Example:**
```
Worker finishes task
Worker tries to drag to DONE
❌ Error: "Tasks can only be marked as DONE from IN REVIEW status"

Correct flow:
IN PROGRESS → IN REVIEW → Manager approves → DONE
```

---

### **4. IN REVIEW → Where Can It Go?**

✅ **ALLOWED:**
- IN REVIEW → DONE (by authorized users only!)
- IN REVIEW → IN PROGRESS (needs revision)
- IN REVIEW → BLOCKED (with reason)

❌ **BLOCKED:**
- IN REVIEW → TODO (Error: "Use IN PROGRESS")
- IN REVIEW → BACKLOG (Error: "Already in review")

**Who can approve DONE:**
- ✅ Admin
- ✅ Captain
- ✅ Manager
- ✅ Builder (if assigned as reviewer in reportTo)
- ✅ Assigned reviewer (reportTo person)

**Example:**
```
Task in IN REVIEW
Worker tries to drag to DONE
❌ Error: "Only Admins, Captains, Managers, or the assigned reviewer can mark tasks as DONE"

Manager drags to DONE ✅
Shows: "Checked by Manager Name"
```

---

### **5. BLOCKED → Where Can It Go?**

✅ **ALLOWED:**
- BLOCKED → IN PROGRESS (unblock and continue)
- BLOCKED → TODO (restart)
- BLOCKED → IN REVIEW (if was reviewing)
- BLOCKED → Any status (flexible recovery)

❌ **BLOCKED:**
- None! BLOCKED is flexible for recovery

**How to block:**
- Only from IN PROGRESS or IN REVIEW
- Must provide reason
- Reason shows in red box always

---

## 📋 BLOCKING RESTRICTIONS

### **What CAN Be Blocked:**
```
✅ IN PROGRESS → BLOCKED (with reason)
✅ IN REVIEW → BLOCKED (with reason)
```

### **What CANNOT Be Blocked:**
```
❌ TODO → BLOCKED
   Error: "Cannot block tasks in TODO. Assign users and start work first."

❌ BACKLOG → BLOCKED
   Error: "Cannot block tasks in BACKLOG. Move to TODO and start work first."

❌ DONE → BLOCKED
   Error: "Completed tasks cannot be modified. Task is locked."
```

**Why:** Only active work can be blocked. Ideas in TODO/BACKLOG aren't "blocked"—they're just not started!

---

## 👥 ASSIGNMENT REQUIREMENTS

### **Cannot Start Without Assignment**
```
Task in TODO with no assigned users
User tries: TODO → IN PROGRESS
❌ Error: "Cannot start task - No users assigned yet. Please assign users first."

Manager assigns workers ✅
Now can move: TODO → IN PROGRESS ✅
```

---

## 📊 COMPLETE WORKFLOW DIAGRAM

```
┌──────────┐
│ BACKLOG  │ (Low priority ideas)
└─────┬────┘
      │ ✅ Only to TODO
      ↓
┌──────────┐
│   TODO   │ (Ready to work)
└─────┬────┘
      │ ✅ Assign users
      │ ✅ To IN PROGRESS or BACKLOG
      │ ❌ Cannot skip to IN REVIEW
      │ ❌ Cannot BLOCK
      ↓
┌──────────┐
│    IN    │ (Working on it)
│ PROGRESS │
└─────┬────┘
      │ ✅ To IN REVIEW when done
      │ ✅ Can BLOCK (with reason)
      ↓
┌──────────┐
│    IN    │ (Reviewing work)
│  REVIEW  │
└─────┬────┘
      │ ✅ Admin/Captain/Manager/Reviewer
      │ ✅ Can approve to DONE
      │ ✅ Can send back to IN PROGRESS
      │ ✅ Can BLOCK (with reason)
      ↓
┌──────────┐
│   DONE   │ 🔒 LOCKED!
└──────────┘
  ↓
Cannot move anywhere
Task is completed forever
Shows: "Checked by [Name]"
```

---

## 🎯 REVIEWER SYSTEM

### **Who Can Approve Tasks?**

**Option 1: Management**
- Admin ✅
- Captain ✅
- Manager ✅

**Option 2: Assigned Reviewer**
- Builder (if set as reportTo) ✅
- Any user set in reportTo field ✅

### **Setting a Reviewer:**
```
When creating/editing task:
→ Set "Report To" / "Checked By" field
→ Assign a specific user to review

When task reaches IN REVIEW:
→ Only that user (or management) can approve
→ Shows "Checked by [Name]" when done
```

---

## 📝 VALIDATION ERROR MESSAGES

### **Clear & Helpful:**

**DONE locked:**
```
❌ "Completed tasks cannot be modified. Task is locked."
```

**Skipping workflow:**
```
❌ "Cannot move to IN REVIEW from TODO. Work must be started and completed first."
❌ "Cannot mark as DONE from TODO. Follow the workflow: TODO → IN PROGRESS → IN REVIEW → DONE"
```

**Backlog restrictions:**
```
❌ "Tasks in BACKLOG can only be moved to TODO. Move to TODO first, then assign users."
❌ "Cannot block tasks in BACKLOG. Move to TODO and start work first."
```

**TODO restrictions:**
```
❌ "Cannot block tasks in TODO. Assign users and start work first."
```

**Blocking restrictions:**
```
❌ "Only tasks that are IN PROGRESS or IN REVIEW can be blocked."
```

**Permission errors:**
```
❌ "Only Admins, Captains, Managers, or the assigned reviewer can mark tasks as DONE"
```

**Assignment errors:**
```
❌ "Cannot start task - No users assigned yet. Please assign users first."
```

---

## ✅ COMPLETE EXAMPLES

### **Example 1: Normal Workflow**
```
1. Manager creates task → TODO
2. Manager assigns 2 workers → Still TODO
3. Worker A drags to IN PROGRESS ✅
4. Workers complete work
5. Worker A drags to IN REVIEW ✅
6. Manager reviews work
7. Manager drags to DONE ✅
   → Shows "Checked by Manager Name"
8. Task is now LOCKED 🔒
9. Cannot move DONE task anywhere ✅
```

### **Example 2: Task Gets Blocked**
```
1. Task in IN PROGRESS
2. Worker discovers missing tools
3. Worker drags to BLOCKED
4. Dialog: "Why is this task blocked?"
5. Worker: "Missing power tools"
6. Red box shows reason ✅
7. Manager orders tools
8. Tools arrive
9. Worker drags BLOCKED → IN PROGRESS ✅
10. Continue work
```

### **Example 3: Backlog to Completion**
```
1. Manager has idea → Creates in BACKLOG
2. Gray box shows "Low Priority" ✅
3. Later, becomes priority
4. Manager drags BACKLOG → TODO ✅
5. Manager assigns workers
6. Worker drags TODO → IN PROGRESS ✅
7. Worker completes
8. Worker drags to IN REVIEW ✅
9. Manager approves
10. Manager drags to DONE ✅
11. Locked forever 🔒
```

### **Example 4: Trying to Cheat (Blocked!)**
```
1. Worker creates task in TODO
2. Worker tries to drag to DONE
   ❌ "Cannot mark as DONE from TODO. Follow the workflow..."
3. Worker tries to drag to IN REVIEW
   ❌ "Cannot move to IN REVIEW from TODO. Work must be started first."
4. Worker tries to drag to BLOCKED
   ❌ "Cannot block tasks in TODO. Assign users and start work first."
5. Worker must follow proper workflow ✅
```

### **Example 5: Backlog Assignment Attempt**
```
1. Task in BACKLOG
2. Manager assigns worker
3. Worker tries to drag to IN PROGRESS
   ❌ "Tasks in BACKLOG can only be moved to TODO..."
4. Manager drags to TODO first ✅
5. Now worker can drag to IN PROGRESS ✅
```

### **Example 6: DONE is Locked**
```
1. Task completed and in DONE
2. Manager realizes mistake
3. Manager tries to drag to IN PROGRESS
   ❌ "Completed tasks cannot be modified. Task is locked."
4. Manager tries to drag to IN REVIEW
   ❌ "Completed tasks cannot be modified. Task is locked."
5. DONE tasks stay DONE forever! 🔒
```

---

## 🎯 Summary of All Rules

| From Status | To Status | Allowed? | Condition |
|------------|-----------|----------|-----------|
| **TODO** | IN PROGRESS | ✅ | Users assigned |
| TODO | IN REVIEW | ❌ | Must work first |
| TODO | BLOCKED | ❌ | Must start first |
| TODO | BACKLOG | ✅ | Always |
| TODO | DONE | ❌ | Must follow workflow |
| **BACKLOG** | TODO | ✅ | Always |
| BACKLOG | IN PROGRESS | ❌ | Go to TODO first |
| BACKLOG | BLOCKED | ❌ | Not started yet |
| BACKLOG | Any other | ❌ | Only to TODO |
| **IN PROGRESS** | IN REVIEW | ✅ | Always |
| IN PROGRESS | BLOCKED | ✅ | With reason |
| IN PROGRESS | TODO | ✅ | Restart |
| IN PROGRESS | DONE | ❌ | Review first |
| **IN REVIEW** | DONE | ✅ | Authorized only |
| IN REVIEW | IN PROGRESS | ✅ | Needs revision |
| IN REVIEW | BLOCKED | ✅ | With reason |
| IN REVIEW | TODO | ❌ | Use IN PROGRESS |
| **BLOCKED** | Any | ✅ | Flexible recovery |
| **DONE** | Any | ❌ | LOCKED! |

---

## 🔒 Key Principles

1. **Sequential Workflow** - Must follow: TODO → IN PROGRESS → IN REVIEW → DONE
2. **No Skipping** - Cannot jump stages (e.g., TODO → DONE)
3. **DONE is Final** - Completed tasks are locked forever
4. **Backlog is Separate** - Must go through TODO to enter workflow
5. **Only Active Work Can Block** - IN PROGRESS and IN REVIEW only
6. **Reviewer Approval** - DONE requires authorized approval
7. **Assignment Required** - Cannot start without assigned users

**The kanban board now enforces professional project management workflow!** 🎉
