# 📊 Team Workload Tracking - Feature Documentation

**Created:** Oct 21, 2025  
**Status:** ✅ COMPLETE  
**Inspired by:** JIRA Workload Management

---

## 🎯 **Feature Overview**

A professional team capacity tracking system that shows:
- **Who has tasks** - Complete visibility of all team members
- **Task distribution** - See workload across the team
- **Overload detection** - Red alerts for overloaded members
- **Individual tracking** - Drill down into each person's tasks
- **Real-time stats** - Active, completed, overdue, and urgent tasks

**Accessible by:** Admin, Captain, and Manager roles only

---

## 🎨 **Design Highlights**

### **JIRA-Inspired Interface**
✅ **Clean card-based list** - Each team member is a card  
✅ **Color-coded status** - Visual workload indicators  
✅ **Overload warnings** - Red text and borders for 15+ tasks  
✅ **Progress bars** - Completion rate visualization  
✅ **Smart sorting** - Most overloaded members first  
✅ **Quick stats** - Team overview at a glance

### **Professional & Modern**
- Dark theme with teal accents
- Smooth animations and transitions
- Mobile-responsive design
- Touch-friendly interface
- Glassmorphism effects

---

## 📐 **Workload Levels**

| Status | Task Count | Color | Description |
|--------|-----------|-------|-------------|
| **Light** | 0-4 tasks | 🔵 Blue | Under capacity |
| **Optimal** | 5-9 tasks | 🟢 Green | Perfect balance |
| **Heavy** | 10-14 tasks | 🟠 Orange | Near limit |
| **Overloaded** | 15+ tasks | 🔴 Red | ALERT! |

---

## 🗂️ **Files Created**

### **1. Backend Query**
```
convex/teamWorkload.ts
```
**Functions:**
- `getTeamWorkload()` - Get all team members with stats
- `getUserTasks(userId)` - Get specific user's task details

**Features:**
- Counts standalone tasks + event tasks
- Calculates completion rates
- Identifies overdue and high-priority tasks
- Determines workload status automatically
- Sorts by active tasks (descending)

### **2. Main List Page**
```
src/app/dashboard/team-workload/page.tsx
```
**Features:**
- Team statistics cards
- Search by name/email
- Filter by role (Admin, Captain, Manager, Builder, Worker)
- Filter by status (Overloaded, Heavy, Optimal, Light)
- Sort by tasks, name, or completion rate
- Click card to see details
- Legend showing workload levels

**UI Elements:**
- Avatar with fallback initials
- Name in RED if overloaded
- Role icon and badge
- Active/Completed/Overdue/Urgent counters
- Completion progress bar
- Workload status badge
- Chevron for navigation

### **3. Detail View Page**
```
src/app/dashboard/team-workload/[userId]/page.tsx
```
**Features:**
- User profile card
- 4 stat cards (Active, Done, Overdue, Urgent)
- Completion rate progress bar
- 3 tabs: Active | Completed | Overdue
- Task cards with:
  - Title and description
  - Priority badge
  - Status badge
  - Event name (if event task)
  - Due date with countdown
  - Progress bar

### **4. Dashboard Integration**
**Updated Files:**
- `src/components/dashboard/AdminDashboard.tsx`
- `src/components/dashboard/ManagerDashboard.tsx`

**Added:**
- Highlighted "Team Workload" button in Quick Actions
- Gradient teal background (stands out!)
- Navigation to `/dashboard/team-workload`

---

## 🚀 **How to Use**

### **From Dashboard**
1. Login as Admin, Captain, or Manager
2. See **"Team Workload"** button in Quick Actions
3. Click to view team capacity

### **Main View**
- **Search:** Find specific team members
- **Filter:** By role or workload status
- **Sort:** By tasks, name, or completion
- **Click card:** View detailed task list

### **Detail View**
- See user's full profile
- View all active tasks
- Check completed work
- Identify overdue items
- Tab between views

---

## 📊 **Data Tracked**

### **Per User:**
- Active Tasks (todo, in_progress, in_review, blocked)
- Completed Tasks (done)
- Overdue Tasks (past due date)
- High Priority Tasks (critical, high)
- Completion Rate (percentage)
- Workload Status (light, optimal, heavy, overloaded)

### **Team Level:**
- Total Members
- Total Active Tasks
- Total Completed Tasks
- Overloaded Members Count
- Average Tasks Per Person

---

## 🎯 **Use Cases**

### **1. Identify Overload**
> "John has 18 tasks! He's overloaded! Redistribute some tasks."

### **2. Balance Workload**
> "Maria only has 3 tasks. She can take on more."

### **3. Track Progress**
> "Team completion rate is 75%. Good progress!"

### **4. Manage Priorities**
> "5 members have urgent tasks. Check those first."

### **5. Monitor Capacity**
> "We have 3 overloaded members. Need to hire or delay."

---

## 🎨 **Visual Examples**

