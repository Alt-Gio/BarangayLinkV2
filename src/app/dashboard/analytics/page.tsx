"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { BarChart3, Menu } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { StatusDistribution } from "@/components/analytics/StatusDistribution";
import { BudgetOverview } from "@/components/analytics/BudgetOverview";
import { RecentActivity } from "@/components/analytics/RecentActivity";
import { MilestoneTracker } from "@/components/analytics/MilestoneTracker";
import { DepartmentPerformance } from "@/components/analytics/DepartmentPerformance";
import { TeamPerformance } from "@/components/analytics/TeamPerformance";
import { ExportButton } from "@/components/common/ExportButton";
import { exportAnalyticsReport } from "@/lib/exportUtils";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month");

  const currentUser = useQuery(api.users.getCurrentUser);
  const projects = useQuery(api.productivity.getProjects, {});
  // Only load all users if current user is admin (level 4+)
  const isAdmin = currentUser?.userLevel?.level && currentUser.userLevel.level >= 4;
  const allUsers = useQuery(
    api.adminUserManagement.getAllUsers, 
    isAdmin ? {} : "skip"
  );
  const departments = useQuery(api.departments.getAllDepartments);

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !currentUser || !projects) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate Analytics
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter((p: any) => p.status === "active").length || 0;
  const completedProjects = projects?.filter((p: any) => p.status === "completed").length || 0;
  const pendingProjects = projects?.filter((p: any) => p.status === "pending_approval" || p.status === "planning").length || 0;
  const completionRate = totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : "0";

  const totalBudget = projects?.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0;
  const completedBudget = projects?.filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0;

  const departmentStats = departments?.map((dept: any) => {
    const deptProjects = projects?.filter((p: any) => p.department === dept.name) || [];
    const completed = deptProjects.filter((p: any) => p.status === "completed").length;
    const active = deptProjects.filter((p: any) => p.status === "active").length;
    const total = deptProjects.length;
    return { name: dept.name, total, active, completed, completionRate: total > 0 ? ((completed / total) * 100).toFixed(0) : "0" };
  }) || [];

  const projectsWithMilestones = projects?.filter((p: any) => p.milestones && p.milestones.length > 0) || [];
  const totalMilestones = projectsWithMilestones.reduce((sum: number, p: any) => sum + p.milestones.length, 0);
  const completedMilestones = projectsWithMilestones.reduce((sum: number, p: any) =>
    sum + (p.milestones?.filter((m: any) => m.completed).length || 0), 0);
  const milestoneCompletionRate = totalMilestones > 0 ? ((completedMilestones / totalMilestones) * 100).toFixed(1) : "0";

  const onTimeProjects = projects?.filter((p: any) => {
    if (p.status !== "completed") return false;
    return new Date(p.actualEndDate || Date.now()) <= new Date(p.endDate);
  }).length || 0;
  const onTimeRate = completedProjects > 0 ? ((onTimeProjects / completedProjects) * 100).toFixed(1) : "0";

  const teamStats = allUsers?.map((user: any) => {
    const userProjects = projects?.filter((p: any) => p.createdBy === user._id) || [];
    return {
      name: user.name,
      role: user.userLevel?.name,
      projects: userProjects.length,
      completed: userProjects.filter((p: any) => p.status === "completed").length
    };
  }).sort((a: any, b: any) => b.completed - a.completed).slice(0, 5) || [];

  const statusDistribution = [
    { status: "Active", count: activeProjects, color: "bg-blue-600",
      percentage: totalProjects > 0 ? ((activeProjects / totalProjects) * 100).toFixed(0) : "0" },
    { status: "Completed", count: completedProjects, color: "bg-emerald-600",
      percentage: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(0) : "0" },
    { status: "Pending", count: pendingProjects, color: "bg-yellow-600",
      percentage: totalProjects > 0 ? ((pendingProjects / totalProjects) * 100).toFixed(0) : "0" },
  ];

  const recentCompletions = projects?.filter((p: any) => p.status === "completed")
    .sort((a: any, b: any) => new Date(b.actualEndDate || 0).getTime() - new Date(a.actualEndDate || 0).getTime())
    .slice(0, 5) || [];

  const upcomingDeadlines = projects?.filter((p: any) => p.status === "active" && p.endDate)
    .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(0, 5) || [];

  // Export handler
  const handleExport = (format: 'pdf' | 'excel') => {
    const analyticsData = {
      totalProjects,
      completedProjects,
      activeProjects,
      pendingProjects,
      totalBudget,
      completedBudget,
      departmentStats,
      teamStats,
      recentCompletions
    };
    
    exportAnalyticsReport(analyticsData, format);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Analytics"
        dashboardSubtitle="Project insights and reports"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-50">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Analytics</h1>
          <div className="w-9" />
        </div>

        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Desktop Header */}
          <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 md:sticky md:top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-emerald-500" />
                    Analytics & Reporting
                  </h1>
                  <p className="text-gray-400 mt-1">Comprehensive project insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                  <ExportButton onExport={handleExport} />
                </div>
              </div>

              <MetricsCards
                totalProjects={totalProjects}
                completionRate={completionRate}
                completedProjects={completedProjects}
                milestoneCompletionRate={milestoneCompletionRate}
                completedMilestones={completedMilestones}
                totalMilestones={totalMilestones}
                onTimeRate={onTimeRate}
                onTimeProjects={onTimeProjects}
              />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white/10 p-1 rounded-lg border border-white/20 flex-wrap">
                <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="milestones" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Milestones
                </TabsTrigger>
                <TabsTrigger value="departments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Departments
                </TabsTrigger>
                <TabsTrigger value="team" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StatusDistribution data={statusDistribution} />
                  <BudgetOverview totalBudget={totalBudget} completedBudget={completedBudget} />
                </div>
                <RecentActivity recentCompletions={recentCompletions} upcomingDeadlines={upcomingDeadlines} />
              </TabsContent>

              <TabsContent value="milestones" className="space-y-6">
                <MilestoneTracker projects={projectsWithMilestones} />
              </TabsContent>

              <TabsContent value="departments" className="space-y-6">
                <DepartmentPerformance departments={departmentStats} />
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                <TeamPerformance teamStats={teamStats} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
