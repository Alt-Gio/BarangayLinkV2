# BarangayLink v2 - User Manual

A complete guide for using the BarangayLink barangay management system.

---

## Getting Started

### First Time Login

1. Open your browser and go to your BarangayLink website
2. Click **Login** or **Register** if you're new
3. Enter your email and password
4. If this is your first time, wait for admin approval
5. Once approved, you'll see your dashboard

### Your Dashboard

After logging in, you'll see your personalized dashboard showing:
- Tasks assigned to you
- Upcoming events
- Recent notifications
- Quick stats about your work

---

## Understanding Your Role

BarangayLink has 5 user roles. Each role has different permissions and responsibilities.

### ADMIN

**Who you are:** System administrator with full control.

**What you can do:**
- Manage all users and approve new registrations
- Configure system settings
- Access all projects and events
- Create and manage departments
- Generate system-wide reports
- Backup and restore data

**Your typical day:**
1. Check pending user approvals
2. Review system notifications
3. Monitor overall project progress
4. Handle escalated issues
5. Generate weekly reports

---

### CAPTAIN

**Who you are:** Barangay Captain or Vice Captain with oversight of all operations.

**What you can do:**
- View all projects across departments
- Approve major project proposals
- Oversee event planning
- Access analytics and reports
- Manage department heads

**Your typical day:**
1. Review project status updates
2. Approve pending projects
3. Check upcoming community events
4. Meet with department managers
5. Review resident concerns

**Common scenarios:**

*Scenario: Approving a new infrastructure project*
1. Go to **Projects** → **Pending Approval**
2. Click on the project to review details
3. Check the budget, timeline, and assigned team
4. Click **Approve** or **Request Changes**
5. Add comments if needed

*Scenario: Checking event attendance*
1. Go to **Events** → Select the event
2. Click **Control Panel**
3. View real-time attendance numbers
4. Download attendance report if needed

---

### MANAGER

**Who you are:** Department head who coordinates projects and teams within your department.

**What you can do:**
- Create projects for your department
- Assign tasks to builders and workers
- Manage your team's workload
- Track project budgets
- Generate department reports

**What you cannot do:**
- Access other departments' private projects
- Approve your own projects (needs Captain/Admin)
- Change system settings

**Your typical day:**
1. Check your team's task progress
2. Update project milestones
3. Assign new tasks as needed
4. Review completed work
5. Communicate with your team

**Common scenarios:**

*Scenario: Creating a new project*
1. Go to **Projects** → Click **+ New Project**
2. Fill in the project details:
   - Title: "Road Repair - Purok 3"
   - Description: What needs to be done
   - Start Date and End Date
   - Budget (if applicable)
3. Click **Create Project**
4. Wait for Captain/Admin approval

*Scenario: Assigning tasks to your team*
1. Open your project
2. Click **+ Add Task**
3. Enter task details:
   - Title: "Survey damaged areas"
   - Priority: High, Medium, or Low
   - Due date
   - Assigned to: Select team members
4. Click **Create Task**
5. Team members will be notified

*Scenario: Checking team workload*
1. Go to **Dashboard** → **Team Workload**
2. See who has too many tasks
3. Reassign tasks if someone is overloaded
4. Balance work across your team

---

### BUILDER

**Who you are:** Senior staff member who creates tasks and helps manage projects.

**What you can do:**
- Create tasks within assigned projects
- Update task status
- Log work hours
- View project details
- Collaborate with team members

**What you cannot do:**
- Create new projects (only Managers can)
- Access projects you're not assigned to
- Approve or reject work

**Your typical day:**
1. Check your assigned tasks
2. Update task progress
3. Create sub-tasks if needed
4. Log your work hours
5. Mark completed tasks as done

**Common scenarios:**

*Scenario: Working on a task*
1. Go to **My Duties** or **Dashboard**
2. Find your assigned task
3. Click **Start** to begin working
4. The timer starts automatically
5. When done, click **Submit for Review**

