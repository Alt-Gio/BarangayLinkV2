# 🎯 Project & Task System - Comprehensive Improvement Plan

## ✅ **COMPLETED:**

### 1. Task Assignment Schema Update
- ✅ Changed `assignedTo` from single ID to array: `v.array(v.id("users"))`
- ✅ Updated `createTask` mutation to accept multiple assignees
- ✅ Ready for multiple team member assignments

---

## 🔄 **IN PROGRESS:**

### 2. Task Query Updates
**Issue**: All queries using `assignedTo` need updates for array handling

**Files to Update**:
- `convex/gamifiedTasks.ts` - Multiple queries
- `convex/tasks.ts` - Task queries
- Frontend components using task queries

**Changes Needed**:
```typescript
// OLD (single ID):
.filter((q) => q.eq(q.field("assignedTo"), userId))

// NEW (array contains):
.collect().then(tasks => tasks.filter(t => t.assignedTo.includes(userId)))
```

---

## 📋 **PENDING CHANGES:**

### 3. Project Details - Edit Functionality
**Location**: `/projects/[id]` - Overview Tab

**Requirements**:
- Add "Edit Project" button next to project title
- Make project details editable inline
- Fields to edit:
  - Title
  - Description  
  - Department
  - Start Date / End Date
  - Location
  - Priority
  - Budget

**Implementation**:
```typescript
const [isEditingDetails, setIsEditingDetails] = useState(false);
const updateProject = useMutation(api.projects.updateProject);
```

---

### 4. Upcoming Events Filter
**Current**: Shows all upcoming events
**Needed**: Show only events linked to current project

**Implementation**:
```typescript
const projectEvents = useQuery(api.events.getProjectEvents, {
  projectId: project._id
});

// Filter for upcoming only
const upcomingEvents = projectEvents?.filter(e => 
  new Date(e.startDate) > new Date()
);
```

---

### 5. Team Display Improvements
**Current**: Simple "1 members" text
**Needed**: Full team visualization with:
- Name
- Role/Position
- Contribution % or tasks completed
- Leadership badge for project lead
- Progress indicators

**Design**:
```
┌────────────────────────────────┐
│ 👤 John Doe         [LEAD]     │
│ Project Manager               │
│ ████████░░ 80% Complete       │
│ 12 tasks completed            │
└────────────────────────────────┘
```

---

### 6. Task Tab - Team Member Dropdown
**Issues**:
1. ❌ Trying to assign Clerk IDs instead of Convex IDs
2. ❌ White dropdown text (invisible)
3. ❌ Not filtering to team members only
4. ❌ No multiple assignment support

**Solutions**:
```typescript
// Get project team members
const teamMembers = useQuery(api.users.getProjectTeamMembers, {
  projectId: project._id
});

// Multiselect dropdown
<MultiSelect
  options={teamMembers.map(m => ({
    value: m._id, // Convex user ID
    label: m.name
  }))}
  className="bg-gray-800 text-white" // Fix white text
  onChange={setSelectedAssignees}
/>
```

---

### 7. Task Reflection in My Tasks
**Needed**: Tasks assigned to user show in `/tasks/my-tasks`

**Query Update**:
```typescript
// In convex/gamifiedTasks.ts
export const getMyTasks = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    const tasks = await ctx.db
      .query("tasks")
      .collect();
    
    // Filter where user is in assignedTo array
    return tasks.filter(t => 
      t.assignedTo.includes(user._id)
    );
  }
});
```

---

### 8. Documents Tab - Auto Labeling
**Current**: Manual labeling
**Needed**: Automatic project association

**Implementation**:
```typescript
const handleUpload = async (file) => {
  await createDocument({
    projectId: project._id, // Auto-link
    category: "project-docs",
    isPublic: false, // Internal by default
    accessLevel: "internal",
    tags: [project.title, project.department]
  });
};
```

---

### 9. Events Tab - Project-Specific Creation
**Current**: Generic event page
**Needed**: Project-context event creation

**Features**:
- Create button opens modal
- Auto-fills `projectId`
- Auto-adds project tag
- Events visible in main events page with project label

**UI**:
```
┌─────────────────────────────────┐
│ + Create Project Event          │
│                                 │
│ [Similar to main event page]    │
│ BUT:                            │
│ - Project: Road Drainage (auto) │
│ - Type: project (auto)          │
│ - Internal by default           │
└─────────────────────────────────┘
```

