# 🔍 OAuth Debugging Guide

**Issue:** Facebook OAuth redirects to login without saving  
**Status:** Ready to debug  

---

## 🧪 **Step-by-Step Testing**

### **Test Facebook OAuth (Follow Exactly):**

1. **Open Browser Console** (F12)
   - Keep it open during entire process
   - Watch for logs starting with ✅, ❌, 📝, ⚠️

2. **Clear Everything:**
   ```
   - Clear browser cookies
   - Clear localStorage
   - Use incognito/private window (recommended)
   ```

3. **Go to Registration:**
   ```
   http://localhost:3000/register
   ```

4. **Click "Continue with Facebook"**
   - Should redirect to Facebook

5. **Authenticate on Facebook**
   - Log in
   - Authorize app

6. **Watch Console - Should See:**
   ```
   ✅ OAuth successful, redirecting to setup
   ```

7. **Should Redirect To:**
   ```
   http://localhost:3000/oauth-setup
   ```
   
8. **If you DON'T see oauth-setup page:**
   - Check console for errors
   - Check what URL you're on
   - Take screenshot

9. **On oauth-setup page:**
   - Should see your Facebook name
   - Fill form:
     - Department: Select any
     - Position: Type anything
     - Phone: Optional
   
10. **Click "Complete Setup"**

11. **Watch Console - Should See:**
    ```
    📝 Step 1: Updating Clerk metadata...
    ✅ Clerk updated
    📝 Step 2: Creating/Updating user in Convex...
    ✅ User created/updated in Convex
    ```

12. **Should Redirect To:**
    ```
    http://localhost:3000/pending-approval
    ```

13. **Check Convex Dashboard:**
    - Open Convex dashboard
    - Go to `users` table
    - Look for your email
    - Should see user with your data

---

## 🔍 **Debugging Checklist**

### **If redirected to login immediately:**

Check console for:
```
❌ No user, redirecting to login
```

**This means:** Clerk session not created

**Fix:**
1. Check Clerk keys in `.env.local`
2. Verify Clerk app configured for OAuth
3. Check Facebook app credentials in Clerk

---

### **If stuck on "Authentication Successful":**

**This means:** Redirect timer not working

**Fix:**
1. Wait 2-3 seconds
2. Check console for errors
3. Manually go to `/oauth-setup`

---

### **If oauth-setup doesn't show:**

Check console for:
```
⚠️ User not in database, redirecting to oauth-setup
or
🔄 No user in Convex, redirecting to setup
```

**If you see dashboard error instead:**
- Dashboard is interfering
- Check `src/app/dashboard/page.tsx` changes applied

---

### **If form submission fails:**

Watch console for:
```
📝 Step 1: Updating Clerk metadata...
(should see either ✅ Clerk updated OR an error)

📝 Step 2: Creating/Updating user in Convex...
(should see either ✅ User created/updated OR an error)
```

**If you see an error:**
- Copy the exact error message
- Check Convex logs
- Check if user levels are seeded

---

## 📊 **What Should Be in Console**

### **Successful Flow:**

```
[1] ✅ OAuth successful, redirecting to setup
    (from oauth-callback)

[2] ✅ OAuth user loaded: YourName YourLastName
    (from oauth-setup)

[3] 📝 Step 1: Updating Clerk metadata...
    (when you click submit)

[4] ✅ Clerk updated
    (Clerk update successful)

[5] 📝 Step 2: Creating/Updating user in Convex...
    (starting Convex save)

[6] ✅ User created/updated in Convex
    (Convex save successful)

[7] (Success toast appears)
    "Registration complete! Redirecting..."

[8] (Redirects to /pending-approval)
```

---

## 🚨 **Common Errors & Solutions**

### **Error: "Not authenticated"**

**Location:** Step 2 (Convex save)

**Cause:** Clerk session not synced

**Solution:**
1. Wait a moment after Step 1
2. Code already has 1-second delay
3. If still fails, increase delay in oauth-setup.tsx

---

### **Error: "Default WORKER user level not found"**

**Location:** Step 2 (Convex save)

**Cause:** User levels not seeded

**Solution:**
```bash
# In Convex dashboard, run seed function
# Or the dashboard should auto-seed on first load
```

---

### **Error: "User not found in database"**

**Location:** Dashboard check

**Cause:** Dashboard loaded before setup complete

**Solution:**
- Don't navigate to /dashboard manually
- Let oauth-setup redirect you
- Dashboard should auto-redirect to oauth-setup if no user

---

### **"Redirecting to login" immediately**

**Location:** oauth-callback or dashboard

**Cause:** Clerk session lost

**Solution:**
1. Check Clerk environment variables
2. Check `.env.local` file exists
3. Verify Clerk publishable key is correct
4. Restart dev server

---

## 🔧 **Manual Verification**

### **Check Clerk User:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Find your app
3. Go to Users section
4. Look for your Facebook email
5. Click on user
6. Check "Unsafe metadata" section
7. Should see:
   ```json
   {
     "firstName": "YourName",
     "lastName": "YourLast",
     "department": "Health Services",
     "position": "Health Worker",
     "phone": "+63...",
     "profileCompleted": true
   }
   ```

---

### **Check Convex User:**

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to Data tab
4. Click `users` table
5. Look for your email
6. Should see:
   ```javascript
   {
     clerkId: "user_xxxxx",
     email: "your@email.com",
     name: "YourName YourLast",
     department: "Health Services",
     position: "Health Worker",
     phone: "+63...",
     status: "pending",
     isActive: false,
     // ... other fields
   }
   ```

---

## 📝 **Report Back**

Please provide:

1. **What URL are you on when you see "User not found"?**
   ```
   URL: _____________
   ```

2. **Console logs** (copy all from start to error)
   ```
   (paste here)
   ```

3. **Did you reach oauth-setup page?**
   ```
   Yes / No
   ```

4. **If yes, did form submission show any logs?**
   ```
   (paste logs)
   ```

5. **Check Clerk dashboard - is user there?**
   ```
   Yes / No / I don't know how to check
   ```

6. **Check Convex dashboard - is user there?**
   ```
   Yes / No / I don't know how to check
   ```

---

## 🎯 **Quick Test**

**Just do this and tell me what happens:**

1. Open http://localhost:3000/register in incognito
2. Click "Continue with Facebook"
3. Take screenshot of FIRST page you see after Facebook auth
4. Copy ALL console logs
5. Send me:
   - Screenshot
   - Console logs
   - What URL you ended up on

This will tell me exactly where the flow is breaking!

---

## ✅ **Expected Result**

If everything works, you should:

1. See Facebook auth page
2. See "Authentication Successful!" for 1.5 sec
3. See oauth-setup form with your name
4. Fill form and submit
5. See "Setting up your account..." button
6. See success toast
7. End up on /pending-approval page
8. User exists in both Clerk AND Convex

If ANY step fails, that's where we need to fix!
