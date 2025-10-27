# ✅ Duplicate Mutation Fixed

**Error:** Cannot redeclare block-scoped variable 'updateUserProfile'  
**Cause:** Two mutations with same name in `convex/users.ts`  
**Solution:** Renamed duplicate to `completeOAuthProfile`  
**Status:** ✅ FIXED

---

## 🐛 **The Error**

```
convex/users.ts:743:14 - error TS2451: Cannot redeclare block-scoped variable 'updateUserProfile'.
convex/users.ts:1348:14 - error TS2451: Cannot redeclare block-scoped variable 'updateUserProfile'.
```

**Cause:** I accidentally created a duplicate mutation with the same name.

---

## ✅ **The Fix**

### **1. Renamed Duplicate Mutation**

**File:** `convex/users.ts`

**Line 743** - Original (kept):
```typescript
// Update user profile (Enhanced for admin use)
export const updateUserProfile = mutation({
  args: {
    userId: v.optional(v.id("users")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  // ... admin-level profile updates
});
```

**Line 1348** - Duplicate (renamed):
```typescript
// Complete OAuth user profile (for new OAuth users)
export const completeOAuthProfile = mutation({
  args: {
    department: v.string(),
    position: v.string(),
    phone: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("pending"))),
    isActive: v.optional(v.boolean()),
  },
  // ... OAuth-specific profile completion
});
```

---

### **2. Updated Component**

**File:** `src/app/complete-profile/page.tsx`

**Changed:**
```typescript
// OLD:
const updateUserProfile = useMutation(api.users.updateUserProfile);
await updateUserProfile({...});

// NEW:
const completeOAuthProfile = useMutation(api.users.completeOAuthProfile);
await completeOAuthProfile({...});
```

---

### **3. Fixed Select Disabled Prop**

**Also fixed:** `disabled` prop on Select component

**Changed:**
```tsx
// OLD (Error):
<Select disabled={invitationValid}>
  <SelectTrigger>

// NEW (Fixed):
<Select>
  <SelectTrigger disabled={invitationValid}>
```

The `disabled` prop goes on `SelectTrigger`, not on `Select`.

---

## ✅ **Why Two Mutations?**

### **updateUserProfile** (Line 743)
- **Purpose:** General profile updates
- **Used by:** Admin dashboard, profile settings
- **Features:** 
  - Can update any user (with permissions)
  - Supports all profile fields
  - Admin permission checks

### **completeOAuthProfile** (Line 1348)
- **Purpose:** OAuth registration completion
- **Used by:** OAuth callback flow
- **Features:**
  - Current user only
  - Required fields: department, position
  - Can activate user with invitation code
  - Simpler, focused on onboarding

---

## 📊 **Result**

**Before:**
- ❌ TypeScript compilation failed
- ❌ Duplicate function declaration error
- ❌ Cannot run dev server

**After:**
- ✅ TypeScript compiles successfully
- ✅ Two distinct mutations with clear purposes
- ✅ OAuth flow works correctly
- ✅ Profile updates work correctly

---

## 🎯 **Usage**

### **For OAuth Registration:**
```typescript
import { api } from '../../../convex/_generated/api';

const completeOAuthProfile = useMutation(api.users.completeOAuthProfile);

await completeOAuthProfile({
  department: "Health Services",
  position: "Health Worker",
  phone: "+63 912 345 6789",
  status: "pending",
  isActive: false,
});
```

### **For Profile Updates:**
```typescript
const updateUserProfile = useMutation(api.users.updateUserProfile);

await updateUserProfile({
  name: "Juan Dela Cruz",
  department: "Education",
  position: "Teacher",
  phone: "+63 912 345 6789",
  bio: "Experienced educator...",
});
```

---

**All TypeScript errors resolved! OAuth registration fully functional!** ✅
