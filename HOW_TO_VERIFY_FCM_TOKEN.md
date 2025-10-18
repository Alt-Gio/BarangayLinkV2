# 🔍 How to Verify FCM Token is Saved

## ✅ **Method 1: Convex Dashboard (Easiest - 30 seconds)**

1. Go to: https://dashboard.convex.dev/
2. Select your project
3. Click **"Data"** in the left sidebar
4. Click on the **"pushSubscriptions"** table
5. You should see entries like:

```
_id: k123abc...
userId: k456def...
token: eJwOVyt8F0Zk1wPf1js...  ← This is your FCM token!
createdAt: 1729267890000
updatedAt: 1729267890000
deviceInfo: {...}
```

**If you see entries → Token is saved! ✅**  
**If table is empty → Token not saved yet ❌**

---

## 🔧 **Method 2: Browser Console Logs**

### **Check if token is being generated:**

1. Open your app: `http://localhost:3000`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for these messages:

```
🔔 Requesting notification permission...
✅ Notification permission granted
🔥 Firebase Messaging initialized
🔔 FCM Token: eJwOVyt8F0Zk1wPf1js...
✅ Push subscription saved to Convex
```

**If you see "✅ Push subscription saved" → Token is saved! ✅**

---

## 🧪 **Method 3: Test Component (Most Detailed)**

I'll create a debug component to show your FCM token on screen.

---

## 🐛 **Method 4: Check for Errors**

### **Common issues why token might not be saved:**

#### **Issue 1: Notification permission not granted**
```
Console shows: "⚠️ Notification permission denied"
```
**Fix:** Click "Allow" when browser asks for notification permission

#### **Issue 2: Service worker not registered**
```
Console shows: "❌ Service worker registration failed"
```
**Fix:** Check that `firebase-messaging-sw.js` exists in `/public` folder

#### **Issue 3: Firebase config missing**
```
Console shows: "❌ Firebase configuration missing"
```
**Fix:** Check `.env.local` has all Firebase variables

#### **Issue 4: Not logged in**
```
Console shows: "❌ Not authenticated"
```
**Fix:** Sign in with Clerk first

---

## 📊 **Quick Verification Checklist**

Run through this checklist:

- [ ] **Logged in?** (Check if you see your name in app)
- [ ] **Notification permission granted?** (Check browser address bar - should show 🔔)
- [ ] **Firebase initialized?** (Check console for "🔥 Firebase Messaging initialized")
- [ ] **Token generated?** (Check console for "🔔 FCM Token: ...")
- [ ] **Token saved?** (Check console for "✅ Push subscription saved")
- [ ] **Token in database?** (Check Convex Dashboard → Data → pushSubscriptions)

---

## 🎯 **Expected Flow**

Here's what should happen when you first visit the app:

```
1. Page loads
   ↓
2. Clerk authentication loads
   ↓
3. NotificationPermissionPrompt appears
   ↓
4. User clicks "Enable Notifications"
   ↓
5. Browser asks: "Allow notifications?"
   ↓
6. User clicks "Allow"
   ↓
7. Service worker registers
   ↓
8. Firebase generates FCM token
   ↓
9. Token is saved to Convex pushSubscriptions table
   ↓
10. Console shows: "✅ Push subscription saved to Convex"
```

---

## 🔑 **What the FCM Token Looks Like**

Your FCM token is a long string that looks like:

```
eJwOVyt8F0Zk1wPf1jsLmHk7:APA91bF_xYz...
```

- Starts with random characters
- Contains `:APA91b` in the middle
- About 150-200 characters long
- Unique per browser/device

---

## 🧪 **Test If Token Is Working**

Once you confirm token is saved, test it:

1. **Send yourself a message** from another account
2. **Check terminal logs** for:
   ```
   📤 Sending push notification to user k97...
   ✅ FCM notification sent successfully: projects/barangaylink-v2/messages/...
   ```
3. **Look for desktop notification** (bottom-right corner on Windows)

---

## 📝 **Still Not Working? Debug Steps:**

### **Step 1: Check useNotificationPermission hook**
Open browser console and type:
```javascript
localStorage.getItem('notification-permission')
```
Should return: `"granted"`

### **Step 2: Check if service worker is active**
1. F12 → Application tab
2. Service Workers (left sidebar)
3. Should see: `firebase-messaging-sw.js` with status "activated"

### **Step 3: Manually trigger token save**
Open console and run:
```javascript
// This will show the current token
navigator.serviceWorker.ready.then((registration) => {
  return registration.pushManager.getSubscription();
}).then(sub => console.log('Subscription:', sub));
```

---

## ✅ **Success Indicators**

You'll know everything is working when:

1. ✅ Convex Dashboard shows your token in pushSubscriptions table
2. ✅ Console shows "✅ Push subscription saved to Convex"
3. ✅ Browser shows 🔔 icon in address bar (notifications allowed)
4. ✅ Test notification appears on desktop
5. ✅ Terminal logs show "✅ FCM notification sent successfully"

---

**Start with Method 1 (Convex Dashboard) - it's the fastest way to check!** 🚀
