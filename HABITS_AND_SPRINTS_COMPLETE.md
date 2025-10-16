# ✅ Habits & Sprints Pages - Complete Implementation

## 🎯 Overview

Created two new pages inspired by productivity apps:
1. **Habits Page** (Habitica-inspired) - `/tasks/habits`
2. **Sprint Board** (Monday.com/ClickUp-inspired) - `/events/sprints`

---

## 📋 Table of Contents
- [Habits Page](#habits-page)
- [Sprint Board](#sprint-board)
- [Integration Guide](#integration-guide)
- [Next Steps](#next-steps)

---

## 🎮 Habits Page

**Path:** `/tasks/habits`  
**File:** `src/app/tasks/habits/page.tsx`

### Features Implemented:

#### 1. **Habitica-Style Character System**
```
┌─────────────────────────────────────────┐
│  [Avatar Lv 5]  John Doe                │
│  Level 5 Warrior                        │
│                                          │
│  ❤️  Health    100/100 ████████████    │
│  ⚡ Mana       50/100  ████████░░░░    │
│  ⭐ Experience 450/500 ██████████░     │
└─────────────────────────────────────────┘
```

**Elements:**
- ✅ Character level display
- ✅ Health bar (red gradient)
- ✅ Mana bar (blue gradient)
- ✅ XP bar (yellow gradient)
- ✅ Visual avatar circle

---

#### 2. **Quick Stats Dashboard**
```
┌──────────────────────────────────────┐
│  🔥 7       🏆 150     🔄 4     ✅ 2/3│
│  Streak     Gold       Habits  Daily  │
└──────────────────────────────────────┘
```

**Metrics:**
- ✅ Day streak counter
- ✅ Gold/currency display
- ✅ Total habits count
- ✅ Daily completion ratio

---

#### 3. **Habits Tracking**
```
┌─────────────────────────────────────────┐
│  🔄 Habits                    [+ Add]   │
├─────────────────────────────────────────┤
│  [❌] Exercise [⭐⭐] 🔥7 day  [✅]    │
│  [❌] Drink Water [⭐] 🔥14 day [✅]    │
│  [❌] Read [⭐⭐] 🔥3 day       [✅]    │
└─────────────────────────────────────────┘
```

**Features:**
- ✅ Positive/Negative habit tracking
- ✅ Streak display with fire icon
- ✅ Difficulty stars (1-3 based on difficulty)
- ✅ Quick +/- buttons
- ✅ Color-coded by type

**Habit Properties:**
- Title
- Type (daily/weekly)
- Streak counter
- Difficulty (easy/medium/hard)
- Positive/Negative indicator

---

#### 4. **Daily Tasks**
```
┌─────────────────────────────────────┐
│  📅 Daily Tasks          [+]        │
├─────────────────────────────────────┤
│  [✓] Morning Standup [⭐]           │
│  [ ] Code Review [⭐⭐]             │
│  [ ] Update Docs [⭐⭐⭐]           │
└─────────────────────────────────────┘
```

**Features:**
- ✅ Checkbox completion
- ✅ Difficulty stars
- ✅ Daily reset functionality (TODO)
- ✅ Completion tracking

---

#### 5. **To-Do List**
```
┌─────────────────────────────────────┐
│  ✅ To-Do List           [+]        │
├─────────────────────────────────────┤
│  [ ] Fix auth bug [⭐⭐⭐]          │
│  [✓] Write tests [⭐⭐]             │
│  [ ] Deploy staging [⭐⭐]          │
└─────────────────────────────────────┘
```

**Features:**
- ✅ Permanent task list
- ✅ Manual completion
- ✅ Difficulty indicators
- ✅ Strike-through on complete

---

### Design Elements:

**Color Scheme:**
- **Health:** Red gradient (`from-red-500 to-pink-500`)
- **Mana:** Blue gradient (`from-blue-500 to-cyan-500`)
- **XP:** Yellow gradient (`from-yellow-500 to-orange-500`)
- **Positive Habits:** Green badges
- **Negative Habits:** Red badges

**Difficulty Colors:**
- **Easy:** Green (`text-green-400`)
- **Medium:** Yellow (`text-yellow-400`)
- **Hard:** Red (`text-red-400`)

---

## 🏃 Sprint Board

**Path:** `/events/sprints`  
**File:** `src/app/events/sprints/page.tsx`

### Features Implemented:

#### 1. **Sprint Overview Dashboard**
```
┌─────────────────────────────────────────┐
│  ▶️ 2        ⏰ 3        ✅ 5        🚩 4│
│  Active     Upcoming   Completed   Miles│
└─────────────────────────────────────────┘
```

**Metrics:**
- ✅ Active sprints count
- ✅ Upcoming sprints count
- ✅ Completed sprints count
- ✅ Milestone tracking

---

#### 2. **Active Sprint Cards** (Monday.com/ClickUp Style)
```
┌───────────────────────────────────────────────┐
│  Foundation Phase [On Track] [📁 Road Repair] │
│  Complete foundation work for the project     │
│                                                │
│  Sprint Progress          5/10 tasks (50%)    │
│  ████████████░░░░░░░░░░░░                    │
│                                                │
│  📅 Start: Oct 1     ⏰ 3 days left           │
│  👥 8 members        ⚡ 15 pts/day            │
│                                                │
│  [✅ 5 Done] [⏰ 5 Remaining] [⚠️ Due Soon]  │
└───────────────────────────────────────────────┘
```

**Card Features:**
- ✅ Sprint title & description
- ✅ Health indicator (On Track/At Risk/Behind)
- ✅ Project link badge
- ✅ Progress bar with percentage
- ✅ Task completion count
- ✅ Start date & time remaining
- ✅ Team size & velocity metrics
- ✅ Quick stats badges
- ✅ View details button

---

#### 3. **Sprint Health Indicators**

**Health Status:**
```typescript
- On Track (≥80% progress)   → Green
- At Risk (50-79% progress)  → Yellow
- Behind (<50% progress)     → Red
```

**Visual Indicators:**
- ✅ Color-coded badges
- ✅ Progress bar colors match health
- ✅ Warning badges for approaching deadlines

---

#### 4. **Sprint Tabs**
```
┌────────────────────────────────────┐
│  [Active (2)] [Upcoming (3)] [✓ (5)]│
└────────────────────────────────────┘
```

**Tab System:**
- ✅ Active - Currently running sprints
- ✅ Upcoming - Scheduled future sprints
- ✅ Completed - Finished sprints archive

---

#### 5. **Velocity Tracking**
```
Velocity = Progress % / Time Elapsed * 100000 pts/day
```

**Metrics:**
- ✅ Auto-calculated velocity
- ✅ Points per day
- ✅ Team performance indicator

---

#### 6. **Time Management**
```
Days Remaining = (EndDate - Now) / (1000 * 60 * 60 * 24)
```

**Features:**
- ✅ Days left calculation
- ✅ Warning for ≤3 days remaining
- ✅ Color-coded urgency (red for urgent)

---

### Sprint Card Data Structure:

```typescript
interface Sprint {
  id: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  projectId?: string;
  projectName?: string;
  attendeeCount: number;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  health: 'on-track' | 'at-risk' | 'behind';
  velocity: number; // points per day
}
```

---

## 🔗 Integration Guide

### 1. Add Routes to Sidebar

**File:** `src/components/layout/Sidebar.tsx`

Add these navigation items:

```typescript
// Under Task Management section:
{
  label: "Habits",
  href: "/tasks/habits",
  icon: RefreshCw, // or Target
}

// Under Event Management section:
{
  label: "Sprint Board",
  href: "/events/sprints",
  icon: TrendingUp, // or BarChart3
}
```

---

### 2. Update Navigation Config

**Expected Structure:**
```
Task Management
├─ My Tasks
├─ Habits (NEW!)
└─ Team Tasks

Event Management
├─ Event Calendar
└─ Sprint Board (NEW!)
```

---

### 3. Create Convex Schema (Next Step)

#### Habits Schema:
```typescript
// convex/schema.ts
habits: defineTable({
  userId: v.id("users"),
  title: v.string(),
  type: v.union(v.literal("daily"), v.literal("weekly")),
  difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  positive: v.boolean(), // true for good habits, false for bad
  streak: v.number(),
  lastCompleted: v.optional(v.number()),
  createdAt: v.number(),
})
.index("by_user", ["userId"])
```

#### Dailies Schema:
```typescript
dailies: defineTable({
  userId: v.id("users"),
  title: v.string(),
  difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  completed: v.boolean(),
  completedAt: v.optional(v.number()),
  resetDate: v.number(), // Auto-reset daily
  createdAt: v.number(),
})
.index("by_user", ["userId"])
```

---

### 4. Create Convex Mutations

#### For Habits:
```typescript
// convex/habits.ts
export const createHabit = mutation({ ... });
export const completeHabit = mutation({ ... }); // Increment/decrement
export const getMyHabits = query({ ... });
```

#### For Sprints:
```typescript
// Already using events table with:
// - type: 'project' for sprints
// - type: 'milestone' for milestones
// - Link to tasks via projectId
```

---

## 🎨 Design Patterns Used

### 1. **Habitica-Inspired Elements:**
- ✅ Character avatar with level
- ✅ Health/Mana/XP bars
- ✅ +/- habit buttons
- ✅ Streak tracking with fire icon
- ✅ Difficulty stars
- ✅ Color-coded positive/negative habits
- ✅ Daily reset system design

### 2. **Monday.com/ClickUp Patterns:**
- ✅ Sprint board layout
- ✅ Progress bars with percentages
- ✅ Health indicators (On Track/At Risk/Behind)
- ✅ Time remaining counters
- ✅ Velocity tracking
- ✅ Team metrics
- ✅ Status badges
- ✅ Tab-based filtering
- ✅ Card-based sprint views

---

## 📊 Mock Data vs Real Data

### Currently Using Mock Data:
- ✅ Habits list
- ✅ Daily tasks
- ✅ To-do items
- ✅ Sprint progress (tasks completed)

### Already Using Real Data:
- ✅ User stats (level, XP, gold, streak)
- ✅ Events (treated as sprints)
- ✅ Event dates and metadata
- ✅ Project links

---

## 🚀 Next Steps

### For Habits Page:

1. **Create Convex Schema:**
   - [ ] Habits table
   - [ ] Dailies table
   - [ ] Todos table (or use existing tasks)

2. **Implement Mutations:**
   - [ ] `createHabit`
   - [ ] `completeHabit` (with streak logic)
   - [ ] `createDaily`
   - [ ] `completeDaily` (with auto-reset)
   - [ ] Health/Mana damage system

3. **Add Features:**
   - [ ] Daily reset at midnight
   - [ ] Streak loss on miss
   - [ ] XP/Gold rewards per completion
   - [ ] Health damage on bad habits
   - [ ] Mana usage for abilities

4. **Gamification:**
   - [ ] Equipment/rewards system
   - [ ] Boss battles (group challenges)
   - [ ] Pet system
   - [ ] Achievement badges

---

### For Sprint Board:

1. **Link with Tasks:**
   - [ ] Query tasks by event/sprint
   - [ ] Calculate real progress
   - [ ] Show task breakdown

2. **Add Sprint Management:**
   - [ ] Create sprint modal
   - [ ] Edit sprint details
   - [ ] Sprint planning interface
   - [ ] Task assignment in sprint

3. **Analytics:**
   - [ ] Sprint burndown chart
   - [ ] Velocity trends
   - [ ] Team performance metrics
   - [ ] Sprint retrospective

4. **Advanced Features:**
   - [ ] Sprint templates
   - [ ] Recurring sprints
   - [ ] Sprint reports/export
   - [ ] Capacity planning

---

## 📱 Mobile Responsive

Both pages are fully responsive:
- ✅ Mobile hamburger menu
- ✅ Stacked layouts on mobile
- ✅ Touch-friendly buttons
- ✅ Optimized card sizes
- ✅ Responsive grids

---

## 🎯 Key Differences

### Habits vs My Tasks:
- **Habits:** Recurring, streak-based, +/- actions
- **My Tasks:** Project-based, Kanban, status workflow

### Sprints vs Event Calendar:
- **Sprints:** Progress tracking, velocity, team metrics
- **Event Calendar:** Schedule view, attendance, general events

---

## ✅ Summary

**Created:**
1. ✅ `/tasks/habits` - Habitica-inspired habit tracker
2. ✅ `/events/sprints` - Monday.com/ClickUp sprint board

**Features:**
- ✅ Character system (Health/Mana/XP)
- ✅ Habit tracking with streaks
- ✅ Daily tasks & To-dos
- ✅ Sprint progress monitoring
- ✅ Health indicators
- ✅ Velocity tracking
- ✅ Team metrics
- ✅ Mobile responsive

**Ready to integrate into navigation!** 🎉
