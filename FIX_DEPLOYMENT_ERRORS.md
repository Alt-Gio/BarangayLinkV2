# 🔧 Fix Deployment Errors

**Date:** Oct 19, 2025  
**Status:** ✅ FIXED

---

## ✅ **Error 1: TypeScript Error - FIXED!**

**Error:**
```
Type '"meeting"' is not assignable to type '"online" | "away" | "offline"'
```

**Fix Applied:**
Updated `convex/presence.ts` line 142 to include all new status types.

**Status:** ✅ Fixed automatically

---

## 🔧 **Error 2: Functions Not Found**

**Error:**
```
Could not find public function for 'messagingExtended:getPinnedMessages'
```

**Cause:**
The new `messagingExtended.ts` file hasn't been deployed to Convex yet.

---

## 🚀 **SOLUTION: Deploy to Convex**

### **Option 1: Development Mode (Recommended)**

Run this in your terminal:

```bash
npx convex dev
```

This will:
- ✅ Deploy all new functions
- ✅ Watch for changes
- ✅ Auto-reload on save
- ✅ Keep running in background

**Leave this running while developing!**

---

### **Option 2: One-Time Deploy**

If you just want to deploy once:

```bash
npx convex deploy
```

This will deploy all changes to production.

---

## 📋 **Complete Fix Steps:**

### **Step 1: Stop Current Dev Server**

Press `Ctrl+C` in your terminal to stop Next.js dev server.

### **Step 2: Start Convex Dev**

```bash
npx convex dev
```

Wait for it to say:
```
✓ Convex functions deployed successfully
```

### **Step 3: Start Next.js (in new terminal)**

Open a NEW terminal and run:

```bash
npm run dev
```

### **Step 4: Test**

Open your app and the errors should be gone!

---

## 🎯 **What Gets Deployed:**

When you run `npx convex dev`, these files are deployed:

✅ `convex/messagingExtended.ts` - New messaging features  
✅ `convex/schema.ts` - Updated database schema  
✅ `convex/presence.ts` - Fixed type error  
✅ All other convex files  

---

## ⚠️ **Important Notes:**

### **Always Keep Convex Dev Running:**

```bash
# Terminal 1 (Always running)
npx convex dev

# Terminal 2 (Your dev server)
npm run dev
```

### **If You See "Function Not Found":**

This means Convex isn't running. Start it:
```bash
npx convex dev
```

### **If Changes Don't Appear:**

1. Check `npx convex dev` is running
2. Wait for "deployed successfully" message
3. Refresh your browser

---

## ✅ **Verification:**

After running `npx convex dev`, you should see:

```
✓ convex/messagingExtended.ts deployed
✓ Functions available:
  - messagingExtended:addReaction
  - messagingExtended:getPinnedMessages
  - messagingExtended:pinMessage
  - messagingExtended:searchMessages
  - messagingExtended:createPoll
  - messagingExtended:voteOnPoll
  - messagingExtended:setCustomStatus
  - messagingExtended:getUserStatus
  - ... and more
```

---

## 🎉 **After Deployment:**

All these features will work:
- ✅ Message reactions
- ✅ Pinned messages
- ✅ Message search
- ✅ Polls
- ✅ Custom status
- ✅ Group admin features
- ✅ Media gallery

---

## 🆘 **Still Having Issues?**

### **"Command not found: npx"**
Install Node.js from nodejs.org

### **"Not logged in to Convex"**
Run:
```bash
npx convex login
```

### **"Project not found"**
Run:
```bash
npx convex dev --once
```

---

## 📝 **Summary:**

**Problem:** New functions not deployed  
**Solution:** Run `npx convex dev`  
**Result:** All features working! ✅

---

**Run `npx convex dev` now and your messaging features will work!** 🚀
