# Project Management System - Setup Guide

## 🚀 Quick Start

You now have a **professional-grade project management system** integrated into your BarangayLink application!

---

## ✅ What's Been Implemented

### 1. **Enhanced Database Schema** (`convex/schema.ts`)
- ✅ Extended `projects` table with:
  - Approval workflow fields
  - Success criteria tracking
  - Milestone management
  - Gamification rewards
  - Impact assessment
  - Status history
  - Enhanced visibility controls

### 2. **Backend API** (`convex/`)
- ✅ **`projectsEnhanced.ts`** - Complete project lifecycle management
  - `createProject` - 6-step wizard data processing
  - `reviewProject` - Approval/rejection workflow
  - `startProject` - Activate approved projects
  - `updateProjectProgress` - Auto and manual progress tracking
  - `completeMilestone` - Track milestone achievements
  - `completeProject` - Finish and distribute XP rewards
  - `getProjectDetails` - Full project data with stats
  - `getProjectsByStatus` - Filtered project lists
  - `getPendingApprovals` - For managers

- ✅ **`eventsEnhanced.ts`** - Event integration
  - `createProjectEvent` - Schedule project events
  - `getProjectEvents` - Event listing
  - `getUpcomingEvents` - Calendar view
  - `getEventsInRange` - Date filtering
  - `markEventAttendance` - Track attendance
  - `sendEventReminder` - Automated reminders

### 3. **Frontend Components** (`src/components/projects/`)
- ✅ **`ProjectWizard.tsx`** - 6-step creation wizard
  - Step 1: Basic Info (title, description, department)
  - Step 2: Timeline & Priority (dates, urgency)
  - Step 3: Budget & Impact (resources, beneficiaries)
  - Step 4: Success Criteria (measurable goals)
  - Step 5: Milestones (phased approach)
  - Step 6: Visibility & Settings (tags, public access)

- ✅ **`ProjectDashboard.tsx`** - Comprehensive project view
  - Stats cards (progress, tasks, budget, timeline)
  - Tabbed interface (Overview, Tasks, Milestones, Team, Events)
  - Action buttons (Approve, Start, Complete)
  - Real-time updates
  - Gamification display

### 4. **Documentation**
- ✅ **`PROJECT_MANAGEMENT_SYSTEM.md`** - Complete system documentation
- ✅ **`SETUP_GUIDE.md`** - This file

---

## 🔧 Integration Steps

### Step 1: Deploy Schema Changes

```bash
# The schema has been updated with new fields
# Convex will automatically deploy when you run:
npm run dev

# Or explicitly deploy:
npx convex deploy
```

**What happens:**
- New fields added to `projects` table
- Existing data is preserved
- New projects will use enhanced schema

### Step 2: Import Components in Your Project Page

Update your existing projects page or create a new one:

```typescript
// In your projects page component
import { ProjectWizard } from "@/components/projects/ProjectWizard";
import { ProjectDashboard } from "@/components/projects/ProjectDashboard";

// For creating projects:
<ProjectWizard
  onComplete={(projectId) => {
    // Navigate to project dashboard
    router.push(`/projects/${projectId}`);
  }}
  onCancel={() => {
    setShowWizard(false);
  }}
/>

// For viewing projects:
<ProjectDashboard
  projectId={selectedProjectId}
  userRole={currentUser.userLevel.name}
/>
```

### Step 3: Add Routes

Create or update these routes:

```
/projects          - List all projects
/projects/new      - Create new project (ProjectWizard)
/projects/[id]     - View project details (ProjectDashboard)
/projects/pending  - Pending approvals (for managers)
```

### Step 4: Update Navigation

Add project management links to your navigation:

```typescript
{currentUser.userLevel.name !== "WORKER" && (
  <Link href="/projects/new">
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      New Project
    </Button>
  </Link>
)}

{(currentUser.userLevel.name === "MANAGER" || currentUser.userLevel.name === "ADMIN") && (
  <Link href="/projects/pending">
    <Badge>
      {pendingCount} Pending Approvals
    </Badge>
  </Link>
)}
```

---

## 🎯 Usage Workflow

### For BUILDERS (Creating Projects)

1. **Navigate to** `/projects/new`
2. **Complete wizard:**
   - Step 1: Enter title, description, department
   - Step 2: Set dates, priority, urgency
   - Step 3: Define budget, location, impact
   - Step 4: Add success criteria
   - Step 5: Create milestones
   - Step 6: Set visibility and tags
3. **Submit** → Project status: "pending_approval"
4. **Wait for approval** from manager/admin
5. **Receive notification** when approved/rejected
6. **Start project** when approved

