"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { BarChart3, Menu, Trophy, Target, Users, Building2, TrendingUp, CheckCircle2, Clock, Award, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { StatusDistribution } from "@/components/analytics/StatusDistribution";
import { BudgetOverview } from "@/components/analytics/BudgetOverview";
import { RecentActivity } from "@/components/analytics/RecentActivity";
import { ExportButton } from "@/components/common/ExportButton";
import { exportAnalyticsReport } from "@/lib/exportUtils";
import { BudgetAnalytics } from "@/components/dashboard/BudgetAnalytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month");

  const currentUser = useQuery(api.users.getCurrentUser);
  const projects = useQuery(api.productivity.getProjects, {});
  
  // Get comprehensive analytics data
  const analyticsData = useQuery(api.analytics.getComprehensiveAnalytics, { timeRange });
  const milestonesByProject = useQuery(api.analytics.getMilestoneAnalyticsByProject, {});
  
  // Sync mutation
  const syncMilestones = useMutation(api.milestones.syncAllMilestonesProgress);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSyncMilestones = async () => {
    setIsSyncing(true);
    try {
      const result = await syncMilestones({});
      toast.success(result.message || 'Milestones synced!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync milestones');
    } finally {
      setIsSyncing(false);
    }
  };

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

  // Use analytics data from the comprehensive query
  const summary = analyticsData?.summary || {
    totalProjects: 0, activeProjects: 0, completedProjects: 0, pendingProjects: 0,
    projectCompletionRate: 0, totalMilestones: 0, completedMilestones: 0,
    milestoneCompletionRate: 0, totalTasks: 0, completedTasks: 0, taskCompletionRate: 0,
    totalBudget: 0, usedBudget: 0, onTimeRate: 0, onTimeProjects: 0,
  };

  const statusDistribution = [
    { status: "Active", count: summary.activeProjects, color: "bg-blue-600",
      percentage: summary.totalProjects > 0 ? Math.round((summary.activeProjects / summary.totalProjects) * 100).toString() : "0" },
    { status: "Completed", count: summary.completedProjects, color: "bg-emerald-600",
      percentage: summary.totalProjects > 0 ? Math.round((summary.completedProjects / summary.totalProjects) * 100).toString() : "0" },
    { status: "Pending", count: summary.pendingProjects, color: "bg-yellow-600",
      percentage: summary.totalProjects > 0 ? Math.round((summary.pendingProjects / summary.totalProjects) * 100).toString() : "0" },
  ];

  const recentCompletions = projects?.filter((p: any) => p.status === "completed")
    .sort((a: any, b: any) => new Date(b.actualEndDate || 0).getTime() - new Date(a.actualEndDate || 0).getTime())
    .slice(0, 5) || [];

  const upcomingDeadlines = projects?.filter((p: any) => p.status === "active" && p.endDate)
    .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(0, 5) || [];

  // Export handler
  const handleExport = (format: 'pdf' | 'excel') => {
    const exportData = {
      totalProjects: summary.totalProjects,
      completedProjects: summary.completedProjects,
      activeProjects: summary.activeProjects,
      pendingProjects: summary.pendingProjects,
      totalBudget: summary.totalBudget,
      completedBudget: summary.usedBudget,
      departmentStats: analyticsData?.departments || [],
      teamStats: analyticsData?.leaderboard || [],
      recentCompletions
    };
    
    exportAnalyticsReport(exportData, format);
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
                    className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}>
                    <option value="week" className="bg-gray-800 text-white">This Week</option>
                    <option value="month" className="bg-gray-800 text-white">This Month</option>
                    <option value="quarter" className="bg-gray-800 text-white">This Quarter</option>
                    <option value="year" className="bg-gray-800 text-white">This Year</option>
                  </select>
                  <ExportButton onExport={handleExport} />
                </div>
              </div>

              <MetricsCards
                totalProjects={summary.totalProjects}
                completionRate={summary.projectCompletionRate.toString()}
                completedProjects={summary.completedProjects}
                milestoneCompletionRate={(summary.overallMilestoneProgress || 0).toString()}
                completedMilestones={summary.completedMilestoneTasks || 0}
                totalMilestones={summary.totalMilestoneTasks || 0}
                onTimeRate={(summary.milestoneOnTimeRate || 0).toString()}
                onTimeProjects={summary.completedOnTimeMilestones || 0}
              />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white/10 p-1 rounded-lg border border-white/20 flex-wrap">
                <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="budget" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Budget & Expenses
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
                  <BudgetOverview totalBudget={summary.totalBudget} completedBudget={summary.usedBudget} />
                </div>
                <RecentActivity recentCompletions={recentCompletions} upcomingDeadlines={upcomingDeadlines} />
              </TabsContent>

              <TabsContent value="budget" className="space-y-6">
                <BudgetAnalytics />
              </TabsContent>

              <TabsContent value="milestones" className="space-y-6">
                {/* Real Milestone Tracking */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Milestone Tracking</h2>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={handleSyncMilestones}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-colors disabled:opacity-50"
                        title="Sync all milestone statuses based on task completion"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Status'}
                      </button>
                      <Badge className="bg-purple-500/20 text-purple-300">
                        {summary.completedMilestones}/{summary.totalMilestones} Complete
                      </Badge>
                    </div>
                  </div>
                  
                  {milestonesByProject && milestonesByProject.length > 0 ? (
                    <div className="space-y-6">
                      {milestonesByProject.map((project: any) => (
                        <div key={project.projectId} className="border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-white">{project.projectTitle}</h3>
                              <p className="text-sm text-gray-400">{project.department}</p>
                            </div>
                            <Badge className={project.progress === 100 ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"}>
                              {project.progress}% Complete
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {project.milestones.map((milestone: any) => (
                              <div key={milestone._id} className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  milestone.progress === 100 ? 'bg-emerald-500' : 
                                  milestone.progress > 0 ? 'bg-blue-500' : 'bg-gray-600'
                                }`}>
                                  {milestone.progress === 100 && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className={milestone.progress === 100 ? "text-gray-400 line-through" : "text-white"}>
                                      {milestone.title}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                      {milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'No date'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">{milestone.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Progress value={milestone.progress} className="h-1.5 flex-1" />
                                    <span className="text-xs text-gray-400">{milestone.completedTasks}/{milestone.totalTasks} tasks</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No milestones found</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="departments" className="space-y-6">
                {/* Real Department Performance */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Building2 className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-bold text-white">Department Performance</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData?.departments?.map((dept: any) => (
                      <div key={dept.name} className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
                        <h3 className="font-semibold text-white mb-3">{dept.name}</h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Projects</span>
                            <span className="text-white font-medium">{dept.totalProjects}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Active</span>
                            <Badge className="bg-blue-500/20 text-blue-300">{dept.activeProjects}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Completed</span>
                            <Badge className="bg-emerald-500/20 text-emerald-300">{dept.completedProjects}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tasks Done</span>
                            <span className="text-emerald-400 font-medium">{dept.completedTasks}/{dept.totalTasks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Task Completion</span>
                            <span className="text-white font-medium">{dept.taskCompletionRate}%</span>
                          </div>
                          {dept.totalBudget > 0 && (
                            <div className="flex justify-between pt-2 border-t border-white/10">
                              <span className="text-gray-400">Budget</span>
                              <span className="text-yellow-400 font-medium">₱{dept.totalBudget.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <Progress value={dept.taskCompletionRate} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                {/* Real Team Leaderboard */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">Top Performers</h2>
                    <Badge className="ml-auto bg-yellow-500/20 text-yellow-300">
                      Based on Completed Tasks
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {analyticsData?.leaderboard?.slice(0, 10).map((member: any, index: number) => (
                      <div 
                        key={member._id} 
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                          index === 0 ? 'border-yellow-500/50 bg-yellow-500/10' :
                          index === 1 ? 'border-gray-400/50 bg-gray-400/10' :
                          index === 2 ? 'border-orange-500/50 bg-orange-500/10' :
                          'border-white/10 bg-white/5'
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-500 text-black' :
                          'bg-gray-700 text-white'
                        }`}>
                          #{index + 1}
                        </div>
                        
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 border-2 border-white/20">
                          <AvatarImage src={member.imageUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                            {member.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{member.name || 'Unknown'}</span>
                            {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{member.role}</span>
                            {member.department && <span>• {member.department}</span>}
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg">
                            <CheckCircle2 className="w-5 h-5" />
                            {member.completedTasks}
                          </div>
                          <div className="text-xs text-gray-400">
                            {member.storyPointsCompleted > 0 && (
                              <span className="text-purple-400">{member.storyPointsCompleted} pts</span>
                            )}
                            {member.storyPointsCompleted > 0 && member.xp > 0 && ' • '}
                            {member.xp > 0 && (
                              <span className="text-blue-400">{member.xp} XP</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!analyticsData?.leaderboard || analyticsData.leaderboard.length === 0) && (
                      <div className="text-center py-12 text-gray-400">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No task completions yet</p>
                        <p className="text-sm">Complete tasks to appear on the leaderboard!</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
