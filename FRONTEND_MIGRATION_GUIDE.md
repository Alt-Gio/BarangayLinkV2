# 🔄 Frontend Migration Guide for Bandwidth Optimization

## Overview
This guide helps you update frontend components to use the new optimized Convex queries.

---

## 📝 Quick Reference: Query Replacements

### Users

| Old Query | New Optimized Query | Bandwidth Saved |
|-----------|-------------------|-----------------|
| `api.users.getAllUsersWithLevels` | `api.users.getAllUsersWithLevels` (with pagination args) | ~80% |
| N/A | `api.users.getUserSummaries` (NEW - for lists/dropdowns) | ~70% |
| `api.users.getUsersByDepartment` | `api.users.getUsersByDepartment` (with `summaryOnly: true`) | ~70% |

### Messaging

| Old Query | New Optimized Query | Bandwidth Saved |
|-----------|-------------------|-----------------|
| `api.messaging.searchUsers` | `api.messaging.searchUsers` (now requires args) | ~90% |
| `api.messaging.getOnlineUsers` | `api.messaging.getOnlineUsers` (with optional `limit`) | ~95% |

---

## 🛠️ Migration Examples

### 1. User Lists - Add Pagination

#### Before ❌
```typescript
const allUsers = useQuery(api.users.getAllUsersWithLevels);

return (
  <div>
    {allUsers?.map(user => <UserCard key={user._id} user={user} />)}
  </div>
);
```

#### After ✅
```typescript
import { useState } from "react";

const [page, setPage] = useState(1);
const userData = useQuery(api.users.getAllUsersWithLevels, { 
  page, 
  limit: 20 
});

if (!userData) return <Loading />;

const { users, pagination } = userData;

return (
  <div>
    {users.map(user => <UserCard key={user._id} user={user} />)}
    
    <Pagination
      page={page}
      hasMore={pagination.hasMore}
      onNext={() => setPage(p => p + 1)}
      onPrev={() => setPage(p => p - 1)}
    />
  </div>
);
```

**Bandwidth Saved:** ~80% (loads 20 instead of 100+)

---

### 2. User Dropdowns - Use Summary Query

#### Before ❌
```typescript
const allUsers = useQuery(api.users.getAllUsersWithLevels);

return (
  <select>
    {allUsers?.map(user => (
      <option key={user._id} value={user._id}>
        {user.name}
      </option>
    ))}
  </select>
);
```

#### After ✅
```typescript
// Use the NEW getUserSummaries query - returns minimal fields
const userSummaries = useQuery(api.users.getUserSummaries, { 
  limit: 50,
  department: currentUser?.department // Optional filter
});

return (
  <select>
    {userSummaries?.map(user => (
      <option key={user._id} value={user._id}>
        {user.name} - {user.position}
      </option>
    ))}
  </select>
);
```

**Bandwidth Saved:** ~70% (minimal fields instead of full objects)

---

### 3. Department User Lists

#### Before ❌
```typescript
const users = useQuery(api.users.getUsersByDepartment, { 
  department: "Engineering" 
});

return (
  <div>
    {users?.map(user => (
      <div key={user._id}>
        {user.name}
      </div>
    ))}
  </div>
);
```

#### After ✅
```typescript
// Add summaryOnly flag for lists
const users = useQuery(api.users.getUsersByDepartment, { 
  department: "Engineering",
  summaryOnly: true,  // NEW - returns minimal fields
  limit: 30
});

return (
  <div>
    {users?.map(user => (
      <div key={user._id}>
        <Avatar src={user.imageUrl} />
        <span>{user.name}</span>
        <span>{user.position}</span>
      </div>
    ))}
  </div>
);
```

**Bandwidth Saved:** ~70% with `summaryOnly: true`

---

### 4. User Search - Add Debouncing & Limits

#### Before ❌
```typescript
const [searchTerm, setSearchTerm] = useState("");
const results = useQuery(api.messaging.searchUsers, { searchTerm });

return (
  <div>
    <input 
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
    />
    {results?.map(user => <UserCard key={user._id} user={user} />)}
  </div>
);
```