*Scenario: Creating a sub-task*
1. Open the main task
2. Click **+ Add Subtask**
3. Enter what needs to be done
4. Assign it to yourself or a teammate
5. Track progress separately

*Scenario: Logging extra hours*
1. Open the task you worked on
2. Click **Log Time**
3. Enter hours and what you did
4. Submit the time entry

---

### WORKER

**Who you are:** Team member who completes assigned tasks.

**What you can do:**
- View tasks assigned to you
- Update your task status
- Clock in and out of tasks
- View event schedules
- Receive notifications

**What you cannot do:**
- Create new tasks or projects
- Assign work to others
- Access unassigned projects

**Your typical day:**
1. Check your task list
2. Clock in to start working
3. Complete your assigned tasks
4. Update status when done
5. Clock out at end of day

**Common scenarios:**

*Scenario: Starting your work day*
1. Login to BarangayLink
2. Go to **My Duties**
3. See all tasks assigned to you
4. Click on a task to see details
5. Click **Clock In** to start

*Scenario: Completing a task*
1. Finish the actual work
2. Open the task in BarangayLink
3. Change status to **Done** or **For Review**
4. Add any notes about what you did
5. Your manager will be notified

*Scenario: Reporting a problem*
1. Open the task
2. Click **Add Comment**
3. Describe the issue you encountered
4. Your manager will see it and respond

---

## Main Features

### Projects

Projects are the core of BarangayLink. They represent major initiatives like infrastructure improvements, community programs, or special events.

**Project Status:**
- **Planning** - Still being organized
- **Active** - Work is ongoing
- **Completed** - All tasks finished
- **On Hold** - Temporarily paused

**How to track progress:**
- Each project shows a progress bar
- Progress is calculated from completed tasks
- Click on a project to see detailed breakdown

---

### Events

Events are community activities like fiestas, clean-up drives, or meetings.

**Creating an Event (Managers and above):**
1. Go to **Events** → **+ New Event**
2. Enter event details:
   - Title and description
   - Date, start time, end time
   - Location (you can pick on map)
   - Maximum attendees
3. Set if it's public or private
4. Create tasks for the event
5. Publish the event

**Event Control Panel:**
- Real-time attendance tracking
- Task assignment and monitoring
- QR code for easy check-in
- Guest registration

**For Workers - Event Duties:**
1. Check **My Duties** for event tasks
2. See what you're assigned to do
3. Clock in when you arrive
4. Complete your tasks
5. Clock out when done

---

### Tasks

Tasks are specific work items within projects or events.

**Task Status Flow:**
```
TODO → IN PROGRESS → IN REVIEW → DONE
```

**Task Priority:**
- 🔴 **Urgent** - Do immediately
- 🟠 **High** - Do today
- 🟡 **Medium** - Do this week
- 🟢 **Low** - Do when you can

**Working on Tasks:**
1. Find your task in **My Duties**
2. Click to open task details
3. Click **Start** or change status to **In Progress**
4. Work on the task
5. When finished, change to **In Review** or **Done**

---

### Kanban Board

The Kanban board gives you a visual view of all tasks organized by status.

**Columns:**
- **To Do** - Tasks waiting to be started
- **In Progress** - Tasks being worked on
- **In Review** - Tasks waiting for approval
- **Done** - Completed tasks

**How to use:**
- Drag tasks between columns to change status
- Click a task to see full details
- Use filters to find specific tasks
- Great for team meetings to review progress

---

### Milestones

Milestones are major checkpoints within a project.

**Example milestones for a road project:**
1. Survey Complete - Week 1
2. Materials Purchased - Week 2
3. Construction Started - Week 3
4. Construction Complete - Week 6
5. Final Inspection - Week 7

**Tracking milestones:**
- Each milestone shows target date
- Progress based on related tasks
- Red = overdue, Yellow = at risk, Green = on track

---

### Documents

Store and share files related to projects.

