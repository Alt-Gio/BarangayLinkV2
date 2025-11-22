# 🔧 Public RSVP Debug Guide

## ✅ **FIXES APPLIED**

### **1. Better Error Handling**
- Added detailed console logs at each step
- Separated error handling for attendee creation vs email sending
- Made email non-blocking (won't fail registration if email fails)

### **2. Email Generation Improvements**
- Added error handling for QR code generation
- Made barcode optional (continues without it if canvas fails)
- Better logging for debugging

### **3. Success Messages**
- Shows "already registered" message if duplicate
- Clear success message

---

## 🧪 **HOW TO TEST**

### **Step 1: Open Browser Console**
```
Press F12 (or Cmd+Option+I on Mac)
Go to "Console" tab
Keep it open while testing
```

### **Step 2: Try Public RSVP**
1. Go to landing page: `http://localhost:3000`
2. Find an event with "Open RSVP" badge
3. Click "Join Event"
4. Fill in form:
   - First Name: Test
   - Last Name: User
   - Email: your-email@example.com
5. Complete OTP verification
6. Submit

### **Step 3: Watch Console Logs**
You should see:
```
RSVP saved successfully
Attendee added: { success: true, attendeeId: "...", ticketCode: "..." }
QR code generated successfully
Barcode generated successfully (or warning if skipped)
Email sent successfully (or warning if failed)
```

### **Step 4: Check Attendees List**
1. Login as admin
2. Go to `/events/attendees`
3. Select the event
4. **You should see the person in the list!**

---

## 🐛 **COMMON ISSUES & SOLUTIONS**

### **Issue 1: "Failed to add attendee"**
**Symptoms:** Console shows error after "RSVP saved successfully"

**Solution:**
- Check Convex dashboard for errors
- Verify `eventAttendees` schema has all required fields
- Check `addAttendeeFromRSVP` mutation in convex/eventAttendees.ts

### **Issue 2: Email Fails But Attendee Not Added**
**Symptoms:** Email error appears, attendee not in list

**Solution:** 
- Email failure is now non-blocking
- Attendee should still be added
- Check console for "Attendee added" log
- If missing, there's an issue with the mutation

### **Issue 3: Attendee Added But Not Visible**
**Symptoms:** Console shows success, but not in attendees page

**Solution:**
- Refresh the attendees page
- Check if filtering is hiding them
- Verify `getEventAttendance` query includes public RSVPs
- Check `isPublicRSVP` field in database

### **Issue 4: Canvas/Barcode Error**
**Symptoms:** "Barcode generation skipped"

**Solution:**
- This is OK! QR code is enough
- Barcode requires `canvas` package (binary compilation)
- Run: `npm install canvas`
- If it fails, that's fine - system works without barcode

---

## 📊 **WHAT SHOULD HAPPEN**

### **Successful Flow:**
```
1. User submits RSVP form ✅
2. OTP verified ✅
3. rsvpToEvent called → saves to events.attendees ✅
4. addAttendeeFromRSVP called → creates eventAttendees record ✅
5. Ticket code generated (EVT-xxx-xxx) ✅
6. QR code generated ✅
7. Barcode generated (optional) ⚠️
8. Email sent with ticket ✅
9. User sees success message ✅
10. Admin sees user in /events/attendees ✅
```

---

## 🔍 **DEBUGGING CHECKLIST**

### **Check 1: Mutation Working?**
Open Convex dashboard:
1. Go to `eventAttendees` table
2. Look for recent entries with `isPublicRSVP: true`
3. Check `registrationSource: "public_rsvp"`
4. Verify `ticketCode` exists

### **Check 2: Email Sending?**
Check Resend dashboard:
1. Go to https://resend.com
2. Check "Logs" section
3. Look for recent emails
4. Check delivery status

### **Check 3: Query Working?**
In Convex dashboard:
1. Go to Functions
2. Run `attendance:getEventAttendance`
3. Pass your eventId
4. Check if public RSVP attendees appear

---

## 🛠️ **MANUAL TEST**

### **Test the Mutation Directly:**

In Convex dashboard:
1. Go to Functions
2. Find `eventAttendees:addAttendeeFromRSVP`
3. Run with:
```json
{
  "eventId": "YOUR_EVENT_ID",
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com"
}
```
4. Should return:
```json
{
  "success": true,
  "attendeeId": "...",
  "ticketCode": "EVT-xxx-xxx",
  "alreadyRegistered": false
}
```

---

## 📝 **VERIFICATION STEPS**

After RSVP, verify:

1. **Browser Console:**
   - ✅ "RSVP saved successfully"
   - ✅ "Attendee added: {...}"
   - ✅ No red errors

2. **Convex Dashboard → eventAttendees:**
   - ✅ New record exists
   - ✅ `isPublicRSVP: true`
   - ✅ `ticketCode` present
   - ✅ Email matches

3. **Admin Panel → /events/attendees:**
   - ✅ Person appears in list
   - ✅ Badge shows "Public RSVP"
   - ✅ Status is "Confirmed"

4. **Email Inbox:**
   - ✅ Email received (if Resend configured)
   - ✅ QR code visible
   - ✅ Ticket code shown

---

## 🚀 **QUICK FIX COMMANDS**

```bash
# Restart dev server
npm run dev

# Check Convex deployment
npx convex dev

# Reinstall dependencies
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📞 **STILL NOT WORKING?**

### **Check These:**
1. Is Convex running? (`npx convex dev`)
2. Is RESEND_API_KEY set in .env.local?
3. Is the event actually set to `allowPublicRSVP: true`?
4. Are you logged in as admin when checking attendees?
5. Did you refresh the attendees page?

### **Get More Info:**
Add this to page.tsx after the mutation call:
```typescript
console.log("Full result:", JSON.stringify(result, null, 2));
```

Then check the browser console for the complete output.

---

## ✨ **EXPECTED BEHAVIOR**

**When working correctly:**
- ✅ User gets success message immediately
- ✅ Console shows all steps completed
- ✅ Attendee appears in list within seconds
- ✅ Email arrives within 1-2 minutes
- ✅ QR code works for check-in

**If something fails:**
- ⚠️ Console shows specific error
- ⚠️ Alert shows error message with details
- ⚠️ Admin can still add manually if needed

---

**The system is now more robust and should show exactly where any failure occurs!** 🎯
