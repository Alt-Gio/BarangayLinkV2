# 🔍 Debugging Offline Mode - Step by Step

**Problem:** Page navigation fails when offline  
**Tool:** Offline Debugger (purple 🔍 button bottom-right)

---

## 🎯 **Use the Debugger**

### **Step 1: Open Debugger**
```
1. Look for purple 🔍 button (bottom-right corner)
2. Click it
3. Debugger panel opens
```

### **Step 2: Check Status While ONLINE**
```
Should see:
✅ Network Status: Online (green)
✅ Current User: Your name
✅ IndexedDB Cache: Shows counts

If you see ❌ anywhere: Navigate to those pages
```

### **Step 3: Build Cache (if needed)**
```
If Tasks shows 0:
1. Go to Tasks page
2. Wait 5 seconds
3. Check debugger - should increase

Repeat for each page with 0 items
```

### **Step 4: Go Offline**
```
1. F12 → Network → Offline
2. Check debugger:
   - Network Status: Offline (orange)
   - Current User: Still shows ✅
   - IndexedDB Cache: Still has data ✅
```

### **Step 5: Test Navigation**
```
1. Click to navigate
2. Watch debugger
3. If "Current User" becomes ❌: Cache problem!
4. If stays ✅ but page fails: Different issue
```

---

## 📊 **What the Debugger Shows**

### **Network Status:**
- 🟢 Green "Online" = Connected
- 🟠 Orange "Offline" = Disconnected

### **Current User:**
- ✅ Name shown = User cached, ready for offline
- ❌ No user loaded = Need to be online first

### **IndexedDB Cache:**
- Users: Should be 1+ (your user)
- Tasks: Should match your task count
- Projects: Should match your projects
- Pending Sync: Number of offline changes

### **Diagnosis Section:**
Shows exactly what's wrong and how to fix it!

---

## 🐛 **Common Issues**

### **Issue 1: "Offline but no cached user!"**
```
Problem: You went offline before logging in properly

Fix:
1. Go online
2. Login
3. Go to dashboard
4. Wait 10 seconds
5. Check debugger shows user ✅
6. Then go offline
```

### **Issue 2: "User cached but no tasks!"**
```
Problem: User is cached but page data isn't

Fix:
1. Go online
2. Visit the failing page (e.g., Tasks)
3. Wait 5 seconds
4. Check debugger - Tasks count increases
5. Then go offline
```

### **Issue 3: Navigation fails but debugger looks good**
```
Problem: Components not using useOfflineData()

Check console for:
- "📦 Loaded user from offline cache" ✅
- "🔌 Offline mode: Clerk auth bypassed" ✅

If missing: Component issue, not cache issue
```

---

## 🔧 **Debugger Actions**

### **"Show Full Stats" Button:**
```
Shows complete IndexedDB statistics:
{
  "users": 1,
  "tasks": 15,
  "projects": 3,
  "messages": 0,
  "notifications": 5,
  "pendingSync": 2
}
```

### **"Dump DB to Console" Button:**
```
Prints all cached data to console
Useful to see actual data structure
Check if data is really there
```

---

## 🎯 **Debugging Workflow**

### **1. Start Online:**
```
✓ Open debugger
✓ Check "Current User" shows ✅
✓ Check "Tasks" > 0
✓ Navigate to all pages you need
✓ Wait 5 sec on each
```

### **2. Verify Cache:**
```
✓ Debugger shows all green ✅
✓ Tasks count matches your tasks
✓ Projects count matches projects
✓ Diagnosis says "Ready for offline mode!"
```

### **3. Go Offline:**
```
✓ F12 → Network → Offline
✓ Debugger shows "Offline" (orange)
✓ Current User still ✅
✓ Cache stats unchanged
```

### **4. Test Navigation:**
```
✓ Try navigating
✓ Watch debugger
✓ If user stays ✅: Should work!
✓ If user becomes ❌: Cache cleared somehow
```

---

## 📝 **What to Report**

### **If Still Not Working, Tell Me:**

1. **Debugger Status (Online):**
   - Network: ?
   - Current User: ?
   - Tasks count: ?
   - Diagnosis message: ?

2. **Debugger Status (Offline):**
   - Network: ?
   - Current User: ?
   - Tasks count: ?
   - Diagnosis message: ?

3. **Console Messages:**
   - Any "📦 Loaded from cache"?
   - Any "🔌 Offline mode"?
   - Any errors?

4. **What Happens:**
   - Navigate to which page?
   - What do you see?
   - Blank screen?
   - Error?
   - Redirect?

---

## 🎉 **Success Looks Like:**

### **Online (Building Cache):**
```
Debugger shows:
🟢 Online
✅ Current User: Your Name
✅ Tasks: 15
✅ Projects: 3
📊 Pending Sync: 0
💚 Diagnosis: "Ready for offline mode!"
```

### **Offline (Using Cache):**
```
Debugger shows:
🟠 Offline
✅ Current User: Your Name (still there!)
✅ Tasks: 15 (still there!)
✅ Projects: 3 (still there!)
📊 Pending Sync: 0 (or 1+ if you made changes)
💚 Diagnosis: "Ready for offline mode!"
```

### **Navigation:**
```
✓ Click Tasks → Loads instantly
✓ Click Projects → Loads instantly
✓ Click Events → Loads instantly
✓ No redirects
✓ Orange banner visible
✓ Can create/edit items
```

---

## 🚀 **Try This Now**

```
1. Restart dev server (if needed)
2. Refresh browser
3. Look for purple 🔍 button (bottom-right)
4. Click it
5. Follow the diagnosis messages
6. Report what you see!
```

---

**The debugger will tell us exactly what's wrong!** 🔍
