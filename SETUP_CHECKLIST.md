# 🚀 Quick Setup Checklist - After Git Clone

**Problem:** You cloned the repo to a new computer and features are missing.  
**Solution:** Follow this checklist step-by-step.

---

## ✅ **Essential Steps (In Order)**

### **1. Install Dependencies** ✓ DONE
```bash
npm install
```
**Status:** ✓ Already completed - 1292 packages installed

---

### **2. Create .env.local File** ⚠️ REQUIRED

**This file is missing!** It contains your secret keys.

**Action:**
1. In the project root, create a new file called `.env.local`
2. Copy these lines into it:

```env
# Convex Database
NEXT_PUBLIC_CONVEX_URL=https://YOUR-PROJECT.convex.cloud
CONVEX_DEPLOYMENT=prod:YOUR-DEPLOYMENT

# Clerk Authentication  
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Liveblocks (Real-time Collaboration)
LIVEBLOCKS_SECRET_KEY=sk_YOUR_KEY
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_YOUR_KEY

# Clerk URLs (Keep these as-is)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Email (Optional)
RESEND_API_KEY=re_YOUR_KEY

# Firebase Push Notifications (Optional)
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY
```

**Where to get these keys:**
- **Convex:** Login at https://dashboard.convex.dev
- **Clerk:** Login at https://dashboard.clerk.com
- **Liveblocks:** Login at https://liveblocks.io/dashboard

---

### **3. Deploy/Connect Convex Backend**

```bash
# Terminal 1 - Start Convex (keep running)
npx convex dev
```

**What this does:**
- ✓ Deploys all backend functions (messagingExtended, events, projects, etc.)
- ✓ Creates database tables
- ✓ Syncs schema
- ✓ Connects to your Convex project

**Important:** Leave this terminal open! Convex must stay running.

---

### **4. Start Next.js Development Server**

```bash
# Terminal 2 - Start Next.js (new terminal!)
npm run dev
```

**Access at:** http://localhost:3000

---

## 🔍 **Verify Features Are Working**

### **Test 1: Basic App**
- [ ] Go to http://localhost:3000
- [ ] Can you see the landing page?
- [ ] Can you click "Login" or "Sign Up"?

### **Test 2: Authentication (Clerk)**
- [ ] Can you sign in?
- [ ] Do you see the dashboard after login?
- [ ] Is your profile picture showing?

### **Test 3: Messaging Features**
- [ ] Go to `/messages`
- [ ] Can you send a message?
- [ ] Hover over message - do you see reactions? 👍❤️😂
- [ ] Can you search messages? (search icon)
- [ ] Can you create a poll? (poll icon)
- [ ] Can you pin messages? (pin icon)

### **Test 4: Event Features**
- [ ] Go to `/events`
- [ ] Click "Create Event"
- [ ] Can you upload an event image?
- [ ] Do event cards show images?
- [ ] Can you RSVP to events?

### **Test 5: Project Features**
- [ ] Go to `/projects`
- [ ] Can you create a project?
- [ ] Can you add tasks?
- [ ] Can you drag & drop tasks on Kanban board?
- [ ] Can you assign team members?

---

## 🚨 **Common Issues & Quick Fixes**

### **Issue: "Cannot find module" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### **Issue: "Clerk not initialized"**
**Cause:** Missing `.env.local` or wrong keys  
**Fix:**
1. Check `.env.local` file exists
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
3. Restart server: `npm run dev`

---

### **Issue: "Convex function not found"**
**Cause:** Convex not deployed  
**Fix:**
```bash
npx convex dev
```

---

### **Issue: Features missing (reactions, polls, etc.)**
**Cause:** `messagingExtended.ts` not deployed  
**Fix:**
1. Check Convex terminal shows: `✓ messagingExtended deployed`
2. If not, restart: `npx convex dev`

---

### **Issue: "Hydration failed" in browser**
**Cause:** Cached build  
**Fix:**
```bash
rm -rf .next
npm run dev
```

---

## 🦊 **Firefox-Specific Fixes**

### **Enable Service Workers:**
1. Firefox → `about:config`
2. Search: `dom.serviceWorkers.enabled`
3. Set to: **true**
4. Restart Firefox

### **Clear Cache:**
1. Firefox Menu → Settings → Privacy & Security
2. Click "Clear Data"
3. Check "Cached Web Content"
4. Click "Clear"

### **Disable Tracking Protection (for localhost):**
1. Click shield icon in address bar
2. Turn OFF "Enhanced Tracking Protection"
3. Reload page

---

## 📊 **Expected Features (After Setup)**

You should have ALL these features working:

### **Messaging:**
- ✅ Message reactions (👍❤️😂😮😢🔥)
- ✅ Pinned messages
- ✅ Message search
- ✅ Polls
- ✅ File attachments
- ✅ Typing indicators
- ✅ Read receipts

### **Events:**
- ✅ Event creation
- ✅ Image upload
- ✅ Event cards with images
- ✅ RSVP system
- ✅ Event categories
- ✅ Calendar view

### **Projects:**
- ✅ Kanban board
- ✅ Task assignments
- ✅ Drag & drop
- ✅ Progress tracking
- ✅ Milestones
- ✅ Sprints
- ✅ Real-time collaboration

### **Offline/PWA:**
- ✅ Works offline
- ✅ Service workers
- ✅ Installable as app

---

## 🎯 **Quick Command Reference**

```bash
# Install dependencies
npm install

# Start Convex (Terminal 1 - keep running)
npx convex dev

# Start Next.js (Terminal 2)
npm run dev

# Clear cache and rebuild
rm -rf .next
npm run dev

# Reinstall dependencies
rm -rf node_modules
npm install

# Check for errors
npm run lint
```

---

## ✅ **You're Ready When:**

- [ ] No errors in Convex terminal
- [ ] No errors in Next.js terminal  
- [ ] App loads at http://localhost:3000
- [ ] Can login successfully
- [ ] Can send messages
- [ ] Can create events with images
- [ ] Can create projects
- [ ] All feature tests pass (see above)

---

## 📞 **Still Having Issues?**

1. **Check both terminals** for error messages
2. **Open browser console** (F12) and check for errors
3. **Verify .env.local** has all required keys
4. **Try in a different browser** (Chrome, Edge) to isolate Firefox issues

---

**Created:** Oct 20, 2025  
**Purpose:** Quick setup after git clone
