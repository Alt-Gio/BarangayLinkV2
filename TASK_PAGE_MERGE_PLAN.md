# 🎯 Unified Task Management Page - Integration Plan

**Date:** Oct 21, 2025  
**Goal:** Merge `/tasks/my-tasks` and `/tasks/my-duties` into one comprehensive task management page

---

## 📋 Current State Analysis

### **My Tasks Page** (`/tasks/my-tasks`)
**Features:**
- ✅ Kanban board view (todo, in_progress, review, completed)
- ✅ Project tasks display
- ✅ User stats (gamification)
- ✅ Filter by priority
- ✅ Filter by project
- ✅ Search functionality
- ✅ Visual board layout

**Limitations:**
- ❌ Doesn't show event tasks
- ❌ No due date visibility
- ❌ No quick action buttons
- ❌ Limited task details

### **My Duties Page** (`/tasks/my-duties`)
**Features:**
- ✅ Shows BOTH event tasks AND project tasks
- ✅ Card-based list view
- ✅ Comprehensive stats (total, event, project, upcoming)
- ✅ Filter by priority, status, overdue
- ✅ Sort by due date, priority, status
- ✅ Shows event details and due dates
- ✅ Progress bars
- ✅ Quick action buttons (Start, Complete)
- ✅ Overdue highlighting
- ✅ Event urgency indicators

**Limitations:**
- ❌ No Kanban board view
- ❌ Less visual organization

---

## 🎯 Unified Page Goals

**Primary Objectives:**
1. ✅ Show ALL tasks in one place (event + project)
2. ✅ Make it clear what needs immediate action
3. ✅ Provide multiple view options (list, kanban, cards)
4. ✅ Comprehensive filtering and sorting
5. ✅ Quick actions for task management
6. ✅ Mobile-optimized
7. ✅ Clear priority and urgency indicators

---

## 📱 New Unified Page Structure

### **1. Header & Stats Dashboard**
```
┌─────────────────────────────────────────────────┐
│ 📋 My Tasks                                      │
│ All your tasks from events and projects          │
├─────────────────────────────────────────────────┤
│ [Total]  [Event]  [Project]  [Overdue]  [Today] │
│   42       18        24         3         8      │
└─────────────────────────────────────────────────┘
```

### **2. View Toggle & Filters**
```
┌─────────────────────────────────────────────────┐
│ [List View] [Kanban View] [Card View]           │
├─────────────────────────────────────────────────┤
│ [Search...] [Priority▼] [Status▼] [Sort▼]      │
│ [□ Overdue Only] [Clear Filters]                │
└─────────────────────────────────────────────────┘
```

### **3. Task Display Areas**
**List View:**
- Event Tasks (with quick actions)
- Project Tasks (with links)
- Sorted by urgency/due date

**Kanban View:**
- Columns: To Do | In Progress | Review | Done
- Drag & drop support
- Mix of event and project tasks

**Card View:**
- Grid layout
- Detailed task cards
- Progress indicators

---

## 🔧 Technical Implementation

### **Data Sources:**
```typescript
// Event tasks
const myEventTasks = useQuery(api.eventControl.getMyEventTasks);

// Project tasks
const myProjectTasks = useQuery(api.gamifiedTasks.getMyProjectTasks);

// User stats
const userStats = useQuery(api.gamifiedTasks.getUserStats, {});
```

### **Unified Task Interface:**
```typescript
interface UnifiedTask {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: number;
  type: 'event' | 'project';
  
  // Event-specific
  event?: {
    _id: string;
    title: string;
    startDate: number;
  };
  progress?: number;
  estimatedHours?: number;
  
  // Project-specific
  projectId?: string;
  projectName?: string;
  
  // Common
  creator?: {
    name: string;
    imageUrl?: string;
  };
}
```

### **View States:**
```typescript
const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'cards'>('list');
const [filterPriority, setFilterPriority] = useState<string>('all');
const [filterStatus, setFilterStatus] = useState<string>('all');
const [filterType, setFilterType] = useState<'all' | 'event' | 'project'>('all');
const [showOverdueOnly, setShowOverdueOnly] = useState(false);
const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
```

---

## 🎨 UI Components

### **Stats Cards:**
- Total Tasks
- Event Tasks
- Project Tasks
- Overdue Tasks
- Due Today

### **Task Card:**
```
┌────────────────────────────────────┐
│ [Event Badge] or [Project Badge]    │
│                                     │
│ Task Title                          │
│ Description...                      │
│                                     │
│ [Priority] [Status] [Due Date]     │
│ ━━━━━━━━━━ 65% Progress            │
│                                     │
│ [Start] [Complete] [View Details]  │
└────────────────────────────────────┘
```

### **Kanban Column:**
```
┌─────────────────┐
│  To Do (12)     │
├─────────────────┤
│ [Task Card]     │
│ [Task Card]     │
│ [Task Card]     │
│ ...             │
└─────────────────┘
```

---

## 📊 Features Matrix

| Feature | My Tasks | My Duties | Unified |
|---------|----------|-----------|---------|
| Event Tasks | ❌ | ✅ | ✅ |
| Project Tasks | ✅ | ✅ | ✅ |
| Kanban View | ✅ | ❌ | ✅ |
| List View | ❌ | ✅ | ✅ |
| Card View | ❌ | ❌ | ✅ |
| Quick Actions | ❌ | ✅ | ✅ |
| Due Dates | ❌ | ✅ | ✅ |
| Progress Bars | ❌ | ✅ | ✅ |
| Overdue Filter | ❌ | ✅ | ✅ |
| Priority Filter | ✅ | ✅ | ✅ |
| Status Filter | ❌ | ✅ | ✅ |
| Type Filter | ❌ | ❌ | ✅ |
| Sort Options | ❌ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ |
| Mobile Optimized | ✅ | ✅ | ✅ |

---

## 🚀 Implementation Steps

### **Step 1: Update /tasks/my-tasks/page.tsx**
1. ✅ Add event tasks query
2. ✅ Create unified task interface
3. ✅ Add view mode toggle
4. ✅ Merge stats from both pages
5. ✅ Add comprehensive filters
6. ✅ Implement all three views

### **Step 2: Deprecate /tasks/my-duties**
1. Add redirect to unified page
2. Update navigation links
3. Add deprecation notice

### **Step 3: Update Navigation**
1. Update sidebar links
2. Update dashboard links
3. Remove duplicate menu items

---

## 📝 File Changes

### **Files to Modify:**
1. `/src/app/tasks/my-tasks/page.tsx` - Main unified page
2. `/src/app/tasks/my-duties/page.tsx` - Add redirect
3. `/src/components/layout/Sidebar.tsx` - Update links
4. Navigation components - Update menu items

### **Files to Create:**
1. `/src/components/tasks/TaskCard.tsx` - Reusable task card
2. `/src/components/tasks/KanbanColumn.tsx` - Kanban column component
3. `/src/components/tasks/TaskFilters.tsx` - Unified filters

---

## 🎯 Success Criteria

✅ User can see ALL tasks in one place  
✅ Clear visual distinction between event and project tasks  
✅ Multiple view options available  
✅ Overdue tasks are highlighted  
✅ Quick actions work for event tasks  
✅ Filters work correctly  
✅ Mobile-responsive  
✅ No duplicate tasks shown  
✅ Fast and performant  
✅ Easy to understand what needs to be done

---

## 📱 Mobile Considerations

- Sticky stats bar
- Collapsible filters
- Swipeable kanban columns
- Touch-friendly action buttons
- Responsive grid layouts
- Bottom action sheet for mobile

---

**Ready to implement!** 🚀
