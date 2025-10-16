# 📧 Email Invitation Setup Instructions

## 🎯 Overview

This guide will help you set up **Resend** for sending real invitation emails to users.

---

## 📋 Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" (it's FREE for 100 emails/day)
3. Verify your email address
4. Log in to your dashboard

---

## 🔑 Step 2: Get Your API Key

1. In the Resend dashboard, go to **API Keys**
2. Click "Create API Key"
3. Give it a name: `BarangayLink Production`
4. Copy the API key (starts with `re_...`)
5. **Important:** Save it somewhere safe - you can only see it once!

---

## ⚙️ Step 3: Add API Key to Environment Variables

### **For Development:**

1. Open `.env.local` in your project root
2. Add this line:
```bash
RESEND_API_KEY=re_your_actual_api_key_here
```

3. **Restart your development server** for changes to take effect

### **For Production (Vercel/Netlify):**

1. Go to your hosting dashboard
2. Navigate to Environment Variables
3. Add:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_your_actual_api_key_here`
4. Redeploy your application

---

## 📮 Step 4: Configure Sender Email (Optional but Recommended)

### **Option 1: Use Resend Test Email (Quick Start)**
- Default: `onboarding@resend.dev`
- Works immediately
- Shows "via resend.com" in recipients' inbox
- **Good for testing**

### **Option 2: Use Your Own Domain (Professional)**

1. **Add Your Domain in Resend:**
   - Go to Domains → Add Domain
   - Enter your domain (e.g., `yourdomain.com`)

2. **Add DNS Records:**
   Resend will provide DNS records to add to your domain:
   ```
   Type: TXT
   Name: @
   Value: [provided by Resend]
   
   Type: MX
   Name: @
   Value: [provided by Resend]
   ```

3. **Verify Domain:**
   - Wait 24-48 hours for DNS propagation
   - Click "Verify" in Resend dashboard
   - Once verified, you can use `noreply@yourdomain.com`

4. **Update Email Template:**
   - Open `convex/emails.ts`
   - Change line 122:
   ```typescript
   from: "BarangayLink <noreply@yourdomain.com>",
   ```

---

## ✅ Step 5: Test the Invitation System

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to the admin invitations page:**
   ```
   http://localhost:3000/admin/invitations
   ```

3. **Send a test invitation:**
   - Click "Send Invitation"
   - Fill in the form with a real email address
   - Click "Send Invitation"

4. **Check your email:**
   - Open the email inbox for the address you used
   - You should receive a beautiful invitation email
   - Click "Accept Invitation"

---

## 🔍 Troubleshooting

### **Issue: Email not sending**

**Check 1: API Key**
```bash
# Verify your .env.local file has:
RESEND_API_KEY=re_xxxxx...

# Restart your dev server after adding
```

**Check 2: Console Logs**
```bash
# Look for errors in your terminal:
Error sending email: ...
Failed to send email: ...
```

**Check 3: Resend Dashboard**
- Go to Logs in Resend dashboard
- Check if email appears there
- Look for any error messages

### **Issue: Email goes to spam**

**Solutions:**
1. Use your own verified domain (not resend.dev)
2. Add SPF, DKIM, DMARC records
3. Ask recipients to mark as "Not Spam"
4. Build sender reputation over time

### **Issue: API Key invalid**

**Solutions:**
1. Make sure you copied the full key (starts with `re_`)
2. Check for extra spaces
3. Generate a new API key
4. Restart your development server

---

## 📊 Resend Pricing

### **Free Tier:**
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ Perfect for small teams

### **Paid Tiers (if you need more):**
- **$20/month:** 50,000 emails/month
- **$80/month:** 100,000 emails/month
- **Enterprise:** Custom pricing

---

## 🎨 Email Template Customization

The email template is in `convex/emails.ts`. You can customize:

### **Colors:**
```typescript
// Change primary color from green to your brand color
style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"
// Replace #10b981 with your color
```

### **Logo:**
```typescript
// Add your logo
<img src="https://yourdomain.com/logo.png" alt="Logo" style="max-width: 150px;" />
```

### **Content:**
```typescript
// Edit the email text in htmlContent variable
<p style="...">
  Your custom message here
</p>
```

---

## 🔐 Security Best Practices

1. **Never commit API keys to Git:**
   ```bash
   # Make sure .env.local is in .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use different keys for dev/prod:**
   - Development: `re_dev_xxxxx`
   - Production: `re_prod_xxxxx`

3. **Rotate keys regularly:**
   - Generate new key every 3-6 months
   - Delete old keys in Resend dashboard

4. **Monitor usage:**
   - Check Resend dashboard regularly
   - Set up usage alerts
   - Watch for suspicious activity

---

## 📧 Email Features

### **Current Features:**
- ✅ Beautiful HTML email template
- ✅ Responsive design (mobile-friendly)
- ✅ Unique invitation tokens
- ✅ 7-day expiration
- ✅ Custom messages
- ✅ One-click acceptance

### **What the Email Includes:**
- 🎉 Welcome message
- 👤 Personalized greeting
- 💬 Custom message from inviter
- 🔗 Secure invitation link
- ⏰ Expiration notice
- ✨ Feature highlights
- 🔒 Security footer

---

## 🚀 Next Steps

Once email is working:

1. **Test thoroughly:**
   - Send to multiple email providers (Gmail, Outlook, etc.)
   - Check mobile display
   - Test expired invitations

2. **Monitor delivery:**
   - Check Resend logs
   - Track acceptance rates
   - Monitor bounce rates

3. **Optimize:**
   - A/B test email content
   - Improve acceptance rates
   - Reduce spam complaints

---

## 📝 Quick Reference

### **Environment Variables:**
```bash
# Required
RESEND_API_KEY=re_xxxxx...

# Optional (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **File Locations:**
```
convex/emails.ts          # Email sending logic
convex/adminUserManagement.ts  # Invitation creation
src/app/admin/invitations/page.tsx  # Admin UI
```

### **Useful Links:**
- [Resend Documentation](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/home)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)

---

## ✅ Checklist

Before going live:

- [ ] Resend account created
- [ ] API key generated
- [ ] Environment variables set
- [ ] Dev server restarted
- [ ] Test email sent successfully
- [ ] Email received and looks good
- [ ] Accept invitation link works
- [ ] Domain verified (if using custom domain)
- [ ] .env.local in .gitignore
- [ ] Production environment variables set

---

**🎉 You're all set! Your invitation system is now fully functional with real email delivery!**
