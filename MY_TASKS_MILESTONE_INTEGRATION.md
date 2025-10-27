# 📋 My Tasks - Milestone Integration Guide

**File:** `src/app/tasks/my-tasks/page.tsx`  
**Goal:** Show milestone tasks alongside project and event tasks  
**Status:** Ready to implement

---

## 📊 **Current Structure:**

My Tasks page currently shows:
1. **Project Tasks** - From `api.gamifiedTasks.getMyProjectTasks`
2. **Event Tasks** - From `api.eventControl.getMyEventTasks`

**We need to add:**
3. **Milestone Tasks** - From milestones the user is assigned to

---

## 🔧 **Changes Needed:**

### **Step 1: Add Milestone Tasks Query**

**Location:** Line 57 (after event tasks query)

**Add:**
```typescript
// Get user's milestone tasks (NEW!)
const myMilestoneTasks = useQuery(api.tasks.getMyMilestoneTasks);
```

**Backend Query Needed:**
Create `api.tasks.getMyMilestoneTasks` that returns:
- All tasks from milestones where user is assigned
- Enriched with milestone info (title, project, deadline)
- Same format as event tasks for consistency

---

### **Step 2: Add Filter Type for Milestones**

**Location:** Line 43

**Change:**
```typescript
// FROM:
const [filterType, setFilterType] = useState<'all' | 'event' | 'project'>('all');

// TO:
const [filterType, setFilterType] = useState<'all' | 'event' | 'project' | 'milestone'>('all');
```

---

### **Step 3: Process Milestone Tasks**

**Location:** After line 149 (after event tasks processing)

**Add:**
```typescript
// Process milestone tasks
const milestoneTasks = myMilestoneTasks || [];

// Filter milestone tasks
let filteredMilestoneTasks = milestoneTasks;

if (searchQuery) {
  filteredMilestoneTasks = filteredMilestoneTasks.filter((task: any) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.milestone?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

if (filterPriority !== 'all') {
  filteredMilestoneTasks = filteredMilestoneTasks.filter((task: any) => 
    task.priority === filterPriority
  );
}

if (filterStatus !== 'all') {
  filteredMilestoneTasks = filteredMilestoneTasks.filter((task: any) => 
    task.status === filterStatus
  );
}
```

---

### **Step 4: Add Filter Type Logic**

**Location:** Find where `filterType` is used (around line 150+)

**Add milestone filtering:**
```typescript
// Apply type filter
if (filterType === 'project') {
  filteredEventTasks = [];
  filteredMilestoneTasks = [];
} else if (filterType === 'event') {
  filteredTasks = [];
  filteredMilestoneTasks = [];
} else if (filterType === 'milestone') {
  filteredTasks = [];
  filteredEventTasks = [];
}
// If 'all', show everything
```

---

### **Step 5: Add Milestone Stats Card**

**Location:** In the stats section (where Level, Experience, Streak are shown)

**Add:**
```typescript
<Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-purple-500/20 rounded-lg">
        <Target className="w-6 h-6 text-purple-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400">Milestone Tasks</p>
        <p className="text-2xl font-bold text-white">
          {filteredMilestoneTasks.length}
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### **Step 6: Add Milestone Column to Kanban**

**Location:** In the Kanban board section

**Add 5th column:**
```typescript
{/* Milestone Tasks Column */}
<div className="bg-white/5 rounded-xl p-4 min-h-[400px]">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Target className="w-5 h-5 text-purple-400" />
      <h3 className="font-semibold text-white">Milestone Tasks</h3>
      <Badge className="bg-purple-500/20 text-purple-300">
        {filteredMilestoneTasks.length}
      </Badge>
    </div>
  </div>
  
  <div className="space-y-3">
    {filteredMilestoneTasks.length === 0 ? (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No milestone tasks</p>
      </div>
    ) : (
      filteredMilestoneTasks.map((task: any) => (
        <TaskCard
          key={task._id}
          task={task}
          type="milestone"
          onUpdate={() => {}}
        />
      ))
    )}
  </div>
</div>
```

---

### **Step 7: Update Filter Buttons**

**Location:** Where filter type buttons are (Project/Event toggle)

**Add Milestone button:**
```typescript
<Button
  onClick={() => setFilterType('milestone')}
  variant={filterType === 'milestone' ? 'default' : 'outline'}
  size="sm"
  className={filterType === 'milestone' ? 'bg-purple-600' : 'border-gray-600'}
