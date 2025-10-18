# 🧪 TEST NEW KANBAN RULES

## ✅ How to Verify All Features Work

### **Test 1: Assignments Block TODO/BACKLOG**

**Steps:**
1. Create a task in TODO
2. Assign 2 workers to it
3. Try to drag task to BACKLOG

**Expected Result:**
```
❌ Error: "Cannot move tasks with assigned users to TODO or BACKLOG. Remove assignments first."
```

**Steps to Move:**
1. Open task
2. Click "Assign" button
3. Remove all workers
4. Now can drag to BACKLOG ✅

---

### **Test 2: Assigned Tasks Can Go to IN PROGRESS**

**Steps:**
1. Create task in TODO
2. Assign 2 workers
3. Drag to IN PROGRESS

**Expected Result:**
```
✅ Success! Task moves to IN PROGRESS
```

No error, task moves freely if workers are assigned.

---

### **Test 3: Team Progress Check**

**Setup:**
1. Create task in TODO
2. Assign 3 workers (Worker A, B, C)
3. Drag to IN PROGRESS

**Test:**
1. Worker A: Click "Clock In" → Work → "Clock Out" → Mark complete
2. Worker B: Click "Clock In" → Work → "Clock Out" → Mark complete  
3. Worker C: Click "Clock In" → Still working (DON'T mark complete)
4. Try to drag task to IN REVIEW

**Expected Result:**
```
❌ Error: "Cannot move to review - Not all workers finished. 2/3 completed."
```

**Continue:**
5. Worker C: "Clock Out" → Mark complete
6. Now try to drag to IN REVIEW

**Expected Result:**
```
✅ Success! Task moves to IN REVIEW (all 3 workers completed)
```

---

### **Test 4: Reviewer Assignment**

**Steps:**
1. Click any task card
2. Task details dialog opens
3. Scroll down to "Reviewer/Checker" section
4. Click "Assign Reviewer" button
5. Select a Builder from dropdown
6. Click "Assign"

**Expected Result:**
```
✅ "Reviewer assigned successfully!"
✅ Shows: "Maria Santos will review this task"
```

---

### **Test 5: Builder Can Approve if Assigned as Reviewer**

**Setup:**
1. Create task
2. Assign workers
3. Assign Builder as reviewer (from Test 4)
4. Workers complete task
5. Move to IN REVIEW

**Test:**
1. Login as the Builder (assigned reviewer)
2. Drag task to DONE

**Expected Result:**
```
✅ Success! Task marked as DONE
✅ Shows: "Checked by [Builder Name]"
```

**Try with Regular Worker:**
1. Login as regular worker (not reviewer)
2. Try to drag task to DONE

**Expected Result:**
```
❌ Error: "Only Admins, Captains, Managers, or the assigned reviewer can mark tasks as DONE"
```

---

### **Test 6: Checked By Visible When Minimized**

**Steps:**
1. Complete a task (mark as DONE)
2. Look at the task card
3. Card should be minimized/collapsed

**Expected Result:**
```
Card shows:
┌──────────────────────────────┐
│ Task Title          ▼ ⋮      │
│ [Done] [High]                │
├──────────────────────────────┤
│ ✅ Checked by Your Name     │ ← This is ALWAYS visible!
└──────────────────────────────┘
```

---

### **Test 7: DONE is Locked**

**Steps:**
1. Find a task that is DONE
2. Try to drag it anywhere

**Expected Result:**
```
❌ Error: "Completed tasks cannot be modified. Task is locked."
```

Cannot move DONE tasks at all. They are permanently locked! 🔒

---

### **Test 8: BACKLOG Can Only Go to TODO**

**Steps:**
1. Create task in BACKLOG
2. Assign workers
3. Try to drag to IN PROGRESS

**Expected Result:**
```
❌ Error: "Tasks in BACKLOG can only be moved to TODO. Move to TODO first, then assign users."
```

**Correct Flow:**
1. Drag from BACKLOG to TODO ✅
2. Now can drag to IN PROGRESS ✅

---

## 📋 Quick Test Checklist

- [ ] **Rule 1:** Assigned tasks blocked from TODO/BACKLOG
- [ ] **Rule 2:** Assigned tasks can go to IN PROGRESS
- [ ] **Rule 3:** Team must complete before IN REVIEW (shows count)
- [ ] **Rule 4:** Can assign reviewer in details
- [ ] **Rule 5:** Builder/reviewer can approve DONE
- [ ] **Rule 6:** "Checked by" shows when minimized
- [ ] **Rule 7:** DONE tasks are locked
- [ ] **Rule 8:** BACKLOG only goes to TODO

---

## 🔧 If Something Doesn't Work

### **Refresh the Page**
The code changes are client-side. Try:
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear cache and reload

### **Check Console for Errors**
1. Press F12
2. Go to Console tab
3. Look for any red errors

### **Verify Assignment Status**
For team progress check:
1. Make sure workers actually marked their work complete
2. Check in "Assigned Users" section
3. Should show "Completed" status

---

## ✅ Expected Workflow

### **Complete Team Task:**
```
1. Create Task (TODO)
2. Assign 3 workers
3. Assign Builder as reviewer
4. Drag to IN PROGRESS ✅

5. Worker A completes (1/3)
6. Worker B completes (2/3)
7. Try IN REVIEW → ❌ Error "2/3 completed"

8. Worker C completes (3/3)
9. Drag to IN REVIEW ✅

10. Builder (reviewer) drags to DONE ✅
11. Shows "Checked by Builder Name" ✅
12. Task locked forever 🔒
```

### **Task with No Assignments:**
```
1. Create Task (TODO)
2. Don't assign anyone
3. Drag to BACKLOG ✅
4. Drag back to TODO ✅
5. Try to drag to IN PROGRESS → Error (need assignments)
```

### **Task Being Moved Back:**
```
1. Task in IN PROGRESS (has 2 workers)
2. Try to drag to TODO → ❌ "Remove assignments first"
3. Remove assignments
4. Drag to TODO ✅
```

---

## 🎯 All Validation Messages

| Action | Expected Error |
|--------|----------------|
| Move assigned task to TODO | "Cannot move tasks with assigned users to TODO or BACKLOG..." |
| Move assigned task to BACKLOG | "Cannot move tasks with assigned users to TODO or BACKLOG..." |
| Move to IN REVIEW (not all complete) | "Cannot move to review - Not all workers finished. 2/3 completed." |
| Worker tries to mark DONE | "Only Admins, Captains, Managers, or the assigned reviewer can mark tasks as DONE" |
| Move DONE task anywhere | "Completed tasks cannot be modified. Task is locked." |
| BACKLOG to IN PROGRESS | "Tasks in BACKLOG can only be moved to TODO..." |
| TODO to BLOCKED | "Cannot block tasks in TODO..." |

**Test each one to verify they all work!** ✅
