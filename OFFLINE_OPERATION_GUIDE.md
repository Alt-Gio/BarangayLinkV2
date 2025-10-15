# Offline Operation Guide

## Overview

BarangayLink v2 now supports full offline functionality, allowing users to continue working even without internet connection. All changes made offline will automatically sync when the connection is restored.

## Features

✅ **Automatic Offline Detection** - Visual indicators when offline
✅ **Service Worker Caching** - Static assets and API responses cached
✅ **IndexedDB Storage** - Local data storage for projects, tasks, messages, events
✅ **Mutation Queue** - Offline changes queued and synced automatically
✅ **Optimistic Updates** - Instant UI feedback for offline actions
✅ **Auto-Sync** - Automatic synchronization when back online

## Architecture

### 1. Service Worker (PWA)
- Handles network requests
- Caches static assets (JS, CSS, images)
- Caches API responses with NetworkFirst strategy
- Updates automatically on new deployments

### 2. IndexedDB Storage
Location: `src/lib/offlineStorage.ts`

**Stores:**
- `projects` - Project data
- `tasks` - Task data
- `messages` - Chat messages
- `events` - Calendar events
- `sync_queue` - Pending mutations
- `data_cache` - Cached query results with TTL

### 3. Network Status Detection
Location: `src/hooks/useNetworkStatus.ts`

Monitors:
- Online/offline events
- Connection quality
- Triggers sync on reconnection

### 4. Offline Indicator
Location: `src/components/ui/OfflineIndicator.tsx`

Shows:
- Offline status banner
- "Syncing..." when reconnecting
- Auto-hides after 3 seconds online

### 5. Offline Sync Provider
Location: `src/providers/OfflineSyncProvider.tsx`

Manages:
- Sync queue
- Auto-sync triggers
- Sync status

## Usage

### For Users

#### Working Offline
1. **Automatic Detection**: When offline, a banner appears at the top
2. **Continue Working**: All features remain functional
3. **Local Storage**: Changes saved locally in browser
4. **Auto-Sync**: When online, changes sync automatically

#### What Works Offline
- ✅ View cached projects, tasks, events
- ✅ Create new items (queued for sync)
- ✅ Edit existing items (queued for sync)
- ✅ Send messages (queued for sync)
- ✅ Upload files (queued for sync)
- ✅ Navigate between pages

#### What Requires Connection
- ❌ Real-time collaboration features
- ❌ Live chat with other users
- ❌ Downloading new data not in cache
- ❌ Authentication/login

### For Developers

#### Using Offline Mutation Hook

```typescript
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { api } from "../../../convex/_generated/api";

function MyComponent() {
  const { execute, isPending, isOffline } = useOfflineMutation(
    api.projects.createProject,
    "createProject", // Function name for queue
    {
      onSuccess: (result) => {
        console.log("Project created:", result);
      },
      onError: (error) => {
        console.error("Failed:", error);
      },
      optimisticUpdate: (args) => {
        // Update UI immediately
        setProjects(prev => [...prev, { ...args, _id: 'temp_id' }]);
      },
      rollback: () => {
        // Revert UI on error
        setProjects(prev => prev.filter(p => p._id !== 'temp_id'));
      }
    }
  );

  const handleCreate = async () => {
    await execute({
      title: "New Project",
      description: "Project description"
    });
  };

  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isOffline ? "Create (Offline)" : "Create Project"}
    </button>
  );
}
```

#### Accessing Offline Storage

```typescript
import { offlineStorage, STORES } from "@/lib/offlineStorage";

// Store data
await offlineStorage.set(STORES.PROJECTS, {
  _id: "project123",
  title: "My Project",
  status: "active"
});

// Get data
const project = await offlineStorage.get(STORES.PROJECTS, "project123");

// Get all items
const allProjects = await offlineStorage.getAll(STORES.PROJECTS);

// Cache with TTL
await offlineStorage.setCache("userProjects", projects, 1000 * 60 * 60); // 1 hour

// Get cached data
const cached = await offlineStorage.getCache("userProjects");
```

#### Adding to Sync Queue

```typescript
await offlineStorage.addToQueue({
  type: "mutation",
  function: "api.projects.updateProject",
  args: {
    projectId: "project123",
    updates: { status: "completed" }
  },
  timestamp: Date.now()
});
```

#### Using Offline Sync Context

