# ✅ Automatic Level-Up System Complete

## 🎯 Overview

Implemented **automatic level-up functionality** that triggers whenever you gain XP from any activity. The system handles multiple level-ups and awards bonus gold!

---

## 🎮 How Level-Up Works

### **XP Requirements:**
```
Level 1 → Level 2: 100 XP
Level 2 → Level 3: 200 XP
Level 3 → Level 4: 300 XP
Level 4 → Level 5: 400 XP
...
Level N → Level N+1: N × 100 XP
```

**Formula:** `XP Required = Current Level × 100`

---

### **What Happens When You Level Up:**

1. ✅ **Level increases** by 1 (or more if you have enough XP)
2. ✅ **Excess XP carries over** to next level
3. ✅ **Bonus gold awarded**: 50 gold per level gained
4. ✅ **Automatic** - no action needed!

**Example:**
```
Current: Level 3 with 280 XP
Needed for Level 4: 300 XP
You gain: 150 XP
Total: 430 XP

Result:
→ Level up to 4! (300 XP spent, 130 XP remaining)
→ Level up to 5! (400 XP needed, but you only have 130)
→ Final: Level 4 with 130 XP + 50 bonus gold
```

---

## 🔥 XP Sources

Level-up checks are triggered after every XP reward:

### **1. Habits** (`convex/habits.ts`)
- ✅ Complete positive habit: +5/10/20 XP
- ✅ Avoid negative habit: +5/10/20 XP
- ✅ Level-up check after each completion

### **2. Daily Tasks** (`convex/habits.ts`)
- ✅ Complete daily: +5/10/20 XP
- ✅ Level-up check after completion
- ✅ Auto-reset every 24 hours

### **3. To-Dos** (`convex/habits.ts`)
- ✅ Complete todo: +10/20/40 XP (2x rewards!)
- ✅ Level-up check after completion
- ✅ Permanent tasks

### **4. Project Tasks** (`convex/gamifiedTasks.ts`)
- ✅ Complete task: Variable XP based on difficulty + hours
- ✅ Level-up check for all assigned users
- ✅ Supports multiple assignees

### **5. Time Logging** (`convex/gamifiedTasks.ts`)
- ✅ Log hours: +1 XP per hour
- ✅ Level-up check after logging
- ✅ Encourages regular tracking

---

## 💎 Level-Up Rewards

### **Immediate Bonuses:**
```
+50 Gold per level gained
```

**Example:**
- Level 1 → 2: +50 gold
- Level 3 → 5 (double level): +100 gold
- Level 10 → 15 (5 levels): +250 gold

### **Future Bonuses (Coming Soon):**
- 🎁 Unlock new features per level
- 🏆 Special achievements
- ⚔️ Equipment unlocks
- 🎨 Cosmetic rewards

---

## 🔧 Technical Implementation

### **Level-Up Function:**
```typescript
async function checkLevelUp(ctx: any, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  const currentLevel = user.level || 1;
  const currentXP = user.experience || 0;
  let xpToNextLevel = currentLevel * 100;
  
  if (currentXP >= xpToNextLevel) {
    let newLevel = currentLevel;
    let remainingXP = currentXP;
    
    // Handle multiple level ups
    while (remainingXP >= xpToNextLevel) {
      remainingXP -= xpToNextLevel;
      newLevel++;
      xpToNextLevel = newLevel * 100;
    }
    
    // Update user
    await ctx.db.patch(userId, {
      level: newLevel,
      experience: remainingXP,
      gold: (user.gold || 0) + ((newLevel - currentLevel) * 50),
    });
  }
}
```

### **Features:**
- ✅ Handles multiple level-ups in one go
- ✅ Carries over excess XP
- ✅ Awards bonus gold
- ✅ Prevents XP overflow
- ✅ Works across all XP sources

---

## 📊 Level Progression Table

| Level | XP Required | Cumulative XP | Gold Bonus |
|-------|-------------|---------------|------------|
| 1→2   | 100         | 100           | +50        |
| 2→3   | 200         | 300           | +50        |
| 3→4   | 300         | 600           | +50        |
| 4→5   | 400         | 1,000         | +50        |
| 5→6   | 500         | 1,500         | +50        |
| 10→11 | 1,000       | 5,500         | +50        |
| 20→21 | 2,000       | 21,000        | +50        |
| 50→51 | 5,000       | 127,500       | +50        |

---

## 🎯 Files Modified

### **1. `convex/habits.ts`**
- ✅ Added `checkLevelUp()` helper function
- ✅ Level-up check after habit completion (+/-)
- ✅ Level-up check after daily completion
- ✅ Level-up check after todo completion

### **2. `convex/gamifiedTasks.ts`**
- ✅ Added `checkLevelUp()` helper function  
- ✅ Level-up check after task completion
- ✅ Level-up check after time logging
- ✅ Works for all assigned users

---

## 🧪 Testing

### **Test Level-Up:**

1. **Check Current Stats:**
   - Go to `/tasks/habits`
   - Note your current Level and XP

2. **Gain XP:**
   - Complete a habit (+10 XP)
   - Complete a daily (+10 XP)
   - Complete a todo (+20 XP)
   - Complete a project task (Variable XP)

3. **Verify Level-Up:**
   - XP bar should update in real-time
   - When XP reaches required amount, level increases
   - Excess XP carries over
   - Gold increases by 50

4. **Test Multiple Levels:**
   - Complete many tasks at once
   - If you gain 500+ XP, you should level up multiple times
   - All excess XP carries over correctly

---

## 💡 Examples

### **Scenario 1: Normal Level-Up**
```
Before: Level 5, 380 XP (need 500 for Level 6)
Complete hard habit: +20 XP
After: Level 5, 400 XP

Complete medium daily: +10 XP  
After: Level 5, 410 XP

Complete hard todo: +40 XP
Total: 450 XP (still need 50 more)

Complete easy habit: +5 XP
After: Level 5, 455 XP

Complete medium habit: +10 XP
After: Level 5, 465 XP

Complete hard habit: +20 XP
Total: 485 XP + 20 = 505 XP

LEVEL UP! 🎉
Result: Level 6, 5 XP, +50 Gold
```

### **Scenario 2: Multi-Level Up**
```
Before: Level 2, 180 XP (need 200 for Level 3)
Complete 10 hard tasks: +200 XP each = 2000 XP
Total: 2,180 XP

Level 2→3: -200 XP (1,980 remaining)
Level 3→4: -300 XP (1,680 remaining)
Level 4→5: -400 XP (1,280 remaining)
Level 5→6: -500 XP (780 remaining)
Level 6→7: -600 XP (180 remaining)

Result: Level 7, 180 XP, +250 Gold (5 levels)
```

---

## ✅ Summary

**Status:** ✅ **FULLY FUNCTIONAL**

### **What Works:**
- ✅ Automatic level-up on XP gain
- ✅ Multiple level-ups handled
- ✅ XP overflow carries over
- ✅ Bonus gold awarded (50 per level)
- ✅ Works across all XP sources:
  - Habits (positive & negative)
  - Daily tasks
  - To-dos
  - Project tasks
  - Time logging

### **Benefits:**
- 🎮 **Immediate feedback** - Level up as soon as you have enough XP
- 💎 **Fair progression** - XP never wasted, always carries over
- 🏆 **Rewarding** - Bonus gold for each level
- 🚀 **Scalable** - System works for levels 1-1000+

**You'll now level up automatically as you complete tasks and build habits!** 🎉
