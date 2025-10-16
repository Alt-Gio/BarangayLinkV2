# ✅ Events & Calendar Improvements - Progress Summary

## 🎯 Completed Tasks:

### 1. **Schema Updates** ✅
**File**: `convex/schema.ts`
- ✅ Added `archived` status to events
- ✅ Added `projectId: v.optional(v.id("projects"))` field
- ✅ Added `archivedAt: v.optional(v.number())` field
- ✅ Added `archivedBy: v.optional(v.id("users"))` field
- ✅ Added index `by_status` for filtering
- ✅ Added index `by_project` for project queries

### 2. **Convex Mutations** ✅
**File**: `convex/events.ts`

#### Archive & Restore:
- ✅ `archiveEvent` - Soft delete (sets status to "archived")
- ✅ `restoreEvent` - Restore archived event
- ✅ `deleteEvent` - Updated to be admin-only (permanent delete)

#### Event Creation:
- ✅ `createEvent` - Updated to include `projectId` field
- ⏳ `createProjectEvent` - Needs update to include `projectId`

### 3. **Convex Queries** ✅
**File**: `convex/events.ts`

- ✅ `getArchivedEvents` - Fetch all archived events
- ✅ `getEventsByProject` - Get events linked to a specific project
- ✅ `getEventsForExport` - Get formatted data for CSV/iCal export
- ⏳ `getAllEvents` - Needs update to exclude archived by default

---

## 📋 Remaining Tasks:

### 4. **Frontend - Events Page** ⏳
**File**: `src/app/events/page.tsx`

**Needs:**
- [ ] Add Archive tab/filter
- [ ] Add Export button with dropdown (CSV, iCal)
- [ ] Add mobile responsiveness check (hide Month/Week/Day on mobile)
- [ ] Add project filter dropdown
- [ ] Improve view mode toggles design
- [ ] Add "Archived" badge/indicator
- [ ] Modernize overall layout

**Current State:**
```typescript
type ViewMode = "month" | "week" | "day" | "list" | "grid";
type EventType = "all" | "meeting" | "community" | "project" | "emergency";
```

**Needs to Add:**
```typescript
const [showArchived, setShowArchived] = useState(false);
const [selectedProject, setSelectedProject] = useState<Id<"projects"> | null>(null);
const archiveEvent = useMutation(api.events.archiveEvent);
const restoreEvent = useMutation(api.events.restoreEvent);
const exportData = useQuery(api.events.getEventsForExport, {...});
```

### 5. **Create Event Modal** ⏳
**File**: `src/components/events/CreateEventModal.tsx`

**Needs:**
- [ ] Add project selection dropdown
- [ ] Simplify form layout
- [ ] Better visual indicators
- [ ] Improve validation

**Add Field:**
```typescript
const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
const projects = useQuery(api.projects.getAllProjects);

// In form:
<Select value={projectId} onChange={setProjectId}>
  <option value="">No Project</option>
  {projects?.map(p => (
    <option key={p._id} value={p._id}>{p.title}</option>
  ))}
</Select>
```

### 6. **Event Card Component** ⏳
**File**: `src/components/events/EventCard.tsx`

**Needs:**
- [ ] Add Archive button (replaces Delete for non-admins)
- [ ] Add Project badge display
- [ ] Improve card design
- [ ] Add restore button for archived events

**Example:**
```typescript
{event.projectId && (
  <Badge className="bg-purple-600/20 text-purple-400">
    <Briefcase className="w-3 h-3 mr-1" />
    {projectName}
  </Badge>
)}

{event.status === "archived" ? (
  <Button onClick={() => restoreEvent({ eventId: event._id })}>
    <RotateCcw className="w-4 h-4" />
    Restore
  </Button>
) : (
  <Button onClick={() => archiveEvent({ eventId: event._id })}>
    <Archive className="w-4 h-4" />
    Archive
  </Button>
)}
```

### 7. **Calendar Views** ⏳
**Files**: 
- `src/components/events/CalendarView.tsx`
- `src/components/events/WeekView.tsx`
- `src/components/events/DayView.tsx`

**Needs:**
- [ ] Modern card design for events
- [ ] Better date navigation
- [ ] Project badges on events
- [ ] Hover effects
- [ ] Exclude archived events from display

### 8. **Export Functionality** ⏳
**Location**: `src/app/events/page.tsx` or new utility file

