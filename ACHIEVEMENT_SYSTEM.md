# 🏆 Enhanced Achievement System

## Overview

Based on the timer implementation from `events/[eventId]/control`, I've created a comprehensive achievement system that tracks duration and awards badges automatically.

---

## 🎯 How It Works

### **Similar to Event Timer System:**
```
Event Timer Flow:
1. User starts task → Timer begins (startTime saved)
2. User works → Duration calculated every second
3. User stops → Duration logged (endTime - startTime)

Achievement Flow:
1. User starts activity → Activity startTime saved
2. User works → Current activity tracked
3. User switches/stops → Duration calculated & achievements checked
```

---

## 📊 Achievement Categories

### **1. ⭐ LEVEL-BASED** (User Progress)
Awarded based on user level in the system.

| Level | Badge | Icon | Points | Description |
|-------|-------|------|--------|-------------|
| Level 2+ | "Level X" | ⭐ | Level × 50 | Dynamic based on level |

**Example:**
- Level 2 → "Level 2" ⭐ (100 points)
- Level 5 → "Level 5" ⭐ (250 points)

---

### **2. 💎 EXPERIENCE-BASED** (XP Milestones)

| XP Threshold | Badge | Icon | Points |
|--------------|-------|------|--------|
| 100 XP | "100 XP Earned" | 🏆 | 100 |
| 500 XP | "500 XP Master" | 💎 | 250 |

---

### **3. ⏰ TIME-BASED** (Duration Tracking)
Auto-tracked when user works on tasks/projects.

| Total Time | Badge | Icon | Points | Requirement |
|------------|-------|------|--------|-------------|
| 1 Hour | "First Hour" | ⏰ | 100 | 60 minutes total |
| 5 Hours | "5 Hour Champion" | 🏅 | 300 | 300 minutes total |
| 10 Hours | "10 Hours Master" | 💎 | 500 | 600 minutes total |

**How Duration is Tracked:**
```typescript
// When user switches activity or stops working:
const duration = Math.floor((now - startTime) / 1000 / 60); // minutes

// Stats updated in user metadata:
{
  totalMinutes: 327,    // All time
  taskMinutes: 200,     // Task-specific
  projectMinutes: 127,  // Project-specific
}
```

---

### **4. 🎯 SESSION-BASED** (Consistency)

| Sessions Count | Badge | Icon | Points |
|----------------|-------|------|--------|
| 10 Sessions | "10 Sessions" | 🎯 | 100 |
| 50 Sessions | "50 Sessions!" | 🎖️ | 300 |

**Session Definition:** Each time user starts working on something new.

---

### **5. 🏃 FOCUS ACHIEVEMENTS** (Longest Session)

| Longest Session | Badge | Icon | Points |
|-----------------|-------|------|--------|
| 2 Hours | "2 Hour Marathon" | 🏃 | 200 |
| 3 Hours | "3 Hour Marathon!" | 🏃‍♂️ | 400 |

**Tracks:** The longest continuous work session.

---

### **6. 🔥 STREAK ACHIEVEMENTS** (Daily Consistency)

| Streak Length | Badge | Icon | Points |
|---------------|-------|------|--------|
| 3 Days | "3 Day Streak" | 🔥 | 150 |
| 7 Days | "7 Day Streak!" | 🔥 | 350 |

**Note:** Requires daily activity tracking (can be implemented separately).

---

### **7. 📋 SPECIALTY ACHIEVEMENTS** (Activity Type)

| Specialty | Badge | Icon | Points | Requirement |
|-----------|-------|------|--------|-------------|
| Task Focus | "Task Master" | 📋 | 250 | 300+ min on tasks |
| Project Focus | "Project Pro" | 📊 | 250 | 300+ min on projects |

---

## 🔄 Auto-Tracking System

### **Duration Calculation (Event Timer Pattern)**

```typescript
// START ACTIVITY
useActivityTracker({
  type: 'task',
  id: taskId,
  name: 'Review Documentation'
});
// → Saves startTime to metadata

// WORKING...
// Timer runs in background, similar to event control timer
// Frontend displays elapsed time: HH:MM:SS

// STOP/SWITCH ACTIVITY
useActivityTracker({ type: 'none' });
// → Calculates duration = now - startTime
// → Updates stats in metadata
// → Checks for new achievements
```

### **Stats Structure in User Metadata**

```typescript
user.metadata = {
  currentActivity: {
    type: 'task',
    id: 'task_123',
    name: 'Review Docs',
    startedAt: 1729234567890
  },
  activityStats: {
    totalMinutes: 327,      // All time worked
    taskMinutes: 200,       // Task-specific
    projectMinutes: 127,    // Project-specific
    sessionsCount: 15,      // Number of sessions
    longestSession: 145     // Longest in minutes
  },
  currentStreak: 5          // Daily streak
}
```

---

## 📈 Real-Time Display

### **Live Timer Display (Like Event Control)**

```typescript
// In your task/project component:
const [elapsed, setElapsed] = useState(0);

useEffect(() => {
  if (currentActivity && currentActivity.startedAt) {
    const calculateElapsed = () => {
      const ms = Date.now() - currentActivity.startedAt;
      setElapsed(Math.floor(ms / 1000));
    };
    
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    
    return () => clearInterval(interval);
  }
}, [currentActivity]);

// Format: HH:MM:SS
const formatTime = () => {
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
```

---

## 🎮 Achievement Unlock Flow

### **Automatic Detection**