### For MANAGERS/ADMINS (Approving Projects)

1. **Navigate to** `/projects/pending`
2. **Review project details:**
   - Budget allocation
   - Timeline feasibility
   - Success criteria clarity
   - Team assignments
3. **Take action:**
   - **Approve** → Project becomes "approved"
   - **Reject** → Provide feedback
   - **Request Revision** → Send notes to creator
4. **Creator notified** automatically

### For ALL TEAM MEMBERS (Working on Projects)

1. **View assigned projects** on dashboard
2. **Complete tasks** to earn XP
3. **Track milestones** progress
4. **Attend scheduled events**
5. **Celebrate completion** and receive rewards!

---

## 📊 Dashboard Integration

Add project widgets to your main dashboard:

```typescript
// Active Projects Widget
const activeProjects = useQuery(api.projectsEnhanced.getProjectsByStatus, {
  status: "active"
});

// Pending Approvals (for managers)
const pendingApprovals = useQuery(api.projectsEnhanced.getPendingApprovals);

// User's Projects
const myProjects = useQuery(api.projects.getAllProjects);
```

**Display:**
- Total active projects count
- User's assigned projects
- Pending approvals badge (for managers)
- Recent project activity
- XP earned from projects

---

## 🔔 Notification Setup

The system automatically creates notifications for:

### Project Lifecycle
- ✅ Project submitted → Notify managers
- ✅ Project approved → Notify creator
- ✅ Project rejected → Notify creator with feedback
- ✅ Project started → Notify all team members
- ✅ Milestone completed → Notify team
- ✅ Project completed → Notify team + distribute XP

### Events
- ✅ Event scheduled → Notify attendees
- ✅ Event reminder → Notify before start time
- ✅ Event updated → Notify all attendees

**All notifications:**
- Stored in database
- Delivered in real-time
- Include action links
- Categorized by type

---

## 🎮 Gamification Features

### XP Distribution

**Formula:**
```typescript
Project XP = (projectLevel × 100) + (durationDays × 10)

Example:
Level 5 project, 20 days
= (5 × 100) + (20 × 10)
= 500 + 200
= 700 XP total
```

**When distributed:**
- Milestone completion: Proportional XP
- Project completion: Full XP to all team members
- Task completion: Based on difficulty

### Level Progression

```typescript
User Level = Math.floor(totalExperience / 1000) + 1

Examples:
0-999 XP = Level 1
1000-1999 XP = Level 2
5000-5999 XP = Level 6
```

**Display on user profile:**
- Current level
- XP progress bar
- Next level requirement
- Recent achievements

---

## 🎨 Customization Options

### Colors and Theming

Update in your Tailwind config or component styles:

```typescript
// Priority colors
const priorityColors = {
  low: "bg-green-600",
  medium: "bg-yellow-600",
  high: "bg-orange-600",
  critical: "bg-red-600"
};

// Status colors
const statusColors = {
  draft: "bg-gray-500",
  pending_approval: "bg-yellow-500",
  approved: "bg-green-500",
  active: "bg-blue-500",
  completed: "bg-emerald-500"
};
```

### Adjust XP Rewards

In `projectsEnhanced.ts`:

```typescript
// Line ~48 - Modify XP calculation
const totalExperienceReward = 
  args.projectLevel * 100 +  // Base XP per level
  durationDays * 10;         // Bonus per day

// Increase rewards:
const totalExperienceReward = 
  args.projectLevel * 200 +  // Double base
  durationDays * 15;         // Increase daily bonus
```

### Milestone Limits

In `ProjectWizard.tsx`:

```typescript
// Set minimum/maximum milestones
const canProceed = () => {
  if (step === 5) {
    return formData.milestones.length >= 3 && 
           formData.milestones.length <= 10;
  }
  // ...
};
```

---

## 🧪 Testing Checklist

### Create a Test Project

1. ✅ Sign in as BUILDER
2. ✅ Click "New Project"
3. ✅ Complete all 6 steps
4. ✅ Submit for approval
5. ✅ Verify notification sent to manager

### Approve Test Project

1. ✅ Sign in as MANAGER
2. ✅ View pending approvals
3. ✅ Click "Approve"
4. ✅ Verify creator receives notification
5. ✅ Check status changed to "approved"

### Work on Test Project

1. ✅ Creator starts project
2. ✅ Add tasks to project
3. ✅ Complete milestone
4. ✅ Check XP reward distributed
5. ✅ Complete entire project
6. ✅ Verify full XP received

### Event Integration

