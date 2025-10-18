# 🔥 Firebase Cloud Messaging - Setup Instructions

## ✅ What We've Done So Far

I've created all the code files needed for FCM. Now you need to complete the Firebase setup!

---

## 📋 **Files Created:**

1. ✅ `src/lib/firebase.ts` - Firebase initialization
2. ✅ `src/hooks/useNotificationPermission.ts` - Permission hook
3. ✅ `convex/pushNotifications.ts` - Backend functions
4. ✅ `convex/schema.ts` - Updated with pushSubscriptions table
5. ✅ `src/components/notifications/NotificationPermissionPrompt.tsx` - UI component
6. ✅ `public/firebase-messaging-sw.js` - Service worker

---

## 🔧 **Next Steps: Complete Firebase Setup**

### **Step 1: Create Firebase Project** (10 minutes)

1. Go to: https://console.firebase.google.com
2. Click **"Add project"**
3. Project name: **`BarangayLink`**
4. Click **"Continue"**
5. **Disable** Google Analytics (not needed)
6. Click **"Create project"**
7. Wait for project creation
8. Click **"Continue"**

---

### **Step 2: Add Web App** (5 minutes)

1. In Firebase Console, click the **Web icon** (</>) to add a web app
2. App nickname: **`BarangayLink Web`**
3. **Check** "Also set up Firebase Hosting" (optional)
4. Click **"Register app"**
5. You'll see your **Firebase configuration**:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "barangaylink-xxxxx.firebaseapp.com",
  projectId: "barangaylink-xxxxx",
  storageBucket: "barangaylink-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. **COPY THIS** - you'll need it next!

---

### **Step 3: Enable Cloud Messaging** (5 minutes)

1. In Firebase Console, go to **Build** → **Cloud Messaging**
2. Click **"Get started"** (if prompted)
3. Under **Web Push certificates**, click **"Generate key pair"**
4. **COPY the VAPID key** (looks like: `BNx...`)
5. Save this key somewhere safe!

---

### **Step 4: Add Environment Variables** (5 minutes)

Create or update your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=barangaylink-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=barangaylink-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=barangaylink-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# VAPID Key for Web Push
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNx...
```

**Replace with your actual values from Step 2 and 3!**

---

### **Step 5: Update Service Worker Config** (2 minutes)

Edit `public/firebase-messaging-sw.js`:

Find this section (lines 8-14):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",  // ← Replace these
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Replace with your actual Firebase config from Step 2!**

---

### **Step 6: Add Permission Prompt to Layout** (2 minutes)

Edit `src/app/layout.tsx`:

Add the import:
```typescript
import { NotificationPermissionPrompt } from '@/components/notifications/NotificationPermissionPrompt';
```

Add the component inside the `<body>` tag (after ClerkProvider):
```typescript
<body>
  <ClerkProvider>
    {/* ... existing providers ... */}
    
    {/* Add this */}
    <NotificationPermissionPrompt />
    
    {children}
  </ClerkProvider>
</body>
```

---

### **Step 7: Test It!** (5 minutes)

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Restart Convex:**
   ```bash
   npx convex dev
   ```

3. **Open your app** in the browser

4. **Wait 3 seconds** - you should see the permission prompt!

5. **Click "Enable Notifications"**

6. **Check browser console** - you should see:
   ```
   ✅ FCM Token: [your-token]
   ✅ Push notification enabled and saved!
   ```

7. **Check Convex Dashboard** → `pushSubscriptions` table
   - Should have 1 entry with your userId and token

---

## 🎯 **Quick Verification Checklist**

Before moving forward, verify:

- [ ] Firebase project created
- [ ] Web app added to Firebase
- [ ] Cloud Messaging enabled
- [ ] VAPID key generated
- [ ] Environment variables added to `.env.local`
- [ ] Service worker updated with config
- [ ] Permission prompt added to layout
- [ ] Dev server restarted
- [ ] Convex dev running
- [ ] Permission prompt appears after 3 seconds
- [ ] Token saved to Convex database

---

## 🎨 **How It Works**

### **Flow:**

```
User opens app
     ↓
Wait 3 seconds
     ↓
Show permission prompt ✨
     ↓
User clicks "Enable"
     ↓
Browser asks for permission 🔔
     ↓
User clicks "Allow"
     ↓
Get FCM token from Firebase 🎫
     ↓
Save token to Convex database 💾
     ↓
Success! ✅
```

---

## 🔐 **Privacy & Security Notes**

### **What Data Is Stored:**

**In Convex (YOUR database):**
- User ID (internal reference)
- FCM Token (encrypted by Firebase)
- Device info (browser/platform)
- Created/updated timestamps

**In Firebase:**
- Only the FCM token
- No personal data
- No message content
- No user information

### **Data Flow:**
```
Your Convex DB → Firebase FCM → User's Device
(100% private)   (Just delivery)   (End user)
```

**Benefits:**
- ✅ All user data stays in YOUR Convex database
- ✅ Firebase only handles delivery (no data storage)
- ✅ You control all notification content
- ✅ No third-party tracking
- ✅ GDPR/Privacy compliant

---

## 📱 **Next: Sending Notifications**

Once setup is complete, you can send notifications like this:

```typescript
// In any Convex mutation
await ctx.scheduler.runAfter(
  0,
  internal.pushNotifications.sendPushNotification,
  {
    userId: targetUser._id,
    title: "📋 New Task Assigned",
    body: "You've been assigned: Road Drainage Repair",
    url: "/tasks/task_123",
    icon: "/icon-192x192.png",
  }
);
```

**Example use cases:**
- Task assignments
- New messages
- Achievement unlocks
- Event reminders
- Deadline alerts

---

## 🆘 **Troubleshooting**

### **Permission prompt doesn't appear:**
- Check browser console for errors
- Make sure `.env.local` has all variables
- Restart dev server
- Clear browser cache

### **"Messaging not initialized" error:**
- Check if service worker is registered
- Verify Firebase config is correct
- Make sure VAPID key is set

### **Token not saving to Convex:**
- Check Convex dev is running
- Look for errors in console
- Verify schema was updated
- Check authentication is working

### **Service worker errors:**
- Make sure `firebase-messaging-sw.js` has correct config
- Check browser DevTools → Application → Service Workers
- Try unregistering and re-registering

---

## ✅ **You're All Set!**

Once you complete Steps 1-7 above, you'll have:

✅ Firebase project configured  
✅ Push notifications enabled  
✅ Tokens saved to Convex  
✅ Permission UI working  
✅ Service worker registered  
✅ Ready to send notifications!  

---

## 📚 **Resources**

- Firebase Console: https://console.firebase.google.com
- FCM Documentation: https://firebase.google.com/docs/cloud-messaging
- Your Convex Dashboard: https://dashboard.convex.dev

---

**Let me know once you've completed these steps, and I'll help you test sending actual push notifications!** 🚀
