# 🚀 Setup Instructions - Landmarks & Map Management

## ✅ What Was Completed

### 1. **Fixed X Icon Error** ✅
Added missing `X` import to `src/app/admin/settings/page.tsx`:
```typescript
import { ..., X } from "lucide-react";
```

### 2. **Backend (Convex)** ✅

#### New Files Created:
1. **`convex/landmarks.ts`** - Landmarks management functions
2. **`convex/mapManagement.ts`** - Map visibility & editing functions  
3. **`convex/seedLandmarks.ts`** - Initial data seeding
4. **`convex/schema.ts`** - Updated with new tables

#### New Functions:
- `getAllLandmarks` - Get all landmarks from DB
- `getBarangayHallCoordinates` - Get default location
- `updateBarangayHallCoordinates` - Update default
- `createLandmark` - Add new landmark
- `updateLandmark` - Edit landmark
- `deleteLandmark` - Remove landmark
- `getProjectsWithoutCoordinates` - Find missing coords
- `getEventsWithoutCoordinates` - Find missing coords
- `updateProjectCoordinates` - Bulk update
- `updateEventCoordinates` - Bulk update
- `toggleProjectVisibility` - Public/Private toggle
- `toggleEventVisibility` - Public/Private toggle
- `quickUpdateProjectLocation` - Fast coordinate edit
- `quickUpdateEventLocation` - Fast coordinate edit

### 3. **Admin Settings Page** ✅

**Location**: `/admin/settings` → **Landmarks & Coordinates** Tab

**Features**:
- ✅ Update Barangay Hall default coordinates
- ✅ View all landmarks dynamically from DB
- ✅ Add new landmarks (modal with form)
- ✅ Edit existing landmarks (pre-filled modal)
- ✅ Delete landmarks (confirmation dialog)
- ✅ View projects without coordinates (badge count + modal)
- ✅ View events without coordinates (badge count + modal)
- ✅ Inline coordinate editing in modals
- ✅ Mobile-responsive design
- ✅ All buttons working & connected to backend

### 4. **Map Integration** ✅

**Features Added**:
- ✅ Landmarks loaded dynamically from database
- ✅ "Manage Landmarks →" link in landmarks panel
- ✅ Admin controls in event/project popups:
  - "Edit" button (links to edit page)
  - "Public/Private" toggle button
  - Visibility badge (👁️ PUBLIC / 🔒 PRIVATE)
- ✅ Mobile-friendly popup layout

---

## 🔧 Setup Steps

### 1. **Run Convex**
```bash
npx convex dev
```
(Keep this running)

### 2. **Seed Initial Landmarks** (First Time Only)
```bash
npx convex run seedLandmarks:seedInitialLandmarks
```
This creates 3 default landmarks:
- 🏢 SM City Legazpi
- 🏬 Yashano Mall  
- 🌋 Mayon Volcano

### 3. **Start Dev Server**
```bash
npm run dev
```

### 4. **Access Admin Page**
1. Login as admin
2. Go to: http://localhost:3000/admin/settings
3. Click "Landmarks & Coordinates" tab

---

## 📱 Mobile-Friendly Features

All implemented with responsive design:
- ✅ Forms stack on mobile
- ✅ Buttons are touch-friendly
- ✅ Modals scroll on small screens
- ✅ Flex layouts wrap appropriately
- ✅ Text sizes optimized for mobile

---

## 🎯 How To Use

### **For Admins - Manage Landmarks**:

1. **Update Barangay Hall**:
   - Edit lat/lng inputs
   - Click "Update Barangay Hall Location"
   - Success alert confirms

2. **Add New Landmark**:
   - Click "Add New Landmark"
   - Fill form (name, icon, color, coordinates, Google Maps URL)
   - Click "Add Landmark"

3. **Edit Landmark**:
   - Click "Edit" on any landmark card
   - Modify fields
   - Click "Save Changes"

4. **Delete Landmark**:
   - Click trash icon
   - Confirm deletion

5. **Manage Coordinates**:
   - Click "View Projects List" or "View Events List"
   - Enter coordinates in inline form
   - Auto-saves on blur

### **For Admins - On Map**:

1. **View Landmarks**:
   - Click any landmark marker
   - See coordinates and Google Maps link
   - Click "Manage Landmarks →" to edit

2. **Edit Projects/Events**:
   - Click project/event marker
   - See PUBLIC/PRIVATE badge
   - Click "Edit" to modify
   - Click toggle to change visibility

---

## 🔐 Privacy Features

Both **Projects** and **Events** have:
- `isPublic` field (already in schema)
- Toggle button in admin popup
- Visual badge showing status
- Quick visibility changes from map

**Public** = 👁️ GREEN badge, visible to everyone
**Private** = 🔒 GRAY badge, admin/members only

---

## 🗺️ Map-Settings Connection

The map and admin settings are now **fully connected**:

1. **Landmarks sync automatically**
   - Add in settings → appears on map instantly
   - Edit in settings → updates on map
   - Delete in settings → removes from map

2. **Quick access**
   - "Manage Landmarks →" link in map panel
   - Opens settings tab directly

3. **Real-time updates**
   - Changes in settings reflect immediately
   - No page refresh needed

---

## 📊 What You Can Now Do

### **From Admin Settings Page**:
- ✅ Manage all landmarks
- ✅ Update default location
- ✅ Find items without coordinates
- ✅ Bulk coordinate editing

### **From Map**:
- ✅ View all landmarks with coords
- ✅ Quick link to manage landmarks
- ✅ Edit projects/events directly
- ✅ Toggle public/private instantly
- ✅ See visibility status at a glance

---

## ⚡ Next Steps (If Needed)

1. **Add coordinate picker** - Click map to set coords
2. **Drag markers** - Drag to reposition
3. **Bulk operations** - Select multiple items
4. **Import/Export** - CSV coordinate management
5. **Custom marker icons** - Upload custom images

---

## 🎉 Summary

Everything is now:
- ✅ Fully functional
- ✅ Connected (map ↔ settings)
- ✅ Mobile-friendly
- ✅ Admin-controlled
- ✅ Real-time synced
- ✅ Production-ready!

**All your requested features are implemented and working!** 🚀
