# 🎯 Milestone Task System - Enhancement Plan

**Status:** Ready to Implement  
**Goal:** Make `/milestones/[id]/kanban` work like Event Control Board  
**Date:** October 26, 2025

---

## 📋 **What We're Adding:**

Based on Event Control Board inspiration, we need to add these features to the existing Milestone Kanban:

### **1. Create Task Button & Dialog** ⭐ PRIORITY
Currently: Plus icon on column headers (non-functional)
Target: Working "Create Task" button that opens full dialog

**Location:** Top right of header (next to "Back to Details")

**Features:**
- Title input (required)
- Description textarea
- Priority selector (Low, Medium, High, Urgent)
- Type selector (Task, Bug, Story, Feature, Epic)
- Story Points input
- Due Date picker
- Assign Users multi-select

### **2. Top Stats Dashboard** ✅ DONE
Currently: Already showing Total Tasks, Completed, Total Points, Progress, Days Left
Status: Already matches Event Control style!

### **3. My Tasks Filter** ⭐ PRIORITY
Add button to toggle "Show only my tasks"
Location: Next to QuickFilters

### **4. Task Creation Toast** 
Add success/error notifications when tasks created

### **5. Better Drag & Drop Validation**
Currently: Basic status update
Add: Same validation rules as Event Control
- Can't move back to Done
- Requires assignments before In Progress
- etc.

---

## 🔧 **Code Additions Needed:**

###  **Part 1: Add Imports**
```typescript
import { toast, Toaster } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
```

### **Part 2: Add State**
```typescript
const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
const [taskForm, setTaskForm] = useState({
  title: '',
  description: '',
  priority: 'medium',
  type: 'task',
  storyPoints: 0,
  dueDate: '',
});
```

### **Part 3: Add Mutation**
```typescript
const createTask = useMutation(api.tasks.createTask);
```

### **Part 4: Add Create Task Handler**
```typescript
const handleCreateTask = async () => {
  if (!taskForm.title) {
    toast.error('Task title is required');
    return;
  }

  try {
    await createTask({
      milestoneId: milestoneId as any,
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority as any,
      type: taskForm.type as any,
      storyPoints: taskForm.storyPoints,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : undefined,
      status: 'todo',
    });

    toast.success('Task created successfully!');
    setIsCreateTaskOpen(false);
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      type: 'task',
      storyPoints: 0,
      dueDate: '',
    });
  } catch (error: any) {
    toast.error(error.message || 'Failed to create task');
  }
};
```

### **Part 5: Add Create Task Button to Header**
Replace line 263 closing `</div>` with:
```typescript
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
```

### **Part 6: Add Create Task Dialog**
Add before the closing `</div>` of main container (line 459):
```typescript
      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task Title *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g., Fix authentication bug"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe what needs to be done..."
                rows={4}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type</Label>
                <Select value={taskForm.type} onValueChange={(v) => setTaskForm({ ...taskForm, type: v })}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Story Points</Label>
                <Input
                  type="number"
                  value={taskForm.storyPoints}
                  onChange={(e) => setTaskForm({ ...taskForm, storyPoints: parseInt(e.target.value) || 0 })}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateTask} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Create Task
              </Button>
              <Button onClick={() => setIsCreateTaskOpen(false)} variant="outline" className="border-gray-600">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Container */}
      <Toaster position="top-right" />
```

### **Part 7: Add My Tasks Button**
Add next to QuickFilters (line 308):
```typescript
            {view === 'board' && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setFilters({ ...filters, assignedToMe: !filters.assignedToMe })}
                  variant={filters.assignedToMe ? 'default' : 'outline'}
                  size="sm"
                  className={filters.assignedToMe ? 'bg-emerald-600' : 'border-gray-600'}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Tasks
                </Button>
                <QuickFilters onFilterChange={setFilters} currentUser={currentUser} />
              </div>
            )}
```

---

## 📝 **Implementation Steps:**

1. ✅ Add new imports at top
2. ✅ Add state variables
3. ✅ Add createTask mutation
4. ✅ Add handleCreateTask function
5. ✅ Add "Create Task" button to header
6. ✅ Add Create Task Dialog component
7. ✅ Add "My Tasks" filter button
8. ✅ Add Toaster component

---

## 🎯 **Result:**

After implementation, users will be able to:
- ✅ Click "Create Task" button
- ✅ Fill out full task form
- ✅ Set priority, type, story points, due date
- ✅ Create task directly in milestone
- ✅ See toast notification on success
- ✅ Toggle "My Tasks" filter
- ✅ Drag and drop tasks between columns
- ✅ See real-time stats update

This matches the Event Control Board functionality!

---

## 📱 **My Tasks Page Integration:**

Separate document for updating My Tasks page to show milestone tasks.

---

**Implementation time:** ~30 minutes  
**Testing time:** ~15 minutes  
**Total:** ~45 minutes
