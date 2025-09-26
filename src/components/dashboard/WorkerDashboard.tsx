"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Star, 
  Heart, 
  Coins, 
  Target, 
  Calendar, 
  CheckSquare,
  Award,
  TrendingUp,
  Zap,
  User,
  Menu,
  Trophy,
  Play
} from 'lucide-react';

interface WorkerDashboardProps {
  user: any;
  permissions: any;
}

export function WorkerDashboard({ user, permissions }: WorkerDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dashboardData = useQuery(api.dashboards.getWorkerDashboard);

  if (!dashboardData) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar 
          userRole="WORKER" 
          dashboardTitle="Worker Dashboard"
          dashboardSubtitle="Personal tasks and community engagement"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">Worker Dashboard</h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
          
          <div className="p-4 md:p-6">
            <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { personalStats, taskOverview, myTasks, myProjects, upcomingEvents, unreadNotifications } = dashboardData;

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole="WORKER" 
        dashboardTitle="Worker Dashboard"
        dashboardSubtitle="Personal tasks and community engagement"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Worker Dashboard</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
      {/* Worker Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Worker Dashboard</h1>
          <p className="text-gray-400">Track your tasks and level up your skills</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">Level {personalStats.level}</p>
          <p className="text-sm text-gray-400">{personalStats.experience} XP</p>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Level</p>
                <p className="text-3xl font-bold text-white">{personalStats.level}</p>
                <p className="text-sm text-purple-400">
                  {personalStats.nextLevelXP} XP to next level
                </p>
              </div>
              <Star className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Gold Earned</p>
                <p className="text-3xl font-bold text-white">{personalStats.gold}</p>
                <p className="text-sm text-yellow-400">Total rewards</p>
              </div>
              <Coins className="w-12 h-12 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasks Completed</p>
                <p className="text-3xl font-bold text-white">{personalStats.totalTasksCompleted}</p>
                <p className="text-sm text-green-400">All time</p>
              </div>
              <CheckSquare className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Streak</p>
                <p className="text-3xl font-bold text-white">{personalStats.streakCount}</p>
                <p className="text-sm text-orange-400">Days active</p>
              </div>
              <Zap className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health & Experience Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Health & Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Health</span>
                  <span className="text-red-400">{personalStats.health}/100</span>
                </div>
                <Progress value={personalStats.health} className="h-3" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Experience</span>
                  <span className="text-purple-400">{personalStats.experience} XP</span>
                </div>
                <Progress 
                  value={personalStats.experience % 1000 / 10} 
                  className="h-3" 
                />
                <p className="text-xs text-gray-500 mt-1">
                  {personalStats.nextLevelXP} XP needed for Level {personalStats.level + 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Task Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{taskOverview.todoTasks}</p>
                <p className="text-sm text-gray-400">To Do</p>
              </div>
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <p className="text-2xl font-bold text-yellow-400">{taskOverview.inProgressTasks}</p>
                <p className="text-sm text-gray-400">In Progress</p>
              </div>
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{taskOverview.completedTasks}</p>
                <p className="text-sm text-gray-400">Completed</p>
              </div>
              <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                <p className="text-2xl font-bold text-red-400">{taskOverview.overdueTasks}</p>
                <p className="text-sm text-gray-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myTasks.map((task: any) => (
              <div key={task._id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium">{task.title}</h4>
                  <p className="text-sm text-gray-400">{task.description}</p>
                  {task.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    className={`${
                      task.priority === 'high' ? 'bg-red-900/20 text-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-gray-900/20 text-gray-400'
                    }`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge 
                    className={`${
                      task.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                      task.status === 'in_progress' ? 'bg-blue-900/20 text-blue-400' :
                      'bg-gray-900/20 text-gray-400'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </Badge>
                  {task.experienceReward && (
                    <div className="text-right">
                      <p className="text-sm text-purple-400">+{task.experienceReward} XP</p>
                      <p className="text-xs text-yellow-400">+{task.goldReward} Gold</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Projects & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              My Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myProjects.map((project: any) => (
                <div key={project._id} className="p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{project.title}</h4>
                    <Badge 
                      className={`${
                        project.status === 'active' ? 'bg-green-900/20 text-green-400' :
                        project.status === 'planning' ? 'bg-yellow-900/20 text-yellow-400' :
                        'bg-gray-900/20 text-gray-400'
                      }`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">{project.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event: any) => (
                <div key={event._id} className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="text-white font-medium">{event.title}</h4>
                  <p className="text-sm text-gray-400">{event.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <Play className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-white font-medium">Start Task</p>
              <p className="text-gray-400 text-sm">Begin working</p>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <CheckSquare className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-white font-medium">View Tasks</p>
              <p className="text-gray-400 text-sm">All assignments</p>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
              <p className="text-white font-medium">Achievements</p>
              <p className="text-gray-400 text-sm">View rewards</p>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <TrendingUp className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-white font-medium">Progress</p>
              <p className="text-gray-400 text-sm">Track stats</p>
            </button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
