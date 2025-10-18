# 🔒 STRICT WORKFLOW RULES - FINAL

## ✅ IMPLEMENTED: NO GOING BACK!

### **Core Principle: Once Assigned, Forward Only!**

```
BACKLOG ← → TODO (only if NO assignments)
           ↓
    [Assign Workers] ← ONE-WAY DOOR!
           ↓
      IN PROGRESS (LOCKED in workflow - cannot go back!)
           ↓
      IN REVIEW (all workers must complete)
           ↓
        DONE 🔒 (only managers/assigned builder)
```

---

## 🚫 STRICT RULES

### **Rule 1: TODO Can NEVER Come Back Once Assigned**

**The Moment You Assign Workers:**
```
✅ Before Assignment:
   TODO ← → BACKLOG (can move freely)

❌ After Assignment:
   TODO is LOCKED OUT forever!
   Task must continue in workflow
```

**Test:**
```
1. Task in TODO
2. Assign 2 workers
3. Move to IN PROGRESS
4. Try to move back to TODO

❌ Error: "Cannot move back to TODO - Task has assigned users. Once assigned, task must stay in workflow."
```

**Why:** Once work is assigned, it's active. No going back to planning!

---

### **Rule 2: IN PROGRESS Cannot Go Back to TODO**

**Once in IN PROGRESS:**
```
✅ Can go to:
   - IN REVIEW (if all complete)
   - BLOCKED (with reason)

❌ Cannot go to:
   - TODO (locked out!)
   - BACKLOG (active work!)
```

**Test:**
```
1. Task in IN PROGRESS
2. Try to drag to TODO

❌ Error: "Cannot move back to TODO - Task has assigned users..."
```

**Why:** Work is started. Can't reset to planning stage!

---

### **Rule 3: ALL Workers Must Complete Before IN REVIEW**

**Team Progress Required:**
```
3 workers assigned:
✅ Worker A: Complete
✅ Worker B: Complete
⏳ Worker C: Working

Try IN REVIEW → ❌ "2/3 completed"

Worker C completes ✅
Try IN REVIEW → ✅ Success!
```

**Test:**
```
1. Assign 3 workers
2. Only 2 mark complete
3. Try to move to IN REVIEW

❌ Error: "Cannot move to review - Not all workers finished. 2/3 completed."
```

---

### **Rule 4: Only Managers & Assigned Builder Can Mark DONE**

**Who Can Approve:**
- ✅ Admin
- ✅ Captain
- ✅ Manager
- ✅ Builder (ONLY if assigned as reviewer in reportTo)
- ❌ Worker (NEVER, even if assigned as reviewer)

**Test:**
```
Task in IN REVIEW

Worker tries to mark DONE:
❌ Error: "Only Admins, Captains, Managers, or assigned Builder reviewer can mark tasks as DONE"

Manager marks DONE:
✅ Success! Shows "Checked by Manager Name"

Builder (assigned reviewer) marks DONE:
✅ Success! Shows "Checked by Builder Name"
```

---

### **Rule 5: Workers Cannot Be Reviewers**

**Assignment Rules:**
```
✅ Can assign as reviewer:
   - Admin
   - Captain
   - Manager
   - Builder

❌ Cannot assign as reviewer:
   - Worker (even if assigned, cannot approve DONE)
```

---

## 📊 Complete Workflow Paths

### **Path 1: Normal Task (Successful)**

```
1. Create task → TODO
2. Drag TODO ← → BACKLOG (planning stage, OK)
3. Back to TODO
4. Assign 3 workers ← ONE-WAY DOOR!
5. Assign Builder as reviewer
6. Drag to IN PROGRESS ✅
   ❌ Can NEVER go back to TODO now!
7. Workers complete their parts (3/3)
8. Drag to IN REVIEW ✅
9. Builder/Manager marks DONE ✅
10. Shows "Checked by [Name]" ✅
11. Task LOCKED 🔒
```

### **Path 2: Try to Go Back (BLOCKED)**

```
1. Task in TODO
2. Assign workers
3. Move to IN PROGRESS
4. Try to move back to TODO
   ❌ "Cannot move back to TODO - Task has assigned users..."
5. Try to move to BACKLOG
   ❌ "Cannot move to BACKLOG - Task has assigned users..."
6. Task MUST continue forward!
```

