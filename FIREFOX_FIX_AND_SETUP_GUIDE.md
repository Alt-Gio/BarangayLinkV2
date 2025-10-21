# 🔧 Firefox App Fix & Complete Setup Guide

**Issue:** After cloning the repo to a new computer, the app is missing features and having issues.

**Date:** Oct 20, 2025  
**Status:** Fixing & Re-integrating

---

## 🎯 **The Problem**

When you clone a Git repo to a new computer, these files are **NOT included** (gitignored):
- ❌ `node_modules/` - All dependencies
- ❌ `.env.local` - Environment variables
- ❌ `.next/` - Build cache
- ❌ Convex deployment state

This causes:
- Missing features (messaging, events, etc.)
- Build errors
- Authentication issues
- Firefox-specific compatibility problems

---

## ✅ **COMPLETE FIX - Step by Step**

### **Step 1: Install Dependencies** 

```bash
# Navigate to project folder
cd c:\Users\admin\Documents\backup\New\barangaylink-v2

# Install all dependencies
npm install
```

**What this does:** Downloads all packages listed in `package.json` (~500MB)

---

### **Step 2: Setup Environment Variables**

Your `.env.local` file is missing. Create it with these variables:

```bash
# Copy the template
copy env.template .env.local
```

Then edit `.env.local` and add your keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Convex Database
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment-name

# Liveblocks (Real-time Collaboration)
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_...
LIVEBLOCKS_SECRET_KEY=sk_...

# Firebase (Push Notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BH6o...

# Email (Resend)
RESEND_API_KEY=re_...
```

**Where to find these keys:**
- **Clerk:** https://dashboard.clerk.com → Your App → API Keys
- **Convex:** https://dashboard.convex.dev → Your Project → Settings
- **Liveblocks:** https://liveblocks.io/dashboard → API Keys
- **Firebase:** https://console.firebase.google.com → Project Settings
- **Resend:** https://resend.com/api-keys

---

### **Step 3: Deploy Convex Backend**

```bash
# Login to Convex
npx convex dev --once

# This will:
# ✓ Deploy all backend functions
# ✓ Set up database schema
# ✓ Initialize tables
# ✓ Deploy messagingExtended features
```

**Important:** Keep this terminal open! Convex needs to stay running.

---

### **Step 4: Start Development Server**

Open a **NEW terminal** (keep Convex running in the other one):

```bash
npm run dev
```

This starts Next.js on: http://localhost:3000

---

### **Step 5: Firefox-Specific Fixes**

Firefox has specific compatibility issues. Apply these fixes:

#### **A) Enable Service Workers in Firefox**

1. Open Firefox
2. Go to `about:config`
3. Search for: `dom.serviceWorkers.enabled`
4. Set to: **true**
5. Restart Firefox

#### **B) Allow PWA Installation**

1. Go to `about:config`
2. Search for: `browser.ssb.enabled`
3. Set to: **true**

#### **C) Clear Firefox Cache**

```
Firefox Menu → Settings → Privacy & Security → Clear Data
✓ Check "Cached Web Content"
✓ Click "Clear"
```

#### **D) Disable Tracking Protection (for localhost)**

1. Click shield icon in address bar
2. Toggle "Enhanced Tracking Protection" OFF for localhost
3. Reload page

---

## 🔍 **Verify All Features Are Working**

### **1. Check Messaging Features**

Go to: `http://localhost:3000/messages`

**Test:**
- ✅ Send a message
- ✅ Hover over message → See reaction emojis (👍❤️😂)
- ✅ Click search icon → Search messages
- ✅ Click poll icon → Create poll
- ✅ Click pin icon → Pin message
- ✅ Upload file attachment

**If not working:**
- Check Convex is running: `npx convex dev`
- Check browser console (F12) for errors

---

### **2. Check Event Features**

Go to: `http://localhost:3000/events`

**Test:**
- ✅ Create event
- ✅ Upload event image
- ✅ See event cards with images
- ✅ Click event → View details
- ✅ RSVP to event

---

### **3. Check Project Features**

Go to: `http://localhost:3000/projects`

**Test:**
- ✅ Create project
- ✅ Add tasks
- ✅ Drag & drop tasks (Kanban board)
- ✅ Assign team members
- ✅ Track progress

---

## 🚨 **Common Errors & Fixes**

### **Error: "Hydration failed"**

