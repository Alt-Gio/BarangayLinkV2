# 🔐 CRITICAL SECURITY FIXES

## ⚠️ These Are Security Vulnerabilities - Fix NOW!

---

## 🚨 Issue #1: Password Validation Exposes Passwords

**File:** `convex/securitySettings.ts:227`
**Severity:** 🔴 **CRITICAL**
**Impact:** User passwords sent in plaintext, logged by Convex

### The Problem
```typescript
// Line 227 - DANGEROUS!
export const validatePassword = query({
  args: { password: v.string() },  // ❌ Password sent to server!
  handler: async (ctx, args) => {
    // Validates password...
  }
});
```

**Why This Is Bad:**
1. Queries are logged by Convex (passwords visible in logs!)
2. Password sent in URL params (cached, logged)
3. No hashing before transmission
4. Anyone with Convex dashboard access sees passwords

### The Fix: Client-Side Validation Only

**Delete the server-side password validator** or make it client-side only:

```typescript
// CLIENT-SIDE ONLY (src/lib/passwordValidator.ts)
export function validatePasswordStrength(password: string) {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain a number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Must contain special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

**Never Send Passwords to Your Backend!**
- Clerk handles all authentication
- Passwords stay with Clerk
- You should never see user passwords

---

## 🚨 Issue #2: Firebase API Keys Exposed

**File:** `public/firebase-messaging-sw.js:9`
**Severity:** 🔴 **CRITICAL**
**Impact:** API keys visible to anyone

### The Problem
```javascript
// Line 9 - EXPOSED TO PUBLIC!
const firebaseConfig = {
  apiKey: "AIzaSyA5Uz-eARzXbO873CN4kzHGAvo9BX7Gqeo",  // ❌ PUBLIC!
  authDomain: "barangaylink-v2.firebaseapp.com",
  projectId: "barangaylink-v2",
  // ...
};
```

**Why This Is Bad:**
1. Anyone can see your Firebase API key
2. Can abuse your Firebase quota
3. Can access your Firebase project
4. Cost you money in Firebase usage

### The Fix: Move to Environment Variables

**Step 1:** Add to `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=barangaylink-v2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=barangaylink-v2
```

**Step 2:** Generate service worker at build time:

Create `scripts/generate-sw.js`:
```javascript
const fs = require('fs');

const swContent = `
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
`;

fs.writeFileSync('public/firebase-messaging-sw.js', swContent);
console.log('✅ Generated firebase-messaging-sw.js');
```

**Step 3:** Update `package.json`:
```json
{
  "scripts": {
    "prebuild": "node scripts/generate-sw.js",
    "build": "next build"
  }
}
```

---

## 🚨 Issue #3: Weak Token Generation

**Files:** `convex/users.ts:1131`, `convex/userApproval.ts:48`
**Severity:** 🔴 **CRITICAL**
**Impact:** Invitation tokens are predictable, can be guessed

### The Problem
```typescript
// WEAK! Math.random() is NOT secure
const invitationToken = `inv_${Math.random().toString(36)}${Math.random().toString(36)}${now}`;

// PREDICTABLE! Timestamp + weak random
const token = `INV-${Date.now()}-${Math.random().toString(36)}`;
```

**Why This Is Bad:**
1. Math.random() is not cryptographically secure
2. Predictable patterns
3. Can be brute-forced
4. Timestamp reveals when invite was created

### The Fix: Use Crypto

```typescript
// SECURE! Cryptographically random
import { v4 as uuidv4 } from 'uuid';

// Option 1: Use UUID (install: npm install uuid)
const invitationToken = `inv_${uuidv4()}`;

// Option 2: Use Web Crypto (built-in)
const invitationToken = `inv_${crypto.randomUUID()}`;

// Option 3: Custom secure random
function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

const invitationToken = `inv_${generateSecureToken(32)}`;
```

**Update All Token Generation:**
1. `convex/users.ts:1131` - sendInvitation mutation
2. `convex/userApproval.ts:48` - createInvitation mutation
3. Any other token generation

---

## 🚨 Issue #4: No Admin Permission Checks

**Files:** `convex/departments.ts`, `convex/userLevels.ts`, others
**Severity:** 🔴 **HIGH**
**Impact:** Anyone can create/modify critical data

### The Problem
```typescript
// convex/departments.ts:45
export const createDepartment = mutation({
  args: { name: v.string(), ... },
  handler: async (ctx, args) => {
    // TODO: Add permission check for admin  ❌ NO CHECK!
    
    const departmentId = await ctx.db.insert("departments", {
      name: args.name,
      // ...
    });
  }
});
```

**Why This Is Bad:**
1. Any authenticated user can create departments
2. Can modify organization structure
3. Can delete critical data
4. No audit trail of who made changes

### The Fix: Add Permission Middleware

**Create:** `convex/auth.ts`
```typescript
import { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  const userLevel = await ctx.db.get(user.userLevel);
  
  if (!userLevel || !["ADMIN", "CAPTAIN"].includes(userLevel.name)) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: string[]
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  const userLevel = await ctx.db.get(user.userLevel);
  
  if (!userLevel || !allowedRoles.includes(userLevel.name)) {
    throw new Error(`Unauthorized: Requires one of: ${allowedRoles.join(", ")}`);
  }

  return user;
}
```

**Use in Mutations:**
```typescript
import { requireAdmin } from "./auth";