>
  <Target className="w-4 h-4 mr-2" />
  Milestones
</Button>
```

---

### **Step 8: Add Milestone Task Card**

**Update TaskCard component to handle milestone tasks:**

```typescript
// Add milestone field to display
{task.type === 'milestone' && task.milestone && (
  <div className="flex items-center gap-1 text-xs text-purple-400">
    <Target className="w-3 h-3" />
    <span>{task.milestone.title}</span>
  </div>
)}

// Add project badge
{task.milestone?.projectName && (
  <Badge className="bg-purple-500/20 text-purple-300 text-xs">
    {task.milestone.projectName}
  </Badge>
)}
```

---

## 📊 **Backend Query Spec:**

### **Create:** `convex/tasks.ts` - `getMyMilestoneTasks`

```typescript
export const getMyMilestoneTasks = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) return [];

    // Get all tasks from all milestones
    const allTasks = await ctx.db.query("tasks").collect();

    // Filter tasks assigned to this user
    const myTasks = allTasks.filter((task) =>
      task.assignedTo && task.assignedTo.includes(user._id)
    );

    // Enrich with milestone and project data
    const enrichedTasks = await Promise.all(
      myTasks.map(async (task) => {
        if (!task.milestoneId) return null;

        const milestone = await ctx.db.get(task.milestoneId);
        if (!milestone) return null;

        const project = milestone.projectId 
          ? await ctx.db.get(milestone.projectId)
          : null;

        return {
          ...task,
          milestone: {
            _id: milestone._id,
            title: milestone.title,
            targetDate: milestone.targetDate,
            projectName: project?.title || 'Unknown Project',
            projectDepartment: project?.department || '',
          },
        };
      })
    );

    // Filter out nulls
    return enrichedTasks.filter(Boolean);
  },
});
```

---

## 🎨 **Visual Design:**

### **Milestone Tasks Column Color:**
- **Background:** `bg-purple-500/10`
- **Border:** `border-purple-500/20`
- **Icon:** Purple `Target` icon
- **Badge:** Purple with count

### **Task Card Milestone Badge:**
- **Color:** Purple
- **Icon:** Target icon
- **Text:** Milestone title + Project name

---

## 📋 **Implementation Checklist:**

- [ ] Create backend query `api.tasks.getMyMilestoneTasks`
- [ ] Add query to My Tasks page
- [ ] Update filterType to include 'milestone'
- [ ] Add milestone task processing
- [ ] Add milestone filter logic
- [ ] Add milestone stats card
- [ ] Add milestone column to Kanban
- [ ] Add milestone filter button
- [ ] Update TaskCard for milestone display
- [ ] Test filtering
- [ ] Test task updates

---

## 🎯 **Expected Result:**

After implementation, users will see:

### **My Tasks Page:**
```
┌─────────────────────────────────────────────────────┐
│  📊 Level 3  ⚡ 180 XP  🔥 5 Day  🎯 12 Milestone  │
└─────────────────────────────────────────────────────┘

[All] [Projects] [Events] [Milestones]

┌────────────┬────────────┬────────────┬─────────────┐
│ To Do      │ In Progress│ In Review  │ Milestone   │
│ 5 tasks    │ 3 tasks    │ 0 tasks    │ 12 tasks    │
│            │            │            │             │
│ [task]     │ [task]     │            │ [milestone] │
│ [task]     │ [task]     │            │ [milestone] │
│            │ [task]     │            │ [milestone] │
└────────────┴────────────┴────────────┴─────────────┘
```

### **Milestone Task Card:**
```
┌─────────────────────────────────────┐
│ 🐛 Fix Authentication Bug           │
│ 5 pts | 🔴 High                     │
│ 🎯 Complete Auth System             │
│ 📁 Website Redesign Project         │
│ 📅 Due: Oct 30, 2025                │
└─────────────────────────────────────┘
```

---

## 🚀 **Benefits:**

1. **Unified View** - All tasks in one place
2. **Better Organization** - Separate column for milestone tasks
3. **Clear Context** - See which milestone/project each task belongs to
4. **Easy Filtering** - Toggle between project/event/milestone tasks
5. **Progress Tracking** - See milestone task completion

---

## ⏱️ **Implementation Time:**

- **Backend Query:** ~15 minutes
- **Frontend Integration:** ~30 minutes
- **Testing:** ~15 minutes
- **Total:** ~60 minutes

---

**This completes the milestone task system integration!** 🎉