**Cause:** Client/server mismatch  
**Fix:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### **Error: "Clerk not initialized"**

**Cause:** Missing Clerk keys in `.env.local`  
**Fix:**
1. Check `.env.local` has correct keys
2. Restart dev server: `npm run dev`

---

### **Error: "Convex function not found"**

**Cause:** Backend not deployed  
**Fix:**
```bash
# Restart Convex
npx convex dev
```

---

### **Error: "Module not found"**

**Cause:** Missing dependencies  
**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

### **Firefox: "Service Worker Registration Failed"**

**Cause:** Firefox PWA settings  
**Fix:**
1. `about:config`
2. Enable `dom.serviceWorkers.enabled`
3. Enable `browser.ssb.enabled`
4. Clear cache
5. Hard refresh: `Ctrl + Shift + R`

---

## 📊 **Complete Feature List**

After following this guide, you should have:

### **Messaging System:**
- ✅ Direct messages
- ✅ Group chats
- ✅ File attachments
- ✅ Message reactions (👍❤️😂😮😢🔥)
- ✅ Pinned messages
- ✅ Message search
- ✅ Polls
- ✅ Read receipts
- ✅ Typing indicators
- ✅ Message editing/deletion

### **Event System:**
- ✅ Create events
- ✅ Upload event images
- ✅ Event categories (Meeting, Community, Project, Emergency)
- ✅ RSVP system
- ✅ Event calendar view
- ✅ Event notifications
- ✅ Public/Private events

### **Project Management:**
- ✅ Kanban board
- ✅ Task assignments
- ✅ Progress tracking
- ✅ Time tracking
- ✅ Milestones
- ✅ Sprints (Jira-style)
- ✅ Story points
- ✅ Drag & drop
- ✅ Real-time collaboration (Liveblocks)

### **Gamification:**
- ✅ XP system
- ✅ Levels
- ✅ Achievements
- ✅ Streaks
- ✅ Leaderboards
- ✅ Habitica-style health/mana

### **Mobile/PWA:**
- ✅ Responsive design
- ✅ Offline mode
- ✅ Service workers
- ✅ Push notifications
- ✅ Install as app

---

## 🎯 **Quick Start Commands**

After completing all steps above:

**Terminal 1 (Convex):**
```bash
npx convex dev
```

**Terminal 2 (Next.js):**
```bash
npm run dev
```

**Access app:**
```
http://localhost:3000
```

---

## 🔧 **Firefox Performance Optimization**

Add these to Firefox `about:config` for better performance:

```
browser.cache.disk.enable = true
browser.cache.memory.enable = true
browser.cache.memory.capacity = 512000
dom.ipc.processCount = 8
```

---

## 📝 **Troubleshooting Checklist**

Before reporting issues, verify:

- [ ] `node_modules/` folder exists (run `npm install`)
- [ ] `.env.local` file exists with all keys
- [ ] Convex is running (`npx convex dev`)
- [ ] Next.js is running (`npm run dev`)
- [ ] No errors in terminal
- [ ] No errors in browser console (F12)
- [ ] Firefox service workers enabled
- [ ] Cache cleared

---

## 🆘 **Still Having Issues?**

### **Check Browser Console:**

1. Press `F12` in Firefox
2. Go to **Console** tab
3. Look for red errors
4. Share the error messages

### **Check Terminal Output:**

Look for errors in:
- Convex terminal
- Next.js terminal

### **Common Firefox Issues:**

**Issue:** Features work in Chrome but not Firefox  
**Fix:** Clear Firefox cache + enable service workers

**Issue:** PWA not installing  
**Fix:** Enable `browser.ssb.enabled` in `about:config`

**Issue:** Push notifications not working  
**Fix:** Check Firebase keys + allow notifications in Firefox settings

---

## ✅ **Success Checklist**

You've successfully set up when:

- ✅ No errors in terminal
- ✅ App loads at http://localhost:3000
- ✅ Can login with Clerk
- ✅ Can send messages
- ✅ Can create events with images
- ✅ Can create projects/tasks
- ✅ All features from documentation work
- ✅ Works in Firefox (and other browsers)

---

## 🎉 **All Done!**

Your BarangayLink v2 is now fully integrated and working!

**Next steps:**
1. Test all features
2. Deploy to production (Vercel)
3. Invite team members
4. Start managing projects!

---

**Created:** Oct 20, 2025  
**Last Updated:** Oct 20, 2025
