# 🔄 Database Migration Guide

## Issue

The enhanced project management system has new required fields in the schema. Existing projects in your database need to be updated to match the new schema.

## Error Message

```
Schema validation failed
Document with ID "..." in table "projects" does not match the schema: 
Object is missing the required field `approvalStatus`.
```

## Solution: Run Migration

### Step 1: Open Convex Dashboard

```bash
npx convex dashboard
```

This will open your Convex dashboard in a browser.

### Step 2: Navigate to Functions

- Click on **"Functions"** in the left sidebar
- Find **"migrateProjects:migrateProjectsToNewSchema"**

### Step 3: Run the Migration

- Click on the function
- Click **"Run"** (no arguments needed)
- Wait for completion

### Step 4: Deploy Convex

After the migration completes, run:

```bash
npx convex dev
```

---

## Alternative: Clear Database (Dev Only)

If you're in development and don't need to keep existing data:

### Option A: Via Dashboard

1. Open `npx convex dashboard`
2. Go to **"Data"** tab
3. Select **"projects"** table
4. Delete all records with old schema

### Option B: Fresh Start

```bash
# Stop convex dev if running
# Then run with clear data flag (this will DELETE ALL DATA!)
npx convex dev --clear-data
```

⚠️ **WARNING**: `--clear-data` will delete ALL data in your database!

---

## What the Migration Does

The migration script (`convex/migrateProjects.ts`) will:

1. ✅ Convert `status: "planning"` → `status: "draft"`
2. ✅ Add `urgency: "normal"` (if missing)
3. ✅ Add `approvalStatus` based on current status
4. ✅ Add empty `successCriteria` array
5. ✅ Add empty `milestones` array
6. ✅ Calculate `totalExperienceReward` based on duration
7. ✅ Set `projectLevel: 3` (medium difficulty)
8. ✅ Add empty `impactArea` array
9. ✅ Set `publicVisibility` based on `isPublic`
10. ✅ Create `statusHistory` with initial entry

---

## After Migration

Once migration is complete:

1. ✅ Schema validation will pass
2. ✅ `npx convex dev` will succeed
3. ✅ All enhanced features will be available
4. ✅ Existing projects will work with new system

---

## Verification

After running migration, check:

```bash
# Should deploy successfully
npx convex dev
```

You should see:
```
✓ Schema validation succeeded
✓ Deployed Convex functions
```

---

## Need Help?

If migration fails:
1. Check the error message in Convex dashboard
2. Verify all projects have required fields
3. Try the alternative clear database option (dev only)

---

**Status:** Ready to migrate  
**Estimated Time:** < 1 minute for small databases
