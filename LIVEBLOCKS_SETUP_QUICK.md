# 🔧 Liveblocks Setup - Quick Fix

## ✅ What I Fixed

Changed Liveblocks client to use auth endpoint instead of public key:

```typescript
// Before (insecure):
publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY

// After (secure):
authEndpoint: "/api/liveblocks-auth"
```

---

## 🔑 Required: Add Environment Variable

### **Step 1: Get Liveblocks Secret Key**

1. Go to https://liveblocks.io/dashboard
2. Sign up/Login (FREE tier available)
3. Create a new project or select existing
4. Go to "API Keys" section
5. Copy your **Secret Key** (starts with `sk_`)

### **Step 2: Add to .env.local**

```bash
# Add this line to .env.local:
LIVEBLOCKS_SECRET_KEY=sk_your_actual_secret_key_here
```

### **Step 3: Restart Dev Server**

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ After Setup

**Collaboration page will work:**
- ✅ Room authentication
- ✅ Real-time comments
- ✅ Thread management
- ✅ User presence

**That's it! The 403 error will be gone.** 🎉

---

## 🚀 Quick Test

1. Add `LIVEBLOCKS_SECRET_KEY` to `.env.local`
2. Restart server
3. Go to `/collaboration`
4. Select a project or event
5. Try adding a comment
6. It should work! ✅
