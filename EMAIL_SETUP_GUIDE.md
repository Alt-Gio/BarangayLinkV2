# 📧 Email Setup Guide - Make Notifications Work!

**Current Status:** Emails are only logging to console (not actually sending)  
**Goal:** Enable real email delivery using Resend (free tier available)

---

## 🚀 Quick Setup with Resend (Recommended)

### **Why Resend?**
- ✅ Free tier: 3,000 emails/month
- ✅ Simple API
- ✅ No credit card required for free tier
- ✅ Great for development and production
- ✅ Official Next.js partner

---

## 📋 **Step-by-Step Setup**

### **Step 1: Sign Up for Resend**

1. Go to [https://resend.com](https://resend.com)
2. Click "Start Building"
3. Sign up with GitHub or email
4. Verify your email

### **Step 2: Get Your API Key**

1. Go to "API Keys" in dashboard
2. Click "Create API Key"
3. Name it: "BarangayLink Production"
4. Copy the API key (starts with `re_`)
5. **IMPORTANT:** Save it now - you won't see it again!

### **Step 3: Add API Key to Environment**

Create or update `.env.local` in your project root:

\`\`\`bash
# Add this line
RESEND_API_KEY=re_your_actual_api_key_here
\`\`\`

### **Step 4: Install Resend SDK**

Run in your terminal:

\`\`\`bash
npm install resend
\`\`\`

### **Step 5: Update Email Sending Code**

Update `convex/notificationSystem.ts`:

\`\`\`typescript
// At the top of the file, add:
import { Resend } from 'resend';

// In the sendEmailNotification function, replace the TODO section with:
export const sendEmailNotification = action({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    message: v.string(),
    notificationType: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      // Get user details
      const user = await ctx.runQuery(api.adminUserManagement.getUserById, { userId: args.userId });
      
      if (!user || !user.email) {
        return {
          success: false,
          message: "User or email not found",
        };
      }

      // Initialize Resend
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Send the actual email
      const { data, error } = await resend.emails.send({
        from: 'BarangayLink <notifications@yourdomain.com>', // Update with your domain
        to: [user.email],
        subject: args.subject,
        html: args.message,
      });

      if (error) {
        console.error('Email send error:', error);
        return {
          success: false,
          message: \`Failed to send email: \${error.message}\`,
        };
      }

      console.log('✅ Email sent successfully:', data);
      
      return {
        success: true,
        message: "Email notification sent successfully",
      };
    } catch (error: any) {
      console.error('Email error:', error);
      return {
        success: false,
        message: \`Failed to send email: \${error.message}\`,
      };
    }
  },
});
\`\`\`

---

## 🎯 **Quick Start (For Testing)**

If you want to test immediately without domain setup:

### **Option 1: Use Resend's Test Domain**

\`\`\`typescript
from: 'onboarding@resend.dev',  // Resend's test domain
to: [user.email],
\`\`\`

⚠️ **Note:** Test domain emails may go to spam. Only for development!

### **Option 2: Verify Your Domain** (Recommended for Production)

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `barangaylink.com`)
4. Add DNS records shown by Resend
5. Wait for verification (usually 1-5 minutes)
6. Use: `notifications@yourdomain.com`

---

## 🧪 **Testing Your Email Setup**

### **Test 1: Send Test Email from Admin**

1. Navigate to Admin Settings → Notifications
2. Click "Test Email" button
3. Check your email inbox
4. Look for subject: "🧪 Test Email - BarangayLink"

### **Test 2: Check Logs**

In Convex dashboard, check logs for:
\`\`\`
✅ Email sent successfully: { id: 're_...' }
\`\`\`

### **Test 3: Resend Dashboard**

1. Go to Resend dashboard
2. Click "Logs"
3. See your sent emails
4. Check delivery status

---

## 🔧 **Alternative Email Services**

### **SendGrid**

\`\`\`typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: user.email,
  from: 'notifications@yourdomain.com',
  subject: args.subject,
  html: args.message,
});
\`\`\`

### **AWS SES**

\`\`\`typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const client = new SESClient({ region: "us-east-1" });

await client.send(new SendEmailCommand({
  Source: 'notifications@yourdomain.com',
  Destination: { ToAddresses: [user.email] },
  Message: {
    Subject: { Data: args.subject },
    Body: { Html: { Data: args.message } }
  }
}));
\`\`\`

### **Nodemailer (SMTP)**

\`\`\`typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

await transporter.sendMail({
  from: 'notifications@yourdomain.com',
  to: user.email,
  subject: args.subject,
  html: args.message,
});
\`\`\`

---

## ❓ **Troubleshooting**

### **"Email not sending"**

1. Check API key is set in `.env.local`
2. Restart your dev server after adding env variables
3. Check Convex logs for errors
4. Verify Resend dashboard shows the attempt

### **"Emails going to spam"**

1. Use a verified domain (not test domain)
2. Add SPF/DKIM records from Resend
3. Warm up your domain (send gradually)
4. Avoid spam trigger words

### **"User email not found"**

1. Check user has email in database
2. Verify getUserById query works
3. Check user authentication

### **"API key invalid"**

1. Regenerate API key in Resend
2. Update `.env.local`
3. Restart server
4. Redeploy if in production

---

## 📊 **Email Delivery Best Practices**

### **For Development:**
\`\`\`typescript
from: 'dev@resend.dev',  // Test domain
to: 'your-test-email@gmail.com',
\`\`\`

### **For Production:**
\`\`\`typescript
from: 'BarangayLink <notifications@barangaylink.com>',
to: user.email,
replyTo: 'support@barangaylink.com',
\`\`\`

### **Rate Limiting:**
- Free tier: 100 emails/day
- Pro tier: 50,000/month
- Plan accordingly for your user base

---

## ✅ **Checklist**

- [ ] Sign up for Resend
- [ ] Get API key
- [ ] Add to `.env.local`
- [ ] Install Resend SDK (`npm install resend`)
- [ ] Update `sendEmailNotification` function
- [ ] Restart dev server
- [ ] Test with "Test Email" button
- [ ] Check email inbox
- [ ] Verify in Resend dashboard
- [ ] (Optional) Set up custom domain

---

## 🎉 **You're Done!**

After setup, emails will:
- ✅ Send to real user inboxes
- ✅ Include beautiful HTML formatting
- ✅ Track delivery status
- ✅ Show in Resend dashboard
- ✅ Work for all notification types

---

## 📧 **Example Working Email**

When a user clicks "Test Email", they'll receive:

**Subject:** 🧪 Test Email - BarangayLink Notification System

**Body:**
```
✅ Email System Test Successful!

Hello Marc Go,

This is a test email from the BarangayLink notification system.

Test Details:
📧 Recipient: act.alcateiat.it@gmail.com
👤 Name: Marc Go
⏰ Time: 10/26/2025, 3:27:56 PM
🔔 System: Notification System

If you received this email, your notification system is working correctly!

💡 What this means:
Users will successfully receive email notifications for:
• Overdue projects
• Project due soon reminders
• Project completion alerts
• Task assignments
```

---

**Ready to send real emails!** 📧✨
