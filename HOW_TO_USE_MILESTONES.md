# 📖 How to Use the Milestone System - Quick Guide

---

## 🎯 **Quick Overview:**

```
Step 1: Create Project → Step 2: Add Milestones → Step 3: Add Sprint Tasks → Step 4: Work in Sprints!
```

---

## 🚀 **Complete Walkthrough:**

### **STEP 1: Create a Project** (Strategic Planning)

**Where:** `/projects` page

**Action:** Click "Create Project"

**Fill in:**
```
Project Name: "Community Center Renovation"
Description: "Build new community facility"
Budget: $50,000
Timeline: 6 months
Department: Public Works
Priority: High
```

**Click:** "Create Project" ✅

---

### **STEP 2: Add Milestones** (Define Goals)

**Where:** Project Detail Page → **Milestones Tab**

**Action:** Click "Add Milestone"

**Create Milestone #1:**
```
Title: "Foundation Complete"
Description: "All excavation and concrete work finished"
Target Date: 2 weeks from now
```

**Click:** "Create Milestone" ✅

**Repeat for more milestones:**
```
Milestone 2: "Walls Complete" (4 weeks)
Milestone 3: "Electrical Complete" (6 weeks)
Milestone 4: "Final Inspection" (7 weeks)
```

**Result:** You now have 4 clear goals for your project! 🎯

---

### **STEP 3: Add Sprint Tasks to Milestones**

**Where:** Still on Milestones Tab

**For each milestone, click "Add Sprint Task"**

**Example for "Foundation Complete":**

**Task 1:**
```
Title: "Excavate building site"
Description: "Remove topsoil and level ground"
Story Points: 8 (Complex, 2-3 days)
Priority: High
Due Date: (optional)
```
**Click:** "Add Sprint Task" ✅

**Task 2:**
```
Title: "Pour concrete foundation"
Story Points: 8 (Complex)
Priority: High
```

**Task 3:**
```
Title: "Schedule inspection"
Story Points: 2 (Simple, 1-2 hours)
Priority: Medium
```

**Task 4:**
```
Title: "Sign off inspection documents"
Story Points: 3 (Easy, half day)
Priority: Medium
```

**Result:** Milestone has 4 actionable tasks totaling 21 points! ⚡

---

### **STEP 4: View Tasks in Kanban Backlog**

**Where:** Navigate to `/events/sprints/kanban-full`

**Click:** "Backlog" tab

**You'll See:**
```
┌────────────────────────────────────────┐
│ 📋 From Milestone: "Foundation Complete" │
├────────────────────────────────────────┤
│ Excavate building site (8 pts)        │ [Add to Sprint]
│ Pour concrete foundation (8 pts)      │ [Add to Sprint]
│ Schedule inspection (2 pts)           │ [Add to Sprint]
│ Sign off documents (3 pts)            │ [Add to Sprint]
└────────────────────────────────────────┘
```

**These tasks are now ready for sprint planning!** ✅

---

### **STEP 5: Create a Sprint**

**Where:** Still on Kanban page

**Action:** Click "New Sprint" button

**Fill in Sprint Details:**
```
Sprint Name: "Week 1 - Foundation Work"
Goal: "Complete foundation excavation and concrete"
Start Date: Today
End Date: 2 weeks from today
Capacity: 40 story points
```

**Click through all 4 steps → "Create Sprint"** ✅

---

### **STEP 6: Add Tasks to Sprint**

**Where:** Backlog tab

**Action:** For each task, click "Add to Sprint"

**A dialog appears asking for story points:**
```
Already set to 8 points!
Just click "Add to Sprint"
```

**Add these tasks:**
- ✅ Excavate site (8 pts)
- ✅ Pour concrete (8 pts)

**Total:** 16 points (good for a sprint!)

**Result:** Tasks now appear in "To Do" column on board! 🎉

---

### **STEP 7: Work on Sprint Tasks**

**Where:** Board tab (main Kanban view)

**See your board:**
```
┌─────────┐  ┌──────────────┐  ┌───────────┐  ┌──────┐
│ To Do   │  │ In Progress  │  │ In Review │  │ Done │
├─────────┤  ├──────────────┤  ├───────────┤  ├──────┤
│Excavate │  │              │  │           │  │      │
│(8 pts)  │  │              │  │           │  │      │
│         │  │              │  │           │  │      │
│Pour     │  │              │  │           │  │      │
│(8 pts)  │  │              │  │           │  │      │
└─────────┘  └──────────────┘  └───────────┘  └──────┘
```

