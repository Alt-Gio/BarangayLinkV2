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
  Settings,
  BarChart3,
  Menu,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface AdminDashboardProps {
  user: any;
  permissions: any;
}

export function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dashboardData = useQuery(api.dashboards.getAdminDashboard);

  if (!dashboardData) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar 
          userRole="ADMIN" 
          dashboardTitle="Admin Dashboard"
          dashboardSubtitle="System administration and management"
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
            <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
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
  
  // Mock userManagement data since it's not in the current dashboard structure
  const userManagement = {
    totalUsers: systemOverview?.totalUsers || 0,
    activeUsers: systemOverview?.activeUsers || 0,
    newUsers: 0,
    pendingApprovals: 0
  };
  
  // Mock critical alerts for now - should come from dashboardData
  const criticalAlerts = dashboardData.criticalAlerts || [];

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole="ADMIN" 
        dashboardTitle="Admin Dashboard"
        dashboardSubtitle="System administration and management"
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
          <h1 className="text-lg font-semibold text-white">Admin Dashboard</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
      {/* System Health Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">System Administration</h1>
          <p className="text-sm sm:text-base text-gray-400">Overall system health and management overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-900/20 rounded-lg border border-green-700">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <span className="text-sm sm:text-base text-green-400 font-medium">System Healthy</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">Critical Alerts</span>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((alert: any, index: number) => (
              <p key={index} className="text-red-300 text-sm">{alert.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* System Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Total Users</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{systemOverview.totalUsers}</p>
                <p className="text-xs sm:text-sm text-green-400 mt-1">
                  {systemOverview.activeUsers} currently active
                </p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Total Projects</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{systemOverview.totalProjects}</p>
                <p className="text-xs sm:text-sm text-blue-400 mt-1">
                  {systemOverview.activeProjects} active
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
                <p className="text-xs sm:text-sm text-gray-400 mb-1">System Tasks</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">{systemOverview.totalTasks}</p>
                <p className="text-xs sm:text-sm text-purple-400 mt-1">
                  {formatPercentage(systemOverview.totalTasks > 0 ? (systemOverview.completedTasks / systemOverview.totalTasks) * 100 : 0)} completed
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
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Total Budget</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words leading-tight">
                  {formatCurrency(systemOverview.totalBudget)}
                </p>
                <p className="text-xs sm:text-sm text-yellow-400 mt-1">
                  {formatCurrency(systemOverview.totalSpent)} spent
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
              <BarChart3 className="w-5 h-5" />
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
                      {dept.activeProjects}/{dept.totalProjects} projects
                    </span>
                  </div>
                  <Progress 
                    value={dept.completionRate} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{dept.totalUsers} users</span>
                    <span>{dept.completionRate}% completion</span>
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
              Recent System Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
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

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/admin/users')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-white font-medium">Manage Users</p>
              <p className="text-gray-400 text-sm">Add, edit, assign roles</p>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/team-workload')}
              className="p-4 bg-gradient-to-br from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 rounded-lg transition-all text-left border-2 border-teal-500/50"
            >
              <TrendingUp className="w-8 h-8 text-teal-100 mb-2" />
              <p className="text-white font-semibold">Team Workload</p>
              <p className="text-teal-100 text-sm">Track capacity</p>
            </button>
            
            <button 
              onClick={() => router.push('/admin/settings')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <Settings className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-white font-medium">System Settings</p>
              <p className="text-gray-400 text-sm">Configure system</p>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/analytics')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <BarChart3 className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-white font-medium">Analytics</p>
              <p className="text-gray-400 text-sm">System reports</p>
            </button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
