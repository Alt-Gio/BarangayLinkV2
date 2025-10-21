# 🔑 Missing .env.local Setup Guide

## ⚠️ **CRITICAL: Your .env.local file is missing!**

This file contains your secret API keys and is **NOT included in Git** for security reasons.

---

## 📋 **Quick Setup Instructions**

### **Step 1: Create the File**

In your project root folder (`barangaylink-v2`), create a new file called:
```
.env.local
```

### **Step 2: Copy This Template**

Paste these lines into your `.env.local` file:

```env
# ============================================
# CONVEX DATABASE (REQUIRED)
# ============================================
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment-name

# ============================================
# CLERK AUTHENTICATION (REQUIRED)
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_secret_here

# Clerk URLs (keep these as-is)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ============================================
# LIVEBLOCKS COLLABORATION (REQUIRED)
# ============================================
LIVEBLOCKS_SECRET_KEY=sk_your_key_here
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_your_key_here

# ============================================
# FIREBASE PUSH NOTIFICATIONS (OPTIONAL)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# ============================================
# EMAIL SERVICE (OPTIONAL)
# ============================================
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ============================================
# MAPBOX MAPS (OPTIONAL)
# ============================================
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token

# ============================================
# APP CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🔑 **Where to Get Your API Keys**

### **1. Convex (Database)**
1. Go to: https://dashboard.convex.dev
2. Login and select your project
3. Go to **Settings** tab
4. Copy:
   - `Deployment URL` → Use as `NEXT_PUBLIC_CONVEX_URL`
   - `Deployment Name` → Use as `CONVEX_DEPLOYMENT`

**Example:**
```env
NEXT_PUBLIC_CONVEX_URL=https://happy-mongoose-123.convex.cloud
CONVEX_DEPLOYMENT=prod:happy-mongoose-123
```

---

### **2. Clerk (Authentication)**
1. Go to: https://dashboard.clerk.com
2. Login and select your application
3. Go to **API Keys** section
4. Copy:
   - `Publishable Key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret Key` → `CLERK_SECRET_KEY`
5. Go to **Webhooks** section
6. Copy webhook secret → `CLERK_WEBHOOK_SECRET`

**Example:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_abcdef1234567890
CLERK_WEBHOOK_SECRET=whsec_abcdef1234567890
```

---

### **3. Liveblocks (Real-time Collaboration)**
1. Go to: https://liveblocks.io/dashboard
2. Login and select your project
3. Go to **API Keys**
4. Copy:
   - `Public Key` → `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
   - `Secret Key` → `LIVEBLOCKS_SECRET_KEY`

**Example:**
```env
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_prod_abcdef123456
LIVEBLOCKS_SECRET_KEY=sk_prod_abcdef123456
```

---

### **4. Firebase (Push Notifications) - Optional**
1. Go to: https://console.firebase.google.com
2. Select your project
3. Click gear icon → **Project Settings**
4. Scroll to **Your apps** section
5. Select web app or create one
6. Copy all configuration values
7. For VAPID key: Go to **Cloud Messaging** tab → **Web Push certificates**

---

### **5. Resend (Email) - Optional**
1. Go to: https://resend.com/api-keys
2. Login and create an API key
3. Copy the key

---

## ✅ **Verify Your Setup**

After creating `.env.local`:

1. **Check file exists:**
   ```bash
   dir .env.local
   ```

2. **Restart development server:**
   ```bash
   npm run dev
   ```

3. **Check for errors:**
   - Open http://localhost:3000
   - Press F12 to open browser console
   - Look for any error messages

4. **Test authentication:**
   - Click "Login" or "Sign Up"
   - If Clerk loads, authentication is working!

---

## 🚨 **Common Mistakes**

### **❌ Wrong: Using placeholder values**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
```

### **✅ Right: Using actual keys**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk
```

---

### **❌ Wrong: Missing quotes around URLs**
No quotes needed! Just the plain value.

### **✅ Right:**
```env
NEXT_PUBLIC_CONVEX_URL=https://happy-mongoose-123.convex.cloud
```

---

### **❌ Wrong: Spaces around equals sign**
```env
CLERK_SECRET_KEY = sk_test_abc123
```

### **✅ Right:**
```env
CLERK_SECRET_KEY=sk_test_abc123
```

---

## 🔒 **Security Notes**

1. **NEVER commit .env.local to Git**
   - It's already in `.gitignore`
   - Contains secret keys

2. **Don't share .env.local file**
   - Each developer needs their own
   - Production uses different keys

3. **Use different keys for dev/prod**
   - Development: `_test_` keys
   - Production: `_prod_` keys

---

## 📞 **Need Help?**

If you can't find your keys:

1. **Convex:** Ask whoever set up the original project
2. **Clerk:** Check your email for invitation
3. **Liveblocks:** Contact team admin
4. **Or:** Create NEW accounts (free tiers available)

---

## 🎯 **After Setup**

Once `.env.local` is ready:

1. Start Convex: `npx convex dev`
2. Start Next.js: `npm run dev`
3. Open: http://localhost:3000
4. Test login and features

---

**Created:** Oct 20, 2025  
**Purpose:** Guide for setting up missing environment variables