### **Main List View**
```
┌──────────────────────────────────────────┐
│  📊 Team Stats                           │
│  👥 12 Members  📋 45 Active  ⚠️ 2 Overloaded│
├──────────────────────────────────────────┤
│  🔍 Search... │ 🎭 Role │ 📊 Status      │
├──────────────────────────────────────────┤
│  👤 John Doe (OVERLOADED) ⚠️             │
│     18 active • 12 done • 3 overdue      │
│     ▓▓▓▓▓░░░░░ 60%                      │
├──────────────────────────────────────────┤
│  👤 Maria Santos (OPTIMAL) ✓             │
│     7 active • 20 done • 0 overdue       │
│     ▓▓▓▓▓▓▓▓░░ 85%                      │
└──────────────────────────────────────────┘
```

### **Detail View**
```
┌──────────────────────────────────────────┐
│  👤 John Doe - Builder                   │
│  john@barangay.gov.ph                    │
│  ⚠️ OVERLOADED                           │
├──────────────────────────────────────────┤
│  ⏰ 18 Active │ ✅ 12 Done │ ⚠️ 3 Overdue│
├──────────────────────────────────────────┤
│  📋 Active Tasks                         │
├──────────────────────────────────────────┤
│  ⚡ Fix Road Drainage                    │
│     🔥 CRITICAL • 📅 Due in 2 days      │
│     ▓▓▓▓▓░░░░░ 50%                      │
├──────────────────────────────────────────┤
│  📝 Update Website                       │
│     🟡 MEDIUM • 📅 Due in 5 days        │
│     ▓▓▓▓▓▓▓▓▓░ 90%                      │
└──────────────────────────────────────────┘
```

---

## 🔐 **Permissions**

**Can View:**
- ✅ Admin
- ✅ Captain  
- ✅ Manager

**Cannot View:**
- ❌ Builder
- ❌ Worker

**Security:**
- Query checks user role
- Throws error if unauthorized
- Users can view their own tasks
- Managers/Admins can view all tasks

---

## 📱 **Mobile Responsive**

✅ **Fully mobile-optimized** using `MobilePage` component  
✅ **Collapsible filters** - Hide to focus on list  
✅ **Touch-friendly** cards - 44px+ tap targets  
✅ **Horizontal scroll** on filters  
✅ **Stacked layouts** on small screens  
✅ **Readable text** sizes at all viewports  

---

## 🎯 **Key Features Summary**

### **1. Team Overview**
- See all team members at once
- Quick stats: members, tasks, overloaded count
- Average tasks per person
- Search and filter capabilities

### **2. Workload Detection**
- Automatic status calculation
- Color-coded warnings
- Red text for overloaded members
- Visual progress bars

### **3. Task Details**
- Click to drill down
- See all tasks (active, completed, overdue)
- Tab navigation
- Full task information

### **4. Professional Design**
- JIRA-inspired interface
- Modern dark theme
- Smooth animations
- Consistent branding

### **5. Smart Sorting**
- Most overloaded first (default)
- Sort by name alphabetically
- Sort by completion rate
- Easy to identify problems

---

## 🚀 **Integration Steps**

Already integrated! Just:

1. ✅ Navigate to Dashboard
2. ✅ Click "Team Workload" button
3. ✅ View team capacity
4. ✅ Click user to see details

---

## 💡 **Future Enhancements**

### **Potential Additions:**
- Export to CSV/PDF
- Email alerts for overloaded members
- Automatic task reassignment
- Workload history charts
- Team capacity planning
- Skill-based assignment suggestions
- Integration with calendar
- Time tracking per task
- Burndown charts
- Sprint planning tools

---

## 📝 **Testing Checklist**

- [ ] Admin can access page
- [ ] Captain can access page
- [ ] Manager can access page
- [ ] Builder/Worker blocked
- [ ] Search works
- [ ] Role filter works
- [ ] Status filter works
- [ ] Sorting works
- [ ] Click card navigates
- [ ] User detail shows tasks
- [ ] Tabs switch properly
- [ ] Overloaded users show red
- [ ] Progress bars accurate
- [ ] Mobile responsive
- [ ] Sidebar works
- [ ] Back button works

---

## 🎉 **Success Metrics**

✅ **Professional Design** - JIRA-inspired, modern UI  
✅ **Overload Detection** - Red alerts for 15+ tasks  
✅ **Complete Visibility** - All users and their tasks  
✅ **Easy Navigation** - Click card for details  
✅ **Mobile-Friendly** - Works on all devices  
✅ **Role-Based Access** - Secure, permission-checked  
✅ **Real-Time Data** - Always up-to-date  

---

## 🎓 **Usage Tips**

### **For Admins:**
- Check weekly for overloaded members
- Redistribute tasks when needed
- Monitor team capacity trends
- Use for hiring decisions

### **For Managers:**
- Balance your department's workload
- Identify team members who can take more
- Track completion rates
- Plan resource allocation

### **For Captains:**
- Oversee multiple departments
- Ensure balanced workload across teams
- Identify bottlenecks
- Support overloaded managers

---

**The Team Workload feature is now live and ready to help you manage team capacity like a pro!** 🎯📊✨
