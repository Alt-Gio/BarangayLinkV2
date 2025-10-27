# 📋 PUBLIC EVENT DISPLAY REQUIREMENTS - COMPLETE GUIDE

## ✅ **REQUIREMENTS FOR EVENTS TO SHOW ON LANDING PAGE**

For an event to appear on the public landing page, it MUST meet **ALL** of these conditions:

### **1. Public Event Checkbox ☑️**
```
isPublic = true
```
- The "Public Event" checkbox must be **CHECKED** when creating/editing the event
- Located in the "Event Settings" section
- If unchecked, event is internal only

### **2. Event Status = Published** 
```
status = "published"
```
- Event must be approved and published
- **Builder/Worker events:** Go to "pending" status → Need Manager approval first
- **Manager/Admin events:** Auto-published immediately

### **3. Event Date in Future**
```
startDate >= current time
```
- Only upcoming events show on landing page
- Past events are automatically hidden
- Check that your event date is set to the future

---

## 🎯 **COMPLETE WORKFLOW BY ROLE**

### **If You Are a MANAGER or ADMIN:**

```
✅ Create Event
  ↓
✅ Check "Public Event" ☑️
  ↓
✅ Set future date
  ↓
✅ Click "Create Event"
  ↓
✅ Event status = "published" (automatic)
  ↓
✅ Event appears on landing page IMMEDIATELY
```

**Your events show right away - no approval needed!**

---

### **If You Are a BUILDER or WORKER:**

```
✅ Create Event
  ↓
✅ Check "Public Event" ☑️
  ↓
✅ Set future date
  ↓
⚠️ "Require Approval" is FORCED ON (you can't uncheck it)
  ↓
✅ Click "Create Event"
  ↓
⚠️ Event status = "pending" (needs approval)
  ↓
❌ Event does NOT appear on landing page yet
  ↓
⏳ Wait for Manager to approve
  ↓
✅ Manager approves at /events/approval
  ↓
✅ Event status changes to "published"
  ↓
✅ Event NOW appears on landing page
```

**Your events need Manager approval before appearing!**

---

## 🔍 **TROUBLESHOOTING: WHY ISN'T MY EVENT SHOWING?**

### **Checklist:**

1. **Is "Public Event" checked?**
   - Go to event → Edit
   - Scroll to "Event Settings"
   - Verify checkbox is ☑️ checked
   - If not, check it and save

2. **Is the event in the future?**
   - Check Start Date/Time
   - Must be later than current time
   - Past events never show

3. **What's the event status?**
   - Go to /events (events page)
   - Find your event
   - Check if it shows "Pending Approval"
   - If pending → Go to /events/approval (Manager only)
   - Approve the event

4. **Are you a Builder/Worker?**
   - Your events ALWAYS need approval
   - Even with "Public Event" checked
   - Ask a Manager to approve at /events/approval

5. **Is the event cancelled?**
   - Cancelled events never show
   - Check event status

---

## 🔧 **BACKEND QUERY EXPLANATION**

**File:** `convex/events.ts` → `getUpcomingEvents`

```typescript
const events = await ctx.db
  .query("events")
  .filter((q) => q.and(
    q.gte(q.field("startDate"), now),        // ← Must be in future
    q.eq(q.field("status"), "published"),    // ← Must be published
    q.eq(q.field("isPublic"), true)          // ← Must be public
  ))
  .order("asc")
  .take(limit);
```

**All 3 conditions must be true:**
1. ✅ startDate >= now (upcoming)
2. ✅ status = "published" (approved)
3. ✅ isPublic = true (public checkbox checked)

---

## 📊 **EVENT STATUS FLOW**

### **Status Values:**
- `"draft"` - Not finished, saved for later
- `"pending"` - Awaiting Manager approval
- `"published"` - Approved and visible
- `"cancelled"` - Cancelled, hidden
- `"archived"` - Past event, archived

### **Status Assignment Logic:**

**When Creating Event:**
```typescript
if (userLevel < 4 && requiresApproval) {
  status = "pending"  // Builder/Worker
} else {
  status = "published"  // Manager/Admin
}
```

**For Builder/Worker:**
- `requiresApproval` is always forced to `true`
- Therefore: status is always `"pending"`
- Need Manager approval to become `"published"`

**For Manager/Admin:**
- `requiresApproval` checkbox is hidden (not needed)
- Therefore: status is always `"published"`
- Events appear immediately

---

## 🎨 **USER INTERFACE INDICATORS**

### **Create Event Modal:**

**Builder/Worker see:**
```
Event Settings:
  ☑ Public Event
  ☑ Require Approval (DISABLED - can't uncheck)
      ⚠️ Your events require Manager approval
```

**Manager/Admin see:**
```
Event Settings:
  ☑ Public Event
  (No "Require Approval" checkbox - not needed)
```

### **Landing Page:**

**Shows:**
```
[Event Image]
COMMUNITY  Open RSVP
Festival Paligas - Opening Ceremony
Grand opening with flag raising...
📅 11/20/2025    📍 Barangay Main Stage
[Join Activity]
```

