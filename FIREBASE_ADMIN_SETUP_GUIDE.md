# 🔥 Firebase Admin SDK Setup Guide

## 📋 **Step 1: Get Firebase Admin Credentials**

### **1.1 Go to Firebase Console**
1. Visit: https://console.firebase.google.com/
2. Select your project: **barangaylink-v2**

### **1.2 Go to Project Settings**
1. Click the ⚙️ gear icon (top-left, next to "Project Overview")
2. Click **"Project settings"**

### **1.3 Go to Service Accounts Tab**
1. Click on the **"Service accounts"** tab
2. You'll see "Firebase Admin SDK" section

### **1.4 Generate Private Key**
1. Click **"Generate new private key"** button
2. A popup will ask you to confirm
3. Click **"Generate key"**
4. A JSON file will download to your computer

### **1.5 Open the Downloaded JSON File**

The file will be named something like:
```
barangaylink-v2-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
```

Open it in a text editor. It will look like:
```json
{
  "type": "service_account",
  "project_id": "barangaylink-v2",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@barangaylink-v2.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk..."
}
```

---

## 📝 **Step 2: Add to .env.local**

Copy these 3 values from the JSON file to your `.env.local`:

```bash
# Firebase Admin SDK (for server-side FCM)
FIREBASE_PROJECT_ID=barangaylink-v2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@barangaylink-v2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

### **⚠️ IMPORTANT:**
- ✅ Keep `FIREBASE_PRIVATE_KEY` in **double quotes**
- ✅ Copy the **entire** private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- ✅ The `\n` characters should stay as `\n` (they're newline indicators)

---

## 🔒 **Step 3: Security**

### **Add to .gitignore** (Already done, but verify):
```
.env.local
*.json
!package.json
!tsconfig.json
```

### **Never commit:**
- ❌ The downloaded JSON file
- ❌ Your `.env.local` file
- ❌ Any file containing the private key

### **Keep the JSON file safe:**
- Save it somewhere secure (password manager, encrypted folder)
- You can regenerate it anytime from Firebase Console
- Delete it from Downloads folder after copying values

---

## ✅ **Step 4: Verify Setup**

### **4.1 Check .env.local has all these variables:**
```bash
# Existing Firebase config (for client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA5Uz-eARzXbO873CN4kzHGAvo9BX7Gqeo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=barangaylink-v2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=barangaylink-v2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=barangaylink-v2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=804912061017
NEXT_PUBLIC_FIREBASE_APP_ID=1:804912061017:web:6373c52cdad249f2fdef48
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE

# NEW: Firebase Admin SDK (for server-side FCM)
FIREBASE_PROJECT_ID=barangaylink-v2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@barangaylink-v2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

# App URL (for FCM callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **4.2 Restart your dev server:**
```bash
npm run dev
```

### **4.3 Check for initialization message:**
Look for this in your terminal:
```
✅ Firebase Admin initialized
```

If you see:
```
❌ Missing Firebase Admin credentials
```
Then check your `.env.local` file again.

---

## 🧪 **Step 5: Test FCM**

### **5.1 Test the API route directly:**
```bash
# Test API route (using curl or Postman):
curl -X POST http://localhost:3000/api/send-fcm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN_HERE",
    "title": "Test Notification",
    "body": "This is a test from API route"
  }'
```

### **5.2 Test in the app:**
1. Make sure you're logged in
2. Enable notifications (grant permission)
3. Send a message to another user
4. Check if FCM notification is sent (check terminal logs)

### **5.3 Check logs:**
Look for these in your terminal:
```
📤 Sending push notification to user k97...
✅ FCM notification sent successfully: projects/barangaylink-v2/messages/...
```

---

## 🐛 **Troubleshooting**

### **Error: "Firebase Admin not initialized"**
**Solution:** Check that all 3 environment variables are in `.env.local` and restart dev server

### **Error: "Invalid private key"**
**Solution:** 
- Make sure private key is in **double quotes**
- Copy the **entire** key including BEGIN and END lines
- Don't remove the `\n` characters

### **Error: "Permission denied"**
**Solution:** 
- Regenerate the service account key from Firebase Console
- Make sure you're using the correct project

### **Error: "Invalid FCM token"**
**Solution:**
- User needs to enable notifications first
- Check that FCM token is saved in database
- Token might be expired - user needs to reload page

---

## 📊 **What Each Variable Does**

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | Server-side auth |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Server-side auth |
| `FIREBASE_PRIVATE_KEY` | Private key for signing | Server-side auth |
| `NEXT_PUBLIC_APP_URL` | Your app URL | FCM notification links |

---

## ✅ **Success Checklist**

- [ ] Downloaded service account JSON from Firebase
- [ ] Added 3 variables to `.env.local`
- [ ] Private key is in double quotes
- [ ] Restarted dev server
- [ ] Saw "✅ Firebase Admin initialized" in terminal
- [ ] Tested sending a message
- [ ] Saw "✅ FCM notification sent successfully" in logs
- [ ] Received notification on desktop

---

## 🎉 **Next Steps After Setup**

Once Firebase Admin is working:

1. **Test notifications when app is closed:**
   - Close all browser windows
   - Have someone send you a message
   - You should still get a desktop notification!

2. **Test on mobile:**
   - Deploy your app
   - Open on mobile browser
   - Enable notifications
   - Should work on Android (iOS Safari has limitations)

3. **Production deployment:**
   - Add the same environment variables to your hosting platform
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables

---

**You're all set! FCM should now work even when the app is closed!** 🚀
