# ⚡ Quick Email Fix - Enable Real Email Sending

## 🎯 **Problem**
Your emails are logging to console but not actually sending.

## ✅ **Solution**
Follow these 3 quick steps:

---

## **Step 1: Install Resend** (30 seconds)

```bash
npm install resend
```

---

## **Step 2: Get Free API Key** (2 minutes)

1. Go to [resend.com](https://resend.com)
2. Sign up (free, no credit card)
3. Create API key
4. Copy it (starts with `re_`)

---

## **Step 3: Add API Key** (30 seconds)

Create `.env.local` in project root:

```bash
RESEND_API_KEY=re_your_key_here
```

---

## **Step 4: Update Code** (2 minutes)

Replace the email sending section in `convex/notificationSystem.ts`:

**Find this (around line 53-76):**
```typescript
      // In a real implementation, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Resend
      // - Nodemailer
      
      // For now, we'll simulate the email send
      console.log(`📧 Email would be sent to: ${user.email}`);
      console.log(`Subject: ${args.subject}`);
      console.log(`Message: ${args.message}`);
      
      // TODO: Integrate with actual email service
```

**Replace with:**
```typescript
      // Send real email with Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      try {
        const { data, error } = await resend.emails.send({
          from: 'onboarding@resend.dev', // Resend test domain (change later)
          to: [user.email],
          subject: args.subject,
          html: args.message,
        });

        if (error) {
          console.error('❌ Email error:', error);
          return {
            success: false,
            message: `Failed to send email: ${error.message}`,
          };
        }

        console.log('✅ Email sent successfully:', data);
      } catch (emailError: any) {
        console.error('❌ Email send failed:', emailError);
        return {
          success: false,
          message: `Email error: ${emailError.message}`,
        };
      }
```

---

## **Step 5: Restart & Test** (1 minute)

1. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test it:**
   - Go to Admin Settings → Notifications
   - Click "Test Email"
   - Check your inbox!

---

## ✅ **You're Done!**

Emails will now actually send to user inboxes! 🎉

---

## 🔍 **Verify It Works**

**Console should show:**
```
✅ Email sent successfully: { id: 're_abc123...' }
```

**NOT:**
```
📧 Email would be sent to: ...  (old logging)
```

---

## 🚀 **Next Steps** (Optional)

For production, you should:

1. **Add custom domain** in Resend dashboard
2. **Change from:** line to your domain:
   ```typescript
   from: 'BarangayLink <notifications@yourdomain.com>',
   ```

3. **Add to production** `.env`:
   ```bash
   RESEND_API_KEY=re_your_production_key
   ```

---

## ❓ **Troubleshooting**

**If emails still don't send:**

1. Check `.env.local` has API key
2. Restart server after adding env var
3. Check Convex logs for errors
4. Verify API key in Resend dashboard

**If you see errors:**

```
Error: Missing API key
```
→ Add RESEND_API_KEY to `.env.local` and restart

```
Error: Invalid API key
```
→ Regenerate key in Resend dashboard

---

**That's it! Your notification system is now fully functional!** 📧✨