#### After ✅
```typescript
import { useState, useEffect } from "react";

const [searchTerm, setSearchTerm] = useState("");
const [debouncedTerm, setDebouncedTerm] = useState("");

// Debounce: wait 300ms after typing stops
useEffect(() => {
  const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

// Only search if >= 2 characters
const results = useQuery(
  api.messaging.searchUsers,
  debouncedTerm.length >= 2 
    ? { searchTerm: debouncedTerm, limit: 20 }
    : "skip"
);

return (
  <div>
    <input 
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      placeholder="Search users (min 2 chars)..."
    />
    {results?.map(user => <UserCard key={user._id} user={user} />)}
  </div>
);
```

**Bandwidth Saved:** ~95% (debouncing prevents every keystroke query)

---

### 5. Online Users - Add Limit

#### Before ❌
```typescript
const onlineUsers = useQuery(api.messaging.getOnlineUsers);

return (
  <div>
    <h3>Online ({onlineUsers?.length})</h3>
    {onlineUsers?.map(user => (
      <div key={user._id}>
        <OnlineBadge />
        {user.name}
      </div>
    ))}
  </div>
);
```

#### After ✅
```typescript
// Limit to 30 online users (plenty for display)
const onlineUsers = useQuery(api.messaging.getOnlineUsers, { 
  limit: 30 
});

return (
  <div>
    <h3>Online ({onlineUsers?.length})</h3>
    {onlineUsers?.map(user => (
      <div key={user._id}>
        <OnlineBadge />
        <Avatar src={user.imageUrl} />
        {user.name}
      </div>
    ))}
  </div>
);
```

**Bandwidth Saved:** ~90% (checks 200 users instead of all)

---

### 6. Conditional Loading for Modals

#### Before ❌
```typescript
// Always loads data even when modal is closed
const projectDetails = useQuery(api.projects.getProject, { 
  projectId 
});

return (
  <div>
    <button onClick={() => setModalOpen(true)}>View Details</button>
    
    {isModalOpen && (
      <Modal>
        <ProjectDetails data={projectDetails} />
      </Modal>
    )}
  </div>
);
```

#### After ✅
```typescript
const [isModalOpen, setModalOpen] = useState(false);

// Only load when modal is open - 100% saving when closed!
const projectDetails = useQuery(
  api.projects.getProject,
  isModalOpen ? { projectId } : "skip"
);

return (
  <div>
    <button onClick={() => setModalOpen(true)}>View Details</button>
    
    {isModalOpen && (
      <Modal onClose={() => setModalOpen(false)}>
        {projectDetails ? (
          <ProjectDetails data={projectDetails} />
        ) : (
          <Loading />
        )}
      </Modal>
    )}
  </div>
);
```

**Bandwidth Saved:** 100% when modal closed (no query made)

---

### 7. Collapsible Sections

#### Before ❌
```typescript
const teamMembers = useQuery(api.projects.getProjectTeamMembers, { 
  projectId 
});

return (
  <div>
    <h3>Team Members ({teamMembers?.length})</h3>
    <ul>
      {teamMembers?.map(member => <li key={member._id}>{member.name}</li>)}
    </ul>
  </div>
);
```

#### After ✅
```typescript
const [isExpanded, setExpanded] = useState(false);

// Only load when expanded
const teamMembers = useQuery(
  api.projects.getProjectTeamMembers,
  isExpanded ? { projectId } : "skip"
);

return (
  <div>
    <button onClick={() => setExpanded(!isExpanded)}>
      {isExpanded ? '▼' : '▶'} Team Members
    </button>
    
    {isExpanded && (
      <ul>
        {teamMembers ? (
          teamMembers.map(member => (
            <li key={member._id}>{member.name}</li>
          ))
        ) : (
          <Loading />
        )}
      </ul>
    )}
  </div>
);
```

**Bandwidth Saved:** 100% when collapsed

---

## 🎯 Component-Specific Migrations

### ChatRoom Components

Update these files:
- `src/components/chat/NewChatModal.tsx`
- `src/components/chat/ChatList.tsx`

