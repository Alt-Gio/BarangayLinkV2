# 🔐 User Registration & Approval System

## ✅ **Implementation Complete!**

Your barangay system now has **dual-path registration** with admin approval controls!

---

## 🎯 **Two Registration Paths**

### **Path 1: Invitation-Only (Recommended)** 🎫
**Flow:** Admin creates invitation → User receives code → Registers with code → **Instant Access**

**Benefits:**
- ✅ Pre-approved users
- ✅ Admin controls who joins
- ✅ No approval wait time
- ✅ Pre-assigned roles & departments

**How it works:**
1. Admin creates invitation in System Administration → Invitations
2. System generates unique code (e.g., `INV-1234567890-abc123`)
3. Admin shares code with person
4. User enters code during registration
5. User gets instant access (no approval needed)

---

### **Path 2: Open Registration with Approval** ⏳
**Flow:** User registers → **Pending Status** → Admin reviews → Admin approves/rejects

**Benefits:**
- ✅ Allows walk-in registrations
- ✅ Admin reviews before access
- ✅ Prevents fake accounts

**How it works:**
1. User registers without invitation code
2. Account created with **PENDING** status
3. User sees "Waiting for approval" message
4. Admin reviews in Pending Approvals page
5. Admin approves or rejects with reason

---

## 📊 **User Status System**

### **Status Types:**

| Status | Description | Access Level |
|--------|-------------|--------------|
| 🟡 **PENDING** | Awaiting admin approval | ❌ No dashboard access |
| 🟢 **ACTIVE** | Approved by admin | ✅ Full access |
| 🔴 **REJECTED** | Denied by admin | ❌ Blocked permanently |

---

## 🛠️ **What Was Built**

### **1. Database Schema Updates** ✅

**Added to `users` table:**
```typescript
status: "pending" | "active" | "rejected"
registeredViaInvitation: boolean
invitationId: Id<"userInvitations">
approvedBy: Id<"users">
approvedAt: number
rejectedBy: Id<"users">
rejectedAt: number
rejectionReason: string
```

**Updated `userInvitations` table:**
- Already existed, now fully integrated
- Tracks invitation status and usage

---

### **2. Backend Functions** ✅

**File:** `convex/userApproval.ts` (NEW)

**Invitation Management:**
- ✅ `createInvitation` - Admin creates invite
- ✅ `validateInvitation` - Check if code is valid
- ✅ `getAllInvitations` - View all invitations
- ✅ `cancelInvitation` - Cancel pending invite
- ✅ `resendInvitation` - Extend expiration

**User Approval:**
- ✅ `getPendingUsers` - List users awaiting approval
- ✅ `approveUser` - Activate pending user
- ✅ `rejectUser` - Deny registration
- ✅ `getApprovalStats` - Dashboard statistics

---

### **3. Updated User Creation** ✅

**File:** `convex/users.ts`

**`ensureUserExists` function now:**
1. Checks for valid invitation (by email or code)
2. If invitation found → Status: **ACTIVE**
3. If no invitation → Status: **PENDING**
4. Uses invitation details for pre-filled data
5. Marks invitation as "accepted"
6. Sends appropriate notification

---

### **4. Access Control** ✅

**File:** `convex/roleBasedAccess.ts`

**Updated `getCurrentUser` to block:**
- ❌ PENDING users: "Your account is pending admin approval"
- ❌ REJECTED users: Shows rejection reason

**Result:** Pending/rejected users cannot access dashboard or any features.

---

### **5. Admin UI Pages** ✅

#### **A. Pending Approvals Page** 🆕
**Path:** `/admin/pending-approvals`

**Features:**
- 📋 List all pending registrations
- 👁️ View user details (name, email, phone, department, position, role)
- ✅ **Approve** button - Activates user instantly
- ❌ **Reject** button - Requires rejection reason
- 📊 Statistics: Pending, Approved, Rejected counts
- 🎫 Shows if user registered via invitation

**Who can access:** ADMIN, CAPTAIN

---

#### **B. Invitations Management Page** 🔜
**Status:** Need to create this next

**Will include:**
- Create new invitations
- View all invitations (pending/accepted/expired/cancelled)
- Cancel invitations
- Resend/extend invitations
- Copy invitation codes

---

## 🚀 **How to Use**

### **For Admins:**

#### **Create an Invitation:**
```typescript
// In Convex dashboard or via UI (once built):
await createInvitation({
  email: "juan@example.com",
  firstName: "Juan",
  lastName: "Dela Cruz",
  department: "Health Services",
  position: "Health Worker",
  phone: "+639123456789",
  userLevelId: "<WORKER_LEVEL_ID>"
});

// Returns:
{
  invitationId: "...",
  token: "INV-1234567890-abc123",
  message: "Invitation created successfully"
}
```

#### **Review Pending Users:**
1. Go to: **System Administration** → **Pending Approvals**
2. See list of all pending registrations
3. Click **Approve** to activate
4. Click **Reject** and provide reason to deny

