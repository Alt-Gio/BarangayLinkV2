# 🚀 BarangayLink Integration Roadmap

**Quick Reference Guide for Connecting the System**

---

## 🎯 Priority Matrix

### **🔴 CRITICAL - Do This Week**

#### 1. Event-Task-Project Pipeline
```
Status: 🟡 30% Connected
Missing: Automatic workflows

Action Items:
□ Create eventTasks.syncToMilestone(eventId, milestoneId)
□ Auto-assign attendees to event tasks
□ Event completion triggers project updates
□ Event task board UI (separate from sprint board)

Files to Edit:
- convex/eventTasks.ts (add sync functions)
- convex/events.ts (add completion workflow)
- src/app/events/[eventId]/tasks/page.tsx (create)
```

#### 2. Messaging → Notifications
```
Status: 🟡 40% Connected  
Missing: Real-time triggers

Action Items:
□ @mentions create notifications
□ Poll votes notify creator
□ Message reactions notify sender
□ File uploads notify room members

Files to Edit:
- convex/messaging.ts (add notification calls)
- convex/notifications.ts (add message-specific types)
```

#### 3. Dashboard Real-time Feed
```
Status: ❌ 20% Connected
Missing: Unified activity stream

Action Items:
□ Create activity aggregator API
□ Build live feed component
□ Show real-time project/task/event updates
□ Add filtering by module type

Files to Create:
- convex/activityFeed.ts (new)
- src/components/dashboard/ActivityFeed.tsx (new)
- src/app/dashboard/page.tsx (integrate feed)
```

---

### **🟠 HIGH PRIORITY - This Sprint**

#### 4. Gamification Expansion
```
Current: Tasks only
Target: All activities

Reward XP/Gold For:
□ Event attendance (+50 XP)
□ Milestone completion (+100 XP, +50 Gold)
□ Document uploads (+10 Gold)
□ Helping teammates (+25 XP per helpful comment)
□ Daily login streak (+10 XP bonus)

Files to Edit:
- convex/gamifiedTasks.ts (expand triggers)
- convex/events.ts (add XP rewards)
- convex/projects.ts (milestone rewards)
```

#### 5. Document Versioning
```
Current: Single version only
Target: Full version history

Action Items:
□ Create documentVersions table
□ Track who changed what when
□ Allow rollback to previous version
□ Show diff between versions

Files to Create:
- convex/documentVersions.ts (new)
- src/components/documents/VersionHistory.tsx (new)
```

#### 6. Budget Tracking
```
Current: Expenses recorded
Target: Full budget management

Action Items:
□ Add budget field to projects
□ Budget vs actual comparison
□ Budget alerts (80%, 100% thresholds)
□ Financial dashboard

Files to Edit:
- convex/schema.ts (add project budget fields)
- convex/expenses.ts (add budget queries)
- src/app/projects/[id]/budget/page.tsx (create)
```

---

### **🟡 MEDIUM PRIORITY - This Month**

#### 7. Public Event RSVP UI
```
Current: Backend exists
Target: User-friendly public UI

Action Items:
□ Landing page event cards show RSVP button
□ RSVP modal with name, email, phone
□ Email verification for public RSVPs
□ QR code ticket generation

Files to Create:
- src/components/landing/EventRSVPModal.tsx (new)
- src/app/events/public/[id]/page.tsx (new)
```

#### 8. Achievement System
```
Current: None
Target: Badge/trophy system

Achievement Categories:
□ Task Master (100 tasks completed)
□ Perfect Attendance (10 events)
□ Team Player (50 helpful comments)
□ Early Bird (complete 20 tasks before due date)
□ Marathon Runner (30-day login streak)

Files to Create:
- convex/achievements.ts (new)
- convex/schema.ts (add achievements table)
- src/components/gamification/AchievementBadge.tsx (new)
```

#### 9. Leaderboards
```
Current: Stats tracked but hidden
Target: Visible rankings

Leaderboard Types:
□ XP Leaders (top 10)
□ Gold Richest (top 10)
□ Task Champions (most completed)
□ Event Attendees (most events)
□ Department Rankings (team competition)

Files to Create:
- convex/leaderboards.ts (new)
- src/app/leaderboards/page.tsx (new)
- src/components/gamification/LeaderboardCard.tsx (new)
```

---

### **🟢 NICE TO HAVE - Next Quarter**

#### 10. Collaboration Rooms Per Project
```
Action: Link Liveblocks to project pages
File: src/app/projects/[id]/page.tsx
```

#### 11. QR Code Event Check-In
```
Action: Mobile scanning for event attendance
File: src/app/events/[id]/checkin/page.tsx (create)
```

#### 12. Expense Approval Workflow
```
Action: Manager approval before expense records
Files: convex/expenses.ts, src/app/expenses/pending/page.tsx
```

#### 13. AI Task Suggestions
```
Action: Recommend tasks based on project type
Files: convex/ai/taskSuggestions.ts (new)
```

---

## 📊 Integration Checklist

### Event System Integration
- [ ] Events create notification for organizer approval
- [ ] Event approval creates project tasks automatically
- [ ] Event attendees auto-assigned to event tasks
- [ ] Event completion updates project progress
- [ ] Event tasks sync to project milestones
- [ ] Event RSVP triggers email confirmation
- [ ] Event check-in rewards XP to attendees

### Messaging Integration
- [ ] @mentions create notifications
- [ ] Message reactions trigger notifications
- [ ] Poll creation notifies room members
- [ ] Poll completion notifies creator
- [ ] File upload notifies room (if important)
- [ ] Typing indicators sync with presence
- [ ] Unread count shown in sidebar

