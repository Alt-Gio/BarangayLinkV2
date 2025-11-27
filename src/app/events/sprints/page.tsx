"use client";

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreateMilestoneModal } from '@/components/milestones/CreateMilestoneModal';
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Flag,
  Menu,
  Plus,
  BarChart3,
  Zap,
  AlertCircle,
  Briefcase
} from 'lucide-react';

export default function SprintsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<string>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();

  // Voice assistant integration state
  const [defaultMilestoneTitle, setDefaultMilestoneTitle] = useState("");

  // Voice assistant integration: Auto-open create modal from URL params
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      // Check if title was provided via voice command
      const title = searchParams.get('title');
      if (title) {
        setDefaultMilestoneTitle(decodeURIComponent(title));
      }
      setShowCreateModal(true);
      // Clear the params from URL to prevent re-triggering
      router.replace('/events/sprints', { scroll: false });
    }
  }, [searchParams, router]);
  
  // Get milestone data with progress
  const activeSprints = useQuery(api.milestones.getActiveMilestones);
  const upcomingSprints = useQuery(api.milestones.getUpcomingMilestones);
  const completedSprints = useQuery(api.milestones.getCompletedMilestones);
  const stats = useQuery(api.milestones.getMilestoneStats);
  const projects = useQuery(api.projects.getAllProjects);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sprints...</p>
        </div>
      </div>
    );
  }

  const getSprintHealth = (health: string) => {
    if (health === 'on-track') return { color: 'text-green-400', bg: 'bg-green-500/20', label: 'On Track' };
    if (health === 'at-risk') return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'At Risk' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Behind' };
  };

  const getDaysRemaining = (endDate: number) => {
    const days = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Sprints"
        dashboardSubtitle="Milestone tracking"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Sprint Board</h1>
          <div className="w-9" />
        </div>

        <div className="p-6 space-y-6">
          <div className="max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-400" />
                  Sprint Board
                </h1>
                <p className="text-gray-400 mt-1">Track project milestones and goals</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Milestone
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Play className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats?.active || 0}</div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats?.upcoming || 0}</div>
                      <div className="text-xs text-gray-400">Upcoming</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats?.completed || 0}</div>
                      <div className="text-xs text-gray-400">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Flag className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
                      <div className="text-xs text-gray-400">Total Milestones</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={selectedSprint === 'active' ? 'default' : 'outline'}
                onClick={() => setSelectedSprint('active')}
                className={selectedSprint === 'active' ? 'bg-blue-600' : 'border-gray-700 text-gray-300'}
              >
                Active ({activeSprints?.length || 0})
              </Button>
              <Button
                variant={selectedSprint === 'upcoming' ? 'default' : 'outline'}
                onClick={() => setSelectedSprint('upcoming')}
                className={selectedSprint === 'upcoming' ? 'bg-blue-600' : 'border-gray-700 text-gray-300'}
              >
                Upcoming ({upcomingSprints?.length || 0})
              </Button>
              <Button
                variant={selectedSprint === 'completed' ? 'default' : 'outline'}
                onClick={() => setSelectedSprint('completed')}
                className={selectedSprint === 'completed' ? 'bg-blue-600' : 'border-gray-700 text-gray-300'}
              >
                Completed ({completedSprints?.length || 0})
              </Button>
            </div>

            {/* Active Sprints */}
            {selectedSprint === 'active' && (
              <div className="space-y-4">
                {!activeSprints || activeSprints.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700/50">
                    <CardContent className="p-12 text-center">
                      <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No active sprints</p>
                      <p className="text-sm text-gray-500 mt-2">Create a new sprint to get started</p>
                    </CardContent>
                  </Card>
                ) : (
                  activeSprints.map((milestone: any) => {
                    const health = getSprintHealth(milestone.health);
                    const daysLeft = milestone.daysLeft;

                    return (
                      <Card key={milestone._id} className="bg-gray-800/50 border-gray-700/50 hover:border-blue-500/30 transition-all">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Milestone Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-white">{milestone.title}</h3>
                                  <Badge className={`${health.bg} ${health.color}`}>
                                    {health.label}
                                  </Badge>
                                  <Badge className="bg-purple-500/20 text-purple-300">
                                    📁 {milestone.projectName}
                                  </Badge>
                                  <Badge className="bg-gray-700 text-gray-300">
                                    {milestone.projectDepartment}
                                  </Badge>
                                </div>
                                <p className="text-gray-400 text-sm">{milestone.description}</p>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => window.location.href = `/milestones/${milestone._id}`}
                              >
                                View Details
                              </Button>
                            </div>

                            {/* Milestone Progress */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-300">Milestone Progress</span>
                                <span className="text-sm font-bold text-white">
                                  {milestone.completedTasks}/{milestone.totalTasks} tasks ({milestone.progress}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    milestone.progress >= 80
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                      : milestone.progress >= 50
                                      ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                                      : 'bg-gradient-to-r from-red-500 to-pink-400'
                                  }`}
                                  style={{ width: `${milestone.progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Milestone Meta */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Target className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Target Date</div>
                                  <div className="text-sm font-medium text-white">
                                    {milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'Not set'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Time Left</div>
                                  <div className={`text-sm font-medium ${daysLeft <= 3 ? 'text-red-400' : 'text-white'}`}>
                                    {daysLeft} days
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-gray-400">
                                <Flag className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Status</div>
                                  <div className="text-sm font-medium text-white capitalize">
                                    {milestone.status.replace('_', ' ')}
                                  </div>
                                </div>
                              </div>
                            </div>


                            {/* Quick Stats */}
                            <div className="flex gap-2 pt-2">
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {milestone.completedTasks} Done
                              </Badge>
                              <Badge className="bg-blue-500/20 text-blue-300">
                                <Clock className="w-3 h-3 mr-1" />
                                {milestone.totalTasks - milestone.completedTasks} Remaining
                              </Badge>
                              {daysLeft <= 3 && (
                                <Badge className="bg-red-500/20 text-red-300">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Due Soon
                                </Badge>
                              )}
                              <Badge className="bg-purple-500/20 text-purple-300">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {milestone.progress}% Complete
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* Upcoming Sprints */}
            {selectedSprint === 'upcoming' && (
              <div className="space-y-4">
                {!upcomingSprints || upcomingSprints.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700/50">
                    <CardContent className="p-12 text-center">
                      <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No upcoming sprints</p>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingSprints.map((milestone: any) => (
                    <Card key={milestone._id} className="bg-gray-800/50 border-gray-700/50 hover:border-purple-500/30 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-white">{milestone.title}</h3>
                              <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                                📁 {milestone.projectName}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{milestone.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                Target: {milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'Not set'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Flag className="w-4 h-4" />
                                {milestone.totalTasks} tasks
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-600"
                            onClick={() => window.location.href = `/milestones/${milestone._id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Create Milestone Modal */}
            <CreateMilestoneModal
              isOpen={showCreateModal}
              onClose={() => {
                setShowCreateModal(false);
                setDefaultMilestoneTitle(""); // Clear title on close
              }}
              projects={projects || []}
              onSuccess={() => {
                // Refresh milestones list
                window.location.reload();
              }}
              defaultTitle={defaultMilestoneTitle}
            />


            {/* Completed Sprints */}
            {selectedSprint === 'completed' && (
              <div className="space-y-4">
                {!completedSprints || completedSprints.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700/50">
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No completed sprints</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedSprints.map((milestone: any) => (
                    <Card key={milestone._id} className="bg-gray-800/50 border-gray-700/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white">{milestone.title}</h3>
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                              <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                                📁 {milestone.projectName}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{milestone.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Completed {milestone.completedAt ? new Date(milestone.completedAt).toLocaleDateString() : 'Recently'}</span>
                              <span>•</span>
                              <span>{milestone.completedTasks}/{milestone.totalTasks} tasks completed</span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-600"
                            onClick={() => window.location.href = `/milestones/${milestone._id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
