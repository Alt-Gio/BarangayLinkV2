# 🚀 Quick Fixes Implementation Guide

Based on your requirements, here are the quick fixes to implement:

---

## ✅ **1. Fix Dropdown Visibility (White Text Issue)**

### **Problem**: Option text appears white/invisible in dropdowns

### **Solution**: Add explicit styling to select and option elements

### **Files to Fix**:

**Pattern to apply globally:**
```tsx
// For ALL <select> elements, ensure this styling:
<select className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
  <option value="option1" className="bg-gray-900 text-white">Option 1</option>
  <option value="option2" className="bg-gray-900 text-white">Option 2</option>
</select>
```

### **Key CSS Classes**:
- **Select**: `bg-gray-900 border border-gray-700 text-white`
- **Options**: `bg-gray-900 text-white`
- **Focus**: `focus:ring-2 focus:ring-emerald-500`

### **Already Fixed**:
- ✅ `ProjectBudgetTab.tsx` - Category select (line 232)
- ✅ `ProjectEventsTab.tsx` - Event type select (line 170)
- ✅ `ProjectWizard.tsx` - Department select (line 328)

### **Check These**:
- Task creation forms (if any native selects)
- Filter dropdowns
- Settings page selects

---

## ✅ **2. Tasks Reflect in /tasks/my-tasks**

### **Status**: Already Fixed in Backend ✅

### **Verification**:
The backend queries already filter by `assignedTo.includes(userId)`, so tasks should automatically appear.

### **To Verify**:
1. Assign yourself to a project task
2. Navigate to http://localhost:3000/tasks/my-tasks
3. Task should appear in the list

### **If Not Working, Check**:
```tsx
// In the My Tasks page component:
const myTasks = useQuery(api.gamifiedTasks.getGamifiedTasks, {
  userId: currentUser._id  // Make sure this is passed
});

// Backend already filters:
tasks.filter(t => t.assignedTo.includes(userId))
```

---

## ✅ **3. Auto-Label Documents with Project**

### **Location**: Document upload functionality

### **Current Behavior**: Manual labeling

### **Required Behavior**: 
- Auto-link to projectId
- Set to **internal** by default (not public)
- Auto-add project tags

### **Implementation**:

**In Documents Tab Upload (src/components/projects/[wherever document upload is]):**

```tsx
const handleUpload = async (fileData) => {
  await createDocument({
    ...fileData,
    // Auto-link to project
    projectId: project._id,
    
    // Set to internal by default (NOT public)
    isPublic: false,
    accessLevel: "internal",
    
    // Auto-add tags
    tags: [
      project.title,
      project.department,
      "project-document"
    ],
    
    // Category
    category: "project-docs",
  });
};
```

**Exception**: 
- If user is Admin: Allow public option
- If on project page: Always internal

---

## ✅ **4. Project-Specific Event Creation**

### **Location**: Events Tab

### **Current**: Event list only

### **Required**: 
- "Create Event" button
- Auto-fills projectId
- Events visible in main events page with project label

### **Implementation**:

**Update `ProjectEventsTab.tsx`:**

```tsx
// Add to existing create event handler:
const handleCreateEvent = async (e) => {
  e.preventDefault();
  
  await createEvent({
    ...formData,
    // Auto-link to project
    projectId: project._id,
    
    // Set type to project event
    type: "project",
    
    // Internal by default
    isPublic: false,
    
    // Add project tag
    tags: [project.title, `Project: ${project.title}`],
  });
};
```

**Display in Main Events Page:**

```tsx
// In event list, show project badge:
{event.projectId && (
  <Badge className="bg-blue-600">
    📁 {event.project?.title}
  </Badge>
)}
```

---

## ✅ **5. Multiple Team Member Assignment**

### **Status**: Backend Ready ✅

### **Frontend Implementation Needed**:

**Create Multi-Select Component for Team Members:**

```tsx
import { useState } from 'react';

function TeamMemberMultiSelect({ projectId, value, onChange }) {
  const teamMembers = useQuery(api.users.getProjectTeamMembers, {
    projectId
  });
  
  const [selected, setSelected] = useState<Id<"users">[]>(value || []);
  
  const toggleMember = (memberId: Id<"users">) => {
    const newSelected = selected.includes(memberId)
      ? selected.filter(id => id !== memberId)
      : [...selected, memberId];
    
    setSelected(newSelected);
    onChange(newSelected);
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Assign to Team Members *
      </label>
      <div className="space-y-1">
        {teamMembers?.map(member => (
          <label
            key={member._id}
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750"
          >
            <input
              type="checkbox"
              checked={selected.includes(member._id)}
              onChange={() => toggleMember(member._id)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <img
              src={member.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <p className="text-white font-medium">{member.name}</p>
              <p className="text-sm text-gray-400">{member.position}</p>
            </div>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-sm text-emerald-400">
          ✓ {selected.length} team member(s) selected
        </p>
      )}
    </div>
  );
}
```

**Usage in Task Creation:**

```tsx
const [assignedTo, setAssignedTo] = useState<Id<"users">[]>([]);

<TeamMemberMultiSelect
  projectId={project._id}
  value={assignedTo}
  onChange={setAssignedTo}
/>

// On submit:
await createTask({
  ...formData,
  assignedTo: assignedTo, // Array of user IDs
});
```

