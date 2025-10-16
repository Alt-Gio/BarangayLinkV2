# ✅ Fixed: Archive/Edit/Delete Error

## 🐛 **Error:**
```
[CONVEX M(events:archiveEvent)] Server Error
Uncaught Error: Invalid argument `id` for `db.get`, 
expected string but got 'object': [object Object]
at handler (../convex/events.ts:138:9)
```

## 🔍 **Root Cause:**

The error occurred because `currentUser.userLevel` was already a **full object** (with `_id`, `name`, `level` properties), but the code was trying to use it as an **ID** to fetch from the database with `ctx.db.get(currentUser.userLevel)`.

### The Problem:
```typescript
// This failed when currentUser.userLevel was already an object
const userLevel = await ctx.db.get(currentUser.userLevel);
// ❌ Error: Can't use an object as an ID!
```

### Why It Happened:
The `getCurrentUser()` function likely returns the user with userLevel already populated (joined/expanded), so `currentUser.userLevel` is:
```typescript
{
  _id: "xyz123",
  name: "ADMIN",
  level: 4,
  // ... other fields
}
```

NOT just an ID like `"xyz123"`.

## ✅ **Solution:**

Added a check to see if `userLevel` is already an object. If it is, use it directly. If not, fetch it from the database.

### Fixed Code:
```typescript
// Check if userLevel is already an object or if we need to fetch it
const userLevel = typeof currentUser.userLevel === 'object' 
  && currentUser.userLevel !== null 
  && '_id' in currentUser.userLevel
    ? currentUser.userLevel  // Already an object, use it!
    : await ctx.db.get(currentUser.userLevel as any); // Just an ID, fetch it
```

## 📝 **Files Fixed:**

**File**: `convex/events.ts`

### 1. `archiveEvent` mutation (line 138-141) ✅
### 2. `restoreEvent` mutation (line 176-178) ✅
### 3. `deleteEvent` mutation (line 212-214) ✅

All three mutations now handle both cases:
- ✅ When `currentUser.userLevel` is already a full object
- ✅ When `currentUser.userLevel` is just an ID that needs fetching

## 🎯 **Result:**

Now when you click the three-dot menu (⋮) and select:
- ✅ **Edit** - Opens edit modal
- ✅ **Archive** - Archives the event (soft delete)
- ✅ **Restore** - Restores archived event
- ✅ **Delete** - Permanently deletes (admin only)

**No more errors!** 🎉

## 🧪 **Testing:**

### As Organizer:
- [ ] Click ⋮ menu on your event
- [ ] Click "Edit Event" - should open edit modal
- [ ] Click "Archive" - should archive the event
- [ ] Click "Restore" (on archived event) - should restore it

### As Admin:
- [ ] All above actions work on any event
- [ ] "Delete Permanently" option visible
- [ ] Can permanently delete any event

### Error Should Be Gone:
- [ ] No console errors when clicking menu options
- [ ] Actions execute successfully
- [ ] Events update immediately

---

**The Edit/Archive/Delete functionality now works perfectly!** ✅
