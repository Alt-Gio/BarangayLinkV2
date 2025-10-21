"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building2, 
  CheckSquare, 
  DollarSign, 
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
  Menu,
  Award,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface ManagerDashboardProps {
  user: any;
  permissions: any;
}

export function ManagerDashboard({ user, permissions }: ManagerDashboardProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dashboardData = useQuery(api.dashboards.getManagerDashboard);

  if (!dashboardData) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar 
          userRole="MANAGER" 
          dashboardTitle="Manager Dashboard"
          dashboardSubtitle="Department management and team coordination"
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
            <h1 className="text-lg font-semibold text-white">Manager Dashboard</h1>
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

  const { departmentOverview, teamPerformance, upcomingDeadlines, pendingApprovals } = dashboardData;
  
  // Get department projects from dashboardData
  const departmentProjects = dashboardData.departmentProjects || [];

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole="MANAGER" 
        dashboardTitle="Manager Dashboard"
        dashboardSubtitle="Department management and team coordination"
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
          <h1 className="text-lg font-semibold text-white">Manager Dashboard</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
      {/* Department Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{user?.department || 'Department'} Management</h1>
          <p className="text-gray-400">Manage your team and oversee department operations</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{departmentOverview.teamSize}</p>
          <p className="text-sm text-gray-400">Team Members</p>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">
              {pendingApprovals.length} Projects Awaiting Approval
            </span>
          </div>
          <div className="space-y-1">
            {pendingApprovals.slice(0, 3).map((project: any) => (
              <p key={project._id} className="text-yellow-300 text-sm">
                &quot;{project.title}&quot; by {project.createdBy?.name}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Team Size</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{departmentOverview.teamSize}</p>
                <p className="text-xs sm:text-sm text-blue-400 mt-1">Department members</p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Active Projects</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{departmentOverview.activeProjects}</p>
                <p className="text-xs sm:text-sm text-green-400 mt-1">
                  {departmentOverview.completedProjects} completed
                </p>
              </div>
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Department Tasks</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{departmentOverview.totalTasks}</p>
                <p className="text-xs sm:text-sm text-purple-400 mt-1">
                  {formatPercentage(departmentOverview.totalTasks > 0 ? (departmentOverview.completedTasks / departmentOverview.totalTasks) * 100 : 0)} completed
                </p>
              </div>
              <CheckSquare className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Department Budget</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words leading-tight">
                  {formatCurrency(departmentOverview.departmentBudget)}
                </p>
                <p className="text-xs sm:text-sm text-yellow-400 mt-1">
                  {formatCurrency(departmentOverview.budgetUsed)} used
                </p>
              </div>
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.map((member: any) => (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{member.name}</p>
                    <p className="text-sm text-gray-400">{member.role} • {member.tasksCompleted} tasks done</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{member.productivityScore}%</div>
                    <p className="text-xs text-gray-400">Productivity</p>
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

      {/* Department Projects */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recent Department Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentProjects.map((project: any) => (
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
                  <span>{project.assignedTo?.length || 0} members</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Department Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/dashboard/team-workload')}
              className="p-4 bg-gradient-to-br from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 rounded-lg transition-all text-left border-2 border-teal-500/50"
            >
              <Users className="w-8 h-8 text-teal-100 mb-2" />
              <p className="text-white font-semibold">Team Workload</p>
              <p className="text-teal-100 text-sm">Track capacity</p>
            </button>
            
            <button 
              onClick={() => router.push('/projects')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <Building2 className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-white font-medium">Projects</p>
              <p className="text-gray-400 text-sm">Create & approve</p>
            </button>
            
            <button 
              onClick={() => router.push('/strategic-planning')}
              className="p-4 bg-gradient-to-br from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 rounded-lg transition-all text-left border-2 border-cyan-500/50"
            >
              <Target className="w-8 h-8 text-cyan-100 mb-2" />
              <p className="text-white font-semibold">Strategic Planning</p>
              <p className="text-cyan-100 text-sm">Goals & progress</p>
            </button>
            
            <button 
              onClick={() => router.push('/events')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <Calendar className="w-8 h-8 text-yellow-400 mb-2" />
              <p className="text-white font-medium">Schedule</p>
              <p className="text-gray-400 text-sm">Events & meetings</p>
            </button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
