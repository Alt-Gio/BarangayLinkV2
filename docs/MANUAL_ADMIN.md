# BarangayLink - Admin Manual

A complete guide for System Administrators.

---

## Your Role

As an **Admin**, you have full control over the BarangayLink system. You're responsible for managing users, configuring settings, and ensuring the system runs smoothly for everyone.

Think of yourself as the IT manager and HR combined - you decide who gets access, what they can do, and keep everything organized.

---

## Getting Started

### Your Dashboard

When you log in, your dashboard shows:
- Pending user approvals waiting for you
- System health and statistics
- Recent activity across all departments
- Quick access to admin functions

### Navigation

As an Admin, you have access to everything:
- **Dashboard** - Overview of system activity
- **Projects** - All projects from every department
- **Events** - All community events
- **Admin** - User management, settings, backups
- **Messages** - Communication with all users

---

## User Management

This is your most important job - controlling who can access the system and what they can do.

### Approving New Users

When someone registers, they wait for your approval.

**How to approve:**
1. Go to **Admin** → **Pending Approvals**
2. You'll see a list of people waiting
3. Click on a name to see their details
4. Review their information:
   - Is their email legitimate?
   - Do you recognize them?
   - What department should they be in?
5. Select their **Role**:
   - WORKER - Basic access, can only do assigned tasks
   - BUILDER - Can create tasks, more responsibility
   - MANAGER - Leads a department
   - CAPTAIN - Barangay official with oversight
   - ADMIN - Full system access (be careful!)
6. Select their **Department**
7. Click **Approve**

**If something looks wrong:**
- Click **Reject** with a reason
- They'll be notified and can try again

### Changing User Roles

Sometimes people get promoted or need different access.

**How to change a role:**
1. Go to **Admin** → **Users**
2. Find the person (use search if needed)
3. Click **Edit** next to their name
4. Change their role from the dropdown
5. Click **Save**

**When to change roles:**
- Worker doing well? Promote to Builder
- New department head? Make them Manager
- Someone leaving management? Demote appropriately

### Deactivating Users

When someone leaves or shouldn't have access anymore.

**How to deactivate:**
1. Go to **Admin** → **Users**
2. Find the person
3. Click **Deactivate**
4. Confirm your choice

**What happens:**
- They can't log in anymore
- Their work history is kept
- Their tasks get unassigned
- You can reactivate them later if needed

### Viewing User Activity

Keep track of what people are doing.

1. Go to **Admin** → **Users**
2. Click on any user
3. See their:
   - Login history
   - Tasks completed
   - Projects involved in
   - Recent activity

---

## Department Management

Organize your barangay into logical departments.

### Creating a Department

1. Go to **Admin** → **Departments**
2. Click **+ Add Department**
3. Enter:
   - Name (e.g., "Infrastructure", "Health", "Peace & Order")
   - Description of what they do
   - Department Head (select a Manager)
4. Click **Save**

### Common Departments

Here are typical barangay departments:
- **Infrastructure** - Roads, buildings, facilities
- **Health & Sanitation** - Medical programs, cleanliness
- **Peace & Order** - Security, tanod coordination
- **Social Services** - Aid programs, senior citizens
- **Youth & Sports** - SK activities, sports programs
- **Environment** - Clean-up drives, tree planting

### Managing Department Members

1. Go to **Admin** → **Departments**
2. Click on a department
3. See all members
4. To move someone:
   - Edit their user profile
   - Change their department
   - Save

---

## System Settings

Configure how BarangayLink works.

### Barangay Information

1. Go to **Admin** → **Settings**
2. Update your barangay details:
   - Official name
   - Address
   - Contact numbers
   - Mission and vision statements

### Map Settings

Set your barangay hall location:
1. Go to **Settings** → **Location**
2. Click on the map to set the pin
3. Or enter coordinates manually
4. Save

This helps with event locations and attendance tracking.

### Working Hours

Configure default working hours:
1. Go to **Settings** → **General**
2. Set start and end times
3. This affects time tracking features

---

## Backup & Recovery

Protect your data. This is critical!

