# 🧪 **FINAL TESTING GUIDE - Registration Approval System**

## ⚠️ **IMPORTANT: Clean Test**

For testing to work properly, you **MUST** do a clean test:

### **Step 1: Complete Cleanup** 🧹

1. **Delete test user from Clerk:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Find your test user
   - Delete the user completely

2. **Delete test user from Convex:**
   - Go to [Convex Dashboard](https://dashboard.convex.dev)
   - Go to Data → users table
   - Find the test user by email
   - Delete the record

3. **Clear browser data:**
   - Open DevTools (F12)
   - Go to Application → Storage
   - Click "Clear site data"
   - Close and reopen browser

---

## 🧪 **Test Scenario 1: Registration WITHOUT Invitation**

### **Expected Flow:**
```
Sign Up → User Created (status: pending) → Redirected to /pending-approval → Cannot access dashboard
```

### **Steps:**

1. **Open browser in Incognito/Private mode**
   - This ensures no cached data

2. **Go to sign-up page**
   - URL: `http://localhost:3000/sign-up`

3. **Register with NEW email**
   - Use an email you've NEVER used before
   - Example: `testuser12345@example.com`
   - Complete sign-up form

4. **Verify email**
   - Check inbox
   - Click verification link

5. **EXPECTED RESULT:**
   - ✅ You should see a **loading spinner** saying "Verifying account status..."
   - ✅ You should be **redirected to** `/pending-approval`
   - ✅ You should see "Registration Pending Approval" page
   - ❌ You should **NOT** see the dashboard

6. **Try to access dashboard manually:**
   - Go to `http://localhost:3000/dashboard`
   - **EXPECTED:** Redirected back to `/pending-approval`

---

## 🧪 **Test Scenario 2: Admin Approval**

### **Steps:**

1. **Login as ADMIN** (different browser or logout first)
   - Use your admin account

2. **Go to Pending Approvals:**
   - Navigate to: **System Administration → Pending Approvals**
   - URL: `http://localhost:3000/admin/pending-approvals`

3. **You should see:**
   - ✅ Your test user in the pending list
   - ✅ Their email, name, department, position
   - ✅ "Approve" and "Reject" buttons

4. **Click "Approve"**

5. **EXPECTED RESULT:**
   - ✅ Toast notification: "User approved successfully!"
   - ✅ User disappears from pending list

6. **Switch back to test user's browser:**
   - Refresh the page
   - **EXPECTED:** Redirected to dashboard
   - ✅ Full dashboard access

---

## 🧪 **Test Scenario 3: Registration WITH Invitation**

### **Steps:**

1. **Create invitation as ADMIN:**
   
   Open Convex Dashboard → Functions tab → Run:
   
   ```javascript
   api.userApproval.createInvitation
   ```
   
   With args:
   ```json
   {
     "email": "invited123@example.com",
     "firstName": "John",
     "lastName": "Doe",
     "department": "Health Services",
     "position": "Health Worker",
     "userLevelId": "<GET_WORKER_LEVEL_ID>",
     "phone": "+639123456789"
   }
   ```
   
   **To get WORKER_LEVEL_ID:**
   - Go to Data → userLevels table
   - Find row where `name` = "WORKER"
   - Copy the `_id` value

2. **Copy the invitation token** from the result
   - It looks like: `INV-1234567890-abc123`

3. **Sign up with invited email:**
   - Use incognito mode
   - Go to sign-up
   - Use email: `invited123@example.com`
   - Complete registration

4. **EXPECTED RESULT:**
   - ✅ User is created with `status: "active"`
   - ✅ Redirected directly to dashboard
   - ✅ NO pending approval needed
   - ✅ Invitation marked as "accepted"

---

## 🐛 **If Dashboard Still Shows (Troubleshooting)**

### **Diagnostic Steps:**

1. **Check Convex Data:**
   
   Go to Convex Dashboard → Data → users:
   
   - Find your test user
   - Check the `status` field
   - **Should be:** `"pending"` for non-invited users
   - **If it says:** `"active"` → Something's wrong

2. **Check Browser Console:**
   
   - Open DevTools (F12)
   - Go to Console tab
   - Look for errors
   - Take a screenshot and share

3. **Check Network Tab:**
   
   - Open DevTools → Network tab
   - Clear network log
   - Try accessing dashboard
   - Look for:
     - `/api/users/getCurrentUserStatus` call
     - What status is returned?

4. **Check Clerk Webhook:**
   
   Go to Clerk Dashboard → Webhooks:
   
   - Is webhook configured?
   - What's the endpoint URL?
   - Check recent deliveries
   - Any errors?

---

## 🔍 **Debugging Commands**

### **Check user status in Convex:**

Go to Convex Dashboard → Functions → Run:

```javascript
// Get all users
api.users.getAllUsers

// Get specific user by email
api.users.getCurrentUserStatus
```

### **Manually set user to pending:**

```javascript
// In Convex Dashboard → Data → users
// Find your user, click Edit
// Change status to "pending"
// Save
```

---

## ✅ **Success Criteria**

### **You know it's working when:**

1. ✅ New user without invitation → See pending approval page
2. ✅ New user cannot access `/dashboard` at all
3. ✅ Pending user shows in admin pending approvals list
4. ✅ After admin approval → User can access dashboard
5. ✅ New user with invitation → Immediate dashboard access

---

## 🚨 **Common Issues & Fixes**

### **Issue 1: Dashboard still loads for pending users**

**Cause:** `currentUser` query returning null or status not being checked

**Fix:**
- Ensure `getCurrentUserStatus` function exists
- Check browser console for errors
- Verify Convex is running (`npx convex dev`)

### **Issue 2: User created with status "active" instead of "pending"**

**Cause:** Multiple code paths creating users

**Check:**
1. `convex/clerk.ts` - line 134: Should check for invitations
2. `convex/users.ts` - line 952: ensureUserExists should set "pending"

### **Issue 3: Redirect loop**

**Cause:** User being redirected back and forth

**Fix:**
- Clear browser cache completely
- Delete user from both Clerk AND Convex
- Start fresh test

---

## 📊 **What Status Means:**

| Status | Created By | Can Access Dashboard? | Shows In |
|--------|-----------|---------------------|----------|
| **pending** | Registration without invitation | ❌ No | Pending Approvals page |
| **active** | Admin approval OR invited registration | ✅ Yes | Normal dashboard |
| **rejected** | Admin rejection | ❌ No | Rejection message page |

---

## 🎯 **Expected Code Flow**

### **For New User (No Invitation):**

```
1. User signs up in Clerk
   ↓
2. Clerk webhook fires → convex/clerk.ts
   ↓
3. Check for invitation by email
   ↓
4. No invitation found
   ↓
5. Create user with status: "pending"
   ↓
6. User redirected to /dashboard
   ↓
7. Dashboard calls ensureUserExists
   ↓
8. User already exists, returns ID
   ↓
9. Dashboard queries getCurrentUserStatus
   ↓
10. Status is "pending"
   ↓
11. useEffect detects "pending" status
   ↓
12. Router.push('/pending-approval')
   ↓
13. ✅ User sees pending approval page
```

---

## 🆘 **Still Not Working?**

1. **Share these details:**
   - Screenshot of Convex users table (your test user's record)
   - Screenshot of browser console errors
   - Screenshot of what you see when accessing dashboard
   - Copy of the user record from Convex Data tab

2. **Check these files were updated:**
   - ✅ `convex/clerk.ts` - Has invitation check
   - ✅ `convex/users.ts` - Has `getCurrentUserStatus` query
   - ✅ `src/app/dashboard/page.tsx` - Has status check and redirect
   - ✅ `convex/schema.ts` - Has status field

3. **Verify Convex is running:**
   ```bash
   npx convex dev
   ```
   - Should show "Watching for file changes..."

---

**If you've followed all steps and it still shows the dashboard immediately, there's likely a caching issue or the Clerk webhook isn't firing. Try the complete cleanup steps again!**