**Supported files:**
- Images (JPG, PNG)
- PDFs
- Word documents
- Excel spreadsheets

**Uploading documents:**
1. Go to **Documents** or open a project
2. Click **Upload**
3. Select your file
4. Add tags for easy searching
5. File is automatically saved

---

### Messages

Built-in chat system for team communication.

**Features:**
- Direct messages to any user
- Group chats for teams
- File sharing in chat
- Read receipts

**Starting a conversation:**
1. Go to **Messages**
2. Click **New Chat**
3. Select who to message
4. Type and send your message

---

### Notifications

Stay updated on what's happening.

**You'll be notified when:**
- You're assigned a new task
- Someone mentions you
- A deadline is approaching
- Your task is approved or needs revision
- New announcements are posted

**Managing notifications:**
1. Click the bell icon
2. See all recent notifications
3. Click one to go to that item
4. Mark as read or clear all

---

## For Administrators

### User Management

**Approving new users:**
1. Go to **Admin** → **Pending Approvals**
2. Review each registration
3. Check their email and details
4. Assign appropriate role and department
5. Click **Approve** or **Reject**

**Changing user roles:**
1. Go to **Admin** → **Users**
2. Find the user
3. Click **Edit**
4. Change their role
5. Save changes

**Deactivating users:**
1. Find the user in **Admin** → **Users**
2. Click **Deactivate**
3. User can no longer login
4. Their data is preserved

---

### System Settings

**Barangay Information:**
- Update barangay name and details
- Set the hall location on map
- Configure working hours

**Backup & Restore:**
1. Go to **Admin** → **Settings** → **Backup**
2. Click **Create Backup**
3. Download the backup file
4. Store it safely

**To restore:**
1. Go to **Backup** section
2. Click **Import Backup**
3. Select your backup file
4. Choose merge or replace mode
5. Wait for completion

---

### Departments

**Creating a department:**
1. Go to **Admin** → **Departments**
2. Click **+ Add Department**
3. Enter name and description
4. Assign a department head
5. Save

**Managing departments:**
- Edit department details anytime
- View all members
- See department statistics
- Transfer users between departments

---

## Tips for Success

### For Everyone

1. **Check your dashboard daily** - Stay updated on your tasks
2. **Update task status** - Helps everyone know where things stand
3. **Use comments** - Communicate issues or progress
4. **Don't ignore notifications** - They're important

### For Managers

1. **Balance workloads** - Don't overload one person
2. **Set realistic deadlines** - Give enough time
3. **Review regularly** - Check progress weekly
4. **Give feedback** - Help your team improve

### For Workers

1. **Clock in on time** - Your hours are tracked
2. **Ask if confused** - Use comments to ask questions
3. **Update status** - Don't leave tasks stuck
4. **Complete high priority first** - Urgent tasks come first

---

## Common Questions

**Q: I forgot my password**
A: Click "Forgot Password" on the login page. Check your email for reset link.

**Q: I can't see a project**
A: You might not be assigned to it. Ask your manager to add you.

**Q: My task is stuck**
A: Check if it needs review. Ask your manager if there's an issue.

**Q: How do I change my profile picture?**
A: Go to your profile (click your name), then click on your picture to upload a new one.

**Q: Can I work offline?**
A: Limited features work offline. Your changes sync when you're back online.

**Q: Who do I contact for help?**
A: Contact your department manager first. For system issues, contact the Admin.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Dashboard** | Your home page with overview of your work |
| **Project** | A major initiative with multiple tasks |
| **Event** | A scheduled community activity |
| **Task** | A specific work item to complete |
| **Milestone** | A major checkpoint in a project |
| **Kanban** | Visual board showing tasks by status |
| **Clock In/Out** | Recording when you start and stop work |
| **Department** | A division within the barangay (e.g., Infrastructure, Health) |

---

## Contact & Support

For technical issues or questions about this system, contact your system administrator.

---

*BarangayLink v2 - Making barangay management simpler and more efficient.*
