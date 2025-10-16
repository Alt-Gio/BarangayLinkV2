# 🎯 Events & Calendar - Complete Improvement Plan

## ✅ Requirements Summary:

### 1. **Archive Events** (Not Delete)
- Add "Archive" functionality instead of permanent deletion
- Archived events hidden in separate category
- Can be restored later

### 2. **Export Button**
- Export events to CSV/iCal format
- Export calendar view

### 3. **Modern Month/Week/Day Views**
- Redesign calendar views to be clean and modern
- Similar to List/Grid improvements

### 4. **Mobile Optimization**
- **Mobile**: Only show List and Grid views
- **Desktop**: Show all views (Month, Week, Day, List, Grid)
- Responsive design

### 5. **Easier Event Creation**
- Simplify create event modal
- Better visual indicators
- Project attachment field

### 6. **Project Linking**
- Attach events to projects
- Show project badge on events
- Filter by project

### 7. **Overall Design Improvements**
- Modern, clean interface
- Better spacing and typography
- Improved color scheme
- Smooth animations

---

## 🔧 Implementation Steps:

### Step 1: Schema Updates ✅
**File**: `convex/schema.ts`
- ✅ Added `archived` status to events
- ✅ Added `projectId` field to link events to projects
- ✅ Added `archivedAt` and `archivedBy` fields
- ✅ Added indexes for `by_status` and `by_project`

### Step 2: Convex Mutations & Queries
**File**: `convex/events.ts`
- [ ] Add `archiveEvent` mutation
- [ ] Add `restoreEvent` mutation
- [ ] Add `exportEvents` query (returns formatted data)
- [ ] Update `createEvent` to include `projectId`
- [ ] Add `getArchivedEvents` query
- [ ] Add `getEventsByProject` query

### Step 3: Events Page Redesign
**File**: `src/app/events/page.tsx`
- [ ] Add Archive filter/tab
- [ ] Add Export button with dropdown (CSV, iCal)
- [ ] Improve view mode toggles
- [ ] Add mobile responsiveness (hide Month/Week/Day on mobile)
- [ ] Add project filter
- [ ] Modernize overall layout

### Step 4: Create Event Modal Enhancement
**File**: `src/components/events/CreateEventModal.tsx`
- [ ] Add project selection dropdown
- [ ] Simplify form layout
- [ ] Better visual indicators
- [ ] Improve validation feedback

### Step 5: Calendar View Components
**Files**: 
- `src/components/events/CalendarView.tsx` (Month)
- `src/components/events/WeekView.tsx`
- `src/components/events/DayView.tsx`

- [ ] Modern card design for events
- [ ] Better date navigation
- [ ] Improved event display
- [ ] Project badges on events
- [ ] Hover effects and animations

### Step 6: List & Grid Views
**Files**:
- `src/components/events/EventsList.tsx`
- `src/components/events/EventCard.tsx`

- [ ] Add archive button
- [ ] Add project badge
- [ ] Improve card design
- [ ] Add export option per event

---

## 🎨 Design Specifications:

### Color Scheme:
- **Primary**: Emerald (existing)
- **Archive**: Amber/Yellow
- **Project Badge**: Purple
- **Event Types**:
  - Meeting: Blue
  - Community: Green
  - Project: Purple
  - Emergency: Red

### Typography:
- Headers: `font-semibold text-lg`
- Body: `text-sm text-gray-300`
- Dates: `text-xs text-gray-400`

### Spacing:
- Card padding: `p-5`
- Gap between items: `gap-4`
- Section margins: `mb-6`

### Animations:
- Hover: `transition-all duration-300`
- Fade in: `animate-fadeIn`
- Slide: `animate-slideIn`

---

## 📱 Mobile Responsiveness:

### Breakpoints:
```css
/* Mobile: < 768px */
- Show: List, Grid
- Hide: Month, Week, Day

/* Tablet: 768px - 1024px */
- Show: All views
- Compact layout

/* Desktop: > 1024px */
- Show: All views
- Full layout
```

### Implementation:
```typescript
const isMobile = window.innerWidth < 768;
const viewModes = isMobile 
  ? ["list", "grid"] 
  : ["month", "week", "day", "list", "grid"];
```

---

## 🔄 Archive Functionality:

### Archive Button:
```typescript
<Button onClick={() => archiveEvent(event._id)}>
  <Archive className="w-4 h-4" />
  Archive
</Button>
```

### Archive Filter:
```typescript
const [showArchived, setShowArchived] = useState(false);
const filteredEvents = events?.filter(e => 
  showArchived ? e.status === "archived" : e.status !== "archived"
);
```

### Restore:
```typescript
<Button onClick={() => restoreEvent(event._id)}>
  <RotateCcw className="w-4 h-4" />
  Restore
</Button>
```

---

## 📤 Export Functionality:

### Export Options:
1. **CSV**: All event data in spreadsheet format
2. **iCal**: Calendar format for import to Google Calendar, Outlook, etc.

### Implementation:
```typescript
const exportToCSV = (events) => {
  const csv = events.map(e => 
    `${e.title},${e.startDate},${e.location}`
  ).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'events.csv';
  a.click();
};
```

---

## 🔗 Project Linking:

### Event Card with Project:
```typescript
{event.projectId && (
  <Badge className="bg-purple-600/20 text-purple-400">
    <Briefcase className="w-3 h-3 mr-1" />
    {projectName}
  </Badge>
)}
```

### Create Event with Project:
```typescript
<Select value={projectId} onChange={setProjectId}>
  <option value="">No Project</option>
  {projects.map(p => (
    <option key={p._id} value={p._id}>{p.title}</option>
  ))}
</Select>
```

---

## ✨ Modern Calendar Views:

### Month View:
- Grid layout with clean cells
- Event dots/badges in cells
- Hover to see event details
- Click to open event modal

### Week View:
- Timeline with hourly slots
- Event blocks with duration
- Drag to reschedule (future)
- Color-coded by type

### Day View:
- Detailed timeline
- Full event information
- Easy to add new events
- Agenda-style list

---

## 🚀 Next Steps:

1. ✅ Update schema
2. Add Convex mutations (archive, restore, export)
3. Redesign events page layout
4. Enhance create event modal
5. Modernize calendar views
6. Add mobile responsiveness
7. Test all functionality
8. Polish design and animations

---

## 📝 Files to Modify:

### Backend (Convex):
- ✅ `convex/schema.ts`
- `convex/events.ts`

### Frontend (Components):
- `src/app/events/page.tsx`
- `src/components/events/CreateEventModal.tsx`
- `src/components/events/CalendarView.tsx`
- `src/components/events/WeekView.tsx`
- `src/components/events/DayView.tsx`
- `src/components/events/EventsList.tsx`
- `src/components/events/EventCard.tsx`

---

## 🎉 Expected Result:

A modern, fully-featured Events & Calendar system with:
- ✅ Archive instead of delete
- ✅ Export to CSV/iCal
- ✅ Beautiful Month/Week/Day views
- ✅ Mobile-optimized (List/Grid only)
- ✅ Easy event creation with project linking
- ✅ Clean, modern design throughout

**This will be a production-ready calendar system!** 🚀
