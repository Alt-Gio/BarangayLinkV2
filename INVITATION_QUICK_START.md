# 🚀 Invitation System - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### **Step 1: Add to .env.local**

```env
# Resend Email Service (REQUIRED)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=BarangayLink <noreply@yourdomain.com>

# App URL (REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get your Resend API key:**
1. Go to https://resend.com
2. Sign up/Login
3. Go to **API Keys** → Copy your key
4. Go to **Domains** → Verify your domain
5. Use format: `Name <email@yourdomain.com>`

---

### **Step 2: Deploy Backend**

```bash
# Terminal 1: Start Convex (keep running)
npx convex dev
```

Wait for:
- ✓ `invitations` deployed
- ✓ `emails` deployed
- ✓ `adminUserManagement` deployed

---

### **Step 3: Start App**

```bash
# Terminal 2: Start Next.js
npm run dev
```

Open: http://localhost:3000

---

### **Step 4: Send Your First Invitation**

1. **Login as Admin**
2. Go to **Admin Panel** → **Manage Users**
3. Click **"Send Invitation"** button
4. Fill in the form:
   - ✅ Email: `user@example.com`
   - ✅ First Name: `John`
   - ✅ Last Name: `Doe`
   - ✅ Department: Select from dropdown
   - ✅ Position: `Developer`
   - ✅ User Level: Select level
   - ☑️ Assign Initial Tasks (recommended)
   - ☑️ Send Welcome Message (recommended)
   - 📝 Custom Message (optional)
5. Click **"Send Invitation"**
6. See success notification! ✅

---

### **Step 5: Accept Invitation**

1. Check email inbox (invited user)
2. Click **"Accept Invitation"** button in email
3. See invitation details page
4. Create account using the **same email address**
5. Automatically redirected to dashboard
6. Done! 🎉

---

## 🧪 Quick Test

**Test with your own email:**

```bash
# 1. Send invitation to yourself
Email: your-email@gmail.com

# 2. Check your inbox
# 3. Click invitation link
# 4. Create account
# 5. Check dashboard for onboarding tasks
```

---

## ✅ Verify It's Working

**Check these:**
- [ ] Email received? (Check spam if not)
- [ ] Invitation link opens correctly?
- [ ] Invitation details show correctly?
- [ ] Account created after signup?
- [ ] Redirected to dashboard?
- [ ] Onboarding tasks visible?
- [ ] Welcome notification visible?

---

## 🚨 Common Issues

### **Email Not Sending**
```bash
# Check Convex logs:
npx convex dev

# Look for:
# ✓ Email sent successfully
# OR
# ✗ Resend API error: [error message]
```

**Solutions:**
- Verify `RESEND_API_KEY` is correct
- Verify domain in Resend dashboard
- Check `RESEND_FROM_EMAIL` format

### **Invitation Link Not Working**
```bash
# Check .env.local has:
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **"Email does not match" Error**
- User must signup with **exact same email** as invitation
- Case-sensitive!

---

## 📧 Email Template Preview

Your invited users will receive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 You're Invited!
Join BarangayLink V2
━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi John Doe,

Admin User has invited you to 
join BarangayLink V2.

[Your Custom Message Here]

🚀 Get Started
Click below to accept and create 
your account.

[Accept Invitation →]

✨ What You'll Get
• Project management tools
• Real-time task tracking
• Team communication
• Progress analytics
• Gamified system

Valid for 7 days.
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Next Steps

Once you've sent your first invitation:

1. **View all invitations:** Admin Panel → Invitations
2. **Resend if needed:** Click "Resend" button
3. **Cancel if wrong:** Click "Cancel" button
4. **Track acceptances:** See status updates

---

## 📚 Full Documentation

For detailed information, see:
- `INVITATION_SYSTEM_COMPLETE.md` - Complete guide
- `convex/invitations.ts` - Backend code
- `src/app/accept-invitation/[token]/page.tsx` - Frontend code

---

**Ready to invite your team! 🚀**

**Questions?** Check the troubleshooting section in `INVITATION_SYSTEM_COMPLETE.md`
