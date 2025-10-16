# ✅ Convex Registration Data Flow - FIXED

## Problem Summary

The Convex `users.ts` file was **defaulting to WORKER role and "General" department** even when users explicitly selected different options during registration. The data wasn't being saved correctly.

### Issues Fixed:

1. ❌ **Role defaulting to WORKER** - Even if user selected BUILDER or MANAGER
2. ❌ **Department defaulting to "General"** - User's selected department was ignored
3. ❌ **Job Title not saving to position** - The position field wasn't getting the jobTitle value
4. ❌ **Phone number not recording** - Phone numbers weren't being saved properly

---

## ✅ What Was Fixed

### 1. **`createOrUpdateFromClerk` (Webhook Handler)**

**Location:** `convex/users.ts` lines 120-224

**Changes:**
- **BEFORE**: Always defaulted to WORKER first, then checked if role exists
- **AFTER**: Checks user's selected role FIRST, only defaults to WORKER if no role provided

```typescript
// OLD WAY (WRONG):
let selectedUserLevel = await ctx.db
  .query("userLevels")
  .filter((q) => q.eq(q.field("name"), "WORKER"))
  .first();

if (userRole) {
  // Try to override...
}

// NEW WAY (CORRECT):
let selectedUserLevel = null;

if (userRole && typeof userRole === 'string') {
  // User selected a role - USE THEIR CHOICE
  const roleLevel = await ctx.db
    .query("userLevels")
    .filter((q) => q.eq(q.field("name"), userRole.toUpperCase()))
    .first();
  if (roleLevel) {
    selectedUserLevel = roleLevel;
  }
}

// Only default to WORKER if no role provided
if (!selectedUserLevel) {
  selectedUserLevel = await ctx.db
    .query("userLevels")
    .filter((q) => q.eq(q.field("name"), "WORKER"))
    .first();
}
```

**Data Mapping:**
```typescript
const userData = {
  userLevel: selectedUserLevel._id,  // ✅ User's selected role
  department: department || "General", // ✅ User's selected department
  position: jobTitle || "Community Member", // ✅ jobTitle → position
  phone: phone || user.phone_numbers?.[0]?.phone_number || undefined, // ✅ Phone saved
  // ...
};
```

---

### 2. **`syncUserFromClerk` (Manual Sync)**

**Location:** `convex/users.ts` lines 228-325

**Changes:**
- Same fix as above - prioritizes user's role selection
- Explicitly maps `jobTitle` → `position`
- Properly handles phone as optional (undefined instead of empty string)

```typescript
// IMPORTANT: Prioritize user's selected role
let userLevel = null;

if (args.role && typeof args.role === 'string') {
  // User provided a role - use their choice
  const roleLevel = await ctx.db
    .query("userLevels")
    .filter((q) => q.eq(q.field("name"), roleUpperCase))
    .first();
  
  if (roleLevel) {
    userLevel = roleLevel;
  }
}

// Only default if no role provided
if (!userLevel) {
  userLevel = await ctx.db.query("userLevels")
    .filter((q) => q.eq(q.field("name"), "WORKER"))
    .first();
}
```

**Data Mapping:**
```typescript
const userData = {
  userLevel: userLevel._id,
  department: args.department || "General", // ✅ Exact department
  position: args.jobTitle || "Community Member", // ✅ jobTitle → position
  phone: args.phone || undefined, // ✅ Phone properly saved
  // ...
};
```

---

### 3. **`ensureUserExists` (Dashboard Initialization)**

**Location:** `convex/users.ts` lines 861-938

**Changes:**
- Reads user's registration data from Clerk `unsafeMetadata`
- Prioritizes selected role over WORKER default
- Maps `jobTitle` → `position` correctly
- Includes `imageUrl` from Clerk profile

```typescript
// Extract from Clerk metadata
const clerkMetadata = (identity as any).unsafeMetadata || {};
const department = clerkMetadata.department;
const jobTitle = clerkMetadata.jobTitle;  // ✅ Get job title
const phone = clerkMetadata.phone;
const role = clerkMetadata.role;
const imageUrl = (identity as any).imageUrl;

// Prioritize user's role
let selectedUserLevel = null;

if (role) {
  const roleLevel = await ctx.db
    .query("userLevels")
    .filter((q) => q.eq(q.field("name"), role.toUpperCase()))
    .first();
  if (roleLevel) {
    selectedUserLevel = roleLevel; // ✅ Use their choice
  }
}

// Only default if no role
if (!selectedUserLevel) {
  selectedUserLevel = await ctx.db
    .query("userLevels")
    .filter((q) => q.eq(q.field("name"), "WORKER"))
    .first();
}
```

**Data Mapping:**
```typescript
const userId = await ctx.db.insert("users", {
  userLevel: selectedUserLevel._id,
  department: department || "General", // ✅ User's choice
  position: jobTitle || "Community Member", // ✅ jobTitle → position
  phone: phone || undefined, // ✅ Phone saved
  imageUrl: imageUrl || undefined, // ✅ Profile picture
  // ...
});
```

---

## 📊 Complete Data Flow

### Registration Form → Clerk → Convex

