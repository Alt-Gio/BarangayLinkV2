# 🚨 IMMEDIATE FIXES - Start Here!

## ⏱️ Fix These in the Next Hour

These are **blocking production deployment** and **security risks**.

---

## 1️⃣ Convert Icons to PNG (5 minutes) ⚠️ BLOCKING iOS

**Status:** 🔴 **CRITICAL - iOS devices cannot connect**

**Do This Right Now:**

### Step 1: Go to Icon Generator
1. Open: **https://realfavicongenerator.net/**
2. Upload your blue building logo (the one you showed me)
3. Click "Generate your Favicons and HTML code"
4. Download the package

### Step 2: Extract Files
```powershell
# Extract to your project
# Copy PNG files from downloaded package to:
# - c:\Users\admin\Documents\backup\New\barangaylink-v2\public\icons\
# - c:\Users\admin\Documents\backup\New\barangaylink-v2\public\
```

### Step 3: Verify
```powershell
# Check files are PNG, not SVG
Get-ChildItem "public\icons" | Select-Object Name, Extension
Get-ChildItem "public\apple-*" | Select-Object Name, Extension

# Should see:
# icon-72x72.png (not .svg)
# apple-touch-icon.png (not .svg)
```

### Step 4: Rebuild
```bash
npm run build
# Should build successfully now
```

**Result:** iOS devices can connect! ✅

---

## 2️⃣ Fix Password Security (30 minutes) 🔐 SECURITY

**Status:** 🔴 **CRITICAL - Passwords exposed in logs**

**Problem:** `convex/securitySettings.ts` sends passwords in plaintext queries.

### Fix: Remove Password Validator

<function_calls>
<invoke name="read_file">
<parameter name="file_path">c:\Users\admin\Documents\backup\New\barangaylink-v2\convex\securitySettings.ts
