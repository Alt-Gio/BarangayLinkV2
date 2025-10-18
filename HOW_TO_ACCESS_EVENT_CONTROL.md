# 🎯 How to Access Event Control

## ✅ **Event Control is Now Accessible!**

Event Control has been integrated into your events page. Here's how to access it:

---

## 📍 **2 Ways to Access Event Control**

### **Method 1: Direct Button on Event Cards** ⭐ RECOMMENDED

1. **Go to Event Calendar**
   ```
   Click: Event Management → Event Calendar
   Or visit: /events
   ```

2. **Find any event card**
   - You'll see event cards in grid or list view

3. **Click "Event Control Board" button**
   - Green button at the bottom of each event card
   - Has a Target icon (🎯)

4. **You're in!**
   - Opens the full Kanban board for that event

---

### **Method 2: Dropdown Menu**

1. **Go to Event Calendar** (`/events`)

2. **Click the 3-dot menu** (⋮) on any event card
   - Located in the top-right corner of the card

3. **Select "Event Control"**
   - First option in the dropdown menu
   - Has a green icon

4. **Board opens!**

---

## 🚀 **Quick Start**

### **After Opening Event Control:**

1. **View the Dashboard Stats**
   - Total tasks, In Progress, Done, etc.
   - 6 stat cards at the top

2. **See Kanban Columns:**
   ```
   📋 Backlog  →  📝 To Do  →  ⚡ In Progress  →  👀 In Review  →  ✅ Done  →  🚫 Blocked
   ```

3. **Create Your First Task:**
   - Click **"Create Task"** button (green, top-right)
   - Fill in task details
   - Assign to team members (if you're Manager/Admin)

4. **Organize Tasks:**
   - Move tasks between columns using dropdown
   - Track progress with visual indicators
   - Monitor deadlines

---

## 📱 **Navigation**

### **Event Control URL Structure:**
```
/events                          → Event Calendar (main page)
/events/[eventId]/control        → Event Control Board for specific event
```

### **Example:**
If your event ID is `j97abc123`, the Event Control URL would be:
```
/events/j97abc123/control
```

---

## 🎯 **What You'll See**

### **On Every Event Card:**

```
┌─────────────────────────────────┐
│  [Event Type Header]            │
│  Event Title                    │
├─────────────────────────────────┤
│  📅 Date & Time                 │
│  📍 Location                    │
│  👥 Attendees                   │
│                                 │
│  Organized by: Name             │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🎯 Event Control Board    │ │ ← NEW BUTTON!
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 🔐 **Who Can Access?**

✅ **Everyone can access Event Control for:**
- Events they created (organizer)
- Events they're attending
- Public events

✅ **MANAGER, CAPTAIN, ADMIN can:**
- Access all events
- Assign tasks to team members
- Manage the full board

---

## 🎨 **Features Available**

Once in Event Control, you can:

### **View:**
- ✅ Kanban board with 6 columns
- ✅ Dashboard statistics
- ✅ Task cards with details
- ✅ Assigned users
- ✅ Due dates & progress

### **Create:**
- ✅ New tasks
- ✅ Subtasks
- ✅ Checklist items

### **Manage:**
- ✅ Move tasks between statuses
- ✅ Assign to team members (if Manager+)
- ✅ Update task details
- ✅ Track time spent

### **Filter:**
- ✅ Search tasks
- ✅ Filter by priority
- ✅ View by status column

---

## 🎯 **Visual Guide**

### **Step-by-Step with Screenshots:**

#### **Step 1: Event Calendar**
```
[Event Management] → [Event Calendar]
```
You'll see all your events in a grid or list.

#### **Step 2: Event Card**
Each event card has the new green button at the bottom.

#### **Step 3: Event Control**
Full Kanban board opens with:
- Stats dashboard
- 6 status columns
- Task cards
- Create task button

---

## 💡 **Tips**

### **Best Practices:**
- ✅ Access Event Control **before** the event to plan
- ✅ Create tasks for **setup, execution, cleanup**
- ✅ Assign tasks based on team member **roles**
- ✅ Track progress in **real-time** during events
- ✅ Mark tasks as **Done** when completed

### **Common Use Cases:**
```
📅 Planning Phase:
   → Create all necessary tasks
   → Set deadlines
   → Assign team members

⚡ Execution Phase:
   → Move tasks to "In Progress"
   → Track real-time updates
   → Monitor overdue items

✅ Completion Phase:
   → Mark tasks as "Done"
   → Review completion rates
   → Generate reports
```

---

## 🚨 **Troubleshooting**

### **"I don't see the button"**
- ✅ Refresh the page
- ✅ Check you're on `/events` page
- ✅ Archived events don't show the button

### **"Button does nothing"**
- ✅ Make sure Convex is running (`npx convex dev`)
- ✅ Check browser console for errors
- ✅ Verify event ID exists

### **"Cannot create tasks"**
- ✅ Verify you're authenticated
- ✅ Check event exists
- ✅ Ensure schema is deployed

---

## 🎉 **You're Ready!**

**Event Control is now fully accessible from every event card!**

Just go to:
1. **Event Calendar** (`/events`)
2. **Click any event's "Event Control Board" button**
3. **Start organizing!**

**No more searching for the URL - it's right there on every event! 🚀**
