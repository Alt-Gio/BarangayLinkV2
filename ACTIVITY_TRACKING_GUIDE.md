# 🎯 Activity Tracking & Achievement System Guide

## ✅ What's Implemented

### 1. **Current Activity Indicator**
Shows what users are currently working on in:
- Sidebar profile panel
- Online users modal
- Real-time updates

### 2. **Mini Achievement Badges**
Displays recent achievements based on:
- User level (⭐)
- Experience points (🏆)
- Visible in sidebar and online users

### 3. **Presence Tracking**
Real-time online status with:
- Auto heartbeat every 30 seconds
- 5-minute timeout
- Facebook-style online detection

---

## 🚀 How to Use Activity Tracking

### Method 1: Use the Hook (Recommended)

Add to any task or project page:

```typescript
import { useActivityTracker } from '@/hooks/useActivityTracker';

function TaskDetailPage({ taskId, taskTitle }: Props) {
  // Auto-track activity when on this page
  useActivityTracker({
    type: 'task',
    id: taskId,
    name: taskTitle
  });

  return <div>Your task content...</div>;
}
```

### Method 2: Manual Control

```typescript
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

function MyComponent() {
  const setActivity = useMutation(api.activity.setCurrentActivity);

  const startWorking = () => {
    setActivity({
      activityType: 'task',
      activityId: 'task_123',
      activityName: 'Review Documentation'
    });
  };

  const stopWorking = () => {
    setActivity({
      activityType: 'none'
    });
  };

  return (
    <button onClick={startWorking}>Start Task</button>
  );
}
```

---

## 📋 Integration Examples

### Example 1: Task Details Page

```typescript
// src/app/tasks/[id]/page.tsx
"use client";

import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function TaskPage({ params }: { params: { id: string } }) {
  const task = useQuery(api.tasks.getTaskById, { taskId: params.id });
  
  // Auto-track when viewing this task
  useActivityTracker({
    type: 'task',
    id: params.id,
    name: task?.title || 'Loading...'
  });

  return (
    <div>
      <h1>{task?.title}</h1>
      {/* Rest of your task UI */}
    </div>
  );
}
```

### Example 2: Project Dashboard

```typescript
// src/app/projects/[id]/page.tsx
"use client";

import { useActivityTracker } from '@/hooks/useActivityTracker';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = useQuery(api.projects.getProjectById, { id: params.id });
  
  // Track project activity
  useActivityTracker({
    type: 'project',
    id: params.id,
    name: project?.title || 'Loading...'
  });

  return (
    <div>
      <h1>{project?.title}</h1>
      {/* Project content */}
    </div>
  );
}
```

### Example 3: Task Modal/Drawer

```typescript
function TaskDrawer({ taskId, isOpen }: Props) {
  const task = useQuery(api.tasks.getTaskById, { taskId });
  
  // Only track when drawer is open
  useActivityTracker({
    type: isOpen ? 'task' : 'none',
    id: taskId,
    name: task?.title
  });

  return (
    <Drawer open={isOpen}>
      {/* Task content */}
    </Drawer>
  );
}
```

---

## 🎖️ Achievement System

### Current Implementation

Achievements are generated based on:
- **Level 2+**: ⭐ "Leveled Up!" badge
- **100+ XP**: 🏆 "100 XP Earned" badge

### Customizing Achievements

Edit `convex/activity.ts`:

```typescript
// Add more achievement types
const mockAchievements = [];

if (user.level && user.level >= 5) {
  mockAchievements.push({ 
    title: "Expert Level!", 
    icon: "💎", 
    points: 500 
  });
}

if (user.experience && user.experience >= 500) {
  mockAchievements.push({ 
    title: "500 XP Master", 
    icon: "🌟", 
    points: 250 
  });
}

// Add custom achievements
if (user.metadata?.tasksCompleted >= 10) {
  mockAchievements.push({ 
    title: "10 Tasks Done!", 
    icon: "📋", 
    points: 100 
  });
}
```

---

## 📊 Where Activity Shows Up

### 1. **Sidebar Profile Panel**
```
┌────────────────────────────┐
│ 👤 Marc Gioooooo  🟢 👥  │
│ ⚡ WORKER                 │
├────────────────────────────┤
│ 💼 Working on:            │
│ Project Review Task       │
├────────────────────────────┤
│ 🏆 [⭐] [🏆] [📋]        │
└────────────────────────────┘
```