---

### 10. Team Tab - Progress & Identification
**Needed**:
- Add Team Member button
- Show member cards with:
  - Avatar
  - Name
  - Role/Position
  - Tasks assigned: X
  - Tasks completed: Y
  - Completion rate: Z%
  - Leadership badges
- Remove team member (admin only)

**Card Design**:
```
┌──────────────────────────────────────┐
│ 👤                    [TEAM LEAD] 👑 │
│ John Doe                             │
│ Project Manager                      │
│ ────────────────────────────────── │
│ 📋 Assigned: 15 tasks                │
│ ✅ Completed: 12 tasks               │
│ 📊 Rate: 80%                         │
│ ████████░░░░░░                       │
│                                      │
│ Recent: Fixed bug in API             │
│ [View Details] [Remove]              │
└──────────────────────────────────────┘
```

---

### 11. **NEW TAB: Budget** 💰
**Location**: Add to tabs (Overview, Tasks, Documents, Events, Team, Settings, **Budget**)

**Features**:
- Add expense button
- List of expenses
- Total budget used
- Budget remaining
- Category breakdown
- Export to Excel

**Schema**:
```typescript
expenses: defineTable({
  projectId: v.id("projects"),
  description: v.string(),
  amount: v.number(),
  category: v.string(),
  date: v.number(),
  receipt: v.optional(v.id("documents")),
  createdBy: v.id("users")
})
```

**UI**:
```
┌─────────────────────────────────────┐
│ Budget Overview                     │
│                                     │
│ Total Budget:    ₱40,000,000.00    │
│ Used:            ₱5,000,000.00      │
│ Remaining:       ₱35,000,000.00     │
│ ████░░░░░░░░░░░░ 12.5%             │
│                                     │
│ + Add Expense                       │
│                                     │
│ Recent Expenses:                    │
│ ─────────────────────────────────  │
│ • Materials      ₱2,500,000.00     │
│ • Labor          ₱1,500,000.00     │
│ • Equipment      ₱1,000,000.00     │
│                                     │
│ [Export] [View Breakdown]           │
└─────────────────────────────────────┘
```

---

### 12. Currency Change: $ → ₱ (Peso)
**Files to Update**:
- All budget displays
- Project cards
- Gamification (gold → peso equivalents?)
- Financial charts
- Reports

**Find & Replace**:
```
Search: \$
Replace: ₱

Locations:
- Project budget displays
- Expense tracking
- Financial reports
- Dashboard stats
```

---

### 13. Settings Tab Improvements
**Current**: Basic settings
**Needed**: Enhanced controls

**Features to Add**:
- Archive project
- Change project lead
- Update team permissions
- Project visibility settings
- Notification preferences
- Danger zone (delete project)

---

## 🎯 **IMPLEMENTATION ORDER:**

### Phase 1 (Critical - Do First):
1. ✅ Fix task assignment schema
2. 🔄 Update all task queries
3. Fix dropdown visibility (white text)
4. Fix team member selection

### Phase 2 (Core Features):
5. Add edit functionality to project details
6. Filter events for project only
7. Improve team display
8. Add budget tab

### Phase 3 (Polish):
9. Auto-label documents
10. Project event creation
11. Team progress tracking
12. Currency symbol changes

### Phase 4 (Enhancement):
13. Settings tab improvements
14. My Tasks integration
15. Leadership indicators

---

## 📝 **KEY CHANGES SUMMARY:**

### Backend (Convex):
- ✅ `schema.ts`: assignedTo → array
- ✅ `gamifiedTasks.ts`: createTask updated
- 🔄 `gamifiedTasks.ts`: queries need array handling
- 📌 `projects.ts`: add expense tracking
- 📌 `events.ts`: project filtering
- 📌 `users.ts`: team member queries

### Frontend:
- 📌 Project detail page: edit mode
- 📌 Task creation: multiselect for assignees
- 📌 Team tab: complete redesign
- 📌 Budget tab: new component
- 📌 Documents: auto-labeling
- 📌 Events: project context
- 📌 All $  → ₱

---

## 🚀 **NEXT STEPS:**

1. **Immediate**: Create document explaining task assignment fix
2. **Next**: Update task queries to handle arrays
3. **Then**: Implement budget tracking system
4. **Finally**: Polish UI and add team features

**Would you like me to proceed with implementing these changes systematically?**
