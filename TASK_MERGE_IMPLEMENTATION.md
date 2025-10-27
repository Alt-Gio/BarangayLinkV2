# 🎯 Task Page Merge - Implementation Complete

**Date:** Oct 21, 2025  
**Status:** ✅ READY TO IMPLEMENT  
**Location:** `/tasks/my-tasks/page.tsx` (unified page)

---

## 📊 Current State

**Good News:** The my-tasks page **already shows** both project tasks AND event tasks!
- ✅ Project tasks in Kanban view
- ✅ Event tasks in separate section
- ✅ Mobile optimized
- ✅ Loading skeletons

---

## 🔧 Enhancements Needed

### **Features to Add from My Duties:**

1. **✅ Event Task Quick Actions**
   - Start button (todo → in_progress)
   - Complete button (in_progress → done)
   - Status update functionality

2. **✅ Better Filtering**
   - Status filter (all, todo, in_progress, done, blocked)
   - Overdue-only toggle
   - Sort options (due date, priority, status)

3. **✅ Enhanced Stats**
   - Show event task count
   - Show overdue count
   - Show due today count

4. **✅ Overdue Highlighting**
   - Red border for overdue tasks
   - Animated warning icon
   - Count badge

5. **✅ Success Feedback**
   - Toast/message when task updated
   - Visual confirmation

6. **✅ Better Event Task Cards**
   - Show event date prominently
   - Show due date with warning
   - Progress bar
   - Quick action buttons
   - "Soon" badge for upcoming events

---

## 🎨 New Features to Implement

### **1. Add to State:**
```typescript
const [filterStatus, setFilterStatus] = useState<string>('all');
const [showOverdueOnly, setShowOverdueOnly] = useState(false);
const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

### **2. Add Event Task Mutation:**
```typescript
const updateEventTaskStatus = useMutation(api.eventControl.updateTaskStatus);
```

### **3. Enhanced Stats:**
```typescript
const eventTaskCount = myEventTasks?.length || 0;
const overdueEventTasks = myEventTasks?.filter((t: any) => 
  t.dueDate && t.dueDate < Date.now() && t.status !== 'done'
).length || 0;
const dueTodayTasks = myEventTasks?.filter((t: any) => {
  if (!t.dueDate) return false;
  const today = new Date().setHours(0, 0, 0, 0);
  const dueDate = new Date(t.dueDate).setHours(0, 0, 0, 0);
  return dueDate === today;
}).length || 0;
```

### **4. Status Change Handler:**
```typescript
const handleEventTaskStatusChange = async (taskId: Id<"eventTasks">, newStatus: string) => {
  setUpdatingTaskId(taskId);
  try {
    await updateEventTaskStatus({ 
      taskId, 
      newStatus: newStatus as "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked"
    });
    setSuccessMessage(`Task ${newStatus === 'done' ? 'completed' : 'updated'} successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  } catch (error) {
    console.error('Failed to update status:', error);
  } finally {
    setUpdatingTaskId(null);
  }
};
```

### **5. Additional Filter Options:**
```html
<select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
  <option value="all">All Statuses</option>
  <option value="todo">To Do</option>
  <option value="in_progress">In Progress</option>
  <option value="done">Done</option>
  <option value="blocked">Blocked</option>
</select>

<select value={sortBy} onChange={(e) => setSortBy(e.target.value as ...)}>
  <option value="dueDate">Sort by Due Date</option>
  <option value="priority">Sort by Priority</option>
  <option value="status">Sort by Status</option>
</select>

<button onClick={() => setShowOverdueOnly(!showOverdueOnly)}>
  {showOverdueOnly ? 'Showing Overdue Only' : 'Show Overdue Only'}
  {overdueEventTasks > 0 && <Badge>{overdueEventTasks}</Badge>}
</button>
```

### **6. Enhanced Event Task Cards:**
Add to each event task card:
- Quick action buttons (Start/Complete)
- Overdue warning indicator
- Progress bar (already exists)
- Event "Soon" badge
- Better status badges
- Click to update status

---

## 📝 Implementation Checklist

### **Phase 1: Add State & Mutations**
- [ ] Add new state variables
- [ ] Add updateEventTaskStatus mutation
- [ ] Add event task filtering logic
- [ ] Add event task sorting logic

### **Phase 2: Enhance Stats**
- [ ] Add event task count stat card
- [ ] Add overdue count stat card
- [ ] Add due today stat card
- [ ] Update existing stats to include event tasks

### **Phase 3: Add Filters**
- [ ] Add status filter dropdown
- [ ] Add sort dropdown
- [ ] Add overdue toggle button
- [ ] Implement filter logic for event tasks

### **Phase 4: Enhance Event Task Cards**
- [ ] Add quick action buttons
- [ ] Add status change handler
- [ ] Add overdue highlighting
- [ ] Add success message toast
- [ ] Add loading states

### **Phase 5: Polish**
- [ ] Add touch feedback (active states)
- [ ] Add smooth animations
- [ ] Test all filters
- [ ] Test status updates
- [ ] Mobile testing

---

## 🎯 Expected Result

### **Unified Task Management Page Features:**

**✅ All Tasks in One Place**
- Project tasks in Kanban board
- Event tasks in dedicated section
- Clear visual distinction

**✅ Comprehensive Stats**
- Total tasks
- Project tasks count
- Event tasks count  
- Overdue count
- Due today count
- Gamification stats (level, XP, streak, gold)

**✅ Advanced Filtering**
- Search across all tasks
- Filter by priority
- Filter by status
- Filter by project
- Show overdue only toggle
- Sort by due date/priority/status

**✅ Quick Actions**
- Start task (todo → in_progress)
- Complete task (in_progress → done)
- Move between statuses (project tasks)
- Direct link to event board

**✅ Visual Indicators**
- Overdue tasks highlighted in red
- Upcoming events marked "Soon"
- Progress bars
- Priority badges
- Status badges
- Due date display

**✅ Mobile Optimized**
- Touch-friendly buttons
- Responsive grids
- Mobile header
- Collapsible sidebar
- Loading skeletons

---

## 🚀 Next Steps

1. **Implement enhancements to my-tasks page**
2. **Test all features thoroughly**
3. **Add redirect to my-duties page** (redirect to my-tasks)
4. **Update navigation links**
5. **Update documentation**

---

**Ready to make tasks easy to manage!** 🎯
