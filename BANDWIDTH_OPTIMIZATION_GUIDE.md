# 🚀 Convex Bandwidth Optimization Guide

## 📊 Current Status
- **Bandwidth Usage:** 33.58 GB / 50 GB (67%) → **Target: 10-15 GB (20-30%)**
- **Function Calls:** 565K / 25M (2.3%) ✅
- **Database Storage:** 27.92 MB / 50 GB (0.05%) ✅

## 🎯 Optimization Summary

### Before Optimization
Your bandwidth was high because:
1. ❌ **No Pagination** - Loading ALL records with `.collect()`
2. ❌ **Full Objects** - Returning entire objects instead of needed fields
3. ❌ **Over-fetching** - Loading data for all items then filtering in memory
4. ❌ **Development Testing** - Constant refreshes inflating usage

### After Optimization  
Expected bandwidth reduction: **50-70%** (33.58 GB → 10-15 GB)

## ✅ Optimizations Implemented

### 1. Users Queries (`convex/users.ts`)

#### `getAllUsersWithLevels` - Now Paginated
```typescript
// Before: Loaded 100 users (~500KB)
const users = await ctx.db.query("users").take(100);

// After: Loads 20 users per page (~100KB) - 80% reduction
const users = useQuery(api.users.getAllUsersWithLevels, { page: 1, limit: 20 });
```

**Bandwidth Saved:** ~80% per call

#### `getUserSummaries` - NEW Optimized Query
```typescript
// Returns minimal fields only - perfect for dropdowns/lists
const summaries = useQuery(api.users.getUserSummaries, { 
  limit: 20,
  department: "Engineering" 
});

// Returns:
{
  _id, name, imageUrl, department, position, isActive, userLevel (ID only)
}
```

**Bandwidth Saved:** ~70% vs full user objects

#### `getUsersByDepartment` - Added Summary Mode
```typescript
// Get minimal fields for lists
const users = useQuery(api.users.getUsersByDepartment, { 
  department: "Engineering",
  summaryOnly: true,
  limit: 30
});
```

**Bandwidth Saved:** ~70% when using `summaryOnly: true`

---

### 2. Messaging Queries (`convex/messaging.ts`)

#### `searchUsers` - Limited Results
```typescript
// Before: Searched ALL users, returned unlimited results
// After: Searches max 100 users, returns max 20 results

const results = useQuery(api.messaging.searchUsers, { 
  searchTerm: "john",
  limit: 20  // Default 20, max 50
});
```

**Bandwidth Saved:** ~90% for large user bases

#### `getOnlineUsers` - Limited Check
```typescript
// Before: Checked ALL users for online status
// After: Checks last 200 active users, returns max 50

const online = useQuery(api.messaging.getOnlineUsers, { limit: 30 });
```

**Bandwidth Saved:** ~95% (from checking 1000+ users to 200)

#### `markAsRead` - Recent Messages Only
```typescript
// Before: Marked ALL messages in room as read (could be 10,000+)
// After: Marks only recent 100 messages (covers scrollback)
```

**Bandwidth Saved:** ~99% for old chat rooms

#### `createAnnouncement` - Batched & Limited
```typescript
// Before: Loaded ALL users, created notifications for ALL
// After: Limits to 500 active users, can override

await createAnnouncement({
  title: "System Maintenance",
  content: "...",
  department: "Engineering", // Optional: specific department
  limit: 100 // Optional: for testing
});
```

**Bandwidth Saved:** ~80% for large organizations

---

### 3. Dashboard Queries (`convex/dashboards.ts`)

Already had some optimizations with `.take()` limits:
- ✅ Admin Dashboard: Takes 100 users, 100 projects, 500 tasks
- ✅ Manager Dashboard: Takes 50 users, 50 projects, 200 tasks
- ✅ Builder/Worker Dashboards: Appropriately limited

**No changes needed** - already optimized!

---

## 📖 How to Use Optimized Queries

### React Component Example

