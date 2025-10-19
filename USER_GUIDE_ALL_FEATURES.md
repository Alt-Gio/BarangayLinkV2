# 📚 Complete User Guide - New Features

**Welcome!** This guide shows you how to use all the amazing new features we just added.

---

## 🎯 **Quick Navigation**

**Jump to:**
- [Part 1: JIRA Sprint System](#part-1-jira-sprint-system) (Kanban Board, Backlog, Charts)
- [Part 2: Story Point Gamification](#part-2-story-point-gamification) (Fair XP Rewards)
- [Part 3: Workload Management](#part-3-workload-management) (Prevent Burnout)
- [Part 4: Team Management](#part-4-team-management) (For Managers)

---

# Part 1: JIRA Sprint System

## 🚀 **Getting Started**

### **Step 1: Access the Sprint Board**

1. Open your browser and go to:
   ```
   http://localhost:3000/events/sprints/kanban-full
   ```

2. You'll see the main Sprint Board interface with:
   - Navigation tabs at the top
   - Sprint metrics (if you have an active sprint)
   - The Kanban board or empty state

---

## 📋 **Creating Your First Sprint**

### **Step 2: Create a New Sprint**

1. Click the **"New Sprint"** button (green button, top-right)

2. **Sprint Creation Wizard** opens with 4 steps:

#### **Step 1: Sprint Details**
```
✏️ Sprint Name: Enter a name (e.g., "Sprint 1", "Q1 Planning")
🎯 Sprint Goal: What will you achieve? (e.g., "Complete user authentication")
📁 Link to Project: Optional - select a project to link this sprint
```

**Example:**
```
Name: "Sprint 1 - User Features"
Goal: "Complete login, signup, and profile pages"
Project: "BarangayLink MVP"
```

Click **"Next"** →

#### **Step 2: Sprint Dates**
```
📅 Start Date: When does this sprint begin?
📅 End Date: When does it finish?
```

**Example:**
```
Start Date: October 19, 2025
End Date: November 2, 2025
Duration: 14 days (2-week sprint)
```

**💡 Tips:**
- 1 week sprint = Quick iterations
- 2 week sprint = Industry standard ⭐ (Recommended)
- 3 week sprint = Larger projects

Click **"Next"** →

#### **Step 3: Sprint Capacity**
```
⚡ Capacity: How many story points can your team handle?
```

**Quick Select:**
- **25 points** = Small team (2-3 people)
- **40 points** = Medium team (4-6 people) ⭐ (Common)
- **60 points** = Large team (7+ people)

Or enter a custom number.

**Example:**
```
Capacity: 40 story points
(For a team of 5 people = ~8 points per person)
```

Click **"Next"** →

#### **Step 4: Review**
```
📋 Review all details
✅ Everything looks good?
```

Click **"Create Sprint"** 🎉

**Success!** Your sprint is now created and active!

---

## 📝 **Adding Tasks to Your Sprint**

### **Step 3: Add Tasks from Backlog**

1. Click the **"Backlog"** tab at the top

2. You'll see a list of all unassigned tasks

3. For each task you want to add:
   - Click **"Add to Sprint"** button
   - A dialog appears: **"Estimate Story Points"**

#### **Story Point Selection:**
```
Choose complexity using Fibonacci scale:

1 point  = Trivial (< 1 hour)      Example: Fix typo
2 points = Simple (1-2 hours)      Example: Add button
3 points = Easy (3-4 hours)        Example: Form validation
5 points = Medium (1 day)          Example: New page
8 points = Complex (2-3 days)      Example: Complex feature
13 points = Very complex (1 week)  Example: Large feature
21 points = Epic (TOO BIG!)        Example: Break it down!
```

4. Select the appropriate story points (click a number)

5. Click **"Add to Sprint"**

6. Task now appears in the **"To Do"** column on your board!

**Example:**
```
Task: "Create login page"
Story Points: 5 (medium complexity, ~1 day)
Result: Task added to sprint, worth 100 XP when completed! ✅
```

---

## 🎯 **Using the Kanban Board**

### **Step 4: Manage Tasks with Drag & Drop**

The board has 4 columns:

```
┌─────────┐  ┌──────────────┐  ┌────────────┐  ┌──────┐
│ To Do   │  │ In Progress  │  │ In Review  │  │ Done │
└─────────┘  └──────────────┘  └────────────┘  └──────┘
```

#### **Moving Tasks:**

1. **Start Working:**
   - Click and drag a task from "To Do"
   - Drop it in "In Progress"
   - Status updates automatically! ✅

2. **Ready for Review:**
   - Drag from "In Progress"
   - Drop in "In Review"
   - Your team can review it

3. **Task Complete:**
   - Drag from "In Review"
   - Drop in "Done"
   - **You earn XP and Gold!** 🎉

#### **Task Card Information:**

Each card shows:
```
┌─────────────────────────────┐
│ 📖 TASK-A3F2               │ ← Type icon + ID
│                             │
│ Create user login page      │ ← Title
│                             │
│ ╔═══════════════════════╗   │
│ ║ 5 pts    🚩    👤 You  ║  │ ← Story points, Priority, Assignee
│ ╚═══════════════════════╝   │
└─────────────────────────────┘
```

**Icons:**
- 📖 Story
- 🐛 Bug
- ✅ Task
- 🎯 Epic
- 🚩 High priority flag

---

## 📊 **Tracking Sprint Progress**

### **Step 5: View Sprint Metrics**

At the top of the board, you'll see:

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Points│  Completed  │  Remaining  │  Velocity   │  Days Left  │
│     40      │     15      │     25      │   2.5 pts   │      8      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**What each means:**
- **Total Points:** All story points in sprint
- **Completed:** Points you've finished (in "Done")
- **Remaining:** Points left to do
- **Velocity:** Average points per day (speed)
- **Days Left:** Time remaining in sprint

---

## 📈 **Using the Burndown Chart**

### **Step 6: Monitor Sprint Health**

1. Click **"Burndown"** tab

2. You'll see a chart with two lines:
   - **Gray dashed line** = Ideal progress (where you should be)
   - **Green/Orange line** = Actual progress (where you are)

#### **Reading the Chart:**

```
Points │
  40   │ ╲ ← Ideal (perfect pace)
  30   │  ╲     ┌── Actual (your team)
  20   │   ╲   /
  10   │    ╲ /
   0   │     ╳────────────────────
       └──────────────────────────── Days
         0   3    6    9   12   14
```

**Status Indicators:**

✅ **On Track** (green line below ideal)
```
Great job! You're ahead of schedule.
Keep up the pace!
```

⚠️ **At Risk** (orange line near ideal)
```
You're close to the ideal pace.
Focus on high-priority tasks.
```

🚨 **Behind** (red line above ideal)
```
Warning! Falling behind schedule.
Consider: reducing scope, asking for help, or extending sprint.
```

---

## 🏃 **Checking Team Velocity**

### **Step 7: View Velocity Chart**

1. Click **"Velocity"** tab

2. You'll see a bar chart showing:
   - **Gray bars** = Committed points (what you planned)
   - **Green/Orange bars** = Completed points (what you finished)
   - **Purple dashed line** = Average velocity

#### **Using Velocity for Planning:**

```
Last 3 sprints:
Sprint 1: 35 points completed
Sprint 2: 40 points completed  ← Improving! ✅
Sprint 3: 38 points completed

Average: 38 points
```

**For Next Sprint:**
```
Plan: 38 points (your average)
Or: 35 points (conservative, safe)
Not: 50 points (overcommitting! ❌)
```

---

## 🔍 **Using Filters**

### **Step 8: Find Tasks Quickly**

On the Board tab, use Quick Filters:

#### **Search Bar:**
```
Type: "login"
Result: Shows only tasks with "login" in title/description
```

#### **My Tasks Button:**
```
Click: "My Tasks"
Result: Shows only tasks assigned to you
```

#### **Overdue Button:**
```
Click: "Overdue"
Result: Shows tasks past their due date (red warning)
```

#### **More Filters:**
```
Click: "More Filters"
Select:
  ☑ High Priority
  ☑ Bug Type
  ☐ Story Type
Result: Shows only high-priority bugs
```

---

## 📝 **Editing Task Details**

### **Step 9: View and Edit Tasks**

1. Click on any task card

2. A **details panel** slides in from the right

3. You can:
   - ✏️ Edit title and description
   - 🎯 Change priority (Low, Medium, High, Critical)
   - 📁 Change type (Story, Bug, Task, Epic)
   - ⚡ Update story points (click different number)
   - 🗑️ Delete task

4. Click **"Edit"** to make changes

5. Click **"Save"** when done

---

# Part 2: Story Point Gamification

## 🎮 **Fair XP Rewards System**

### **How Story Points = XP**

Every task now has **story points** that determine XP:

```
┌─────────────┬──────────┬───────────┬─────────────────┐
│ Story Points│    XP    │   Gold    │   Complexity    │
├─────────────┼──────────┼───────────┼─────────────────┤
│   1 point   │   10 XP  │   5 gold  │ Trivial (1hr)   │
│   2 points  │   25 XP  │  12 gold  │ Simple (2hr)    │
│   3 points  │   50 XP  │  25 gold  │ Easy (4hr)      │
│   5 points  │  100 XP  │  50 gold  │ Medium (1 day)  │
│   8 points  │  200 XP  │ 100 gold  │ Complex (3 days)│
│  13 points  │  350 XP  │ 175 gold  │ Large (1 week)  │
│  21 points  │  600 XP  │ 300 gold  │ Epic (break it!)│
└─────────────┴──────────┴───────────┴─────────────────┘
```

### **Example Rewards:**

**Old System (Unfair):**
```
Simple task: 50 XP
Complex task: 50 XP
Same reward? Unfair! 😞
```

**New System (Fair):**
```
Simple task (2 pts): 25 XP
Complex task (8 pts): 200 XP
Fair rewards! 😊
```

---

## 💪 **Earning XP**

### **Step 10: Complete Tasks for XP**

1. Pick a task from "To Do"
2. Drag to "In Progress"
3. Work on it
4. Drag to "Done"
5. **Boom!** XP and Gold added to your profile! 🎉

**Example:**
```
Task: "Build authentication system"
Story Points: 8
Reward: 200 XP + 100 Gold

Your Stats:
Level: 5 → 6 (level up!) 🎊
XP: 450 → 650
Gold: 200 → 300
```

---

# Part 3: Workload Management

## ⚠️ **Prevent Burnout**

### **Step 11: Check Your Daily Workload**

The system automatically tracks how many story points you have today.

#### **Where to See It:**

On the Sprint Board or Dashboard, look for the **Workload Dashboard** widget.

#### **Workload Status:**

```
┌─────────────────────────────────────┐
│  Today's Workload                   │
├─────────────────────────────────────┤
│  📊 5 tasks • 8 story points        │
│  ████████░░░░░░░░░░░░░░ 80%        │ ← Capacity bar
│                                     │
│  ⚠️ Heavy Workload                  │
│  You're near capacity limit.        │
│  Focus on high-priority tasks.      │
└─────────────────────────────────────┘
```

### **Status Levels:**

#### **🟢 Light (0-3 points)**
```
Status: Healthy ✅
Message: "Great day for planning!"
Action: Can take on more work
```

#### **🔵 Normal (4-5 points)**
```
Status: Sustainable ✅
Message: "Normal pace - doing great!"
Action: Good balance
```

#### **🟠 Heavy (6-8 points)**
```
Status: Challenging ⚠️
Message: "Heavy workload - focus on priorities"
Action: Be careful, don't add more
```

#### **🔴 Overloaded (9+ points)**
```
Status: BURNOUT RISK! 🚨
Message: "Critical workload! Delegate or reschedule tasks."
Action: STOP! Too much work!
```

---

## 📅 **Daily Capacity Guide**

### **Recommended Daily Workload:**

```
Perfect Day (5 points):
- 1 × 5pt task (medium)
  OR
- 1 × 3pt task (easy) + 1 × 2pt task (simple)
  
Example:
  ✅ 9am-12pm: Build login form (3 pts)
  ✅ 1pm-3pm: Add validation (2 pts)
  Total: 5 points = Sustainable! ✅
```

```
Heavy Day (8 points):
- 1 × 8pt task (complex)
  OR
- 1 × 5pt + 1 × 3pt task
  
Example:
  ⚠️ 9am-5pm: Complex feature (8 pts)
  Total: 8 points = Push your limit ⚠️
  Can do occasionally, not every day!
```

```
OVERLOADED (13 points):
- DON'T DO THIS! 🚨
  
Example:
  🚨 1 × 8pt + 1 × 5pt task
  Total: 13 points = Burnout!
  
Action: Remove tasks or delegate!
```

---

## 🎯 **Weekly Planning**

### **Step 12: Plan a Sustainable Week**

```
Monday:    5 points (normal)
Tuesday:   5 points (normal)
Wednesday: 3 points (light - meetings)
Thursday:  8 points (heavy - push day)
Friday:    4 points (light - wrap up)
─────────────────────────────────────
Total:    25 points / week = Healthy! ✅
Average:   5 points / day = Perfect pace
```

**Bad Example (Burnout):**
```
Monday:   10 points 🚨
Tuesday:  12 points 🚨
Wednesday: 9 points 🚨
Thursday: 11 points 🚨
Friday:    8 points 🚨
─────────────────────────────────────
Total:    50 points / week = UNSUSTAINABLE! 🚨
Average:  10 points / day = Burnout inevitable!

Result: You'll be exhausted by Wednesday 😞
```

---

## ⚡ **Workload Warnings**

### **Step 13: Respond to Warnings**

The system shows warnings when you're overloaded:

#### **Warning Message:**
```
┌────────────────────────────────────┐
│ ⚠️ High Workload Alert             │
├────────────────────────────────────┤
│ You have 12 story points today     │
│ Recommended maximum: 8 points      │
│                                    │
│ Suggestions:                       │
│ • Delegate 4 points to teammate    │
│ • Move task to tomorrow            │
│ • Extend deadline                  │
│ • Ask manager for help             │
└────────────────────────────────────┘
```

#### **What to Do:**

1. **Review your tasks:**
   - Which are most important?
   - Which can wait?

2. **Take action:**
   - Move low-priority tasks to tomorrow
   - Ask teammate to take a task
   - Talk to manager about scope

3. **Protect yourself:**
   - Don't work overtime
   - Quality > quantity
   - Your health matters!

---

# Part 4: Team Management

## 👥 **For Managers: Team Workload View**

### **Step 14: Monitor Team Health**

1. Go to Sprint Board
2. Look for **"Team Workload"** section (if you're a manager)

#### **Team Overview:**

```
┌─────────────────────────────────────────────────┐
│  Team Workload Overview                         │
├─────────────────────────────────────────────────┤
│  Alice Johnson                     ✅ Healthy   │
│  3 tasks • 5 points                             │
│  ████████░░░░░░░░░░░░ 60% capacity             │
│                                                 │
│  Bob Smith                      🚨 Critical     │
│  8 tasks • 15 points                            │
│  ████████████████████ 120% capacity            │
│  ⚠️ Overloaded! Redistribute tasks             │
│                                                 │
│  Carol Lee                         ✅ Healthy   │
│  4 tasks • 5 points                             │
│  ████████░░░░░░░░░░░░ 60% capacity             │
└─────────────────────────────────────────────────┘
```

### **Status Indicators:**

- **🟢 Healthy:** Under 6 points - can take more
- **🔵 Moderate:** 6-7 points - good pace
- **🟠 Heavy:** 8-9 points - at limit
- **🔴 Critical:** 10+ points - OVERLOADED!

---

## ⚖️ **Balancing Team Workload**

### **Step 15: Redistribute Tasks**

**Problem:**
```
Bob: 15 points (overloaded!) 🚨
Alice: 3 points (underutilized)
```

**Solution:**
```
1. Identify Bob's lowest priority task (5 points)
2. Reassign it to Alice
3. New balance:
   Bob: 10 points (still high, but better)
   Alice: 8 points (full capacity)
```

**How to Reassign:**
1. Open task details
2. Change assignee to Alice
3. Task moves to Alice's list
4. Workload rebalances automatically ✅

---

## 📊 **Team Metrics**

### **Step 16: Track Team Performance**

```
┌────────────────────────────────┐
│  Team Statistics               │
├────────────────────────────────┤
│  Total Points: 40              │
│  Avg per Person: 5 points      │
│  Overloaded: 1 member 🚨       │
│  Healthy: 7 members ✅         │
│                                │
│  Recommendation:               │
│  Redistribute 5 points from    │
│  overloaded member to team     │
└────────────────────────────────┘
```

---

# 🎯 Quick Reference

## **Daily Workflow**

### **Morning (9 AM):**
```
1. Check workload dashboard
2. See today's tasks
3. Prioritize by importance
4. Start with highest priority
```

### **During Day:**
```
1. Drag task to "In Progress"
2. Work on it
3. Drag to "In Review" when done
4. Move to "Done" after review
5. Earn XP! 🎉
```

### **End of Day (5 PM):**
```
1. Update any stuck tasks
2. Check tomorrow's workload
3. Plan next day
4. Log off (don't overwork!)
```

---

## **Sprint Workflow**

### **Sprint Start (Day 1):**
```
1. Create new sprint
2. Add tasks from backlog
3. Estimate story points
4. Distribute to team
5. Start sprint
```

### **During Sprint (Days 2-13):**
```
1. Daily: Move tasks on board
2. Mid-sprint: Check burndown
3. If behind: Reduce scope
4. If ahead: Great job!
```

### **Sprint End (Day 14):**
```
1. Complete sprint
2. Review velocity
3. Calculate team average
4. Plan next sprint
5. Celebrate! 🎉
```

---

## **Story Points Cheat Sheet**

```
┌──────┬──────────┬─────────────────┐
│Points│    XP    │  When to Use    │
├──────┼──────────┼─────────────────┤
│  1   │   10 XP  │ < 1 hour work   │
│  2   │   25 XP  │ 1-2 hours       │
│  3   │   50 XP  │ Half day        │
│  5   │  100 XP  │ Full day        │
│  8   │  200 XP  │ 2-3 days        │
│ 13   │  350 XP  │ 1 week          │
│ 21   │  600 XP  │ Break it down!  │
└──────┴──────────┴─────────────────┘
```

---

## **Capacity Guidelines**

```
Daily:
✅ 0-5 points = Healthy
⚠️ 6-8 points = Heavy
🚨 9+ points = Stop!

Weekly:
✅ 25 points = Perfect
⚠️ 40 points = Maximum
🚨 50+ points = Burnout!
```

---

## **Common Questions**

### **Q: How many points should I aim for per day?**
**A:** 5 points is ideal. Sustainable and productive!

### **Q: What if I have 10 points today?**
**A:** Warning! Delegate tasks or move some to tomorrow.

### **Q: How do I earn more XP?**
**A:** Complete higher story point tasks! 8 points = 200 XP!

### **Q: What if my sprint is falling behind?**
**A:** Check burndown chart. Options:
1. Reduce scope (remove tasks)
2. Extend sprint
3. Ask for help

### **Q: Can I change story points after adding to sprint?**
**A:** Yes! Click task → Update story points → XP recalculates automatically.

---

## **Pro Tips**

### **🌟 Tip 1: Start Small**
```
First sprint: 25 points (conservative)
After you know team velocity: Increase to 35-40
```

### **🌟 Tip 2: Leave Buffer**
```
Team can do 40 points?
Plan for 32 points (20% buffer)
Reason: Unexpected issues happen!
```

### **🌟 Tip 3: High Value First**
```
Do 8-point tasks early in sprint
Leave 1-2 point tasks for end
Reason: Big wins first, easy tasks when tired
```

### **🌟 Tip 4: Daily Check-in**
```
Every morning:
1. Check workload
2. Check burndown
3. Adjust if needed
```

### **🌟 Tip 5: Celebrate Wins**
```
Completed 5-point task? Celebrate!
Sprint finished on time? Team party!
Hit velocity goal? Share success!
```

---

## **Need Help?**

### **Documentation:**
- Full details: `FULL_JIRA_IMPLEMENTATION_COMPLETE.md`
- Story points: `STORY_POINT_GAMIFICATION_COMPLETE.md`
- Troubleshooting: `KANBAN_INTEGRATION_COMPLETE.md`

### **Common Issues:**
- Board not loading? Refresh browser
- Can't drag tasks? Check if sprint is active
- No XP earned? Complete task to "Done" column

---

## 🎉 **You're Ready!**

### **Start Using:**
1. ✅ Create your first sprint
2. ✅ Add tasks with story points
3. ✅ Use the Kanban board
4. ✅ Monitor your workload
5. ✅ Earn fair XP rewards!

### **Remember:**
- 📊 5 points/day = Healthy pace
- 🎯 Story points = Fair XP
- ⚠️ Listen to warnings
- 🎉 Celebrate your progress!

---

**Happy Sprint Planning!** 🚀

Your productivity and wellbeing matter! ❤️
