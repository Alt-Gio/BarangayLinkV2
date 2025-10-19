"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
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
  AlertCircle
} from 'lucide-react';

export default function SprintsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<string>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    capacity: 40, // story points
    goals: '',
    projectId: '', // Link to project
  });

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();
  
  // Get sprint data with progress
  const activeSprints = useQuery(api.sprints.getActiveSprints);
  const upcomingSprints = useQuery(api.sprints.getUpcomingSprints);
  const completedSprints = useQuery(api.sprints.getCompletedSprints);
  const stats = useQuery(api.sprints.getSprintStats);
  const projects = useQuery(api.projects.getAllProjects);
  
  // Mutations
  const createEvent = useMutation(api.events.createEvent);
  
  const handleCreateSprint = async () => {
    if (!sprintForm.title || !sprintForm.startDate || !sprintForm.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      await createEvent({
        title: sprintForm.title,
        description: sprintForm.description || `Sprint: ${sprintForm.title}\n\nGoals:\n${sprintForm.goals}`,
        type: 'project',
        startDate: new Date(sprintForm.startDate).getTime(),
        endDate: new Date(sprintForm.endDate).getTime(),
        location: 'Virtual Sprint',
        isPublic: false,
        requiresApproval: false,
        projectId: sprintForm.projectId ? (sprintForm.projectId as any) : undefined, // Link to project if selected
      });
      
      setShowCreateModal(false);
      setSprintForm({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        capacity: 40,
        goals: '',
        projectId: '',
      });
    } catch (error) {
      console.error('Failed to create sprint:', error);
      alert('Failed to create sprint. Please try again.');
    }
  };

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
        dashboardSubtitle="Event progression tracking"
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
                <p className="text-gray-400 mt-1">Track event and project progression</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Sprint
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
                      <div className="text-2xl font-bold text-white">{stats?.milestones || 0}</div>
                      <div className="text-xs text-gray-400">Milestones</div>
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
                  activeSprints.map((sprint: any) => {
                    const health = getSprintHealth(sprint.health);
                    const daysLeft = getDaysRemaining(sprint.endDate);

                    return (
                      <Card key={sprint._id} className="bg-gray-800/50 border-gray-700/50 hover:border-blue-500/30 transition-all">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Sprint Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-white">{sprint.title}</h3>
                                  <Badge className={`${health.bg} ${health.color}`}>
                                    {health.label}
                                  </Badge>
                                  {sprint.projectName && (
                                    <Badge className="bg-purple-500/20 text-purple-300">
                                      📁 {sprint.projectName}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm">{sprint.description}</p>
                              </div>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                View Details
                              </Button>
                            </div>

                            {/* Sprint Progress */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-300">Sprint Progress</span>
                                <span className="text-sm font-bold text-white">
                                  {sprint.progress.completed}/{sprint.progress.total} tasks ({sprint.progress.percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    sprint.progress.percentage >= 80
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                      : sprint.progress.percentage >= 50
                                      ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                                      : 'bg-gradient-to-r from-red-500 to-pink-400'
                                  }`}
                                  style={{ width: `${sprint.progress.percentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Sprint Meta */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700/50">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Start Date</div>
                                  <div className="text-sm font-medium text-white">
                                    {new Date(sprint.startDate).toLocaleDateString()}
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
                                <Users className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Team Size</div>
                                  <div className="text-sm font-medium text-white">
                                    {sprint.attendeeCount || 0} members
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-gray-400">
                                <Zap className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Velocity</div>
                                  <div className="text-sm font-medium text-white">
                                    {sprint.velocity} pts/day
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Timeline Indicator */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">Sprint Timeline</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                                  style={{ 
                                    width: `${Math.min(((Date.now() - sprint.startDate) / (sprint.endDate - sprint.startDate)) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-2 pt-2">
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {sprint.progress.completed} Done
                              </Badge>
                              <Badge className="bg-blue-500/20 text-blue-300">
                                <Clock className="w-3 h-3 mr-1" />
                                {sprint.progress.total - sprint.progress.completed} Remaining
                              </Badge>
                              {daysLeft <= 3 && (
                                <Badge className="bg-red-500/20 text-red-300">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Due Soon
                                </Badge>
                              )}
                              <Badge className="bg-purple-500/20 text-purple-300">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {sprint.progress.percentage}% Complete
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
                  upcomingSprints.map((sprint: any) => (
                    <Card key={sprint._id} className="bg-gray-800/50 border-gray-700/50 hover:border-purple-500/30 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">{sprint.title}</h3>
                            <p className="text-sm text-gray-400 mb-3">{sprint.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Starts {new Date(sprint.startDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {sprint.attendeeCount || 0} members
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="border-gray-600">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Create Sprint Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-2xl flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                        Create New Sprint
                      </CardTitle>
                      <Button 
                        onClick={() => setShowCreateModal(false)} 
                        variant="outline" 
                        className="border-gray-600"
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sprint Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sprint Name *
                      </label>
                      <Input
                        value={sprintForm.title}
                        onChange={(e) => setSprintForm({ ...sprintForm, title: e.target.value })}
                        placeholder="e.g., Sprint 1, Q1 Planning Sprint, Feature Development"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    {/* Link to Project */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Link to Project (Optional)
                      </label>
                      <select
                        value={sprintForm.projectId}
                        onChange={(e) => setSprintForm({ ...sprintForm, projectId: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                      >
                        <option value="" className="bg-gray-900 text-gray-300">No project (Standalone sprint)</option>
                        {projects && projects.map((project: any) => (
                          <option key={project._id} value={project._id} className="bg-gray-900 text-white">
                            {project.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Linking to a project will show this sprint in the project's Events tab
                      </p>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date *
                        </label>
                        <Input
                          type="date"
                          value={sprintForm.startDate}
                          onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date *
                        </label>
                        <Input
                          type="date"
                          value={sprintForm.endDate}
                          onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Sprint Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sprint Capacity (Story Points)
                      </label>
                      <Input
                        type="number"
                        value={sprintForm.capacity}
                        onChange={(e) => setSprintForm({ ...sprintForm, capacity: parseInt(e.target.value) || 0 })}
                        placeholder="40"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Estimated team capacity for this sprint</p>
                    </div>

                    {/* Sprint Goals */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sprint Goals
                      </label>
                      <Textarea
                        value={sprintForm.goals}
                        onChange={(e) => setSprintForm({ ...sprintForm, goals: e.target.value })}
                        placeholder="• Complete user authentication\n• Implement dashboard UI\n• Fix critical bugs"
                        rows={4}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description (Optional)
                      </label>
                      <Textarea
                        value={sprintForm.description}
                        onChange={(e) => setSprintForm({ ...sprintForm, description: e.target.value })}
                        placeholder="Additional sprint details, notes, or context..."
                        rows={3}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    {/* Quick Info */}
                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Sprint Overview
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white ml-2 font-medium">
                            {sprintForm.startDate && sprintForm.endDate
                              ? `${Math.ceil((new Date(sprintForm.endDate).getTime() - new Date(sprintForm.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Capacity:</span>
                          <span className="text-white ml-2 font-medium">{sprintForm.capacity} points</span>
                        </div>
                        {sprintForm.projectId && (
                          <div className="col-span-2">
                            <span className="text-gray-400">Linked Project:</span>
                            <span className="text-purple-300 ml-2 font-medium">
                              📁 {projects?.find((p: any) => p._id === sprintForm.projectId)?.title || 'Selected Project'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleCreateSprint}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Sprint
                      </Button>
                      <Button 
                        onClick={() => setShowCreateModal(false)}
                        variant="outline"
                        className="border-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
                  completedSprints.map((sprint: any) => (
                    <Card key={sprint._id} className="bg-gray-800/50 border-gray-700/50 opacity-75">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white">{sprint.title}</h3>
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{sprint.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Ended {new Date(sprint.endDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{sprint.progress.completed}/{sprint.progress.total} tasks completed</span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="border-gray-600">
                            View Report
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
