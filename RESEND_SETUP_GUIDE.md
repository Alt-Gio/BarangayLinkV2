# 📧 Resend Email Setup Guide - Quick Start

## 🎯 **Goal: Get Email Invitations Working in 5 Minutes**

---

## ✅ **Step 1: Create Resend Account (2 min)**

1. **Go to:** https://resend.com/signup
2. **Sign up with:**
   - Your email
   - Choose a password
   - No credit card required!

3. **Verify your email** (check inbox)

---

## 🔑 **Step 2: Get API Key (1 min)**

1. After logging in, go to **"API Keys"** in sidebar
2. Click **"Create API Key"**
3. **Name it:** `BarangayLink Development`
4. **Permissions:** Full Access (default)
5. Click **"Add"**
6. **Copy the key** (starts with `re_...`)
   - ⚠️ Copy it now! You won't see it again!

---

## 📝 **Step 3: Add to .env.local (30 seconds)**

Open your `.env.local` file and add this line:

```bash
# Resend Email API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

**Replace** `re_xxxxxxxxxxxxxxxxxxxxx` with your actual API key!

---

## 🔄 **Step 4: Restart Server (30 seconds)**

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 **Step 5: Test It! (1 min)**

### **Option A: Quick Test Page**
1. Go to: `http://localhost:3000/test-email`
2. Enter your email address
3. Click "Send Test Email"
4. Check your inbox! 📬

### **Option B: Real Invitation Test**
1. Go to: `http://localhost:3000/admin/invitations`
2. Click "Send Invitation"
3. Fill in the form
4. Click "Send"
5. Recipient gets email! 🎉

---

## ✅ **Success Checklist**

- [ ] Resend account created
- [ ] API key copied
- [ ] Added `RESEND_API_KEY` to `.env.local`
- [ ] Restarted dev server
- [ ] Visited `/test-email`
- [ ] Saw "✅ Resend API Configured"
- [ ] Sent test email
- [ ] Received email in inbox

---

## 📊 **What You Get (FREE Tier)**

| Feature | Free Tier |
|---------|-----------|
| **Emails per day** | 100 |
| **Emails per month** | 3,000 |
| **Cost** | $0 |
| **Domains** | 1 domain |
| **API Keys** | Unlimited |
| **Email logs** | 30 days |

**Perfect for development and small apps!**

---

## 🎨 **Your Invitation Email Looks Like:**

```
┌─────────────────────────────────────────┐
│         🎉 You're Invited!              │
│       Join BarangayLink V2              │
├─────────────────────────────────────────┤
│                                         │
│  Hi John Doe,                           │
│                                         │
│  Sarah Admin has invited you to join   │
│  BarangayLink V2 - a powerful project  │
│  management platform.                   │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ [Accept Invitation →]           │    │
│  └────────────────────────────────┘    │
│                                         │
│  ✨ What You'll Get:                    │
│  • Collaborative project management     │
│  • Real-time task tracking              │
│  • Team communication                   │
│  • Progress analytics                   │
│  • Gamified productivity                │
│                                         │
│  Link expires in 7 days                 │
└─────────────────────────────────────────┘
```

---

## 🚀 **Features That Work Out of the Box**

### ✅ **Invitation System:**
- Beautiful HTML emails
- Secure invitation tokens
- 7-day expiration
- Custom messages
- Resend functionality
- Status tracking

### ✅ **Email Tracking:**
- Delivery status
- Open tracking (if enabled)
- Click tracking
- Bounce handling
- Error logs

---

## 🐛 **Troubleshooting**

### **"Email not received"**
1. Check spam folder
2. Verify email address is correct
3. Check Resend dashboard logs
4. Make sure API key is correct

### **"Resend API Not Configured"**
1. Check `.env.local` has `RESEND_API_KEY`
2. No spaces around `=`
3. No quotes around the key
4. Restart dev server

### **"Invalid API Key"**
1. Regenerate key in Resend dashboard
2. Copy the new key
3. Update `.env.local`
4. Restart server

---

## 📈 **Advanced: Custom Domain (Optional)**

Want emails from `noreply@yourdomain.com` instead of `onboarding@resend.dev`?

1. Go to Resend dashboard → **Domains**
2. Click **"Add Domain"**
3. Add your domain (e.g., `barangaylink.com`)
4. Add DNS records (SPF, DKIM, DMARC)
5. Verify domain
6. Update `from:` in `convex/emails.ts`

**Benefits:**
- Professional sender address
- Better deliverability
- Custom branding
- Higher trust

---

## 🎯 **Next: Use Your Invitations!**

### **How to Send Invitations:**

1. **Go to Admin Panel:**
   ```
   http://localhost:3000/admin/invitations
   ```

2. **Click "Send Invitation"**

3. **Fill in Details:**
   - Name
   - Email
   - Department
   - Position
   - User Level
   - Custom Message (optional)

4. **Click "Send Invitation"**

5. **Email Sent Automatically!** 🎉

---

## ✅ **What's Working Now:**

| Component | Status |
|-----------|--------|
| Resend Integration | ✅ Ready |
| Email Templates | ✅ Beautiful |
| Invitation Tokens | ✅ Secure |
| Database Schema | ✅ Complete |
| Admin Interface | ✅ Working |
| Expiration System | ✅ 7 days |
| Error Handling | ✅ Robust |

---

## 🎉 **You're Done!**

**Total time:** ~5 minutes  
**Cost:** $0 (free tier)  
**Emails per month:** 3,000  
**Result:** Professional invitation system! ✨

---

**Test it now at:** `http://localhost:3000/test-email` 🚀
