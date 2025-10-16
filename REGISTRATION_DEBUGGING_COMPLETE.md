# 🔍 Registration Data Not Saving - COMPREHENSIVE DEBUG SOLUTION

## Problem Statement
User registration data is defaulting instead of saving actual selections:
- ❌ **Department**: Always "General" (should save user's choice)
- ❌ **Role**: Always "WORKER" (should save BUILDER or MANAGER if selected)
- ❌ **Position**: Always "Community Member" (should save job title entered)
- ❌ **Phone**: Not saving (should save phone number)

---

## ✅ What I've Added - COMPLETE DEBUG SYSTEM

### 1. **Clerk Webhook Logging** (`convex/clerk.ts`)
```
🎯 CLERK WEBHOOK EVENT: user.created (or user.updated)
```
Shows which event triggers the webhook

### 2. **Full User Data Logging** (`convex/users.ts` - createOrUpdateFromClerk)
```
🔍 WEBHOOK RECEIVED - Full user data
```
Shows everything Clerk sends (including unsafeMetadata)

### 3. **Extracted Data Logging**
```
📋 EXTRACTED DATA
```
Shows what we pulled from the metadata

### 4. **Role Search Logging**
```
🔎 Looking for role: MANAGER
✅ Found role level: MANAGER - Level 3
  OR
❌ Role not found in database: MANAGER
  OR
⚠️ No role found, defaulting to WORKER
```

### 5. **Final Save Logging**
```
💾 SAVING TO DATABASE
```
Shows exactly what's being written to Convex

---

## 🧪 STEP-BY-STEP DEBUGGING PROCESS

### STEP 1: Open Convex Logs Dashboard
1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project: "BarangayLink"
3. Click **"Logs"** in the sidebar
4. **KEEP THIS TAB OPEN** while testing

### STEP 2: Register Test User with SPECIFIC Data

**Use these EXACT values for testing:**

#### Basic Info (Step 1):
- First Name: **"TestDebug"**
- Last Name: **"User001"**
- Email: **`testdebug001@example.com`** (use unique number each test)
- Phone: **"0925-111-2222"**
- Password: **"TestPass123!"**

#### Profile Details (Step 2):
- Job Title: **"Barangay Captain"** (type it)
- Department: **"Administration"** (select from dropdown)
- Access Role: **Click "Manager (Level 3)"** card

#### Verification (Step 3):
- Enter code from email
- Complete registration

### STEP 3: Check Convex Logs IMMEDIATELY

You should see logs in this order:

```
🎯 CLERK WEBHOOK EVENT: user.created for user: user_xxxxx

🔍 WEBHOOK RECEIVED - Full user data:
{
  "id": "user_xxxxx",
  "email": "testdebug001@example.com",
  "firstName": "TestDebug",
  "lastName": "User001",
  "unsafeMetadata": {
    "phone": "0925-111-2222",
    "jobTitle": "Barangay Captain",
    "department": "Administration",
    "role": "MANAGER",
    "profileCompleted": true,
    "registrationStep": 2
  }
}

📋 EXTRACTED DATA:
{
  "userRole": "MANAGER",
  "department": "Administration",
  "jobTitle": "Barangay Captain",
  "phone": "0925-111-2222",
  "existingUser": false
}

🔎 Looking for role: MANAGER

✅ Found role level: MANAGER - Level 3

💾 SAVING TO DATABASE:
{
  "name": "TestDebug User001",
  "email": "testdebug001@example.com",
  "department": "Administration",
  "position": "Barangay Captain",
  "phone": "0925-111-2222",
  "userLevelName": "MANAGER",
  "userLevelId": "jx7..."
}
```

### STEP 4: Verify in Database

1. In Convex Dashboard, click **"Data"** tab
2. Select **"users"** table
3. Find user with email `testdebug001@example.com`
4. Check fields:
   - ✅ `department` = "Administration"
   - ✅ `position` = "Barangay Captain"
   - ✅ `phone` = "0925-111-2222"
   - ✅ `userLevel` = (click to see it points to MANAGER)

---

## 🚨 POSSIBLE ISSUES & SOLUTIONS

### Issue 1: `unsafeMetadata` is EMPTY in logs

**If you see:**
```json
"unsafeMetadata": {}
```

**This means:** Metadata not sent from registration form

**Check:**
1. Open `src/app/register/page.tsx`
2. Find `handleStep2Submit` function (around line 244)
3. Verify this code exists:
```typescript
const result = await signUp.create({
  emailAddress: basicInfo.email,
  password: basicInfo.password,
  firstName: basicInfo.firstName,
  lastName: basicInfo.lastName,
  unsafeMetadata: {
    phone: basicInfo.phone,              // ← Must be here
    jobTitle: profileDetails.jobTitle,    // ← Must be here
    department: profileDetails.department, // ← Must be here
    role: profileDetails.role,            // ← Must be here
    profileCompleted: true,
    registrationStep: 2
  }
});
```

**If missing, add it!**

### Issue 2: Values are "undefined" in extracted data

**If you see:**
```json
{
  "userRole": undefined,
  "department": undefined,
  "jobTitle": undefined
}
```

**This means:** Form state is empty when submitted

**Add debug logging to registration form:**

In `src/app/register/page.tsx`, add at the START of `handleStep2Submit`:

```typescript
console.log("🎨 FORM VALUES BEFORE SUBMIT:", {
  phone: basicInfo.phone,
  jobTitle: profileDetails.jobTitle,
  department: profileDetails.department,
  role: profileDetails.role
});
```

This will show if the form state has values before sending to Clerk.

### Issue 3: Multiple Webhook Calls

**If you see TWO sets of logs:**
```
🎯 CLERK WEBHOOK EVENT: user.created
...
🎯 CLERK WEBHOOK EVENT: user.updated
```

**This is NORMAL!** Clerk fires webhooks for:
1. `user.created` - When user is first created
2. `user.updated` - When user data is updated

**What to check:** 
- Does the **SECOND** webhook (`user.updated`) have correct metadata?
- Is the first one overwriting with defaults, then second one fixing it?

**Solution if needed:** 
Only process `user.updated` by changing `convex/clerk.ts`:

```typescript
switch (result.type) {
  case "user.updated":  // Only this one
    await ctx.runMutation(internal.users.createOrUpdateFromClerk, {
      data: result.data,
    });
    break;
}
```

### Issue 4: Role Not Found in Database

**If you see:**
```
❌ Role not found in database: MANAGER
⚠️ No role found, defaulting to WORKER
```

**This means:** userLevels table doesn't have the role

**Check:**
1. Go to Convex Dashboard → Data → userLevels table
2. Verify these exist:
   - name: "WORKER", level: 1
   - name: "BUILDER", level: 2
   - name: "MANAGER", level: 3

**If missing, seed them:**
Run the seed function or insert manually.

### Issue 5: Clerk is Not Sending Metadata

**If Clerk webhook shows empty metadata repeatedly:**

**Possible causes:**
1. Clerk has limits on metadata size (check if metadata is too large)
2. Clerk account settings restrict metadata
3. signUp.create() is called before state is updated

**Quick fix:**
Add a small delay or ensure state is committed before calling create.

---

## 🎯 WHAT TO DO RIGHT NOW

### 1. ✅ Test Registration
Follow STEP 2 above with exact test values

### 2. ✅ Capture Logs
Copy ALL log output from Convex logs and share it

### 3. ✅ Check Database
Verify what actually got saved in users table

### 4. ✅ Report Back
Share:
- The complete log output (from 🎯 to 💾)
- What the database shows
- Whether you saw one or two webhook calls

---

## 📊 EXPECTED VS ACTUAL

### ✅ EXPECTED (Success):
```
Logs show:
  ✓ unsafeMetadata has all values
  ✓ Role found: MANAGER
  ✓ Department: "Administration"
  ✓ Position: "Barangay Captain"

Database shows:
  ✓ department: "Administration"
  ✓ position: "Barangay Captain"
  ✓ phone: "0925-111-2222"
  ✓ userLevel: points to MANAGER
```

### ❌ ACTUAL (Problem):
```
Logs show:
  ? Check what unsafeMetadata contains
  ? Check if role is found
  ? Check extracted values

Database shows:
  ✗ department: "General"
  ✗ position: "Community Member"
  ✗ phone: undefined
  ✗ userLevel: points to WORKER
```

---

## 💡 QUICK DIAGNOSTIC CHECKLIST

Run through this checklist:

- [ ] Convex logs show 🎯 webhook event
- [ ] unsafeMetadata is NOT empty
- [ ] Extracted data shows correct values
- [ ] Role search succeeds (✅ Found role level)
- [ ] Final save shows correct data
- [ ] Database has correct values

**If ANY checkbox fails, that's where the problem is!**

---

## 🔧 TEMPORARY WORKAROUND

If you need users registered NOW while we debug:

### Manual Update in Convex Dashboard:
1. Go to Data → users table
2. Find the user
3. Click on the user row
4. Edit fields manually:
   - department → Change to correct dept
   - position → Change to correct job title
   - phone → Add phone number
   - userLevel → Change to correct level ID

This is NOT a solution, just a temporary fix for existing users!

---

## 📝 SUMMARY

I've added **comprehensive logging** at every step:
- ✅ Which webhook event fires (created vs updated)
- ✅ Full data Clerk sends
- ✅ What we extract from metadata
- ✅ Role search results
- ✅ Final data being saved

**Next step:** Test with the exact values above and share the complete log output. This will tell us EXACTLY where the data is lost!

The logging is now so detailed that we'll immediately see:
1. Is Clerk sending the data? (check unsafeMetadata)
2. Are we extracting it correctly? (check extracted data)
3. Is the role found? (check role search)
4. What's actually saved? (check final save log)

**This WILL identify the issue!** 🎯