### Dashboard Integration
- [ ] Real-time activity feed (all modules)
- [ ] Live project health scores
- [ ] Team workload visualization
- [ ] Gamification leaderboard widget
- [ ] Upcoming deadlines widget
- [ ] Recent notifications panel
- [ ] Quick action buttons (create task, event, etc.)

### Gamification Integration
- [ ] Task completion rewards XP/Gold
- [ ] Event attendance rewards XP
- [ ] Milestone completion bonus
- [ ] Document upload rewards
- [ ] Comment helpfulness rewards
- [ ] Daily login streak
- [ ] Achievement unlocks
- [ ] Leaderboard rankings

### Document Integration
- [ ] Documents link to tasks
- [ ] Documents link to events
- [ ] Documents link to projects
- [ ] Expense receipts → documents
- [ ] Certificate requests → documents
- [ ] Attendee verification docs → documents
- [ ] Version history tracking
- [ ] Document commenting

### Financial Integration
- [ ] Project budgets tracked
- [ ] Expenses link to projects
- [ ] Budget vs actual reports
- [ ] Budget alerts
- [ ] Expense approval workflow
- [ ] Receipt management
- [ ] Financial dashboard

### Resident Integration
- [ ] Residents can RSVP to events
- [ ] Projects show affected households
- [ ] Public feedback on projects
- [ ] Certificate automation
- [ ] Event participation certificates
- [ ] SMS notifications (future)

---

## 🛠️ Technical Implementation Guide

### Step 1: Create Service Layer
```typescript
// convex/services/activityService.ts
export async function logActivity(
  ctx: any,
  type: string,
  data: any
) {
  await ctx.db.insert("activityLogs", {
    userId: ctx.auth.userId,
    activityType: type,
    data,
    timestamp: Date.now()
  });
  
  // Trigger notifications if needed
  if (shouldNotify(type)) {
    await notificationService.create(ctx, {
      type,
      recipients: getRecipients(data),
      message: formatMessage(type, data)
    });
  }
  
  // Award gamification points
  if (shouldReward(type)) {
    await gamificationService.award(ctx, {
      userId: ctx.auth.userId,
      action: type,
      context: data
    });
  }
}
```

### Step 2: Add Event Handlers
```typescript
// convex/events.ts - Add to completeEvent mutation
export const completeEvent = mutation({
  handler: async (ctx, { eventId }) => {
    // ... existing code ...
    
    // NEW: Sync with project
    if (event.projectId) {
      await projects.updateFromEventCompletion(ctx, {
        projectId: event.projectId,
        eventId,
        taskCompletion: eventTaskStats
      });
    }
    
    // NEW: Reward attendees
    const attendees = await getEventAttendees(ctx, { eventId });
    for (const attendee of attendees) {
      if (attendee.attendanceStatus === "attended") {
        await gamification.awardXP(ctx, {
          userId: attendee.userId,
          amount: 50,
          reason: "event_attendance"
        });
      }
    }
  }
});
```

### Step 3: Unified API Pattern
```typescript
// All modules follow this pattern:
export const create = mutation({
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("table", data);
    
    // Auto-log activity
    await activityService.log(ctx, "created", { id, data });
    
    // Auto-notify relevant users
    await notificationService.notify(ctx, { ... });
    
    // Auto-reward if applicable
    await gamificationService.check(ctx, { ... });
    
    return id;
  }
});
```

---

## 📈 Success Metrics

### Integration Complete When:
- ✅ Event → Task → Project pipeline works end-to-end
- ✅ Dashboard shows live data from all modules
- ✅ Notifications fire for all important actions
- ✅ Gamification rewards all productive activities
- ✅ Search finds data across all modules
- ✅ Documents centralized and versioned
- ✅ Mobile feature parity with desktop
- ✅ Analytics dashboard shows real-time metrics

### KPIs to Track:
- **User Engagement:** Daily active users, session duration
- **Task Completion:** Average tasks per user per week
- **Event Participation:** RSVP rate, attendance rate
- **Project Success:** On-time completion percentage
- **Gamification:** Average XP per user, achievement unlock rate
- **Communication:** Messages per day, notification open rate

---

## 🎯 Quick Wins (Under 1 Hour Each)

1. **Add XP reward for event check-in** (30 min)
   - Edit: `convex/eventAttendees.ts`
   - Call: `gamificationService.awardXP()` on check-in

2. **Show unread message count in sidebar** (30 min)
   - Edit: `src/components/layout/Sidebar.tsx`
   - Query: `api.messages.getUnreadCount()`

3. **Create project progress widget for dashboard** (45 min)
   - Create: `src/components/dashboard/ProjectProgress.tsx`
   - Query existing project stats

4. **Add "Quick Create" buttons to dashboard** (30 min)
   - Edit: `src/app/dashboard/page.tsx`
   - Reuse existing modals

5. **Display gamification stats in user dropdown** (20 min)
   - Edit: `src/components/layout/Sidebar.tsx`
   - Show XP, level, gold in profile panel

---

## 🚀 Let's Build!

**Next Steps:**
1. ✅ Review this roadmap
2. 🔄 Pick top 3 priorities
3. 🔄 Implement one per day
4. 🔄 Test integrations
5. 🔄 Deploy incrementally

**Remember:** Integration > New Features. Connect what exists before adding more! 💡

---

**Ready to make BarangayLink fully connected? Let's do this! 🎉**
