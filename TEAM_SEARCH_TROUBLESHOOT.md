# 🔧 Team Member Search - Troubleshooting

## ✅ **What I Just Fixed:**

### **1. Removed Department Filter**
- **Before**: Only showed users from the same department as the project
- **After**: Shows ALL users from any department
- **Why**: Too restrictive - now you can add anyone

### **2. Improved Search Query**
- Added null checking for optional fields
- Trimmed whitespace from search terms
- Better string matching

### **3. Added Debug Query**
- `getAllActiveUsers` - Shows all active users in system
- Useful for checking if users exist

---

## 🔍 **Quick Test:**

### **Step 1: Check if you have users**
Open your browser console and check Convex dashboard:
1. Go to https://dashboard.convex.dev
2. Click on "Data" tab
3. Look at "users" table
4. **Do you see any users?** If not, that's the problem!

### **Step 2: Check user fields**
Each user should have:
- ✅ `name` - Not empty
- ✅ `email` - Valid email
- ✅ `isActive` - Set to `true`
- ✅ `userLevel` - Valid ID to userLevels table

### **Step 3: Try searching**
In the Team tab:
1. Type just "a" or "e" (single letter)
2. Any users with that letter in name/email should appear
3. If nothing shows, users might not have `isActive: true`

---

## 🐛 **Common Issues:**

### **Issue 1: No users in database**
**Solution**: Register some users first
- Go to `/register` page
- Create test accounts
- Complete profile setup

### **Issue 2: Users not active**
**Solution**: Check `isActive` field
```
In Convex Dashboard → Data → users:
- Find your users
- Check `isActive` field
- Should be: true
- If false or undefined, edit and set to true
```

### **Issue 3: Search too slow**
**Solution**: Now searches immediately with any text
- Type "admin" → Shows users with "admin" in any field
- Type "eng" → Shows engineers, etc.

### **Issue 4: Users already on team**
**Solution**: They're automatically excluded
- Search only shows users NOT on the team
- This is intentional to prevent duplicates

---

## 🎯 **What Should Happen Now:**

1. **Open Team Tab**
2. **Type anything** in search (e.g., "a", "admin", your name)
3. **Users appear immediately**
4. **If no users appear**:
   - Check you have users in database
   - Check users have `isActive: true`
   - Check browser console for errors

---

## 🔬 **Debug Steps:**

### **Check 1: Do users exist?**
```
In Convex Dashboard:
Data → users → Should see rows
```

### **Check 2: Are they active?**
```
Click on a user → Check fields:
isActive: true ✓
name: "John Doe" ✓
email: "john@example.com" ✓
```

### **Check 3: Test the query**
```
In Convex Dashboard:
Functions → searchUsers → Run with:
{
  "searchTerm": "a"
}
Should return users with "a" in their info
```

### **Check 4: Browser console**
```
Open browser DevTools (F12)
Go to Team tab
Type in search
Check Console tab for errors
Check Network tab for API calls
```

---

## ✅ **Expected Behavior:**

```
Type: "john"
Result: Shows all users with "john" in:
  - Name (John Doe)
  - Email (john@company.com)
  - Position (Johnathan Engineer)
  - Department (John's Dept)

Type: "a"
Result: Shows everyone with "a" anywhere

Type: "@"
Result: Shows all emails (all contain @)
```

---

## 🚨 **If Still Not Working:**

### **Option A: Create Test User**
1. Go to `/register`
2. Create account: test@test.com
3. Fill out profile
4. Complete registration
5. Try searching for "test"

### **Option B: Manual Database Check**
```
Convex Dashboard → Data → users

Sample user should look like:
{
  _id: "abc123",
  clerkId: "user_xyz",
  name: "John Doe",
  email: "john@example.com",
  position: "Engineer",
  department: "Engineering",
  isActive: true,  ← MUST BE TRUE
  userLevel: "id_to_userLevels",
  ...
}
```

### **Option C: Check Console Logs**
Open the Team tab with browser console open (F12) and look for:
- ✅ "Query: searchUsers" - Query is running
- ❌ Errors in red - Something broke
- 🔵 Network calls to Convex - API is being called

---

## 💡 **Quick Fixes:**

### **Fix 1: Set all users to active**
```sql
In Convex Dashboard → Data → users:
For each user, edit and set:
isActive = true
```

### **Fix 2: Try searching for YOUR email**
If you're logged in, search for your own email address.
You should appear (unless you're already on the team).

### **Fix 3: Clear and re-type**
Sometimes the query gets stuck:
1. Clear search box
2. Type something else
3. Check if new results appear

---

## 📊 **Search is Now:**
- ✅ Shows users from ALL departments
- ✅ Searches name, email, position, department
- ✅ Excludes users already on team
- ✅ Only shows active users (`isActive: true`)
- ✅ Returns up to 50 results
- ✅ Sorted alphabetically

---

**Try it now and let me know what happens!** 

**What do you see when you:**
1. Open Team tab?
2. Type "a" in the search box?
3. Check browser console for errors?
