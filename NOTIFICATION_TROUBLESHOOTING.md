# 🔔 Notification Troubleshooting Guide

## 🐛 **Problem: Notifications Show Up Inconsistently**

If notifications work sometimes but not always, it's usually due to **Windows notification settings**, not your code.

---

## ✅ **Solution: Fix Windows Notification Settings**

### **Step 1: Enable Windows Notifications**

1. Press **Windows + I** to open Settings
2. Go to **System → Notifications**
3. Make sure the main **"Notifications"** toggle is **ON**
4. Turn **OFF** "Do not disturb" mode

### **Step 2: Allow Browser Notifications**

1. In the same Notifications settings
2. Scroll down to **"Notifications from apps and other senders"**
3. Find **Google Chrome** (or Microsoft Edge)
4. Make sure it's set to **ON**
5. Click on it and ensure all notification types are allowed

### **Step 3: Check Browser Settings**

**Chrome/Edge:**
1. Click the 🔒 lock icon in the address bar
2. Find "Notifications"
3. Make sure it's set to **"Allow"**
4. If it says "Ask" or "Block", change it to "Allow"

---

## 🧪 **How to Test if It's Fixed:**

1. Go to: `http://localhost:3000/test-notifications`
2. Click **"Run Diagnostics"** button
3. Check the output - all should be ✅
4. Click **"Send Test Notification"**
5. **Look at bottom-right corner of your Windows screen** (not the browser!)
6. Notification should appear within 1-2 seconds

---

## 📱 **Why Aren't Real App Notifications Working?**

You mentioned you didn't see notifications outside the test page. Here's why:

### **Test Page Notifications** ✅
- Work immediately
- Just JavaScript `new Notification()`
- Show up when you click test buttons

### **Real App Notifications** ⏳
- Only triggered by actual app events
- Need to be logged in
- Need real actions to happen

---

## 🎯 **How to Trigger Real Notifications:**

### **1. Task Assignment Notification**
**Trigger:** When someone assigns you a task

**How to test:**
1. Sign in to the app
2. Have another user assign you a task
3. OR assign yourself a task from another browser/account
4. Notification should appear immediately

### **2. New Message Notification**
**Trigger:** When someone sends you a message

**How to test:**
1. Sign in to the app
2. Go to Messages
3. Have another user send you a message
4. OR send yourself a message from another account
5. Notification should appear

### **3. Event Reminder Notification**
**Trigger:** 24h, 1h, or 15min before event

**How to test:**
1. Create an event that starts in 2 hours
2. Call the scheduler function
3. Wait for the 1-hour reminder
4. Notification will appear automatically

### **4. Deadline Notification**
**Trigger:** When task deadline approaches

**How to test:**
1. Create a task with deadline in 2 hours
2. Schedule deadline reminders
3. Wait for the 1-hour reminder
4. Notification will appear

---

## 🔍 **Common Issues & Fixes:**

### **Issue: "Notifications work on test page but not in app"**
**Cause:** You need to be logged in and perform real actions

**Fix:**
1. Make sure you're signed in with Clerk
2. Actually assign a task or send a message
3. Real notifications only trigger on real events

---

### **Issue: "Sometimes notifications appear, sometimes they don't"**
**Cause:** Windows "Do Not Disturb" or Focus Assist is on

**Fix:**
1. Click the notification icon in Windows taskbar (bottom-right)
2. Turn OFF "Focus assist" or "Do not disturb"
3. Try again

---

### **Issue: "Notifications appear but disappear too quickly"**
**Cause:** Windows notification display time is too short

**Fix:**
1. Windows Settings → Ease of Access → Display
2. Increase "Show notifications for" time
3. Or use `requireInteraction: true` in notification config

---

### **Issue: "Test notifications work, but real app doesn't send any"**
**Cause:** Backend mutations aren't being called

**Check:**
1. Open browser console (F12)
2. Look for Convex mutation logs
3. Make sure mutations are actually running
4. Check if you're authenticated (logged in)

---

## 🎯 **Quick Diagnostic Checklist:**

Run this checklist to identify the problem:

- [ ] **Browser supports notifications** (`'Notification' in window`)
- [ ] **Permission granted** (`Notification.permission === 'granted'`)
- [ ] **Windows notifications ON** (Settings → System → Notifications)
- [ ] **Do Not Disturb OFF** (Windows notification center)
- [ ] **Chrome/Edge allowed** (Windows notification settings)
- [ ] **Browser permission allowed** (Lock icon → Notifications)
- [ ] **Logged in to app** (Clerk authentication)
- [ ] **Service worker registered** (Check DevTools → Application → Service Workers)

---

## 💡 **Pro Tips:**

### **Make Notifications More Visible:**
```typescript
// In your notification config, add:
{
  requireInteraction: true,  // Stays until dismissed
  tag: 'unique-id',          // Updates instead of stacking
  silent: false,             // Plays sound
  vibrate: [200, 100, 200],  // Vibration pattern (mobile)
}
```

### **Test Without Real Users:**
```typescript
// In your Convex functions, manually trigger notifications:
await ctx.runMutation(api.pushNotifications.sendPushNotification, {
  userId: yourUserId,
  title: "Test Notification",
  body: "This is a test",
  url: "/dashboard",
});
```

### **Debug Notification Delivery:**
```typescript
// Add this to see notification creation:
const notification = new Notification('Test', {...});
notification.onshow = () => console.log('✅ Notification shown!');
notification.onerror = (e) => console.error('❌ Notification error:', e);
notification.onclick = () => console.log('👆 Notification clicked!');
```

---

## 🆘 **Still Not Working?**

If you've tried everything above and notifications still don't work:

1. **Test in Incognito Mode** - Rules out extension conflicts
2. **Test in Different Browser** - Edge, Firefox, Chrome
3. **Check Windows Event Viewer** - Look for notification errors
4. **Restart Browser** - Sometimes needed after permission changes
5. **Restart Computer** - Nuclear option but sometimes works

---

## ✅ **Expected Behavior:**

**Test Page:**
- Click button → Notification appears in 0-2 seconds
- Shows in Windows notification center (bottom-right)
- Can be clicked to focus browser window

**Real App:**
- Task assigned → Notification appears immediately
- Message received → Notification appears immediately
- Event reminder → Notification appears at scheduled time
- All show in Windows notification center

---

## 🎉 **Success Criteria:**

You'll know it's working when:

1. ✅ Test notifications appear **every time** you click
2. ✅ Notifications show in bottom-right corner of Windows
3. ✅ They stay visible for a few seconds
4. ✅ You can click them to open the app
5. ✅ Real app actions (task assign, message) trigger notifications

---

**Most Common Fix: Just enable Windows notifications and turn off Do Not Disturb!** 🎯
