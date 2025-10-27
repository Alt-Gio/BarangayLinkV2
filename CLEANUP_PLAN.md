# 🗑️ CLEANUP PLAN - Remove Redundant Code

**Status:** ⚠️ AWAITING YOUR APPROVAL  
**Date:** October 26, 2025

---

## 📋 **What I Created:**

✅ **NEW:** `/milestones/[id]/kanban` - Dedicated Kanban board for each milestone  
✅ **UPDATED:** Milestone detail page now has "Open Kanban Board" button

---

## 🗑️ **What I Recommend Removing:**

### **1. Old Sprint Kanban (NOT USED ANYMORE)**
**File:** `src/app/events/sprints/kanban-full/page.tsx`

**Reason:**
- This was the OLD sprint kanban that worked with events/sprints
- We now use milestones instead of sprints
- No longer functional with our new milestone system
- Taking up space and causing confusion

**Action:** ✅ DELETE THIS FILE

---

### **2. Old Sprint Modal Code (ALREADY HIDDEN)**
**File:** `src/app/events/sprints/page.tsx` (lines ~442-660)

**Reason:**
- Old sprint creation modal (not milestone modal)
- Currently hidden with `{false && showCreateModal && ...}`
- Just dead code now that we have CreateMilestoneModal
- Taking up ~220 lines

**Action:** ✅ DELETE THESE LINES

---

### **3. Generic Milestone Kanban Selector**
**File:** `src/app/milestones/kanban/page.tsx`

**Current Function:**
- Shows a selector to choose which milestone
- Then displays kanban board for that milestone

**Problem:**
- Now we have dedicated kanban for each milestone at `/milestones/[id]/kanban`
- This selector page is redundant
- Users should go directly to specific milestone kanban

**Options:**
1. ✅ **KEEP IT** - As a quick access page to select milestones
2. ❌ **REMOVE IT** - Force users to go through milestone detail page first

**My Recommendation:** **KEEP IT** but update the "Kanban Board" button on Sprint Board to go to milestone selector, then they can choose which milestone to work on.

---

### **4. Unused Sprint Form State**
**File:** `src/app/events/sprints/page.tsx`

**Lines ~35-43:**
```typescript
const [sprintForm, setSprintForm] = useState({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  capacity: 40,
  goals: '',
  projectId: '',
});
```

**Reason:**
- State for old sprint creation
- Not used anymore (CreateMilestoneModal has its own state)

**Action:** ✅ DELETE THIS STATE

---

### **5. Old Sprint Creation Handler**
**File:** `src/app/events/sprints/page.tsx`

**Lines ~58-91:**
```typescript
const handleCreateSprint = async () => {
  // ... old sprint creation logic
};
```

**Reason:**
- Handler for old sprint modal
- CreateMilestoneModal has its own handler
- Not called anywhere

**Action:** ✅ DELETE THIS FUNCTION

---

### **6. Unused Event Mutation**
**File:** `src/app/events/sprints/page.tsx`

**Line ~56:**
```typescript
const createEvent = useMutation(api.events.createEvent);
```

**Reason:**
- Used by old sprint creation
- Not needed anymore

**Action:** ✅ DELETE THIS LINE

---

## ✅ **What to KEEP:**

### **DO NOT REMOVE:**
1. ✅ `/events/sprints/page.tsx` - **Sprint Board (milestone list view)**
2. ✅ `/milestones/[id]/page.tsx` - **Milestone detail page**
3. ✅ `/milestones/[id]/kanban/page.tsx` - **NEW dedicated kanban**
4. ✅ `/milestones/kanban/page.tsx` - **Selector page (optional)**
5. ✅ `CreateMilestoneModal` component

---

## 📊 **Summary Table:**

| File/Code | Action | Reason |
|-----------|--------|--------|
| `/events/sprints/kanban-full/page.tsx` | 🗑️ DELETE | Old sprint kanban, not used |
| Old sprint modal (lines 442-660) | 🗑️ DELETE | Hidden dead code |
| `sprintForm` state | 🗑️ DELETE | Unused state |
| `handleCreateSprint` function | 🗑️ DELETE | Unused handler |
| `createEvent` mutation | 🗑️ DELETE | Unused mutation |
| `/milestones/kanban/page.tsx` | ⚠️ ASK USER | Selector page - keep or remove? |

---

## 🎯 **Your Decision Required:**

### **Question 1: Remove Sprint Kanban Full?**
- **File:** `src/app/events/sprints/kanban-full/page.tsx`
- **My Recommendation:** ✅ **YES, DELETE IT**
- **Your Answer:** ?

### **Question 2: Remove Old Sprint Modal Code?**
- **Lines:** 442-660 in `src/app/events/sprints/page.tsx`
- **My Recommendation:** ✅ **YES, DELETE IT**
- **Your Answer:** ?

### **Question 3: Keep or Remove Milestone Selector Page?**
- **File:** `src/app/milestones/kanban/page.tsx`
- **Option A:** Keep it (quick access to select milestones)
- **Option B:** Remove it (go through detail page first)
- **My Recommendation:** **KEEP IT** for convenience
- **Your Answer:** ?

---

## 🚀 **After Cleanup:**

Your codebase will have:

```
Clean Structure:
├── /events/sprints (Sprint Board - milestone overview)
├── /milestones/[id] (Milestone detail page)
├── /milestones/[id]/kanban (Dedicated kanban for THIS milestone) ⭐ NEW
└── /milestones/kanban (Quick selector - optional)

Components:
├── CreateMilestoneModal ✅
└── Old sprint code ❌ REMOVED
```

---

## ⚡ **Benefits After Cleanup:**

1. ✅ No confusion between old sprint vs new milestone system
2. ✅ Cleaner codebase (~300+ lines removed)
3. ✅ Each milestone has its own dedicated kanban
4. ✅ Clear navigation path
5. ✅ No dead code

---

## 🔧 **Please Confirm:**

Reply with:
- ✅ "Yes, remove all recommended items"
- ⚠️ "Keep [specific item]"
- ❓ "I have questions about [item]"

I'll proceed with the cleanup once you confirm!