export const createDepartment = mutation({
  args: { name: v.string(), ... },
  handler: async (ctx, args) => {
    // ✅ Check admin permission
    const admin = await requireAdmin(ctx);
    
    const departmentId = await ctx.db.insert("departments", {
      name: args.name,
      createdBy: admin._id,  // Track who created it
      createdAt: Date.now(),
    });
    
    return departmentId;
  }
});
```

**Add to These Files:**
- `convex/departments.ts` - createDepartment, updateDepartment
- `convex/userLevels.ts` - createUserLevel, updateUserLevel
- `convex/securitySettings.ts` - all mutations
- Any other admin-only functions

---

## 🚨 Issue #5: Unvalidated CSV Import

**File:** `src/app/admin/residents/page.tsx:127`
**Severity:** 🟠 **HIGH**
**Impact:** Malicious CSV can inject bad data

### The Problem
```typescript
// Line 124-129
residentData[header.trim()] = values[index]?.trim();

// TODO: Call Convex mutation to create resident
// await createResident(residentData);  ❌ NO VALIDATION!
successCount++;
```

**Why This Is Bad:**
1. No validation of CSV data
2. Can inject SQL/NoSQL (if we had direct DB access)
3. Can overflow fields
4. Can crash import process
5. Can corrupt data

### The Fix: Validate Before Import

```typescript
// Add validation schema
import { z } from 'zod';

const ResidentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['Male', 'Female', 'Other']),
  civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated']),
  contactNumber: z.string().regex(/^09\d{9}$/).optional(),
  email: z.string().email().optional(),
  // ... more fields
});

// Validate before creating
try {
  const validatedData = ResidentSchema.parse(residentData);
  await createResident(validatedData);
  successCount++;
} catch (error) {
  errors.push({
    row: index + 2,
    error: error.message,
    data: residentData
  });
}
```

---

## 📋 Security Checklist

### Immediate (Do Today)
- [ ] Remove password validation from server
- [ ] Move Firebase config to env variables
- [ ] Replace Math.random() with crypto
- [ ] Add admin permission checks
- [ ] Add CSV import validation

### This Week
- [ ] Add rate limiting to API routes
- [ ] Add CSRF protection
- [ ] Audit all Convex mutations for auth
- [ ] Add input sanitization
- [ ] Review all TODO comments

### This Month
- [ ] Security audit by third party
- [ ] Penetration testing
- [ ] Add error tracking (Sentry)
- [ ] Add security headers
- [ ] Implement CSP policy

---

## 🛡️ Security Best Practices Going Forward

1. **Never Store Passwords**
   - Use Clerk for authentication
   - Never see or store passwords
   - Let Clerk handle security

2. **Always Validate Input**
   - Server-side validation (don't trust client)
   - Use Zod or similar
   - Sanitize all inputs

3. **Check Permissions**
   - Every mutation should check auth
   - Use middleware for common checks
   - Fail closed (deny by default)

4. **Use Secure Randomness**
   - crypto.randomUUID() for tokens
   - Never use Math.random() for security
   - Use proper token libraries

5. **Protect Sensitive Data**
   - Environment variables for secrets
   - Never commit secrets to git
   - Use .env.local (not .env)

6. **Monitor & Log**
   - Track failed auth attempts
   - Log admin actions
   - Alert on suspicious activity

---

## 📞 Need Help?

**Security Resources:**
- OWASP Top 10: https://owasp.org/Top10/
- Clerk Security: https://clerk.com/docs/security
- Convex Security: https://docs.convex.dev/security

**If You Find a Security Issue:**
1. Don't commit it
2. Fix it immediately
3. Check if it's in production (rotate keys if needed)
4. Document the fix
5. Add tests to prevent regression

---

**Priority:** Fix these BEFORE deploying to production!
**Estimated Time:** 2-3 hours
**Impact:** Prevents security breaches, protects user data