```
1. USER FILLS REGISTRATION FORM:
   ├─ First Name: "Juan"
   ├─ Last Name: "Dela Cruz"
   ├─ Email: "juan@example.com"
   ├─ Phone: "0925-643-3456"
   ├─ Job Title: "Barangay Captain"        ← THIS IS THE POSITION
   ├─ Department: "Administration"          ← USER'S CHOICE
   └─ Access Role: "MANAGER"                ← USER'S CHOICE

2. SAVED TO CLERK (Step 2 - Profile Details):
   unsafeMetadata: {
     phone: "0925-643-3456",
     jobTitle: "Barangay Captain",
     department: "Administration",
     role: "MANAGER",
     profileCompleted: true,
     registrationStep: 2
   }

3. CLERK WEBHOOK TRIGGERS:
   └─ Calls: createOrUpdateFromClerk(data)

4. SAVED TO CONVEX DATABASE:
   {
     clerkId: "user_xxx",
     email: "juan@example.com",
     name: "Juan Dela Cruz",
     userLevel: <Manager_UserLevel_ID>,      ✅ MANAGER (not WORKER!)
     department: "Administration",            ✅ Administration (not General!)
     position: "Barangay Captain",           ✅ jobTitle → position
     phone: "0925-643-3456",                 ✅ Phone saved
     level: 1,
     experience: 0,
     gold: 50,
     // ... gamification stats
   }
```

---

## 🎯 Key Principles Applied

### 1. **User Choice First, Defaults Second**
```typescript
// ✅ CORRECT ORDER:
1. Check if user provided value
2. Use their selection
3. Only default if nothing provided

// ❌ WRONG ORDER:
1. Set default first
2. Try to override with user value
```

### 2. **Explicit Field Mapping**
```typescript
// Registration Form Field → Database Field
jobTitle (from form) → position (in database)
department (from form) → department (in database)
role (from form) → userLevel (in database, via query)
phone (from form) → phone (in database)
```

### 3. **Role = UserLevel Mapping**
```typescript
// Access Role Selection → UserLevel Name → UserLevel ID
"WORKER" → query userLevels where name = "WORKER" → userLevel._id
"BUILDER" → query userLevels where name = "BUILDER" → userLevel._id
"MANAGER" → query userLevels where name = "MANAGER" → userLevel._id
```

### 4. **Proper Optional Handling**
```typescript
// ✅ CORRECT:
phone: phone || undefined

// ❌ WRONG:
phone: phone || ""  // Empty string is not same as undefined
```

---

## 🧪 Testing the Fix

### Test Case 1: Register as Manager in Peace & Order

**Steps:**
1. Go to `/register`
2. Fill basic info (name, email, phone, password)
3. Select:
   - Job Title: "Barangay Captain"
   - Department: "Peace & Order"
   - Access Role: **Manager (Level 3)**
4. Complete verification

**Expected Result in Convex:**
```javascript
{
  name: "[Your Name]",
  department: "Peace & Order",  // ✅ Not "General"
  position: "Barangay Captain", // ✅ Your job title
  userLevel: <Manager_ID>,      // ✅ Not WORKER
  phone: "[Your Phone]",         // ✅ Saved
}
```

### Test Case 2: Register as Builder in Health Services

**Steps:**
1. Register with:
   - Job Title: "Health Worker"
   - Department: "Health Services"
   - Access Role: **Builder (Level 2)**

**Expected Result:**
```javascript
{
  department: "Health Services", // ✅ Not "General"
  position: "Health Worker",     // ✅ Your job title
  userLevel: <Builder_ID>,       // ✅ Not WORKER
}
```

### Test Case 3: Register as Worker in Treasury

**Steps:**
1. Register with:
   - Job Title: "Accounting Assistant"
   - Department: "Treasury"
   - Access Role: **Worker (Level 1)**

**Expected Result:**
```javascript
{
  department: "Treasury",           // ✅ Your choice
  position: "Accounting Assistant", // ✅ Your job title
  userLevel: <Worker_ID>,           // ✅ Correctly WORKER
}
```

---

## 🔍 Verification Checklist

After user registers, check Convex dashboard:

- [ ] **userLevel** = Correct level ID (not always WORKER)
- [ ] **department** = User's selected department (not "General")
- [ ] **position** = User's entered job title (not "Community Member")
- [ ] **phone** = User's phone number (not empty/undefined when provided)
- [ ] **name** = First name + Last name combined
- [ ] **email** = Correct email address
- [ ] **isActive** = true
- [ ] **level** = 1 (gamification level)
- [ ] **gold** = 50 (starting gold)

---

## 📝 Summary

### What Changed:
1. **Role Priority**: User's selected role is now checked FIRST, not defaulted to WORKER
2. **Department Saved**: User's selected department saves correctly
3. **Job Title → Position**: The `jobTitle` from form now maps to `position` field
4. **Phone Saved**: Phone numbers are properly stored (as undefined when not provided)

### Functions Updated:
1. ✅ `createOrUpdateFromClerk` - Webhook handler
2. ✅ `syncUserFromClerk` - Manual sync function
3. ✅ `ensureUserExists` - Dashboard initialization

### Result:
**Users now get exactly what they select during registration!**
- Pick MANAGER → Get MANAGER role
- Pick "Peace & Order" → Assigned to "Peace & Order"
- Enter "Barangay Captain" → Position is "Barangay Captain"
- Enter phone → Phone is saved

No more defaulting to WORKER or "General"! 🎉