```typescript
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function UserList() {
  const [page, setPage] = useState(1);
  
  // OPTIMIZED: Loads only 20 users at a time
  const userData = useQuery(api.users.getAllUsersWithLevels, { 
    page, 
    limit: 20 
  });
  
  if (!userData) return <div>Loading...</div>;
  
  const { users, pagination } = userData;
  
  return (
    <div>
      {users.map(user => (
        <div key={user._id}>{user.name}</div>
      ))}
      
      {/* Pagination Controls */}
      <div className="flex gap-2">
        <button 
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={!pagination.hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Conditional Queries (Massive Savings!)

```typescript
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function CollapsibleUserList() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // OPTIMIZED: Only loads when expanded - 100% saving when collapsed!
  const users = useQuery(
    api.users.getUserSummaries,
    isExpanded ? { limit: 20 } : "skip"
  );
  
  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Hide' : 'Show'} Users
      </button>
      
      {isExpanded && users && (
        <ul>
          {users.map(user => (
            <li key={user._id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Search with Debouncing

```typescript
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";

export function UserSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  
  // Debounce search term (wait 300ms after typing stops)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // OPTIMIZED: Only searches when term >= 2 chars
  const results = useQuery(
    api.messaging.searchUsers,
    debouncedTerm.length >= 2 
      ? { searchTerm: debouncedTerm, limit: 10 }
      : "skip"
  );
  
  return (
    <div>
      <input 
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      
      {results?.map(user => (
        <div key={user._id}>{user.name}</div>
      ))}
    </div>
  );
}
```

---

## 🎯 Best Practices for Your Team

### 1. **Always Use Limits**
```typescript
// ❌ BAD - Loads everything
const projects = await ctx.db.query("projects").collect();

// ✅ GOOD - Limits to what's displayed
const projects = await ctx.db.query("projects").take(20);
```

### 2. **Paginate List Views**
```typescript
// ❌ BAD - Shows all 1000 users
<UserList users={allUsers} />

// ✅ GOOD - Shows 20 per page
<UserList 
  users={paginatedUsers.users}
  pagination={paginatedUsers.pagination}
/>
```

### 3. **Use Summary Queries for Lists**
```typescript
// ❌ BAD - Loads full user objects for dropdown
const users = useQuery(api.users.getAllUsersWithLevels);

// ✅ GOOD - Loads minimal fields for dropdown
const users = useQuery(api.users.getUserSummaries, { limit: 50 });
```

### 4. **Conditional Loading**
```typescript
// ❌ BAD - Always loads data
const details = useQuery(api.projects.getDetails, { id: projectId });

// ✅ GOOD - Only loads when modal open
const details = useQuery(
  api.projects.getDetails,
  isModalOpen ? { id: projectId } : "skip"
);
```

### 5. **Limit Enrichment**
```typescript
// ❌ BAD - Enriches all 1000 items
const enriched = await Promise.all(
  allUsers.map(u => getUserLevel(u.levelId))
);

// ✅ GOOD - Only enriches displayed items
const displayedUsers = users.slice(0, 20);
const enriched = await Promise.all(
  displayedUsers.map(u => getUserLevel(u.levelId))
);
```

---

## 📈 Expected Results

### Development Environment
- **Current:** 33.58 GB/month (constant testing/refreshing)
- **Optimized:** 10-15 GB/month (-60% to -70%)

### Production Environment
- **Expected:** 5-10 GB/month (-70% to -85%)
- Real users don't refresh constantly like development
- Natural usage patterns are much lighter

### With 4000 Residents Database
- **Additional Impact:** +2-5 GB/month
- **Total Usage:** 12-20 GB/month
- **Still Well Under Limit:** 50 GB/month ✅

---

## 🔧 Query Limit Reference

Use these recommended limits from `convex/queryOptimization.ts`:

```typescript
export const QUERY_LIMITS = {
  // List views
  USER_LIST: 50,          // User management pages
  PROJECT_LIST: 30,       // Project list pages
  TASK_LIST: 50,          // Task boards
  
  // Dashboards
  DASHBOARD_ITEMS: 10,    // Dashboard widgets
  RECENT_ACTIVITY: 5,     // Activity feeds
  
  // Chat/Messaging
  CHAT_ROOMS: 50,         // Chat room list
  MESSAGES: 50,           // Messages per room
  CHAT_SEARCH: 20,        // Search results
  
  // Dropdowns/Autocomplete
  DROPDOWN: 20,           // Dropdown options
  AUTOCOMPLETE: 10,       // Autocomplete suggestions
  
  // Public Pages
  PUBLIC_PROJECTS: 12,    // Landing page
  PUBLIC_EVENTS: 10,      // Public events
  
  // Maximum safe limit
  MAX_SAFE: 100,          // Never exceed this
} as const;
```

---

## 🚦 Monitoring Bandwidth

### Check Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Click "Usage" tab
4. Monitor "Database Bandwidth"

### Warning Signs
- ⚠️ **>40 GB:** Review recent code changes
- 🚨 **>45 GB:** Immediate optimization needed
- ✅ **<20 GB:** Healthy usage

### Monthly Checklist
- [ ] Review bandwidth trends
- [ ] Check for new `.collect()` usage in code
- [ ] Ensure pagination is used on new list views
- [ ] Verify limits are applied to new queries

---

## 💡 Quick Wins Checklist

### Already Implemented ✅
- [x] Paginated `getAllUsersWithLevels`
- [x] Added `getUserSummaries` for lists
- [x] Optimized `searchUsers` with limits
- [x] Limited `getOnlineUsers` checks
- [x] Optimized `markAsRead` to recent messages
- [x] Limited `createAnnouncement` user fetch
- [x] Created query optimization utilities

### Recommended Next Steps 🎯
- [ ] Update frontend components to use paginated queries
- [ ] Replace `getAllUsersWithLevels` calls with `getUserSummaries` where applicable
- [ ] Add debouncing to search inputs
- [ ] Implement conditional loading for modals/dropdowns
- [ ] Test in production and monitor bandwidth

---

## 📞 Support

If bandwidth remains high after these optimizations:
1. Check for components making repeated query calls
2. Look for queries in loops or useEffect without dependencies
3. Review recent code changes for `.collect()` usage
4. Consider adding indexes to frequently queried fields

---

## 🎓 Learning Resources

- **Convex Pagination:** https://docs.convex.dev/database/pagination
- **Query Optimization:** https://docs.convex.dev/database/reading-data
- **React Performance:** https://react.dev/reference/react/useMemo

---

**Last Updated:** {{ new Date().toISOString().split('T')[0] }}  
**Optimization Version:** 1.0  
**Expected Bandwidth Reduction:** 50-70%
