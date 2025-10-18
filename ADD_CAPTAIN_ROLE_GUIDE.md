# 🚀 Quick Guide: Add CAPTAIN Role to System

## ✅ **Step 1: Run Updated Seed Command**

```bash
npx convex run userLevels:seedUserLevels
```

**Expected Output:**
```json
{
  "message": "CAPTAIN role added successfully",
  "captainId": "...",
  "totalLevels": 5
}
```

---

## ✅ **Step 2: Verify in System Administration**

### **Where to Find CAPTAIN Role:**

1. **Navigate to:** System Administration → User Management
   - From sidebar: Click "System Administrator" → "User Management"

2. **You'll see CAPTAIN in:**

   **A. User Level Filter Dropdown:**
   ```
   All Levels ▼
   ├─ WORKER
   ├─ BUILDER
   ├─ MANAGER
   ├─ CAPTAIN      ← NEW!
   └─ ADMIN
   ```

   **B. User Role Badges:**
   - ADMIN: 🔴 Red badge
   - CAPTAIN: 🟠 Orange badge (NEW!)
   - MANAGER: 🟣 Purple badge
   - BUILDER: 🔵 Blue badge
   - WORKER: 🟢 Green badge

---

## ✅ **Step 3: Assign CAPTAIN Role to User**

### **Method 1: Via User Management Page**

1. Go to System Administration → User Management
2. Click on user you want to make CAPTAIN
3. Look for "Level" or "Role" field
4. Select "CAPTAIN" from dropdown
5. Save changes

### **Method 2: Via Convex Dashboard**

1. Open Convex dashboard
2. Go to "Data" → "users" table
3. Find the user
4. Click on their `userLevel` field
5. Change to the CAPTAIN role ID
6. Save

---

## 🎯 **What CAPTAIN Can Do:**

### **System Administration Access:**
✅ Can access System Administration menu
✅ Can view User Management
✅ Can view Invitations
✅ Can view Organizational Chart
❌ Cannot access System Settings (ADMIN only)

### **Operational Permissions:**
✅ **All Departments:** Access to all departments (not limited)
✅ **User Management:** Create and update users
✅ **Project Approval:** Approve projects from any department
✅ **Event Management:** Create and manage all events
✅ **Financial Approval:** Approve financial requests
✅ **Team Assignment:** Assign users to any project
✅ **Analytics:** View system-wide analytics

---

## 🔍 **Verification Steps:**

After adding CAPTAIN role:

1. **Check User Levels List:**
   ```bash
   npx convex run userLevels:getAllUserLevels
   ```
   Should show 5 levels including CAPTAIN

2. **Check in Admin UI:**
   - Go to User Management
   - Open filter dropdown
   - CAPTAIN should be listed

3. **Test Assignment:**
   - Try assigning CAPTAIN role to a test user
   - Login as that user
   - Verify they see System Administrator menu

---

## 📊 **Role Hierarchy Display:**

In System Administration, users will see:

```
ADMIN (Level 5)     🔴 Full system control
  ↓
CAPTAIN (Level 4)   🟠 Executive oversight
  ↓
MANAGER (Level 3)   🟣 Department management
  ↓
BUILDER (Level 2)   🔵 Project creation
  ↓
WORKER (Level 1)    🟢 Task execution
```

---

## ⚠️ **Troubleshooting:**

### **If CAPTAIN doesn't appear:**

1. **Check Convex logs:**
   ```bash
   npx convex logs
   ```

2. **Verify seed ran successfully:**
   - Output should say "CAPTAIN role added successfully"
   - Not "User levels already exist"

3. **Check database directly:**
   - Open Convex dashboard
   - Go to Data → userLevels
   - Look for entry with name: "CAPTAIN"

4. **Refresh browser:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## 🎉 **Success!**

Once completed:
- ✅ CAPTAIN role appears in System Administration
- ✅ Orange badge shows in user lists
- ✅ Can be assigned to users
- ✅ Full executive permissions enabled

**Your system now has the complete 5-level role hierarchy!** 🏛️
