# 🔧 Sprint Creation Troubleshooting

**Problem:** Sprint creation doesn't go through

---

## 🎯 **Common Issues & Solutions:**

### **Issue 1: Schema Not Deployed** ⚠️

The new `sprints` table needs to be in Convex.

**Check:**
1. Is `npx convex dev` running?
2. Do you see "✔ Synced types" in the terminal?

**Solution:**
```bash
# Make sure Convex is running:
npx convex dev

# Wait for: "✔ Synced types"
# This means schema is deployed ✅
```

---

### **Issue 2: Sprint Status Mismatch** 🎯

**The Problem:**
- `createSprint` creates sprint with status: **"planning"**
- `getActiveSprint` looks for status: **"active"**
- So created sprints don't show up!

**Solution:** ✅ FIXED! Sprints now start automatically when created.

**What Changed:**
- Sprints now created with status: "active" (not "planning")
- Sprint shows up immediately after creation
- No extra step needed!

---

### **Issue 3: Console Errors** 🐛

**Check Browser Console:**
Press F12 and look for errors. Common ones:

**Error: "Not authenticated"**
```
Solution: Make sure you're logged in
1. Check if you see your profile pic
2. Try refreshing the page
3. Log out and log back in
```

**Error: "User not found"**
```
Solution: User profile not synced
1. Go to dashboard first
2. Wait 3 seconds
3. Then try creating sprint
```

**Error: Network error**
```
Solution: Convex not running
1. Check terminal for "npx convex dev"
2. Should see: ✔ Synced types
3. Restart if needed
```

---

### **Issue 4: Form Validation** ✏️

**Required Fields:**
- ✅ Sprint Name (required)
- ✅ Start Date (required)
- ✅ End Date (required)
- ✅ Capacity > 0 (required)

**Check:**
- Did you fill in all 4 steps?
- Did you click "Create Sprint" (not just "Next")?
- Did you see any validation errors?

---

## 🎯 **Step-by-Step Test:**

### **Test 1: Check Convex**
```bash
# Terminal should show:
npx convex dev

# Output should include:
✔ Provisioned dev deployment
✔ Synced types
✔ Watching for file changes...
```

### **Test 2: Check Auth**
```
1. Open: http://localhost:3000/dashboard
2. See your name/profile? ✅
3. No name? Log out and back in
```

### **Test 3: Create Sprint (Minimal)**
```
1. Go to: /events/sprints/kanban-full
2. Click "New Sprint"
3. Fill in:
   Name: "Test Sprint"
   Goal: "Test"
   Start: Today
   End: 2 weeks from today
   Capacity: 40
4. Click through all 4 steps
5. Click "Create Sprint"
```

### **Test 4: Check Console**
```
F12 → Console tab

Look for:
✅ No red errors = Good!
❌ Red errors = Tell me what it says
```

### **Test 5: Verify Creation**
```
After creating:
1. Should see sprint name at top
2. Should see "0 / 40 points"
3. Should see empty Kanban board
4. Try adding task from backlog
```

---

## 🔧 **Quick Fixes:**

### **Fix 1: Restart Everything**
```bash
# Terminal 1: Stop Convex (Ctrl+C)
npx convex dev

# Terminal 2: Stop Dev Server (Ctrl+C)  
npm run dev

# Wait for both to start
# Then try again
```

### **Fix 2: Clear Cache**
```
Browser:
Ctrl + Shift + R (hard refresh)

Or:
Ctrl + Shift + Delete → Clear cache
```

### **Fix 3: Check Database**
```
1. Open: https://dashboard.convex.dev
2. Select your project
3. Click "Data" tab
4. Look for "sprints" table
5. See any rows? Sprint was created! ✅
6. No table? Schema not deployed
```

---

## 📊 **Verify Sprint Created:**

### **Method 1: Check UI**
```
Go to: /events/sprints/kanban-full

Should see:
┌─────────────────────────────┐
│ 🎯 [Your Sprint Name]       │
│ Goal: [Your Goal]           │
│                             │
│ Total: 0 / Completed: 0     │
└─────────────────────────────┘
```

### **Method 2: Check Database**
```
Convex Dashboard:
1. Go to dashboard.convex.dev
2. Select project
3. Data → sprints table
4. Should see your sprint row ✅
```

### **Method 3: Check Console**
```
F12 → Console → Network tab
Filter: "getActiveSprint"
Status: 200? ✅
Response contains your sprint? ✅
```

---

## 🆘 **Still Not Working?**

### **Tell Me:**

1. **What happens when you click "Create Sprint"?**
   - Button does nothing?
   - Page refreshes?
   - Error message?
   - Loading forever?

2. **What's in the console? (F12)**
   - Any red errors?
   - Copy the full error message

3. **Is Convex running?**
   - Terminal shows "✔ Synced types"?
   - Or errors?

4. **Can you see the sprint in Convex dashboard?**
   - Go to dashboard.convex.dev
   - Data → sprints table
   - Any rows?

---

## ✅ **Solution Applied:**

**I just fixed the main issue!**

**Change Made:**
- Sprints now start automatically (status: "active")
- Will show up immediately after creation
- No manual start step needed

**What You Need to Do:**
1. Make sure `npx convex dev` is running
2. Wait for "✔ Synced types"
3. Refresh browser (Ctrl + Shift + R)
4. Try creating sprint again
5. Should work now! ✅

---

## 📝 **Expected Behavior:**

```
Create Sprint
     ↓
Wizard opens (4 steps)
     ↓
Fill in details
     ↓
Click "Create Sprint"
     ↓
Wizard closes
     ↓
Sprint appears at top! ✅
     ↓
Ready to add tasks!
```

---

**Try creating a sprint now and let me know what happens!** 🚀
