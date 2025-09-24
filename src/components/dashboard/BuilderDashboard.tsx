"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Building2, 
  Users, 
  CheckSquare, 
  DollarSign, 
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Menu,
  Briefcase
} from 'lucide-react';

interface BuilderDashboardProps {
  user: any;
  permissions: any;
}

export function BuilderDashboard({ user, permissions }: BuilderDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dashboardData = useQuery(api.dashboards.getBuilderDashboard);

  if (!dashboardData) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar 
          userRole="BUILDER" 
          dashboardTitle="Builder Dashboard"
          dashboardSubtitle="Project management and team coordination"
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
            <h1 className="text-lg font-semibold text-white">Builder Dashboard</h1>
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

  const { projectOverview, taskDistribution, workerPerformance, upcomingDeadlines, myProjects } = dashboardData;

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole="BUILDER" 
        dashboardTitle="Builder Dashboard"
        dashboardSubtitle="Project management and team coordination"
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
          <h1 className="text-lg font-semibold text-white">Builder Dashboard</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
      {/* Builder Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Project Builder Dashboard</h1>
          <p className="text-gray-400">Manage your projects and coordinate with your team</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{projectOverview.totalProjects}</p>
          <p className="text-sm text-gray-400">Active Projects</p>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">My Projects</p>
                <p className="text-3xl font-bold text-white">{projectOverview.totalProjects}</p>
                <p className="text-sm text-green-400">
                  {projectOverview.activeProjects} active
                </p>
              </div>
              <Building2 className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Project Tasks</p>
                <p className="text-3xl font-bold text-white">{taskDistribution.totalTasks}</p>
                <p className="text-sm text-purple-400">
                  {taskDistribution.totalTasks > 0 ? Math.round((taskDistribution.completedTasks / taskDistribution.totalTasks) * 100) : 0}% completed
                </p>
              </div>
              <CheckSquare className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Team Members</p>
                <p className="text-3xl font-bold text-white">{projectOverview.assignedWorkers}</p>
                <p className="text-sm text-blue-400">Workers assigned</p>
              </div>
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Project Budget</p>
                <p className="text-3xl font-bold text-white">₱{projectOverview.totalBudget.toLocaleString()}</p>
                <p className="text-sm text-yellow-400">
                  ₱{projectOverview.budgetUsed.toLocaleString()} used
                </p>
              </div>
              <Briefcase className="w-12 h-12 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worker Performance & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              Worker Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workerPerformance.map((worker: any) => (
                <div key={worker.userId} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{worker.name}</p>
                    <p className="text-sm text-gray-400">{worker.tasksCompleted} tasks completed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{worker.completionRate}%</div>
                    <p className="text-xs text-gray-400">Success rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((task: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    <p className="text-sm text-gray-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    className={`${
                      task.priority === 'high' ? 'bg-red-900/20 text-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-gray-900/20 text-gray-400'
                    }`}
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Projects */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            My Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProjects.map((project: any) => (
              <div key={project._id} className="p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{project.title}</h4>
                  <Badge 
                    className={`${
                      project.status === 'active' ? 'bg-green-900/20 text-green-400' :
                      project.status === 'planning' ? 'bg-yellow-900/20 text-yellow-400' :
                      project.status === 'completed' ? 'bg-blue-900/20 text-blue-400' :
                      'bg-gray-900/20 text-gray-400'
                    }`}
                  >
                    {project.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Budget: ₱{project.budget?.toLocaleString() || 'N/A'}</span>
                  <span>{project.assignedTo?.length || 0} workers</span>
                </div>
                {project.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={project.progress} className="h-2" />
                    <p className="text-xs text-gray-400 mt-1">{project.progress}% complete</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <Building2 className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-white font-medium">Create Project</p>
              <p className="text-gray-400 text-sm">Start new project</p>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <CheckSquare className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-white font-medium">Manage Tasks</p>
              <p className="text-gray-400 text-sm">Assign & track</p>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-white font-medium">Team</p>
              <p className="text-gray-400 text-sm">Manage workers</p>
            </button>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
              <TrendingUp className="w-8 h-8 text-orange-400 mb-2" />
              <p className="text-white font-medium">Analytics</p>
              <p className="text-gray-400 text-sm">Project metrics</p>
            </button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