```typescript
// When user stops/switches activity:
checkDurationAchievements(ctx, userId, durationMinutes, activityType)

// Checks all thresholds:
if (stats.totalMinutes >= 60 && stats.totalMinutes < 65) {
  // NEW ACHIEVEMENT! 🎉
  achievements.push({
    type: 'first_hour',
    title: '1 Hour Focused!',
    icon: '⏰'
  });
  
  // Optional: Send notification
  await ctx.db.insert("notifications", {
    userId: userId,
    title: "🏆 Achievement Unlocked!",
    message: "You've earned: 1 Hour Focused! ⏰",
    type: "success",
    category: "achievement",
    isRead: false,
    createdAt: Date.now()
  });
}
```

---

## 🛠️ Implementation Examples

### **Example 1: Task Page with Auto-Tracking**

```typescript
// src/app/tasks/[id]/page.tsx
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useQuery } from 'convex/react';

export default function TaskPage({ params }: { params: { id: string } }) {
  const task = useQuery(api.tasks.getTask, { taskId: params.id });
  const currentActivity = useQuery(api.activity.getCurrentActivity);
  const stats = useQuery(api.activity.getActivityStats);
  
  // Auto-track activity
  useActivityTracker({
    type: 'task',
    id: params.id,
    name: task?.title || 'Loading...'
  });
  
  // Live timer display (like event control)
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (currentActivity?.startedAt) {
      const timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - currentActivity.startedAt) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentActivity]);

  return (
    <div>
      {/* Active Timer Badge */}
      {currentActivity && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-300">⏱️ Working</span>
            <span className="font-mono font-bold text-emerald-300">
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      )}
      
      {/* Stats Display */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-gray-400 text-sm">Total Hours</div>
          <div className="text-2xl font-bold text-white">{stats?.totalHours || 0}h</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-gray-400 text-sm">Sessions</div>
          <div className="text-2xl font-bold text-white">{stats?.sessionsCount || 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-gray-400 text-sm">Longest</div>
          <div className="text-2xl font-bold text-white">{stats?.longestSessionMinutes || 0}m</div>
        </div>
      </div>
      
      {/* Task content */}
      <h1>{task?.title}</h1>
    </div>
  );
}
```

---

## 📊 Stats Dashboard Component

```typescript
// src/components/stats/ActivityStats.tsx
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function ActivityStats() {
  const stats = useQuery(api.activity.getActivityStats);
  const achievements = useQuery(api.activity.getRecentAchievements, { limit: 10 });
  
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon="⏰" 
          label="Total Hours" 
          value={stats?.totalHours || 0}
          color="blue"
        />
        <StatCard 
          icon="🎯" 
          label="Sessions" 
          value={stats?.sessionsCount || 0}
          color="purple"
        />
        <StatCard 
          icon="🏃" 
          label="Longest Session" 
          value={`${stats?.longestSessionMinutes || 0}m`}
          color="emerald"
        />
        <StatCard 
          icon="📊" 
          label="Average Session" 
          value={`${stats?.averageSessionMinutes || 0}m`}
          color="orange"
        />
      </div>
      
      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">📋 Task Time</h3>
          <div className="text-3xl font-bold text-teal-400">
            {stats?.taskHours || 0}h
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">📊 Project Time</h3>
          <div className="text-3xl font-bold text-purple-400">
            {stats?.projectHours || 0}h
          </div>
        </div>
      </div>
      
      {/* Achievements */}
      <div>
        <h3 className="text-white font-semibold mb-4">🏆 Recent Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {achievements?.map((ach, i) => (
            <div key={i} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-3xl mb-2">{ach.icon}</div>
              <div className="text-white font-medium">{ach.title}</div>
              <div className="text-yellow-400 text-sm">{ach.points} points</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔔 Achievement Notifications

### **Auto-Notify on Unlock**

```typescript
// In checkDurationAchievements function:
if (newAchievementUnlocked) {
  await ctx.db.insert("notifications", {
    userId: userId,
    title: "🏆 Achievement Unlocked!",
    message: `You've earned: ${achievement.title} ${achievement.icon}`,
    type: "success",
    category: "achievement",
    isRead: false,
    actionUrl: "/profile",
    metadata: {
      achievementType: achievement.type,
      points: achievement.points,
      icon: achievement.icon
    },
    createdAt: Date.now()
  });
}
```

---

## 🎯 Achievement Tiers

### **Point Values:**
- 🥉 **Bronze** (50-100 pts): Beginner achievements
- 🥈 **Silver** (150-250 pts): Intermediate achievements  
- 🥇 **Gold** (300-400 pts): Advanced achievements
- 💎 **Diamond** (500+ pts): Master achievements

---

## 📱 Where Achievements Show

1. **Sidebar Profile** - Top 3 recent badges
2. **Online Users Modal** - Mini badges per user
3. **Profile Page** - Full achievement gallery
4. **Stats Dashboard** - Achievement progress
5. **Notifications** - Unlock alerts

---

## 🚀 Next Enhancements

### **Coming Soon:**
- [ ] Achievement unlock animations
- [ ] Leaderboard by achievement points
- [ ] Rare/Epic achievements
- [ ] Team achievements
- [ ] Monthly achievement resets
- [ ] Achievement trading/gifting

---

## 📝 Summary

You now have a comprehensive achievement system that:

✅ **Tracks duration** like the event timer  
✅ **Auto-awards badges** based on milestones  
✅ **Displays real-time** progress  
✅ **Shows in multiple places** (sidebar, modal, profile)  
✅ **Motivates users** with points and tiers  
✅ **Sends notifications** on unlocks  

The system is live and will start tracking as soon as users begin working on tasks/projects!
