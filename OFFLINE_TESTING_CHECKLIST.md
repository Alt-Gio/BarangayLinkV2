# Offline Functionality Testing Checklist

## Pre-Testing Setup

- [ ] Build the application: `npm run build`
- [ ] Start production server: `npm start`
- [ ] Open browser DevTools (F12)
- [ ] Navigate to Application tab (Chrome) or Storage tab (Firefox)

## Test 1: Service Worker Registration

- [ ] Go to Application > Service Workers
- [ ] Verify service worker is "activated and running"
- [ ] Check for any registration errors
- [ ] Verify manifest.json loads correctly

**Expected:** ✅ Service worker active, no errors

## Test 2: Offline Detection

- [ ] With app loaded, go to Network tab
- [ ] Select "Offline" from throttling dropdown
- [ ] Verify offline indicator appears at top of screen
- [ ] Indicator should show "You're offline" message

**Expected:** ✅ Red banner with offline message

## Test 3: Cached Content

- [ ] While offline, refresh the page
- [ ] Verify page loads from cache
- [ ] Navigate to different pages
- [ ] Check images and styles load

**Expected:** ✅ App loads without network

## Test 4: Create Items Offline

### Projects
- [ ] Go to Projects page
- [ ] Click "Create Project"
- [ ] Fill in details and save
- [ ] Verify project appears in UI
- [ ] Check IndexedDB > sync_queue for pending mutation

### Tasks
- [ ] Go to Tasks page
- [ ] Create a new task
- [ ] Verify task shows with temp ID
- [ ] Check queue for pending mutation

### Messages
- [ ] Go to Messages
- [ ] Send a message
- [ ] Verify message appears
- [ ] Check queue

**Expected:** ✅ Items created, queue populated

## Test 5: Edit Items Offline

- [ ] Edit an existing project
- [ ] Change title or status
- [ ] Save changes
- [ ] Verify UI updates immediately
- [ ] Check queue for update mutation

**Expected:** ✅ Optimistic UI update, mutation queued

## Test 6: IndexedDB Storage

- [ ] Open Application > IndexedDB
- [ ] Find "barangaylink_offline_db"
- [ ] Check tables: projects, tasks, messages, sync_queue
- [ ] Verify queued mutations exist

**Expected:** ✅ Database created, data stored

## Test 7: Reconnection & Sync

- [ ] Go back online (disable offline mode)
- [ ] Verify indicator changes to "Back online - Syncing..."
- [ ] Watch console for sync logs
- [ ] Check IndexedDB queue - should be empty after sync
- [ ] Verify server has received updates

**Expected:** ✅ Green banner, queue clears, data synced

## Test 8: Cache Performance

- [ ] Go online
- [ ] Navigate to dashboard
- [ ] Go offline
- [ ] Navigate to same page
- [ ] Measure load time (should be instant)

**Expected:** ✅ Cached page loads < 100ms

## Test 9: Error Handling

### Network Timeout
- [ ] Simulate slow network (Slow 3G)
- [ ] Try to load new data
- [ ] Verify timeout falls back to cache

### Storage Full
- [ ] Fill browser storage quota
- [ ] Try to cache more data
- [ ] Verify graceful degradation

**Expected:** ✅ No crashes, fallback to network

## Test 10: Multi-Tab Sync

- [ ] Open app in two tabs
- [ ] Go offline in both
- [ ] Make changes in tab 1
- [ ] Go online
- [ ] Check tab 2 updates

**Expected:** ✅ Both tabs sync correctly

## Browser Testing Matrix

### Chrome/Edge
- [ ] Service worker works
- [ ] IndexedDB works
- [ ] Cache API works
- [ ] Offline indicator works
- [ ] PWA installable

### Firefox
- [ ] Service worker works
- [ ] IndexedDB works
- [ ] Cache API works
- [ ] Offline indicator works
- [ ] PWA installable

### Safari (Mobile)
- [ ] Service worker works
- [ ] IndexedDB works
- [ ] Cache API works
- [ ] Offline indicator works
- [ ] PWA installable

## Mobile Testing

### Android Chrome
- [ ] Install PWA from browser
- [ ] Test offline functionality
- [ ] Verify background sync
- [ ] Check battery usage

### iOS Safari
- [ ] Add to Home Screen
- [ ] Test offline functionality
- [ ] Verify cache persistence
- [ ] Check storage limits

## Performance Benchmarks

### Cache Size
- [ ] Check total cache size (Application > Cache Storage)
- [ ] Should be < 50MB
- [ ] Images compressed
- [ ] Unnecessary files excluded

### IndexedDB Size
- [ ] Check database size
- [ ] Should be < 100MB
- [ ] Old entries cleaned up
- [ ] Expired cache removed

### Load Times
- [ ] First load (online): < 3s
- [ ] Cached load (offline): < 500ms
- [ ] Sync operation: < 5s
- [ ] Page transitions: < 200ms

## Edge Cases

- [ ] Logout while offline
- [ ] Clear cache while offline
- [ ] Browser crash during sync
- [ ] Conflict resolution (same item edited online/offline)
- [ ] Large file upload offline
- [ ] Session timeout offline

## Production Checklist

- [ ] Service worker deployed
- [ ] HTTPS enabled
- [ ] Manifest icons present (all sizes)
- [ ] Cache headers configured
- [ ] Error monitoring enabled
- [ ] Analytics tracking offline events
- [ ] User documentation updated
- [ ] Support team trained

## Known Issues & Limitations

### Current Limitations
- Real-time collaboration requires connection
- File uploads queued but not processed until online
- Large datasets may exceed storage quota
- iOS Safari 50MB storage limit

### Workarounds
- Show "sync pending" badge on offline items
- Warn users about large uploads when offline
- Implement storage quota checks
- Clear old cache periodically

## Debugging Tips

### View Logs
```javascript
// In browser console
localStorage.setItem('debug', 'offline:*');
```

### Clear Everything
```javascript
// Service Worker
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));

// Cache
caches.keys().then(names => names.forEach(name => caches.delete(name)));

// IndexedDB
indexedDB.deleteDatabase('barangaylink_offline_db');

// Reload
location.reload();
```

### Check Sync Queue
```javascript
// In browser console
const request = indexedDB.open('barangaylink_offline_db');
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('sync_queue', 'readonly');
  const store = tx.objectStore('sync_queue');
  const getAll = store.getAll();
  getAll.onsuccess = () => console.log('Queue:', getAll.result);
};
```

---

**Pass Criteria:** All tests must pass before deploying to production.

**Test Date:** ___________
**Tester:** ___________
**Results:** ___________
