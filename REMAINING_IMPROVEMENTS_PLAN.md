# 🎯 Remaining Project Improvements - Implementation Plan

## ✅ **COMPLETED (4/14):**
1. ✅ Fix task assignment to use Convex user IDs
2. ✅ Update all task queries for array assignedTo
3. ✅ Fix all TypeScript errors (21 errors fixed)
4. ✅ Add Budget tab with expense tracking + ₱ Peso

---

## 🔄 **PENDING (10/14):**

### **5. Fix Task Dropdown Visibility (White Text Issue)**

**Problem**: Dropdown text appears white on white background - hard to read

**Files to Fix**:
- Task creation forms
- Difficulty dropdowns
- Priority dropdowns
- Category dropdowns

**Solution**:
```tsx
// Change from:
<select className="bg-white text-white">

// To:
<select className="bg-gray-900 text-white border-gray-700">
```

**Specific Changes**:
- Add `bg-gray-900` or `bg-gray-800` to all select elements
- Ensure `text-white` for visibility
- Add `border border-gray-700` for better definition

---

### **6. Add Edit Button to Project Details (Overview Tab)**

**Location**: `/projects/[id]` - Overview tab, Project Details section

**Requirements**:
- Add "Edit Project" button next to title
- Inline editing for:
  - Title
  - Description
  - Department
  - Start Date / End Date
  - Location
  - Priority
  - Budget

**Implementation**:
```tsx
const [isEditing, setIsEditing] = useState(false);
const updateProject = useMutation(api.projects.updateProject);

// Toggle edit mode
// Show form with pre-filled values
// Save button to update
```

---

### **7. Filter Upcoming Events (Project-Only)**

**Location**: Overview tab - "Upcoming Events" section

**Current**: Shows ALL upcoming events
**Needed**: Show only events linked to THIS project

**Fix**:
```tsx
// BEFORE:
const upcomingEvents = useQuery(api.events.getUpcomingEvents);

// AFTER:
const projectEvents = useQuery(api.events.getProjectEvents, { 
  projectId: project._id 
});

const upcomingEvents = projectEvents?.filter(e => 
  new Date(e.startDate) > new Date()
);
```

---

### **8. Improve Team Display**

**Location**: Overview tab - Team section

**Current**: "1 members" text only
**Needed**: Full team cards with:

```
┌────────────────────────────────┐
│ 👤 John Doe         [LEAD] 👑 │
│ Project Manager               │
│ ────────────────────────────  │
│ 📋 Assigned: 15 tasks         │
│ ✅ Completed: 12 tasks        │
│ 📊 Rate: 80%                  │
│ ████████░░░░                  │
└────────────────────────────────┘
```

**Implementation**:
- Query team members with task stats
- Show avatar, name, role
- Display task completion rate
- Add leadership badges
- Progress bars for each member

---

### **9. Multiple Task Assignments (Team Members Only)**

**Location**: Tasks tab - Create/Edit task forms

**Current**: Single user dropdown
**Needed**: Multi-select dropdown showing ONLY project team members

**Implementation**:
```tsx
// Get project team
const teamMembers = useQuery(api.users.getProjectTeamMembers, {
  projectId: project._id
});

// Multi-select component
<MultiSelect
  options={teamMembers.map(m => ({
    value: m._id,
    label: `${m.name} - ${m.position}`
  }))}
  value={selectedAssignees}
  onChange={setSelectedAssignees}
  className="bg-gray-900 text-white"
/>
```

---

### **10. Tasks in My Tasks Page**

**Location**: `/tasks/my-tasks`

**Current**: May not show project tasks
**Needed**: Show ALL tasks where user is assigned (including project tasks)

**Fix**: Ensure queries check assignedTo array
```tsx
// In convex/gamifiedTasks.ts or similar
const myTasks = allTasks.filter(t => 
  t.assignedTo.includes(currentUser._id)
);
```

Already fixed in backend - just verify frontend displays them.

---

### **11. Auto-Label Documents**

**Location**: Documents tab - Upload functionality

**Current**: Manual labeling
**Needed**: Auto-link to project + set internal

