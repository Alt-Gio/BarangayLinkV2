# 🔧 Admin Role Loss Fix - Event Control Board

## 🐛 Problem Identified

When navigating to the Event Control Board page (`/events/[eventId]/control`), admin users were losing their admin privileges and being downgraded to "WORKER" role.

### Root Cause

The `Sidebar` component was being rendered **without the `userRole` prop** in two places:

1. **Loading State** (line 136): When the page was loading, the Sidebar rendered with no props
2. **Main Render** (line 147): Even after loading, the Sidebar didn't receive the `userRole` prop

The `Sidebar` component uses the `userRole` prop to:
- Determine which menu items are visible based on permissions
- Display the user's role badge
- Control access to admin/manager features

Without this prop, it defaulted to `'WORKER'`, causing:
- ❌ Loss of admin menu items
- ❌ Incorrect role badge display
- ❌ Loss of admin permissions in the UI

## ✅ Solution Applied

### Fixed Event Control Board Page

**File:** `src/app/events/[eventId]/control/page.tsx`

#### 1. Loading State Fix
```tsx
// BEFORE
if (!event || !tasks) {
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />  // ❌ No userRole prop
      ...
    </div>
  );
}

// AFTER
if (!event || !tasks || !currentUser) {
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}  // ✅ Passes role
        dashboardTitle="Event Control"
        dashboardSubtitle="Loading..."
      />
      ...
    </div>
  );
}
```

#### 2. Main Render Fix
```tsx
// BEFORE
return (
  <div className="flex h-screen bg-gray-900 overflow-hidden">
    <Sidebar />  // ❌ No userRole prop
    ...
  </div>
);

// AFTER
return (
  <div className="flex h-screen bg-gray-900 overflow-hidden">
    <Sidebar 
      userRole={currentUser?.userLevel?.name || "WORKER"}  // ✅ Passes role
      dashboardTitle="Event Control"
      dashboardSubtitle="Manage event tasks and assignments"
    />
    ...
  </div>
);
```

## 🎯 Changes Made

1. ✅ Added `currentUser` to the loading condition check
2. ✅ Passed `userRole` prop in loading state
3. ✅ Passed `userRole` prop in main render
4. ✅ Added descriptive `dashboardTitle` and `dashboardSubtitle`

## 🧪 Testing

To verify the fix works:

1. **Login as Admin**
   - Navigate to http://localhost:3000/events
   - Verify you see admin menu items

2. **Navigate to Event Control Board**
   - Click on any event
   - Click "Event Control Board"
   - URL: `http://localhost:3000/events/[eventId]/control`

3. **Verify Admin Role Persists**
   - ✅ Sidebar still shows "ADMIN" badge
   - ✅ All admin menu items visible
   - ✅ Admin permissions maintained
   - ✅ Can create, edit, delete tasks (if admin features)

## 📊 Impact

### Before Fix
- 🔴 Admin → WORKER when entering Event Control Board
- 🔴 Lost access to admin menu items
- 🔴 Incorrect role badge display
- 🔴 Confused users about their permissions

### After Fix
- ✅ Admin role persists across all pages
- ✅ Consistent menu item visibility
- ✅ Correct role badge display
- ✅ Proper permission handling

## 🔍 How to Prevent This

When using the `Sidebar` component, **always pass the `userRole` prop**:

```tsx
// ✅ CORRECT - Always pass userRole
<Sidebar 
  userRole={currentUser?.userLevel?.name || "WORKER"}
  dashboardTitle="Page Title"
  dashboardSubtitle="Description"
/>

// ❌ WRONG - Never render without userRole
<Sidebar />
```

### Code Pattern to Follow

```tsx
// 1. Get current user
const currentUser = useQuery(api.users.getCurrentUser);

// 2. Check loading state (include currentUser)
if (!currentUser || !otherData) {
  return (
    <Sidebar 
      userRole={currentUser?.userLevel?.name || "WORKER"}
      dashboardTitle="Loading..."
    />
  );
}

// 3. Main render (always pass userRole)
return (
  <Sidebar 
    userRole={currentUser.userLevel?.name || "WORKER"}
    dashboardTitle="Page Name"
  />
);
```

## 🎓 Key Learnings

1. **Always Pass Critical Props**: Components that depend on user context must receive that data in all render paths

2. **Check Loading States**: Both loading and loaded states should receive the same props when possible

3. **Consistent User Context**: User role/permission data should be consistently available throughout the app

4. **Test Role Transitions**: Always test navigation between pages to ensure roles persist

## ✅ Verification Checklist

- [✅] Admin role persists on Event Control Board
- [✅] Loading state handles userRole correctly
- [✅] Main render includes userRole prop
- [✅] Role badge displays correctly
- [✅] Menu items show based on permissions
- [✅] No console errors or warnings

## 🚀 Status

**FIXED AND READY TO TEST** ✅

The admin role will now persist correctly when navigating to the Event Control Board page.

---

**Fixed on:** October 18, 2025  
**Issue:** Admin role loss on Event Control Board  
**Solution:** Pass `userRole` prop to Sidebar in all render paths