```typescript
// In NewChatModal.tsx
const searchResults = useQuery(
  api.messaging.searchUsers,
  searchTerm.length >= 2 
    ? { searchTerm, limit: 20 }  // ← Add limit
    : "skip"
);

const onlineUsers = useQuery(api.messaging.getOnlineUsers, { 
  limit: 30  // ← Add limit
});
```

### User Management Pages

Update these files:
- `src/app/admin/users/page.tsx`
- `src/components/admin/UserManagement.tsx`

```typescript
// Replace getAllUsersWithLevels with pagination
const [page, setPage] = useState(1);
const userData = useQuery(api.users.getAllUsersWithLevels, { 
  page, 
  limit: 20 
});
```

### Project Wizard / Team Assignment

Update: `src/components/projects/ProjectWizard.tsx`

```typescript
// Use getUserSummaries for team selection
const availableUsers = useQuery(api.users.getUserSummaries, { 
  department: formData.department,
  limit: 50
});
```

---

## ✅ Migration Checklist

### Phase 1: Critical (Do First)
- [ ] Update user search components (NewChatModal, etc.)
- [ ] Add pagination to user list pages
- [ ] Update online user displays with limits
- [ ] Replace full user queries with summaries in dropdowns

### Phase 2: Important
- [ ] Add conditional loading to modals
- [ ] Implement debouncing on search inputs
- [ ] Add collapsible sections with conditional queries
- [ ] Update team selection dropdowns

### Phase 3: Polish
- [ ] Add loading states for paginated data
- [ ] Implement "Load More" buttons where appropriate
- [ ] Add empty states for filtered lists
- [ ] Test pagination edge cases

---

## 🧪 Testing Checklist

After migrating each component:
- [ ] Component loads without errors
- [ ] Data displays correctly
- [ ] Pagination works (if applicable)
- [ ] Search works with debouncing
- [ ] Conditional queries load when triggered
- [ ] No console errors
- [ ] Performance feels good

---

## 📊 Verify Bandwidth Reduction

### Before Deploying
1. Open browser DevTools → Network tab
2. Filter by "fetch" or "XHR"
3. Interact with updated component
4. Check request sizes (should be smaller)

### After Deploying
1. Check Convex Dashboard → Usage
2. Monitor bandwidth over 24-48 hours
3. Should see 50-70% reduction

---

## 🆘 Common Issues & Solutions

### Issue: "Cannot destructure property 'users' of undefined"
**Cause:** Old code expects array, new code returns object
**Fix:** 
```typescript
// Before
const users = useQuery(api.users.getAllUsersWithLevels);

// After - destructure correctly
const userData = useQuery(api.users.getAllUsersWithLevels, { page: 1 });
const users = userData?.users || [];
```

### Issue: "searchTerm is required"
**Cause:** searchUsers now requires arguments
**Fix:**
```typescript
// Add minimum length check and conditional query
const results = useQuery(
  api.messaging.searchUsers,
  searchTerm.length >= 2 ? { searchTerm } : "skip"
);
```

### Issue: Infinite loading spinner
**Cause:** Query is "skipped" but UI doesn't handle it
**Fix:**
```typescript
// Check if query is skipped
const data = useQuery(api.some.query, condition ? args : "skip");

if (!condition) {
  return <div>Please {action} to load data</div>;
}

if (!data) {
  return <Loading />;
}
```

---

## 💡 Pro Tips

1. **Start with high-traffic pages first** (user lists, dashboards)
2. **Test in development** before deploying
3. **Monitor bandwidth** for 24 hours after each change
4. **Keep old queries** commented out temporarily for rollback
5. **Update one component at a time** to isolate issues

---

## 📞 Need Help?

If you encounter issues during migration:
1. Check the query still exists in `convex/users.ts` or `convex/messaging.ts`
2. Verify you're passing the correct arguments
3. Check browser console for specific error messages
4. Test the query in Convex dashboard Functions tab

---

**Last Updated:** {{ new Date().toISOString().split('T')[0] }}  
**Migration Version:** 1.0
