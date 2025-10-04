# Authentication Error Fix

## 🐛 Issue Encountered

```
[CONVEX Q(notifications:getUnreadNotificationsCount)] 
Server Error: Uncaught Error: Authentication required
at async handler (../convex/notifications.ts:138:9)
```

## ✅ Root Cause

The `getUnreadNotificationsCount` query was using `getCurrentUser(ctx)` which requires authentication, but the query was being called immediately on page load before the user was fully authenticated.

## 🔧 Fixes Applied

### 1. Fixed `convex/notifications.ts`

**Before:**
```typescript
export const getUnreadNotificationsCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) return 0;
    // ...
  }
});
```

**After:**
```typescript
export const getUnreadNotificationsCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return 0;
    // ...
  }
});
```

**Why**: Using `ctx.auth.getUserIdentity()` directly returns `null` for unauthenticated users instead of throwing an error, which is better for queries that run on page load.

### 2. Made Queries Conditional in `src/app/collab/page.tsx`

**Before:**
```typescript
const onlineUsers = useQuery(api.presence.getOnlineUsers, { includeAway: true });
const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount);
```

**After:**
```typescript
const onlineUsers = useQuery(
  api.presence.getOnlineUsers,
  user ? { includeAway: true } : "skip"
);

const unreadCount = useQuery(
  api.notifications.getUnreadNotificationsCount,
  user ? {} : "skip"
);
```

**Why**: This prevents queries from running until the user is authenticated, avoiding any race conditions.

## ✅ Result

- ✅ No more authentication errors
- ✅ Queries only run when user is authenticated
- ✅ Graceful handling of unauthenticated state
- ✅ Page loads without errors

## 🧪 How to Verify

1. Navigate to `/collab`
2. Page should load without errors
3. Sign in if prompted
4. All features should work correctly
5. Check browser console - no red errors

## 📋 Pattern to Follow

For future queries that need authentication:

```typescript
// ✅ Good - Safe for page load
export const myQuery = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return []; // or return null, or return default value
    
    // Rest of query logic
  }
});

// ❌ Avoid - Will throw error if not authenticated
export const myQuery = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx); // This throws!
    // Rest of query logic
  }
});
```

## 🔐 Authentication Flow

1. User visits `/collab`
2. Clerk loads authentication state
3. If not authenticated → Show sign-in page
4. If authenticated:
   - Queries run with `"skip"` removed
   - Data loads from Convex
   - Page renders with full features

## 📚 Related Files

- `convex/notifications.ts` - Fixed query
- `src/app/collab/page.tsx` - Added conditional queries
- `convex/roleBasedAccess.ts` - Contains `getCurrentUser()` helper

---

**Status**: ✅ FIXED
**Date**: 2025-09-30T15:48:00+08:00
