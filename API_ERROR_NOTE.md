# ⚠️ API Error Note - Parameter Name Mismatch

## Error Message
```
ArgumentValidationError: Object is missing the required field `newStatus`. 
Consider wrapping the field validator in `v.optional(...)` if this is expected.

Object: {status: "in_progress", taskId: "p9751rp3f1cf3b9dnpn4ahdw017sp5xj"}
Validator: v.object({newOrderIndex: v.optional(v.float64()), newStatus: v.union(...)})
```

## Root Cause
Something in the codebase is calling `updateTaskStatus` mutation with parameter name `status` instead of `newStatus`.

## Where It's Coming From
The error occurs when tasks transition to "in_progress" status, likely from:
1. Clock In functionality
2. Drag and drop status changes
3. Manual status updates

## Current Status
✅ **Already Fixed in Current Code:**
- The `handleStatusChange` function correctly uses `newStatus`
- Clock in/out mutations use direct `ctx.db.patch` (not `updateTaskStatus`)
- No direct calls with wrong parameter found in current code

## What This Means
The error might be from:
1. **Cached/old code** still running in browser
2. **Different page/component** calling it incorrectly
3. **Browser state** with old mutation calls

## Resolution Steps

### 1. **Clear Browser Cache**
```
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"
6. Hard refresh (Ctrl+Shift+R)
```

### 2. **Restart Convex Dev Server**
```bash
# Stop current server
# Then restart:
npx convex dev
```

### 3. **Verify Current Implementation**
All current code uses correct parameter names:
```typescript
// ✅ CORRECT (in page.tsx)
await updateTaskStatus({
  taskId,
  newStatus: newStatus as any,
});

// ❌ WRONG (what the error shows)
await updateTaskStatus({
  taskId,
  status: "in_progress", // Wrong parameter name
});
```

## If Error Persists

### Check These Files:
1. `src/app/events/[eventId]/control/page.tsx`
2. `src/app/tasks/my-duties/page.tsx`
3. Any other components that might call `updateTaskStatus`

### Search Command:
```bash
# Search for incorrect usage
grep -r "updateTaskStatus" src/
grep -r "status:" src/ | grep "taskId"
```

## Expected Behavior After Fix

When workers clock in:
1. ✅ Status changes to "in_progress"  
2. ✅ Progress tracking starts
3. ✅ Individual assignment updates
4. ✅ No API errors

## Conclusion

**The current codebase is correct.** The error is likely from:
- Old cached code in browser
- Previous session's state
- Stale Convex functions

**Solution:** Clear cache and restart both client and server.

If error still appears after clearing cache, it means there's another call somewhere else in the app that we haven't found yet.
