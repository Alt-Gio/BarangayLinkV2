# 🚀 FCM Backend Setup - Quick Steps

## ✅ **What I Just Did For You:**

1. ✅ Installed `firebase-admin` package
2. ✅ Created `/api/send-fcm/route.ts` - API endpoint to send FCM
3. ✅ Updated `convex/pushNotifications.ts` - Now actually sends via FCM
4. ✅ Created setup documentation

---

## 🎯 **What YOU Need to Do (5 minutes):**

### **Step 1: Get Firebase Admin Credentials (3 min)**

1. Go to: https://console.firebase.google.com/
2. Select project: **barangaylink-v2**
3. Click ⚙️ gear icon → **Project settings**
4. Click **"Service accounts"** tab
5. Click **"Generate new private key"** button
6. Click **"Generate key"** to download JSON file
7. Open the downloaded JSON file in notepad

---

### **Step 2: Add to .env.local (2 min)**

Open your `.env.local` file and add these 3 new lines:

```bash
# Firebase Admin SDK (Add these 3 lines)
FIREBASE_PROJECT_ID=barangaylink-v2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@barangaylink-v2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
```

**Copy from the JSON file you downloaded:**
- `FIREBASE_PROJECT_ID` = the `"project_id"` value
- `FIREBASE_CLIENT_EMAIL` = the `"client_email"` value  
- `FIREBASE_PRIVATE_KEY` = the `"private_key"` value (keep in quotes!)

**⚠️ Important:**
- Keep `FIREBASE_PRIVATE_KEY` in **double quotes**
- Copy the **entire** private key including `-----BEGIN PRIVATE KEY-----`
- Don't remove the `\n` characters

---

### **Step 3: Restart Dev Server**

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

Look for this message in terminal:
```
✅ Firebase Admin initialized
```

---

## 🧪 **Step 4: Test It!**

### **Test 1: Send a Message**
1. Open 2 browser windows (2 different users)
2. Window 1: Send a message to user in Window 2
3. **Close Window 2 completely** (close all tabs)
4. Window 1: Send another message
5. **Window 2 should get notification even though it's closed!** 🎉

### **Test 2: Check Logs**
Look in your terminal for:
```
📤 Sending push notification to user k97...
✅ FCM notification sent successfully: projects/barangaylink-v2/messages/0:123...
```

---

## 📋 **Your .env.local Should Have:**

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex
CONVEX_DEPLOYMENT=dev:...
NEXT_PUBLIC_CONVEX_URL=https://...

# Firebase Client-side (for browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA5Uz-eARzXbO873CN4kzHGAvo9BX7Gqeo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=barangaylink-v2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=barangaylink-v2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=barangaylink-v2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=804912061017
NEXT_PUBLIC_FIREBASE_APP_ID=1:804912061017:web:6373c52cdad249f2fdef48
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY

# NEW: Firebase Admin (for server-side)
FIREBASE_PROJECT_ID=barangaylink-v2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@barangaylink-v2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🐛 **Common Issues:**

### **"Firebase Admin not initialized"**
→ Check that all 3 Firebase Admin variables are in `.env.local`  
→ Restart dev server

### **"Invalid private key"**
→ Make sure private key is in **double quotes**  
→ Copy the **entire** key including BEGIN and END lines

### **"No FCM token"**
→ User needs to enable notifications first  
→ Reload page after enabling notifications

---

## ✅ **Success = Notifications Work When App is Closed!**

**Before FCM Backend:**
- ✅ Notifications when app is **open** (via NotificationListener)
- ❌ No notifications when app is **closed**

**After FCM Backend:**
- ✅ Notifications when app is **open** (instant via FCM)
- ✅ Notifications when app is **closed** (FCM delivers to OS)
- ✅ Works on mobile browsers (Android)
- ✅ Instant delivery (no delay)

---

## 📚 **Full Documentation:**

- `FIREBASE_ADMIN_SETUP_GUIDE.md` - Detailed setup instructions
- `FCM_SETUP_INSTRUCTIONS.md` - Original FCM setup
- `NOTIFICATION_SYSTEM_REVIEW.md` - Complete system overview

---

**Next Step:** Follow Step 1 above to get your Firebase Admin credentials! 🔥
