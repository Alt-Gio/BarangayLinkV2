# 🔄 HOW TO RESTART SERVER & FIX LIVEBLOCKS

**The Issue:** Your LIVEBLOCKS_SECRET_KEY is in .env.local but not loading because the server hasn't been restarted!

---

## ✅ **STEP-BY-STEP FIX:**

### **Step 1: Stop the Dev Server**

In your terminal where `npm run dev` is running:

```bash
Press Ctrl+C
```

You should see something like:
```
^C
Process terminated
```

### **Step 2: Delete .next Folder (Important!)**

This clears the cache:

```bash
Remove-Item -Recurse -Force .next
```

Or manually:
1. Go to your project folder
2. Delete the `.next` folder
3. It will regenerate when you restart

### **Step 3: Start Dev Server Again**

```bash
npm run dev
```

Wait for:
```
✓ Ready in 3s
○ Local: http://localhost:3000
```

### **Step 4: Test Again**

1. Open http://localhost:3000/collaboration
2. Select a project/event
3. Type a comment
4. Click "Post Comment"
5. ✅ Should work now!

---

## 🔍 **Check if .env.local is Correct:**

Your .env.local should have this line (no quotes, no spaces):

```env
LIVEBLOCKS_SECRET_KEY=sk_prod_your_key_here
```

**Common mistakes:**
- ❌ `LIVEBLOCKS_SECRET_KEY = sk_prod_...` (spaces around =)
- ❌ `LIVEBLOCKS_SECRET_KEY="sk_prod_..."` (has quotes)
- ❌ `NEXT_PUBLIC_LIVEBLOCKS_SECRET_KEY=...` (wrong name)
- ✅ `LIVEBLOCKS_SECRET_KEY=sk_prod_...` (CORRECT!)

---

## 📋 **Complete Terminal Commands:**

Copy and paste these one by one:

```powershell
# 1. Stop server (if running)
# Press Ctrl+C in the terminal

# 2. Delete cache
Remove-Item -Recurse -Force .next

# 3. Verify key is set (should show ✅)
node check-liveblocks.js

# 4. Start server
npm run dev
```

---

## 🎯 **What to Watch For:**

When you start the server, watch the terminal for any errors:

**Good signs (✅):**
```
✓ Ready in 3s
✓ Compiled successfully
```

**Bad signs (❌):**
```
Error: LIVEBLOCKS_SECRET_KEY is not defined
```

If you see the bad sign, your .env.local has a problem.

---

## 🔧 **If Still Not Working:**

Check these in order:

### **1. Check File Location**
```powershell
# This should show your .env.local file
Get-ChildItem .env.local
```

If it says "file not found", create it in the root folder!

### **2. Check File Content Format**

Make sure there are NO:
- Trailing spaces
- Extra blank lines
- Unicode characters
- Hidden characters

### **3. Test Key Loading**

After restarting server, run:
```powershell
node check-liveblocks.js
```

Should show:
```
✅ LIVEBLOCKS_SECRET_KEY is set
✅ Secret key format looks correct
```

---

## 🆘 **Emergency Check:**

If nothing works, verify your key from Liveblocks:

1. Go to https://liveblocks.io/dashboard
2. Click your project
3. Settings → API Keys
4. Copy the **SECRET KEY** (not public key)
5. It should start with `sk_prod_` or `sk_dev_`
6. Paste it in .env.local (no quotes!)

---

## ⚡ **Quick Checklist:**

- [ ] Stopped dev server (Ctrl+C)
- [ ] Deleted .next folder
- [ ] Verified .env.local has LIVEBLOCKS_SECRET_KEY
- [ ] No quotes or spaces in .env.local
- [ ] Started server with npm run dev
- [ ] Tested posting a comment

---

**After following these steps, your comments WILL work!** 🎉