### 2. **Online Users Modal**
```
┌─────────────────────────────────┐
│ Online Users (3 active)         │
├─────────────────────────────────┤
│ [Avatar] Marc G [⭐][🏆]       │
│    🟢   Worker                  │
│         📋 Working on: Task X   │
│         [💬] [🔔]              │
└─────────────────────────────────┘
```

### 3. **Profile Page**
Shows full achievement list with details

---

## ⚙️ Configuration Options

### Activity Tracker Hook Options

```typescript
interface ActivityTrackerOptions {
  type: 'task' | 'project' | 'none';
  id?: string;         // Task/Project ID
  name?: string;       // Display name
}
```

### Set Activity Mutation Args

```typescript
{
  activityType: 'task' | 'project' | 'none',
  activityId?: string,    // Optional
  activityName?: string   // Optional
}
```

---

## 🔄 Auto-Clear Behavior

Activity is automatically cleared when:
- User navigates away from page
- Component unmounts
- Browser tab closes
- User sets status to offline

---

## 📈 Analytics Potential

You can extend this to track:
- Time spent on tasks
- Most active users
- Popular projects
- Work patterns
- Productivity metrics

### Example: Track Duration

```typescript
// Add to convex/activity.ts
export const trackActivityDuration = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const activity = user.metadata?.currentActivity;
    
    if (activity && activity.startedAt) {
      const duration = Date.now() - activity.startedAt;
      
      // Store duration in analytics table
      await ctx.db.insert("activityLogs", {
        userId: user._id,
        activityType: activity.type,
        activityId: activity.id,
        duration: duration,
        timestamp: Date.now()
      });
    }
  }
});
```

---

## 🎯 Best Practices

### DO:
✅ Track when users actively work on tasks/projects
✅ Clear activity when leaving page
✅ Show activity in team collaboration views
✅ Use for presence awareness
✅ Display achievements prominently

### DON'T:
❌ Track every page navigation
❌ Set activity for list/browse pages
❌ Leave stale activity data
❌ Track activity for anonymous users
❌ Spam with too many achievements

---

## 🚧 Next Steps to Implement

### 1. **Add to Task Pages**
```bash
# Files to update:
src/app/tasks/[id]/page.tsx
src/app/tasks/my-tasks/page.tsx
src/app/tasks/team/page.tsx
```

### 2. **Add to Project Pages**
```bash
# Files to update:
src/app/projects/[id]/page.tsx
src/app/productivity/project/[id]/page.tsx
```

### 3. **Create Achievement System**
```bash
# Create new table in schema:
convex/schema.ts - Add "achievements" table
```

### 4. **Track Activity Duration**
```bash
# Add analytics:
convex/analytics.ts - Activity duration tracking
```

### 5. **Notification Integration**
```bash
# Notify on achievements:
convex/activity.ts - Send notification when badge earned
```

---

## 📝 Quick Implementation Checklist

- [x] Activity tracking backend (convex/activity.ts)
- [x] Presence system integration
- [x] Sidebar profile indicator
- [x] Online users modal integration
- [x] Achievement badges display
- [x] Activity tracker hook
- [ ] Add to task detail pages
- [ ] Add to project detail pages
- [ ] Create achievement unlock system
- [ ] Track activity duration
- [ ] Analytics dashboard
- [ ] Achievement notifications

---

## 🆘 Troubleshooting

### Activity not showing?
1. Check if `npx convex dev` is running
2. Verify functions are deployed
3. Check browser console for errors
4. Ensure user is authenticated

### Achievements not appearing?
1. Check user level is >= 2
2. Verify experience >= 100
3. Look at `convex/activity.ts` logic
4. Check mock achievements array

### Online status not updating?
1. Verify presence tracker is in layout
2. Check heartbeat is running
3. Look for network errors
4. Ensure user has active session

---

## 📚 API Reference

### Queries

```typescript
// Get current user's activity
api.activity.getCurrentActivity()

// Get user's recent achievements
api.activity.getRecentAchievements({ 
  userId?: Id<"users">,
  limit?: number 
})
```

### Mutations

```typescript
// Set current activity
api.activity.setCurrentActivity({
  activityType: 'task' | 'project' | 'none',
  activityId?: string,
  activityName?: string
})
```

---

## 🎉 You're Ready!

The system is now deployed and ready to use. Just add the `useActivityTracker` hook to your task and project pages to enable automatic activity tracking!

Need help? Check the examples above or reach out to the dev team.