**Implementation**:
```tsx
const handleUpload = async (file) => {
  await uploadDocument({
    ...fileData,
    projectId: project._id, // Auto-link
    category: "project-docs",
    isPublic: false, // Internal by default
    accessLevel: "internal",
    tags: [project.title, project.department],
  });
};
```

**Files to Update**:
- `DocumentUpload.tsx` or similar
- Pass projectId from parent
- Set defaults

---

### **12. Project-Specific Event Creation**

**Location**: Events tab

**Current**: Shows event list only (or generic creation)
**Needed**: 
- "Create Event" button in Events tab
- Modal/form that auto-fills projectId
- Events show in main events page with project label

**Implementation**:
```tsx
// In ProjectEventsTab.tsx
<Button onClick={() => setShowCreateModal(true)}>
  + Create Project Event
</Button>

<CreateEventModal
  projectId={project._id}
  projectName={project.title}
  onClose={() => setShowCreateModal(false)}
/>
```

**Auto-fill**:
- projectId
- type: "project"
- isPublic: false (internal)
- Add project tag

---

### **13. Improve Team Tab**

**Location**: Team tab (full redesign)

**Current**: Basic display
**Needed**: 
- Add team member button
- Member cards with:
  - Avatar + Name + Role
  - Tasks assigned/completed
  - Completion rate %
  - Progress bar
  - Leadership badges (👑 for lead)
  - Remove button (admin only)

**Layout**:
```
┌─────────────────────────────────────┐
│ + Add Team Member           [Admin] │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 👤 John Doe              👑 LEAD     │
│ Project Manager                      │
│ ──────────────────────────────────   │
│ 📋 15 tasks  ✅ 12 done  📊 80%     │
│ ████████░░░░░░                       │
│ Last active: 2 hours ago             │
│ [View Profile] [Remove]              │
└──────────────────────────────────────┘
```

**Features**:
- Add/remove team members
- Show real-time stats
- Leadership identification
- Activity tracking

---

### **14. Replace $ with ₱ (Peso)**

**Scope**: Entire application
**Current**: Some places use $ symbol
**Needed**: ALL currency displays use ₱

**Files to Check**:
```
src/components/projects/
src/components/dashboards/
src/app/projects/
src/app/admin/
Any financial displays
```

**Find & Replace**:
```tsx
// BEFORE:
`$${amount.toLocaleString()}`
<DollarSign />

// AFTER:
formatPeso(amount)  // Using our helper
₱{amount.toLocaleString()}
```

**Create Global Helper**:
```tsx
// src/lib/formatters.ts
export const formatPeso = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};
```

**Icons**: Replace `<DollarSign />` with text `₱` or create PesoIcon component

---

## 📋 **Implementation Priority:**

### **Quick Wins** (30 min each):
1. ✅ Fix dropdown visibility (#5) - CSS fixes
2. ✅ Filter events (#7) - Query change
3. ✅ Auto-label documents (#11) - Props passing
4. ✅ Replace $ with ₱ (#14) - Find & replace

### **Medium Tasks** (1-2 hours each):
5. ✅ Add edit button to project details (#6)
6. ✅ Project event creation (#12)
7. ✅ Tasks in My Tasks (#10) - Verification

### **Complex Features** (2-3 hours each):
8. ✅ Improve team display (#8)
9. ✅ Multiple task assignments (#9)
10. ✅ Improve team tab (#13)

---

## 🎯 **Estimated Total Time:**

- Quick wins: 2 hours
- Medium tasks: 4 hours  
- Complex features: 7 hours
- **Total: ~13 hours of development**

---

## 🚀 **Next Actions:**

**Batch 1 (Quick Wins)**:
- Fix dropdown styles
- Filter project events
- Auto-label documents
- Currency symbol changes

**Batch 2 (Medium)**:
- Edit project details
- Event creation
- Task page verification

**Batch 3 (Complex)**:
- Team displays
- Multi-assignment
- Team tab redesign

---

## 📝 **Testing Checklist:**

After each implementation:
- [ ] Feature works as described
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Proper permissions
- [ ] Data saves correctly
- [ ] UI looks good

---

**Ready to proceed with Batch 1 (Quick Wins)?**
