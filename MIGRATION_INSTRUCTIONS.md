# 🔄 Database Migration Required

## ⚠️ **Issue:**
```
Schema validation failed: assignedTo must be an array
```

Existing tasks in database have `assignedTo` as a single ID (string) instead of array.

---

## ✅ **Solution: Run Migration**

### **Option 1: Using Convex Dashboard (Recommended)**

1. Open Convex Dashboard: https://dashboard.convex.dev
2. Go to your project
3. Click on "Functions" tab
4. Find and run: `migrations:migrateTasksAssignedTo`
5. Click "Run" button

**OR**

### **Option 2: Using CLI**

Run this command in your terminal:

```bash
npx convex run migrations/migrateTasksAssignedTo:migrateTasksAssignedTo
```

---

## 📊 **What It Does:**

The migration script will:
1. Find all tasks in database
2. Check if `assignedTo` is already an array
3. Convert single IDs to arrays: `"userId"` → `["userId"]`
4. Skip tasks already in array format
5. Return summary:
   - Total tasks processed
   - Tasks migrated
   - Tasks skipped (already arrays)

---

## 🎯 **After Migration:**

Once complete, you'll see output like:
```json
{
  "total": 50,
  "migrated": 45,
  "skipped": 5,
  "message": "Migration complete! 45 tasks updated, 5 already in array format."
}
```

**Then your schema validation errors will be gone!** ✅

---

## 🚀 **Next Steps:**

After migration completes:
1. Refresh your app
2. Schema errors should be resolved
3. Ready to proceed with Budget tab implementation

---

## ⚡ **Quick Fix Alternative:**

If you have very few tasks, you can also:
1. Go to Convex Dashboard → Data
2. Find the "tasks" table  
3. Manually edit the problematic task:
   - Find task with ID: `k5731bh15fz6nr61q1frn17bj97rk56g`
   - Change `assignedTo` from string to array format
   - Click Save

But migration script is better for bulk updates!