**Needs:**
```typescript
// CSV Export
const exportToCSV = async () => {
  const data = await getEventsForExport({});
  const csv = [
    ['Title', 'Type', 'Start Date', 'Location', 'Organizer', 'Attendees'],
    ...data.map(e => [
      e.title,
      e.type,
      new Date(e.startDate).toLocaleDateString(),
      e.location,
      e.organizer,
      e.attendeeCount
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `events-${Date.now()}.csv`;
  a.click();
};

// iCal Export
const exportToICal = async () => {
  const data = await getEventsForExport({});
  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BarangayLink//Events//EN
${data.map(e => `BEGIN:VEVENT
UID:${e.id}
DTSTAMP:${formatICalDate(e.createdAt)}
DTSTART:${formatICalDate(e.startDate)}
DTEND:${formatICalDate(e.endDate)}
SUMMARY:${e.title}
DESCRIPTION:${e.description}
LOCATION:${e.location}
ORGANIZER:${e.organizer}
END:VEVENT`).join('\n')}
END:VCALENDAR`;
  
  const blob = new Blob([ical], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `events-${Date.now()}.ics`;
  a.click();
};
```

### 9. **Mobile Responsiveness** ⏳
**Location**: `src/app/events/page.tsx`

**Implementation:**
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

// View mode options
const viewModes = isMobile 
  ? [
      { value: "list", icon: List, label: "List" },
      { value: "grid", icon: Grid, label: "Grid" }
    ]
  : [
      { value: "month", icon: Calendar, label: "Month" },
      { value: "week", icon: Calendar, label: "Week" },
      { value: "day", icon: Calendar, label: "Day" },
      { value: "list", icon: List, label: "List" },
      { value: "grid", icon: Grid, label: "Grid" }
    ];
```

---

## 🎨 Design Improvements Needed:

### Color Scheme:
- **Archive**: `bg-amber-600/20 text-amber-400 border-amber-500/30`
- **Project Badge**: `bg-purple-600/20 text-purple-400 border-purple-500/30`
- **Export Button**: `bg-blue-600 hover:bg-blue-700`

### Modern View Toggles:
```typescript
<div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg">
  {viewModes.map(mode => (
    <button
      key={mode.value}
      onClick={() => setViewMode(mode.value)}
      className={`
        px-4 py-2 rounded-md transition-all duration-200
        ${viewMode === mode.value 
          ? 'bg-emerald-600 text-white shadow-lg' 
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }
      `}
    >
      <mode.icon className="w-4 h-4 inline mr-2" />
      {mode.label}
    </button>
  ))}
</div>
```

### Archive Filter Toggle:
```typescript
<button
  onClick={() => setShowArchived(!showArchived)}
  className={`
    px-4 py-2 rounded-lg border transition-all
    ${showArchived
      ? 'bg-amber-600/20 border-amber-500/50 text-amber-400'
      : 'border-white/10 text-gray-400 hover:border-amber-500/30'
    }
  `}
>
  <Archive className="w-4 h-4 inline mr-2" />
  {showArchived ? 'Hide Archived' : 'Show Archived'}
</button>
```

---

## 📦 New Icons Needed:

Add to imports in relevant files:
```typescript
import {
  Archive,        // For archive button
  RotateCcw,      // For restore button
  Download,       // For export button
  FileText,       // For CSV export
  Calendar as CalendarIcon, // For iCal export
  Briefcase,      // For project badge
  Filter,         // For filters
} from "lucide-react";
```

---

## 🚀 Next Steps (Priority Order):

1. **Update `getAllEvents` query** to exclude archived by default
2. **Update Events Page** - Add archive filter, export button, mobile check
3. **Update Create Event Modal** - Add project selection
4. **Update Event Card** - Add archive/restore buttons, project badge
5. **Add Export Functions** - CSV and iCal
6. **Modernize Calendar Views** - Better design, project badges
7. **Test Everything** - All features working
8. **Polish Design** - Final touches, animations

---

## ✅ Summary:

**Backend (Convex):** ~80% Complete
- ✅ Schema updated
- ✅ Archive/Restore mutations added
- ✅ Export query added
- ✅ Project linking added
- ⏳ Minor query updates needed

**Frontend:** ~20% Complete
- ⏳ Events page needs major updates
- ⏳ Create modal needs project field
- ⏳ Event cards need archive buttons
- ⏳ Export functionality needs implementation
- ⏳ Mobile responsiveness needs implementation
- ⏳ Calendar views need modernization

**Estimated Remaining Work:** 2-3 hours of focused development

---

## 📝 Files Modified So Far:

1. ✅ `convex/schema.ts` - Events schema updated
2. ✅ `convex/events.ts` - Mutations and queries added

## 📝 Files Still Need Modification:

3. ⏳ `src/app/events/page.tsx` - Main events page
4. ⏳ `src/components/events/CreateEventModal.tsx` - Event creation
5. ⏳ `src/components/events/EventCard.tsx` - Event display
6. ⏳ `src/components/events/CalendarView.tsx` - Month view
7. ⏳ `src/components/events/WeekView.tsx` - Week view
8. ⏳ `src/components/events/DayView.tsx` - Day view
9. ⏳ `src/components/events/EventsList.tsx` - List view

**The foundation is solid! Now we need to build the UI on top of it.** 🎯