---

## ✅ **6. Team Tab Improvements**

### **Show Progress & Completion Levels**

```tsx
// For each team member, query their stats:
const getMemberStats = async (memberId: Id<"users">) => {
  const tasks = await ctx.db.query("tasks")
    .collect()
    .then(tasks => tasks.filter(t => 
      t.projectId === projectId &&
      t.assignedTo.includes(memberId)
    ));
  
  const completed = tasks.filter(t => t.status === "completed");
  
  return {
    total: tasks.length,
    completed: completed.length,
    rate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0
  };
};

// Display:
<div className="space-y-3">
  {teamMembers.map(member => (
    <div key={member._id} className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <img src={member.imageUrl} className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <h4 className="text-white font-semibold">{member.name}</h4>
          <p className="text-sm text-gray-400">{member.position}</p>
        </div>
        {member.isLead && (
          <Badge className="bg-yellow-600">👑 Lead</Badge>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-sm mb-2">
        <div>
          <p className="text-gray-500">Assigned</p>
          <p className="text-white font-semibold">{stats.total}</p>
        </div>
        <div>
          <p className="text-gray-500">Completed</p>
          <p className="text-emerald-400 font-semibold">{stats.completed}</p>
        </div>
        <div>
          <p className="text-gray-500">Rate</p>
          <p className="text-blue-400 font-semibold">{stats.rate.toFixed(0)}%</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all"
          style={{ width: `${stats.rate}%` }}
        />
      </div>
    </div>
  ))}
</div>
```

---

## ✅ **7. Settings Tab Improvements**

### **Current**: Basic settings
### **Needed**: Enhanced functionality

**Add These Sections:**

```tsx
// 1. Project Visibility
<div className="space-y-3">
  <h3 className="text-white font-semibold">Project Visibility</h3>
  <label className="flex items-center gap-3">
    <input type="checkbox" checked={isPublic} onChange={...} />
    <span className="text-gray-300">Make project public</span>
  </label>
</div>

// 2. Project Lead
<div className="space-y-3">
  <h3 className="text-white font-semibold">Project Lead</h3>
  <select className="bg-gray-900 text-white...">
    {teamMembers.map(m => <option value={m._id}>{m.name}</option>)}
  </select>
</div>

// 3. Notifications
<div className="space-y-3">
  <h3 className="text-white font-semibold">Notifications</h3>
  <label className="flex items-center gap-3">
    <input type="checkbox" checked={emailOnUpdate} onChange={...} />
    <span className="text-gray-300">Email on task updates</span>
  </label>
</div>

// 4. Danger Zone
<div className="border border-red-500/50 rounded-lg p-4 bg-red-500/10">
  <h3 className="text-red-400 font-semibold mb-3">Danger Zone</h3>
  <Button className="bg-red-600 hover:bg-red-700">
    Archive Project
  </Button>
</div>
```

---

## ✅ **8. Replace $ with ₱ (Peso)**

### **Status**: Mostly Done ✅

### **Global Helper Already Created**:
```tsx
// src/lib/formatters.ts
import { formatPeso } from '@/lib/formatters';

// Usage:
formatPeso(12500) // Returns: "₱12,500.00"
```

### **Files to Check**:

**Search for remaining $ symbols:**
```bash
grep -r "\$" src/components/
grep -r "DollarSign" src/components/
```

**Replace Pattern:**
```tsx
// BEFORE:
$${amount.toLocaleString()}
<DollarSign className="w-4 h-4" />

// AFTER:
{formatPeso(amount)}
₱  {/* Just use the symbol */}
```

**Already Fixed**:
- ✅ Budget tab (all ₱)
- ✅ Project detail page budget display (line 268, 321, 323)

---

## 🎯 **Implementation Checklist:**

### **Quick Fixes (30 min each)**:
- [ ] Verify dropdown styling (check all selects have proper classes)
- [ ] Test My Tasks page (should already work)
- [ ] Add auto-labeling to document upload
- [ ] Scan for remaining $ symbols

### **Medium Fixes (1 hour each)**:
- [ ] Add multi-select for team member assignment
- [ ] Improve team tab with stats
- [ ] Enhance settings tab

### **Already Complete**:
- [x] Budget tab with ₱ Peso
- [x] Backend supports multiple assignments
- [x] Event creation in Events tab
- [x] Most ₱ Peso formatting

---

## 📝 **Testing After Implementation**:

1. **Dropdowns**: Open each dropdown - text should be clearly visible
2. **My Tasks**: Assign yourself to project task - should appear
3. **Documents**: Upload from project page - should be internal + tagged
4. **Events**: Create event from project - should link to project
5. **Team Assignment**: Select multiple team members - should save
6. **Currency**: Check all money displays - should show ₱

---

## ✨ **Quick Reference**:

### **Dropdown Fix**:
```tsx
className="bg-gray-900 border border-gray-700 text-white"
```

### **Auto-Label Documents**:
```tsx
projectId: project._id,
isPublic: false,
tags: [project.title]
```

### **Multi-Select Pattern**:
```tsx
assignedTo: [userId1, userId2, userId3]
```

### **Peso Format**:
```tsx
import { formatPeso } from '@/lib/formatters';
{formatPeso(amount)}
```

---

**All patterns are established - just need to apply them across components!** ✅
