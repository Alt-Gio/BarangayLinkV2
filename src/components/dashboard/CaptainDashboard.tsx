"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building2, 
  CheckSquare, 
  DollarSign, 
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  BarChart3,
  Menu,
  Landmark,
  Target,
  Award,
  FileText
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface CaptainDashboardProps {
  user: any;
  permissions: any;
}

export function CaptainDashboard({ user, permissions }: CaptainDashboardProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dashboardData = useQuery(api.dashboards.getAdminDashboard);

  if (!dashboardData) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar 
          userRole="CAPTAIN" 
          dashboardTitle="Captain Dashboard"
          dashboardSubtitle="Strategic leadership and oversight"
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
            <h1 className="text-lg font-semibold text-white">Captain Dashboard</h1>
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

  const { systemOverview, departmentStats, recentActivity } = dashboardData;
  
  // Mock critical alerts for now - should come from dashboardData
  const criticalAlerts = dashboardData.criticalAlerts || [];

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole="CAPTAIN" 
        dashboardTitle="Captain Dashboard"
        dashboardSubtitle="Strategic leadership and oversight"
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
          <h1 className="text-lg font-semibold text-white">Captain Dashboard</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
      {/* Leadership Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Barangay Leadership Center</h1>
          <p className="text-sm sm:text-base text-gray-400">Strategic oversight and community governance</p>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyan-900/20 rounded-lg border border-cyan-700">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <span className="text-sm sm:text-base text-cyan-400 font-medium">Captain Command</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">Priority Attention Required</span>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((alert: any, index: number) => (
              <p key={index} className="text-red-300 text-sm">{alert.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Barangay Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Community Members</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{systemOverview.totalUsers}</p>
                <p className="text-xs sm:text-sm text-cyan-400 mt-1">
                  {systemOverview.activeUsers} active today
                </p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-cyan-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Active Initiatives</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{systemOverview.totalProjects}</p>
                <p className="text-xs sm:text-sm text-green-400 mt-1">
                  {systemOverview.activeProjects} in progress
                </p>
              </div>
              <Target className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Task Completion</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
                  {formatPercentage(systemOverview.totalTasks > 0 ? (systemOverview.completedTasks / systemOverview.totalTasks) * 100 : 0)}
                </p>
                <p className="text-xs sm:text-sm text-purple-400 mt-1">
                  {systemOverview.completedTasks}/{systemOverview.totalTasks} tasks
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
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Barangay Budget</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words leading-tight">
                  {formatCurrency(systemOverview.totalBudget)}
                </p>
                <p className="text-xs sm:text-sm text-yellow-400 mt-1">
                  {formatPercentage(systemOverview.totalBudget > 0 ? (systemOverview.totalSpent / systemOverview.totalBudget) * 100 : 0)} utilized
                </p>
              </div>
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.map((dept: any) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{dept.name}</span>
                    <span className="text-sm text-gray-400">
                      {dept.activeProjects}/{dept.totalProjects} initiatives
                    </span>
                  </div>
                  <Progress 
                    value={dept.completionRate} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{dept.totalUsers} team members</span>
                    <span>{dept.completionRate}% progress</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Community Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{activity.title}</p>
                    <p className="text-gray-400 text-xs">{activity.description}</p>
                    <span className="text-xs text-gray-500">{activity.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership Command Center */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Leadership Command Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/organization-board')}
              className="p-4 bg-gradient-to-br from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 rounded-lg transition-all text-left border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
            >
              <Landmark className="w-8 h-8 text-cyan-100 mb-2" />
              <p className="text-white font-semibold">Organization Board</p>
              <p className="text-cyan-100 text-sm">View hierarchy</p>
            </button>

            <button 
              onClick={() => router.push('/dashboard/team-workload')}
              className="p-4 bg-gradient-to-br from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 rounded-lg transition-all text-left border-2 border-teal-500/50 shadow-lg shadow-teal-500/20"
            >
              <TrendingUp className="w-8 h-8 text-teal-100 mb-2" />
              <p className="text-white font-semibold">Team Workload</p>
              <p className="text-teal-100 text-sm">Monitor capacity</p>
            </button>
            
            <button 
              onClick={() => router.push('/strategic-planning')}
              className="p-4 bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-lg transition-all text-left border-2 border-blue-500/50 shadow-lg shadow-blue-500/20"
            >
              <Target className="w-8 h-8 text-blue-100 mb-2" />
              <p className="text-white font-semibold">Strategic Planning</p>
              <p className="text-blue-100 text-sm">Set goals & vision</p>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/analytics')}
              className="p-4 bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 rounded-lg transition-all text-left border-2 border-purple-500/50 shadow-lg shadow-purple-500/20"
            >
              <BarChart3 className="w-8 h-8 text-purple-100 mb-2" />
              <p className="text-white font-semibold">Reports & Analytics</p>
              <p className="text-purple-100 text-sm">Performance insights</p>
            </button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