---

### **For Users:**

#### **Register WITH Invitation Code:**
1. Go to registration page
2. Enter invitation code in special field (needs to be added to UI)
3. Complete registration
4. ✅ **Instant access!**

#### **Register WITHOUT Invitation:**
1. Go to registration page
2. Complete normal registration
3. See message: "Registration submitted, pending approval"
4. ⏳ Wait for admin to approve
5. Receive notification when approved

---

## 📱 **User Experience**

### **Pending User Experience:**

**After registration:**
```
┌─────────────────────────────────────┐
│  ⏳ Registration Pending Approval   │
├─────────────────────────────────────┤
│                                     │
│  Your registration has been         │
│  submitted successfully.            │
│                                     │
│  An administrator will review your  │
│  account and you'll be notified     │
│  once approved.                     │
│                                     │
│  This usually takes 1-2 business    │
│  days.                              │
│                                     │
└─────────────────────────────────────┘
```

**When approved:**
```
🎉 Welcome to BarangayLink!
Your account has been approved. 
You can now access all features.
```

**If rejected:**
```
❌ Registration Denied
Your registration has been denied.
Reason: [Admin's reason here]
```

---

## 🔒 **Security Features**

1. ✅ **Invitation expiration** - 7 days by default
2. ✅ **One-time use codes** - Cannot reuse invitation
3. ✅ **Email validation** - Checks for existing users
4. ✅ **Status-based access control** - Blocks pending/rejected
5. ✅ **Audit trail** - Tracks who approved/rejected and when
6. ✅ **Rejection reasons** - Documented for transparency

---

## 📋 **Still Need to Build**

### **1. Update Registration Page UI** 🔜
**File:** `src/app/registration/page.tsx`

**Add:**
- Invitation code input field
- "Have an invitation code?" section
- Validate code before registration
- Show different UI for invited vs non-invited users

---

### **2. Create Invitations Management Page** 🔜
**File:** `src/app/admin/invitations/page.tsx` (exists but needs updating)

**Features needed:**
- Create invitation form
- List all invitations with filters
- Cancel/resend actions
- Copy invitation code button
- Show invitation usage stats

---

### **3. Update Sidebar Navigation** 🔜
**File:** `src/components/layout/Sidebar.tsx`

**Add:**
- Link to "Pending Approvals" page
- Badge showing count of pending users
- Move/update Invitations link

---

### **4. Create Pending Status Page** 🔜
**File:** `src/app/pending-approval/page.tsx` (NEW)

**Show when user logs in with pending status:**
- Friendly waiting message
- Estimated approval time
- Contact information
- Logout button

---

## 🎨 **UI Components Needed**

1. **Invitation Code Input**
   - Validates code in real-time
   - Shows invitation details when valid

2. **Pending Approval Banner**
   - Shows on login for pending users
   - Prevents dashboard access

3. **Approval/Reject Modals**
   - Already built in pending-approvals page ✅

4. **Stats Cards**
   - Already built ✅

---

## 🧪 **Testing Checklist**

### **Test Invitation Flow:**
- [ ] Admin creates invitation
- [ ] Invitation code is generated
- [ ] User registers with code
- [ ] User gets instant active status
- [ ] Invitation marked as "accepted"
- [ ] User can access dashboard immediately

### **Test Pending Approval Flow:**
- [ ] User registers without code
- [ ] User status is "pending"
- [ ] User sees pending message
- [ ] User cannot access dashboard
- [ ] Admin sees user in pending list
- [ ] Admin approves user
- [ ] User gets notification
- [ ] User status becomes "active"
- [ ] User can now access dashboard

### **Test Rejection Flow:**
- [ ] Admin rejects user
- [ ] Rejection reason is required
- [ ] User gets rejection notification
- [ ] User sees rejection message
- [ ] User cannot access dashboard
- [ ] User status is "rejected"

---

## 🎯 **Next Steps**

**I'll continue building:**

1. ✅ Schema updates - **DONE**
2. ✅ Backend functions - **DONE**
3. ✅ Access control - **DONE**
4. ✅ Pending Approvals page - **DONE**
5. 🔜 **Update Registration Page** - NEXT
6. 🔜 Update/Create Invitations Page
7. 🔜 Create Pending Status Page
8. 🔜 Update Sidebar with links
9. 🔜 Testing & polish

---

## ✨ **Summary**

**You now have:**
- ✅ Dual-path registration (invitation + open)
- ✅ Admin approval system
- ✅ Status-based access control
- ✅ Pending approvals management page
- ✅ Complete backend API

**Benefits:**
- 🎯 **Full control** over who joins your barangay system
- 🔒 **Secure** - No unauthorized access
- ⚡ **Flexible** - Invitation for trusted, approval for walk-ins
- 📊 **Transparent** - Full audit trail
- 👥 **Professional** - Like enterprise systems

**Ready for production after completing the remaining UI pages!** 🚀