**Start working:**
1. Drag "Excavate" → "In Progress"
2. Work on it
3. Drag to "Done" when finished
4. **Earn 200 XP + 100 Gold!** 🎮

---

### **STEP 8: Watch Progress Update!**

**What happens when you complete a task:**

**Task Level:**
```
✅ "Excavate site" marked complete
   Reward: +200 XP, +100 Gold
```

**Milestone Level:**
```
Milestone: "Foundation Complete"
Progress: 0% → 25% (1 of 4 tasks done)
Status: In Progress ⏳
```

**Project Level:**
```
Project: "Community Center"
Progress: 0% → 6% (milestone progress)
Status: Active
```

**All automatic!** No manual updates needed! ✨

---

### **STEP 9: Complete the Milestone**

**When all tasks are done:**

```
Milestone "Foundation Complete":
✅ Excavate site (8 pts) - DONE
✅ Pour concrete (8 pts) - DONE
✅ Schedule inspection (2 pts) - DONE
✅ Sign off documents (3 pts) - DONE

Progress: 100% ✅
Status: Completed!
```

**Project updates to 25% (1 of 4 milestones)!** 🎉

---

### **STEP 10: Move to Next Milestone**

**Go back to project → Milestones**

**Now work on Milestone 2: "Walls Complete"**

**Add its tasks to next sprint:**
```
Sprint 2: "Week 3 - Wall Construction"
- Lay concrete blocks (8 pts)
- Install rebar (5 pts)
- Plaster walls (5 pts)
```

**Keep going until project is 100% complete!** 🏆

---

## 💡 **Tips & Tricks:**

### **Tip 1: Mix Milestone & Admin Tasks**
```
Sprint: "Week 1"
├── Excavate site (8 pts) ← From milestone
├── Process requests (3 pts) ← Admin work
└── Submit report (2 pts) ← Admin work

Total: 13 points = Perfect balance!
```

### **Tip 2: Don't Overload Milestones**
```
Good Milestone: 4-6 tasks, 15-30 points
Bad Milestone: 20 tasks, 100 points
```

### **Tip 3: Keep Tasks Small**
```
✅ Max 8 story points per task
❌ No 13 or 21 point tasks!
Break them down into smaller ones.
```

### **Tip 4: Set Realistic Target Dates**
```
Foundation: 2 weeks ✅
Walls: 2 more weeks ✅
Electrical: 2 more weeks ✅

Don't promise "everything in 1 week!" ❌
```

### **Tip 5: Celebrate Milestones!**
```
When milestone hits 100%:
🎉 Team celebration
📊 Review what went well
📝 Plan next milestone
```

---

## 🎯 **Common Workflows:**

### **Workflow 1: New Construction Project**
```
1. Create project with budget & timeline
2. Define 5-7 construction milestones
3. Add 4-6 sprint tasks per milestone
4. Run 2-week sprints
5. Track progress automatically
6. Celebrate completed milestones!
```

### **Workflow 2: Event Planning**
```
1. Create project for event
2. Milestones: Planning → Vendor → Marketing → Execution
3. Add small prep tasks to each
4. Sprint each week leading up
5. Final sprint: Event day tasks
6. Complete project!
```

### **Workflow 3: Community Program**
```
1. Create program project
2. Milestones: Training → Week 1 → Week 2 → Follow-up
3. Add daily tasks
4. Sprint each week
5. Track participant progress
6. Review outcomes
```

---

## ✅ **Quick Reference:**

### **Where to Do What:**

| Action | Location |
|--------|----------|
| Create Project | `/projects` |
| Add Milestones | Project → Milestones Tab |
| Add Sprint Tasks | Milestone → Add Task |
| View Backlog | `/events/sprints/kanban-full` → Backlog |
| Create Sprint | Kanban → New Sprint |
| Work on Tasks | Kanban → Board |
| Check Progress | Project Detail Page |

### **Story Points Guide:**

| Points | Time | Use For |
|--------|------|---------|
| 1 | < 1 hour | Trivial tasks |
| 2 | 1-2 hours | Simple tasks |
| 3 | Half day | Easy tasks |
| 5 | Full day | Medium tasks |
| 8 | 2-3 days | Complex tasks |

---

## 🎉 **You're Ready!**

**Now you can:**
- ✅ Create projects with clear goals
- ✅ Break goals into milestones
- ✅ Add actionable sprint tasks
- ✅ Track progress automatically
- ✅ Complete work efficiently!

**Start with your first project today!** 🚀