1. ✅ Create project event
2. ✅ Team members receive notification
3. ✅ Event appears on project dashboard
4. ✅ Event visible in calendar
5. ✅ Reminder sent before event

---

## 🐛 Troubleshooting

### Issue: "Cannot read property 'name' of undefined"
**Solution:** Ensure user has `userLevel` populated
```typescript
const currentUser = await getCurrentUser(ctx);
if (!currentUser.userLevel) {
  throw new Error("User level not set");
}
```

### Issue: Milestones not updating
**Solution:** Check milestone ID matches
```typescript
const milestone = project.milestones.find(m => m.id === args.milestoneId);
if (!milestone) {
  throw new Error("Milestone not found");
}
```

### Issue: XP not distributing
**Solution:** Verify user records exist and are active
```typescript
const user = await ctx.db.get(userId);
if (!user || !user.isActive) {
  console.error("User not found or inactive");
  continue;
}
```

### Issue: Notifications not appearing
**Solution:** Check notification queries are not skipped
```typescript
const notifications = useQuery(
  api.notifications.getAllUserNotifications,
  user ? { limit: 50 } : "skip"  // Don't skip if user exists
);
```

---

## 📈 Performance Tips

### Optimize Large Project Lists

```typescript
// Add pagination
const projects = useQuery(api.projectsEnhanced.getProjectsByStatus, {
  status: "active",
  limit: 20,
  offset: page * 20
});
```

### Cache Frequently Accessed Data

```typescript
// Use React Query or SWR for additional caching
const { data: projectDetails } = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => convex.query(api.projectsEnhanced.getProjectDetails, { projectId }),
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

### Lazy Load Dashboard Tabs

```typescript
// Only load data when tab is active
{activeTab === "tasks" && (
  <TasksList projectId={projectId} />
)}
```

---

## 🌟 Best Practices

### Project Creation
- Use clear, descriptive titles
- Set realistic timelines
- Define measurable success criteria
- Create 3-7 milestones for optimal tracking
- Choose appropriate difficulty level

### Approval Process
- Review within 24 hours
- Provide constructive feedback if rejecting
- Suggest revisions instead of outright rejection
- Consider resource availability

### Team Management
- Assign appropriate skill levels
- Balance workload across team members
- Regular progress check-ins
- Celebrate milestone completions

### Public Visibility
- Set "Public" for community projects
- Use "Internal" for department work
- Reserve "Private" for sensitive projects
- Update progress regularly for public projects

---

## 🔗 Integration Points

### With Existing Features

**Tasks System:**
```typescript
// Link existing tasks to projects
await ctx.db.patch(taskId, {
  projectId: newProjectId
});
```

**Events Calendar:**
```typescript
// Project events appear in main calendar
const allEvents = useQuery(api.events.getAllEvents);
// Includes project events automatically
```

**User Profiles:**
```typescript
// Show user's projects on profile
const userProjects = projects?.filter(p => 
  p.assignedTo.includes(userId) || 
  p.createdBy === userId
);
```

**Notifications:**
```typescript
// Project notifications integrated with main system
const notifications = useQuery(api.notifications.getAllUserNotifications);
// Includes project lifecycle notifications
```

---

## 🎓 Training Users

### For BUILDERS
1. Watch project creation demo
2. Practice with test project
3. Learn milestone planning
4. Understand approval process

### For MANAGERS
1. Review approval guidelines
2. Practice feedback techniques
3. Learn resource allocation
4. Monitor department projects

### For WORKERS
1. Understand task assignments
2. Learn XP system
3. Track personal progress
4. Complete training tasks

---

## 📚 Additional Resources

### Documentation
- `PROJECT_MANAGEMENT_SYSTEM.md` - Full system documentation
- `convex/projectsEnhanced.ts` - API reference
- `convex/eventsEnhanced.ts` - Events API
- Component JSDoc comments

### Examples
- Sample projects in seed data
- Test workflows in documentation
- UI component examples

### Support
- Check GitHub issues
- Review Convex dashboard for errors
- Test in development first
- Use browser dev tools for debugging

---

## ✨ You're Ready!

Your project management system is **fully functional** and ready to use!

**Next Steps:**
1. ✅ Test the wizard with a sample project
2. ✅ Create your first real project
3. ✅ Train team on new system
4. ✅ Monitor usage and gather feedback
5. ✅ Iterate and improve based on needs

**Need Help?**
- Check the troubleshooting section
- Review component code comments
- Test with sample data first
- Verify Convex functions are deployed

---

**Status:** 🎉 READY FOR PRODUCTION
**Version:** 2.0.0
**Last Updated:** 2025-09-30
