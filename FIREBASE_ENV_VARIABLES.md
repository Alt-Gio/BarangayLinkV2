# Firebase Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA5Uz-eARzXbO873CN4kzHGAvo9BX7Gqeo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=barangaylink-v2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=barangaylink-v2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=barangaylink-v2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=804912061017
NEXT_PUBLIC_FIREBASE_APP_ID=1:804912061017:web:6373c52cdad249f2fdef48

# VAPID Key for Web Push (Get this from Firebase Console)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

## How to Get Your VAPID Key:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: "barangaylink-v2"
3. Click the **Settings** icon (⚙️) → **Project settings**
4. Go to **Cloud Messaging** tab
5. Scroll to **Web Push certificates**
6. Click **Generate key pair**
7. Copy the key (starts with "B...")
8. Replace `YOUR_VAPID_KEY_HERE` with your actual key

## After Adding Variables:

1. Restart your dev server
2. Restart Convex dev
3. Test the notification prompt!
