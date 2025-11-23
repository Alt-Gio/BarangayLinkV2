# Project Progress Synchronization

## Overview
The project progress system now **automatically syncs** with task completion. When tasks are created, updated, completed, or deleted, the project's `progress` field is updated in real-time.

## Features
✅ **Automatic Progress Calculation**: Progress percentage is calculated based on completed tasks
✅ **Real-time Updates**: Progress updates immediately when tasks change status
✅ **Consistent Across Views**: Progress is displayed consistently on:
   - Project detail pages (`/projects/[id]`)
   - Project cards list (`/projects`)
   - Landing page public projects (`/`)

## How It Works

### Automatic Sync
The progress is automatically updated when:
1. ✨ A new task is created
2. ✅ A task is marked as completed
3. ↩️ A task is marked as incomplete
4. 📝 A task's status is changed (e.g., moved to "done" in Kanban)
5. 🗑️ A task is deleted

### Progress Calculation
```
Progress = (Completed Tasks / Total Tasks) × 100
```

A task is considered "completed" if:
- `task.status === "done"` OR
- `task.status === "completed"` OR
- `task.completed === true`

## Migration for Existing Projects

If you have existing projects with tasks that need their progress synced, run the migration:

### Option 1: Via Convex Dashboard (Recommended)
1. Go to your Convex Dashboard: https://dashboard.convex.dev
2. Select your project
3. Go to "Functions" tab
4. Find and run `projectProgressMigration:syncAllProjectsProgress`
5. Check the logs to see the progress sync results

### Option 2: Via Admin Action (In App)
1. Log in as an ADMIN user
2. Open the browser console (F12)
3. Run this command:
```javascript
// Import the mutation
const { useMutation } = await import('convex/react');
const api = await import('@/convex/_generated/api');

// Call the admin action
await api.adminActions.syncAllProjectsProgressAdmin();
```

### Option 3: Programmatically
Add a button in your admin panel that calls:
```typescript
const syncProgress = useMutation(api.adminActions.syncAllProjectsProgressAdmin);

// In your onClick handler:
await syncProgress({});
```

## Technical Details

### Files Modified
- ✅ `convex/tasks.ts` - Added `syncProjectProgress` internal mutation and automatic triggers
- ✅ `convex/landingPage.ts` - Updated task completion checks
- ✅ `convex/gamifiedTasks.ts` - Updated task completion checks for consistency
- ✅ `convex/projectProgressMigration.ts` - Migration script for existing projects
- ✅ `convex/adminActions.ts` - Admin action to trigger migration

### Database Changes
- **No schema changes required** - Uses existing `projects.progress` field

### API Functions

#### Internal Mutation (Auto-called)
```typescript
api.tasks.syncProjectProgress({ projectId: Id<"projects"> })
```
Automatically called via scheduler when tasks change.

#### Admin Migration (Manual)
```typescript
api.adminActions.syncAllProjectsProgressAdmin({})
```
Manually triggers progress sync for ALL projects. Admin only.

## Verification

After deploying, verify the system works:

1. **Create a test project** with 10 tasks
2. **Check progress** - Should show 0%
3. **Complete 5 tasks** (mark as done or move to "done" column)
4. **Check progress** - Should show 50%
5. **Complete 5 more tasks**
6. **Check progress** - Should show 100%

Progress should update across:
- Project detail page (top progress circle)
- Projects list page (progress bar on cards)
- Landing page (progress bar on public projects)

## Troubleshooting

### Progress not updating?
1. Check that tasks are properly linked to projects (`task.projectId` exists)
2. Verify tasks have the correct completion status
3. Check Convex logs for any errors
4. Re-run the migration script

### Different progress values in different places?
- Make sure all views are using the synced `project.progress` field
- Clear browser cache and reload
- Run the migration script to ensure consistency

## Notes

- ⚡ Progress updates are near real-time (scheduled with `runAfter(0, ...)`)
- 🔒 Only ADMIN users can trigger the migration script
- 📊 Progress is stored as an integer (0-100)
- 🎯 Project with 0 tasks shows 0% progress

## Future Enhancements

Potential improvements:
- [ ] Weighted progress (based on story points or priority)
- [ ] Milestone-based progress tracking
- [ ] Progress history/timeline
- [ ] Progress notifications (e.g., "Project reached 50%!")
