# 📊 Barangay Calendar 2025 - Import Guide

## 📁 **File Structure**

```
data/
├── barangay-calendar-2025.json  ← Main data file
└── README-IMPORT.md              ← This file
```

---

## 📋 **JSON Structure**

### **Committees**
```json
{
  "committees": [
    {
      "name": "Committee Name",
      "chairman": "HON. NAME",
      "position": "Position",
      "isActive": true
    }
  ]
}
```

### **Calendar Entries**
```json
{
  "calendarEntries": [
    {
      "date": "YYYY-MM-DD",
      "category": "PROJECT" | "EVENT",
      "type": "meeting" | "community" | "emergency",
      "title": "Event Title",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "location": "Location",
      "isAllDay": boolean,
      "duration": "Optional duration text"
    }
  ]
}
```

---

## 🔍 **Category Definitions**

### **[PROJECT]**
Ongoing programs, initiatives, capacity building, systematic programs
- **Examples:** 
  - BHW Pre-Natal Checkup (recurring)
  - SLP Programs (multi-phase)
  - AKAP verification (systematic)
  - Capacity building training
  - Health campaigns

### **[EVENT]**
One-time occurrences, meetings, ceremonies, specific gatherings
- **Examples:**
  - BARCO deadline
  - Lupon meetings
  - Court hearings
  - Elections
  - One-time ceremonies

---

## 🚀 **How to Import**

### **Option 1: Manual Import via Convex Dashboard**

1. Go to Convex Dashboard
2. Select your database
3. Navigate to data import
4. Upload `barangay-calendar-2025.json`
5. Map fields to schema

### **Option 2: Create Import Script**

Create a script at `convex/importCalendar.ts`:

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import calendarData from "../data/barangay-calendar-2025.json";

export const importCommittees = internalMutation({
  handler: async (ctx) => {
    for (const committee of calendarData.committees) {
      await ctx.db.insert("committees", {
        name: committee.name,
        chairman: committee.chairman,
        position: committee.position,
        isActive: committee.isActive,
        createdAt: Date.now(),
      });
    }
  },
});

export const importCalendarEntries = internalMutation({
  handler: async (ctx, args: { organizerId: string }) => {
    const organizerId = args.organizerId;
    
    for (const entry of calendarData.calendarEntries) {
      const startDate = new Date(entry.date + "T" + (entry.startTime || "00:00")).getTime();
      const endDate = entry.endTime 
        ? new Date(entry.date + "T" + entry.endTime).getTime()
        : startDate + (3600000); // 1 hour default
      
      await ctx.db.insert("events", {
        title: entry.title,
        description: entry.title,
        type: entry.type,
        eventCategory: entry.category,
        startDate,
        endDate,
        location: entry.location || "TBA",
        organizer: organizerId,
        attendees: [],
        isPublic: true,
        requiresApproval: false,
        status: "published",
        attachments: [],
      });
    }
  },
});
```

### **Option 3: Use the Import Tool**

Run in terminal:
```bash
npx convex run importCalendar:importCommittees
npx convex run importCalendar:importCalendarEntries --organizerId YOUR_USER_ID
```

---

## 📝 **Field Mapping**

### **Committees → Schema**
```
JSON Field          →  Schema Field
────────────────────────────────────
name                →  name
chairman            →  chairman
position            →  position
isActive            →  isActive
                    →  createdAt (auto: Date.now())
```

### **Calendar Entries → Events Schema**
```
JSON Field          →  Schema Field
────────────────────────────────────
title               →  title
title               →  description (copy)
type                →  type
category            →  eventCategory
date + startTime    →  startDate (convert to timestamp)
date + endTime      →  endDate (convert to timestamp)
location            →  location
                    →  organizer (must provide)
                    →  attendees (empty array)
                    →  isPublic (true)
                    →  requiresApproval (false)
                    →  status ("published")
                    →  attachments (empty array)
```

---

## ✅ **Validation Rules**

Before importing, ensure:
- [ ] All dates are valid (YYYY-MM-DD format)
- [ ] Start time is before end time
- [ ] Event categories are "PROJECT" or "EVENT"
- [ ] Event types match schema: meeting, community, project, emergency, milestone
- [ ] Committee names are unique
- [ ] Organizer user ID exists in database

---

## 🎯 **Quick Statistics**

From the JSON file:
- **Total Committees:** 8
- **Total Calendar Entries:** 70+
- **Date Range:** February 2025 - July 2025
- **Categories:**
  - PROJECT: ~40 entries
  - EVENT: ~30 entries

---

## 🔧 **Customization**

You can modify the JSON file to:
1. Add more fields (coordinates, images, etc.)
2. Link events to projects
3. Add committee references
4. Include milestones
5. Add attendee lists

---

## 📞 **Support**

If you encounter issues:
1. Check schema compatibility
2. Validate JSON syntax
3. Ensure user IDs exist
4. Review Convex logs

---

**Last Updated:** November 23, 2025
**Version:** 1.0.0
