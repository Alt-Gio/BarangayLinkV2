# 🔍 Debug Registration Data Not Saving

## Current Situation
Even after fixing the Convex code, data is still defaulting to:
- ❌ Department: "General" (not user's choice)
- ❌ Role: WORKER (not user's selection)
- ❌ Position: "Community Member" (not job title)
- ❌ Phone: Empty (not saved)

## ✅ What I Added - DEBUG LOGGING

I've added comprehensive console logging to `convex/users.ts` in the `createOrUpdateFromClerk` function:

### Logs Added:
1. **🔍 WEBHOOK RECEIVED** - Shows ALL data Clerk sends
2. **📋 EXTRACTED DATA** - Shows what we pulled from metadata
3. **🔎 Looking for role** - Shows role search
4. **✅ Found role level** - Confirms role found
5. **❌ Role not found** - Warns if role missing
6. **⚠️ No role found** - Shows when defaulting to WORKER
7. **💾 SAVING TO DATABASE** - Shows final data being saved

---

## 🧪 HOW TO DEBUG

### Step 1: Open Convex Logs
1. Go to your Convex dashboard
2. Click on "Logs" tab
3. Keep it open in a separate browser tab

### Step 2: Register a Test User
1. Go to `/register`
2. Fill in:
   - **First Name**: "TestUser"
   - **Last Name**: "Debug"
   - **Email**: Use a unique email (e.g., `testdebug1@example.com`)
   - **Phone**: "0925-123-4567"
   - **Password**: Any strong password
3. Click "Continue to Profile Details"
4. Fill in:
   - **Job Title**: Type "Barangay Captain"
   - **Department**: Select "Administration"
   - **Access Role**: Click "Manager (Level 3)"
5. Check "I agree to terms"
6. Click "Continue to Verification"
7. Enter verification code from email
8. Click "Verify and Complete"

### Step 3: Check Convex Logs IMMEDIATELY

Look for these log entries:

#### Expected Good Flow:
```
🔍 WEBHOOK RECEIVED - Full user data:
{
  "id": "user_xxx",
  "email": "testdebug1@example.com",
  "firstName": "TestUser",
  "lastName": "Debug",
  "unsafeMetadata": {
    "phone": "0925-123-4567",
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
  "phone": "0925-123-4567",
  "existingUser": false
}

🔎 Looking for role: MANAGER

✅ Found role level: MANAGER - Level 3

💾 SAVING TO DATABASE:
{
  "name": "TestUser Debug",
  "email": "testdebug1@example.com",
  "department": "Administration",
  "position": "Barangay Captain",
  "phone": "0925-123-4567",
  "userLevelName": "MANAGER",
  "userLevelId": "xxx"
}
```

#### If You See This (BAD):
```
🔍 WEBHOOK RECEIVED - Full user data:
{
  "unsafeMetadata": {}  ← EMPTY! This is the problem
}

📋 EXTRACTED DATA:
{
  "userRole": undefined,
  "department": undefined,
  "jobTitle": undefined,
  "phone": undefined
}

⚠️ No role found, defaulting to WORKER

💾 SAVING TO DATABASE:
{
  "department": "General",  ← Defaulted
  "position": "Community Member",  ← Defaulted
  "phone": undefined,
  "userLevelName": "WORKER"  ← Defaulted
}
```

---

## 🚨 COMMON PROBLEMS & SOLUTIONS

### Problem 1: `unsafeMetadata` is EMPTY

**Cause:** Clerk webhook is being triggered BEFORE metadata is saved

**Solution:** This happens when:
1. Webhook fires on `user.created` (Step 1 completion)
2. But metadata is added in Step 2

**Fix Options:**

#### Option A: Wait for `user.updated` event
The webhook might fire TWICE:
1. First on `user.created` (no metadata yet)
2. Second on `user.updated` (with metadata)

Check if you see TWO webhook calls in logs!

#### Option B: Update metadata earlier
Move metadata update to Step 1 (but this requires changing the flow)

### Problem 2: Role is "undefined" or wrong case

**Check registration form:**
- Make sure `profileDetails.role` has exact value: `"WORKER"`, `"BUILDER"`, or `"MANAGER"`
- Not lowercase: `"worker"`, `"builder"`, `"manager"`

**Fix:** Check line 798-801 in `register/page.tsx`:
```typescript
onChange={(e) => {
  setProfileDetails(prev => ({ ...prev, role: e.target.value }));
  clearFieldError('role');
}}
```

The `role.value` should be: `"WORKER"`, `"BUILDER"`, `"MANAGER"`

### Problem 3: Multiple Webhooks

**Symptom:** User gets created with defaults, then updated with correct data

**Check:** Look for MULTIPLE "🔍 WEBHOOK RECEIVED" logs for same user

**Why:** Clerk fires:
1. `user.created` → When email/password created (Step 2 start)
2. `user.updated` → When metadata added (Step 2 complete)

**Solution:** That's actually OKAY! The second webhook should have correct data.

---

## 🔧 IMMEDIATE FIX TO TRY

### Check if it's a Timing Issue

Let me check when `signUp.create()` is called:

**Currently in `handleStep2Submit`:**
```typescript
const result = await signUp.create({
  emailAddress: basicInfo.email,
  password: basicInfo.password,
  firstName: basicInfo.firstName,
  lastName: basicInfo.lastName,
  unsafeMetadata: {
    phone: basicInfo.phone,
    jobTitle: profileDetails.jobTitle,  ← Should be here
    department: profileDetails.department,  ← Should be here
    role: profileDetails.role,  ← Should be here
  }
});
```

This SHOULD be correct!

### But Check This:

**Are `profileDetails` values actually filled?**

Add temporary logging in `handleStep2Submit`:

```typescript
console.log("DEBUG - About to create user with:", {
  phone: basicInfo.phone,
  jobTitle: profileDetails.jobTitle,
  department: profileDetails.department,
  role: profileDetails.role
});
```

---

## 📊 VERIFICATION STEPS

After registration, check Convex database:

1. **Open Convex Dashboard**
2. **Go to Data → users table**
3. **Find your test user**
4. **Check fields:**
   - `department` = "Administration" ✅ or "General" ❌
   - `position` = "Barangay Captain" ✅ or "Community Member" ❌
   - `phone` = "0925-123-4567" ✅ or undefined ❌
   - `userLevel` = Manager ID ✅ or Worker ID ❌

---

## 🎯 NEXT STEPS

### 1. Register Test User Following Steps Above

### 2. Share the Convex Logs

Copy and paste the log output that shows:
- 🔍 WEBHOOK RECEIVED
- 📋 EXTRACTED DATA
- 💾 SAVING TO DATABASE

### 3. Check If Multiple Webhooks

Count how many times you see "🔍 WEBHOOK RECEIVED" for the same user

### 4. Verify Registration Form Values

Add console.log in Step 2 submit to see if values are correct before sending to Clerk

---

## 💡 TEMPORARY WORKAROUND

If the issue is timing (webhook fires before metadata is saved):

### Add a delay or use `user.updated` event ONLY

Check `convex/clerk.ts`:
```typescript
switch (result.type) {
  case "user.created":
  case "user.updated":  ← Both trigger the same function
    await ctx.runMutation(internal.users.createOrUpdateFromClerk, {
      data: result.data,
    });
    break;
}
```

**Try changing to ONLY `user.updated`:**
```typescript
switch (result.type) {
  case "user.updated":  ← Only this one
    await ctx.runMutation(internal.users.createOrUpdateFromClerk, {
      data: result.data,
    });
    break;
}
```

This ensures webhook only fires AFTER metadata is added!

---

## 📝 Summary

**I've added extensive logging to help debug. Please:**

1. ✅ Register a test user
2. ✅ Check Convex logs for the debug output
3. ✅ Share the logs here
4. ✅ Check if you see multiple webhook calls
5. ✅ Verify the database after registration

**This will tell us EXACTLY where the data is being lost!**
