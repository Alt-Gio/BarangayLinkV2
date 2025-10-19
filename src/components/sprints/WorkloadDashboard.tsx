"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  User,
  Calendar,
} from 'lucide-react';

interface WorkloadDashboardProps {
  userTasks: any[];
  currentUser: any;
  sprintCapacity?: number;
}

// Story Points to XP conversion
const STORY_POINT_TO_XP = {
  1: 10,   // Trivial: 10 XP
  2: 25,   // Simple: 25 XP
  3: 50,   // Easy: 50 XP
  5: 100,  // Medium: 100 XP
  8: 200,  // Complex: 200 XP
  13: 350, // Very complex: 350 XP
  21: 600, // Epic: 600 XP
};

// Recommended daily capacity (story points)
const DAILY_CAPACITY_LIMITS = {
  light: 3,      // 3 points/day = sustainable
  normal: 5,     // 5 points/day = healthy
  heavy: 8,      // 8 points/day = challenging
  overloaded: 13 // 13+ points/day = burnout risk!
};

export function WorkloadDashboard({ userTasks, currentUser, sprintCapacity }: WorkloadDashboardProps) {
  // Calculate user's workload
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Tasks due today
  const tasksToday = userTasks.filter((task: any) => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });

  // Tasks due this week
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const tasksThisWeek = userTasks.filter((task: any) => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < weekEnd;
  });

  // Calculate story points
  const todayPoints = tasksToday.reduce((sum: number, task: any) => 
    sum + (task.storyPoints || 0), 0
  );
  
  const weekPoints = tasksThisWeek.reduce((sum: number, task: any) => 
    sum + (task.storyPoints || 0), 0
  );

  // Calculate potential XP
  const todayPotentialXP = tasksToday.reduce((sum: number, task: any) => {
    const points = task.storyPoints || 0;
    return sum + (STORY_POINT_TO_XP[points as keyof typeof STORY_POINT_TO_XP] || task.experienceReward || 0);
  }, 0);

  // Determine workload status
  const getWorkloadStatus = (points: number) => {
    if (points === 0) return { level: 'none', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Clock };
    if (points <= DAILY_CAPACITY_LIMITS.light) return { level: 'light', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle };
    if (points <= DAILY_CAPACITY_LIMITS.normal) return { level: 'normal', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Zap };
    if (points <= DAILY_CAPACITY_LIMITS.heavy) return { level: 'heavy', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: TrendingUp };
    return { level: 'overloaded', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle };
  };

  const todayStatus = getWorkloadStatus(todayPoints);
  const weeklyAverage = Math.round(weekPoints / 7);
  const weekStatus = getWorkloadStatus(weeklyAverage);

  // Calculate capacity utilization
  const maxDailyCapacity = DAILY_CAPACITY_LIMITS.heavy; // 8 points is 100%
  const todayUtilization = Math.min((todayPoints / maxDailyCapacity) * 100, 150); // Cap at 150%
  const weekUtilization = Math.min((weeklyAverage / DAILY_CAPACITY_LIMITS.normal) * 100, 150);

  return (
    <div className="space-y-4">
      {/* Main Workload Card */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            My Workload
          </CardTitle>
          <p className="text-sm text-gray-400">
            Track your daily capacity and prevent burnout
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Today's Workload */}
            <div className={`${todayStatus.bg} border border-${todayStatus.color.replace('text-', '')} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <todayStatus.icon className={`w-5 h-5 ${todayStatus.color}`} />
                  <h3 className="font-semibold text-white">Today</h3>
                </div>
                <Badge className={`${todayStatus.bg} ${todayStatus.color} capitalize`}>
                  {todayStatus.level}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{tasksToday.length} tasks</span>
                  <span className={`text-2xl font-bold ${todayStatus.color}`}>
                    {todayPoints} pts
                  </span>
                </div>
                
                <Progress 
                  value={todayUtilization} 
                  className={`h-2 ${todayUtilization > 100 ? 'bg-red-900' : 'bg-gray-700'}`}
                />
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Capacity: {todayUtilization.toFixed(0)}%
                  </span>
                  <span className={todayStatus.color}>
                    {todayPotentialXP} XP potential
                  </span>
                </div>
              </div>

              {todayPoints > DAILY_CAPACITY_LIMITS.heavy && (
                <div className="mt-3 p-2 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-300">
                  ⚠️ Warning: High workload! Consider delegating or rescheduling tasks.
                </div>
              )}
            </div>

            {/* This Week's Average */}
            <div className={`${weekStatus.bg} border border-${weekStatus.color.replace('text-', '')} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-5 h-5 ${weekStatus.color}`} />
                  <h3 className="font-semibold text-white">This Week</h3>
                </div>
                <Badge className={`${weekStatus.bg} ${weekStatus.color} capitalize`}>
                  {weekStatus.level}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{tasksThisWeek.length} tasks</span>
                  <span className={`text-2xl font-bold ${weekStatus.color}`}>
                    {weekPoints} pts
                  </span>
                </div>
                
                <Progress 
                  value={weekUtilization} 
                  className={`h-2 ${weekUtilization > 100 ? 'bg-red-900' : 'bg-gray-700'}`}
                />
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Avg: {weeklyAverage} pts/day
                  </span>
                  <span className={weekStatus.color}>
                    Sustainable pace
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Story Point Guide */}
          <div className="mt-4 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Story Points = XP Rewards
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {Object.entries(STORY_POINT_TO_XP).map(([points, xp]) => (
                <div key={points} className="bg-gray-800 rounded p-2">
                  <div className="font-bold text-purple-400">{points} pts</div>
                  <div className="text-gray-400">= {xp} XP</div>
                </div>
              ))}
            </div>
          </div>

          {/* Capacity Guidelines */}
          <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-semibold mb-2">💡 Daily Capacity Guide:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span><strong>0-3 pts:</strong> Light day, great for planning</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-blue-400" />
                <span><strong>4-5 pts:</strong> Normal day, sustainable pace</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-orange-400" />
                <span><strong>6-8 pts:</strong> Heavy day, push your limits</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span><strong>9+ pts:</strong> Overloaded! Risk of burnout</span>
              </li>
            </ul>
          </div>

          {/* Today's Tasks Breakdown */}
          {tasksToday.length > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-semibold mb-2">Today's Tasks:</h4>
              <div className="space-y-2">
                {tasksToday.slice(0, 5).map((task: any) => (
                  <div key={task._id} className="bg-gray-900/50 border border-gray-700 rounded p-2 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{task.title}</div>
                      <div className="text-xs text-gray-400">
                        {task.priority} priority • {task.difficulty} difficulty
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.storyPoints && (
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                          {task.storyPoints} pts
                        </Badge>
                      )}
                      <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">
                        {task.experienceReward} XP
                      </Badge>
                    </div>
                  </div>
                ))}
                {tasksToday.length > 5 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{tasksToday.length - 5} more tasks
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