### Creating a Backup

Do this regularly - at least weekly.

1. Go to **Admin** → **Settings** → **Backup**
2. Click **Create Backup**
3. Wait for it to complete
4. Click **Download**
5. Save the file somewhere safe:
   - USB drive
   - Cloud storage (Google Drive, etc.)
   - Another computer

### Automatic Backups

The system creates daily backups automatically. You can:
- View backup history
- Download any previous backup
- Configure retention (how long to keep them)

### Restoring from Backup

If something goes wrong:

1. Go to **Backup** section
2. Click **Import Backup**
3. Select your backup file
4. Choose mode:
   - **Replace** - Wipes everything and restores (use if major problem)
   - **Merge** - Adds missing data without deleting (safer)
5. Click **Restore**
6. Wait for completion (may take a few minutes)

**Warning:** Replace mode will delete current data. Be sure you want to do this!

---

## Invitations

Invite people to join the system directly.

### Sending an Invitation

1. Go to **Admin** → **Invitations**
2. Click **+ New Invitation**
3. Enter their email
4. Select their role and department
5. Add a personal message (optional)
6. Click **Send**

They'll receive an email with a link to register. Their role and department are pre-set.

### Tracking Invitations

See who you've invited:
- **Pending** - Sent but not yet accepted
- **Accepted** - They registered successfully
- **Expired** - Link expired (resend if needed)

---

## Reports & Analytics

Monitor how the barangay is performing.

### Available Reports

1. **User Activity** - Who's active, who's not
2. **Project Progress** - Overall completion rates
3. **Event Attendance** - How many people come to events
4. **Task Completion** - Work getting done on time?
5. **Department Performance** - Compare departments

### Generating Reports

1. Go to **Dashboard** → **Analytics**
2. Select the report type
3. Choose date range
4. Click **Generate**
5. View on screen or download as PDF/Excel

### What to Look For

**Good signs:**
- High task completion rates
- Active daily users
- Projects finishing on time

**Warning signs:**
- Many overdue tasks
- Users not logging in
- Projects stuck in planning

---

## Troubleshooting

### Common Issues

**User can't log in:**
1. Check if they're approved
2. Check if they're deactivated
3. Have them reset password
4. Check their email is correct

**Missing data:**
1. Check the user's department access
2. Check project assignments
3. Restore from backup if needed

**System slow:**
1. Check your internet connection
2. Clear browser cache
3. Try a different browser
4. Contact technical support

### Getting Help

For technical issues beyond your control:
- Check the system documentation
- Contact the development team
- Provide error messages and screenshots

---

## Your Daily Checklist

Start each day with these tasks:

- [ ] Check pending user approvals
- [ ] Review system notifications
- [ ] Scan for any error reports
- [ ] Check backup status
- [ ] Review flagged content or issues

### Weekly Tasks

- [ ] Generate activity reports
- [ ] Review user access levels
- [ ] Check department performance
- [ ] Download manual backup
- [ ] Clean up old/unused accounts

### Monthly Tasks

- [ ] Full system review
- [ ] Update barangay information if needed
- [ ] Review and update departments
- [ ] Archive old projects
- [ ] Security audit of user access

---

## Best Practices

1. **Approve users promptly** - Don't leave people waiting
2. **Be careful with Admin role** - Only give it when necessary
3. **Backup regularly** - You'll thank yourself later
4. **Document changes** - Keep notes on major decisions
5. **Communicate** - Let users know about system updates
6. **Review access regularly** - Remove people who shouldn't have access
7. **Stay organized** - Keep departments and roles logical

---

## Quick Reference

### Role Hierarchy

```
ADMIN (You - Full Access)
   ↓
CAPTAIN (Oversight of all)
   ↓
MANAGER (Department heads)
   ↓
BUILDER (Senior staff)
   ↓
WORKER (Basic access)
```

### Keyboard Shortcuts

- `Ctrl + K` - Quick search
- `Ctrl + N` - New item
- `Esc` - Close modal/dialog

---

*You're the backbone of the system. Keep it running smoothly!*