**Doesn't Show:**
- Events with isPublic = false
- Events with status = "pending"
- Events with status = "cancelled"
- Events in the past

---

## 🚀 **QUICK FIX GUIDE**

### **"I checked Public Event but it's not showing!"**

**If you're a Builder/Worker:**
1. Your event is pending approval
2. Ask a Manager to:
   - Go to `/events/approval`
   - Find your event
   - Click "Approve Event"
3. Event will now appear!

**If you're a Manager/Admin:**
1. Check event date - is it in the future?
2. Edit event and verify "Public Event" is checked
3. Check if event was accidentally cancelled
4. Refresh the page

---

## 📱 **WHERE TO CHECK**

### **As Event Creator:**
- Go to `/events` (Events Calendar)
- Your event should appear there
- If it says "Pending Approval" → Wait for Manager

### **As Manager:**
- Go to `/events/approval` (Event Approval)
- See all pending events
- Approve events to make them visible

### **As Public User:**
- Go to `/` (Landing Page)
- Scroll to "Upcoming Events"
- Only see published, public, future events

---

## 🔐 **PERMISSION MATRIX**

| Role | Create Event | Auto-Published | Need Approval | Can Approve |
|------|--------------|----------------|---------------|-------------|
| Worker | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Builder | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Manager | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |

---

## 💡 **COMMON SCENARIOS**

### **Scenario 1: Builder Creates Public Event**

```
1. Builder creates "Community Festival"
2. Checks "Public Event" ☑️
3. Sets date to next week
4. Clicks "Create Event"
5. Event created with status = "pending"
6. Event does NOT appear on landing page
7. Builder asks Manager for approval
8. Manager goes to /events/approval
9. Manager clicks "Approve"
10. Event status → "published"
11. Event NOW appears on landing page ✅
```

### **Scenario 2: Manager Creates Public Event**

```
1. Manager creates "Monthly Assembly"
2. Checks "Public Event" ☑️
3. Sets date to next week
4. Clicks "Create Event"
5. Event created with status = "published"
6. Event appears on landing page IMMEDIATELY ✅
```

### **Scenario 3: Event Not Showing**

```
Problem: Event has "Public Event" checked but not showing

Checklist:
1. ✓ Public Event = checked
2. ? Status = pending (NEED APPROVAL)
3. ✓ Date = future

Solution: Get Manager approval
Result: Event appears after approval ✅
```

---

## 📝 **BACKEND CODE REFERENCE**

### **Event Creation (convex/events.ts):**

```typescript
// Determine status based on user level
const userLevel = currentUser.userLevel.level;
const eventStatus = (userLevel < 4 && args.requiresApproval) 
  ? "pending" 
  : "published";

// Create event
await ctx.db.insert("events", {
  title: args.title,
  isPublic: args.isPublic ?? true,
  requiresApproval: args.requiresApproval ?? false,
  status: eventStatus,  // ← This determines visibility
  // ...
});
```

### **Landing Page Query (convex/events.ts):**

```typescript
const events = await ctx.db
  .query("events")
  .filter((q) => q.and(
    q.gte(q.field("startDate"), now),     // Future only
    q.eq(q.field("status"), "published"), // Approved only
    q.eq(q.field("isPublic"), true)       // Public only
  ))
  .order("asc")
  .take(limit);
```

---

## ✅ **WHAT WAS FIXED**

### **Before:**
```
❌ Backend didn't filter by isPublic
❌ Frontend had redundant filter
❌ No clear documentation on requirements
```

### **After:**
```
✅ Backend explicitly filters by isPublic=true
✅ Frontend removed redundant filter
✅ Complete documentation created
✅ Clear role-based workflow
```

---

## 🎯 **FINAL ANSWER TO YOUR QUESTION**

**"I want if I add a check on the Public Event that it would show on the Landing Page."**

**Answer:**

✅ **If you are a Manager or Admin:**
- Check "Public Event" ☑️
- Event shows IMMEDIATELY on landing page

⚠️ **If you are a Builder or Worker:**
- Check "Public Event" ☑️
- Event does NOT show yet (status = "pending")
- Need Manager to approve at /events/approval
- THEN event shows on landing page

**This is by design for quality control!**

---

## 🚨 **IMPORTANT NOTES**

1. **Security/Quality:** Builder/Worker events need approval to prevent:
   - Spam events
   - Inappropriate content
   - Incorrect information
   - Unapproved activities

2. **Manager Bypass:** Managers/Admins don't need approval because:
   - They have authority
   - They are responsible
   - They can publish immediately

3. **Public vs RSVP:** 
   - `isPublic` = Event shows on landing page
   - `allowPublicRSVP` = Non-logged-in users can RSVP
   - These are SEPARATE settings

---

**ALL EVENTS WITH isPublic=true, status=published, AND FUTURE DATES WILL SHOW!** ✅🎉📅