### **Path 3: Incomplete Team (BLOCKED)**

```
1. Task in IN PROGRESS
2. 3 workers assigned
3. Only 2 complete work
4. Try to move to IN REVIEW
   ❌ "2/3 completed"
5. Must wait for 3rd worker
6. 3rd completes ✅
7. Now can move to IN REVIEW ✅
```

### **Path 4: Worker Tries to Approve (BLOCKED)**

```
1. Task in IN REVIEW
2. Worker assigned as reviewer
3. Worker tries to mark DONE
   ❌ "Only Admins, Captains, Managers, or assigned Builder..."
4. Only Manager/Builder can approve!
```

---

## 🎯 Status Transition Table

| From Status | To Status | Condition | Allowed? |
|-------------|-----------|-----------|----------|
| **TODO** | BACKLOG | No assignments | ✅ |
| TODO | IN PROGRESS | Has assignments | ✅ |
| TODO | IN REVIEW | Any | ❌ |
| TODO | BLOCKED | Any | ❌ |
| **BACKLOG** | TODO | Always | ✅ |
| BACKLOG | IN PROGRESS | Any | ❌ |
| BACKLOG | Others | Any | ❌ |
| **IN PROGRESS** | TODO | Any | ❌ NEVER! |
| IN PROGRESS | BACKLOG | Any | ❌ NEVER! |
| IN PROGRESS | IN REVIEW | All workers complete | ✅ |
| IN PROGRESS | BLOCKED | With reason | ✅ |
| **IN REVIEW** | DONE | Manager/Builder only | ✅ |
| IN REVIEW | IN PROGRESS | Needs revision | ✅ |
| IN REVIEW | BLOCKED | With reason | ✅ |
| IN REVIEW | TODO | Any | ❌ |
| **DONE** | Any | Any | ❌ LOCKED! |

---

## 🚨 Critical Error Messages

### **Cannot Go Back:**
```
❌ "Cannot move back to TODO - Task has assigned users. Once assigned, task must stay in workflow."
```

### **Team Not Complete:**
```
❌ "Cannot move to review - Not all workers finished. 2/3 completed."
```

### **Worker Cannot Approve:**
```
❌ "Only Admins, Captains, Managers, or assigned Builder reviewer can mark tasks as DONE"
```

### **Need Assignments:**
```
❌ "Cannot start task - No users assigned yet. Please assign users first."
```

### **Can Only Move to TODO from BACKLOG:**
```
❌ "Can only move to TODO from BACKLOG"
```

---

## ✅ Quick Checklist

- [ ] **TODO → BACKLOG** (no assignments) ✅
- [ ] **BACKLOG → TODO** ✅
- [ ] **TODO + Assign → IN PROGRESS** ✅
- [ ] **IN PROGRESS → TODO** ❌ BLOCKED!
- [ ] **IN PROGRESS → BACKLOG** ❌ BLOCKED!
- [ ] **IN PROGRESS → IN REVIEW** (all workers done) ✅
- [ ] **IN REVIEW → DONE** (manager only) ✅
- [ ] **Worker cannot approve DONE** ❌ BLOCKED!
- [ ] **DONE → anywhere** ❌ LOCKED!

---

## 🎯 Summary: The ONE-WAY Door

```
┌──────────────────────────────────────┐
│  PLANNING STAGE (can go back)        │
│  ================================     │
│                                      │
│  BACKLOG ← → TODO                    │
│                                      │
└──────────────────────────────────────┘
               ↓
        [Assign Workers]
               ↓
┌──────────────────────────────────────┐
│  ⚠️  ONE-WAY DOOR - NO RETURN! ⚠️    │
└──────────────────────────────────────┘
               ↓
┌──────────────────────────────────────┐
│  EXECUTION STAGE (forward only)      │
│  ================================     │
│                                      │
│  IN PROGRESS → IN REVIEW → DONE      │
│  (Can never go back to TODO!)        │
│                                      │
└──────────────────────────────────────┘
```

**Key Concept:**
- **Before assignments:** Flexible (TODO ← → BACKLOG)
- **After assignments:** One-way (forward only!)
- **Once started:** Cannot return to planning

**This ensures tasks progress forward and don't get stuck in limbo!** 🎉