```typescript
import { useOfflineSync } from "@/providers/OfflineSyncProvider";

function SyncButton() {
  const { isSyncing, queuedCount, syncNow } = useOfflineSync();

  return (
    <button onClick={syncNow} disabled={isSyncing}>
      {isSyncing ? "Syncing..." : `Sync ${queuedCount} Changes`}
    </button>
  );
}
```

## Caching Strategy

### Static Assets (CacheFirst)
- Images: 7 days
- CSS/JS: 30 days
- Fonts: 30 days

### API Responses (NetworkFirst)
- Convex API: 24 hours, 10s timeout
- Fallback to cache if network fails

### User Data (Manual)
- Projects, tasks, events stored in IndexedDB
- Cache invalidated on mutations
- TTL configurable per query

## Testing Offline Mode

### In Browser DevTools

1. **Chrome DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Select "Offline" from throttling dropdown

2. **Firefox DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Offline" option

3. **Test Scenarios**:
   ```
   ✓ Page loads with cached data
   ✓ Offline indicator appears
   ✓ Can create/edit items
   ✓ Changes queued in IndexedDB
   ✓ Sync triggers on reconnection
   ✓ Queue clears after sync
   ```

### Manual Testing

```bash
# Start dev server
npm run dev

# In browser:
# 1. Load the app
# 2. Open DevTools -> Application -> Service Workers
# 3. Verify service worker is active
# 4. Go offline (DevTools or toggle WiFi)
# 5. Navigate and make changes
# 6. Check IndexedDB for queued mutations
# 7. Go back online
# 8. Verify sync completes
```

## Troubleshooting

### Service Worker Not Registering

**Check:**
- PWA disabled in development: `process.env.NODE_ENV === 'development'`
- HTTPS required (except localhost)
- Browser supports service workers

**Fix:**
```bash
# Build for production
npm run build

# Or enable in development (next.config.ts):
disable: false,
```

### Cache Not Working

**Clear cache:**
```javascript
// In browser console
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### IndexedDB Errors

**Check storage quota:**
```javascript
navigator.storage.estimate().then(estimate => {
  console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
});
```

**Clear IndexedDB:**
```javascript
indexedDB.deleteDatabase('barangaylink_offline_db');
```

### Sync Not Working

**Check queue:**
```javascript
import { offlineStorage } from "@/lib/offlineStorage";

// View queue
const queue = await offlineStorage.getQueue();
console.log('Pending mutations:', queue);

// Clear queue manually
await offlineStorage.clearQueue();
```

## Performance Tips

### 1. Limit Cache Size
```typescript
// In next.config.ts
expiration: {
  maxEntries: 64,  // Limit entries
  maxAgeSeconds: 24 * 60 * 60  // 24 hours
}
```

### 2. Selective Caching
Only cache data that's needed offline:
```typescript
// Cache important data
await offlineStorage.setCache("userProjects", projects);

// Don't cache large datasets
// Don't cache frequently changing data
```

### 3. Cleanup Old Cache
```typescript
// Automatic cleanup runs every hour
// Manual cleanup:
await offlineStorage.cleanupExpiredCache();
```

### 4. Optimize IndexedDB Queries
```typescript
// Use indexes for faster queries
const store = transaction.objectStore(STORES.TASKS);
const index = store.index("status");
const results = await index.getAll("active");
```

## Security Considerations

### 1. Sensitive Data
- Don't cache sensitive user data
- Clear cache on logout
- Use secure storage for tokens

### 2. Data Validation
- Validate all cached data before use
- Check data integrity
- Handle corrupted data gracefully

### 3. Sync Conflicts
- Last-write-wins strategy
- Conflict resolution on server
- User notification for conflicts

## Deployment Checklist

- [ ] Service worker registered
- [ ] Manifest.json configured
- [ ] HTTPS enabled
- [ ] Cache strategies configured
- [ ] IndexedDB initialized
- [ ] Offline indicator visible
- [ ] Sync tested thoroughly
- [ ] Error handling implemented
- [ ] Cleanup scheduled
- [ ] Performance optimized

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Cache API | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ✅ |

**Minimum Versions:**
- Chrome 50+
- Firefox 44+
- Safari 11.1+
- Edge 17+

## Additional Resources

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [PWA Best Practices](https://web.dev/pwa/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

---

**Need Help?** Check console logs for detailed debugging information.
