"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRouter } from 'next/navigation';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Flag,
  ChevronDown,
  ChevronUp,
  Menu,
  ArrowLeft,
  Filter,
  BarChart3,
  Milestone as MilestoneIcon
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

export default function StrategicPlanningPage() {
  const router = useRouter();
  const { currentUser, userRole, isLoading } = useDashboardData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [view, setView] = useState<'projects' | 'milestones' | 'events'>('projects');

  const projects = useQuery(api.projects.getAllProjects) || [];
  const events = useQuery(api.events.getAllEvents) || [];

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Strategic Planning...</p>
        </div>
      </div>
    );
  }

  if (!['ADMIN', 'CAPTAIN', 'MANAGER'].includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access Strategic Planning.</p>
        </div>
      </div>
    );
  }

  const filteredProjects = projects.filter((project: any) => {
    if (filterStatus === 'all') return true;
    return project.status === filterStatus;
  });

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);
  const totalSpent = projects.reduce((sum: number, p: any) => sum + (p.spent || 0), 0);

  const upcomingEvents = events.filter((e: any) => new Date(e.startDate) > new Date()).length;
  const completedEvents = events.filter((e: any) => e.status === 'completed').length;

  const toggleProject = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in-progress':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'on-hold':
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole={userRole}
        dashboardTitle="Strategic Planning"
        dashboardSubtitle="Goals, projects, and milestones"
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
          <h1 className="text-lg font-semibold text-white">Strategic Planning</h1>
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Strategic Planning</h1>
              <p className="text-sm sm:text-base text-gray-400">Manage goals, track projects, and monitor progress</p>
            </div>
            <button
              onClick={() => router.back()}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Total Projects</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{totalProjects}</p>
                    <p className="text-xs text-green-400 mt-1">{activeProjects} active</p>
                  </div>
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Completion</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {formatPercentage(totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0)}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">{completedProjects} done</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Total Budget</p>
                    <p className="text-lg sm:text-xl font-bold text-white break-words">
                      {formatCurrency(totalBudget)}
                    </p>
                    <p className="text-xs text-yellow-400 mt-1">
                      {formatPercentage(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)} used
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Events</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{events.length}</p>
                    <p className="text-xs text-green-400 mt-1">{upcomingEvents} upcoming</p>
                  </div>
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Toggle & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setView('projects')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'projects'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Target className="w-4 h-4 inline mr-1" />
                Projects
              </button>
              <button
                onClick={() => setView('milestones')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'milestones'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Flag className="w-4 h-4 inline mr-1" />
                Milestones
              </button>
              <button
                onClick={() => setView('events')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'events'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Events
              </button>
            </div>

            {view === 'projects' && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    filterStatus === 'all'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    filterStatus === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    filterStatus === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Completed
                </button>
              </div>
            )}
          </div>

          {/* Projects View */}
          {view === 'projects' && (
            <div className="space-y-4">
              {filteredProjects.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No projects found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredProjects.map((project: any) => (
                  <Card key={project._id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      {/* Project Header */}
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleProject(project._id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                            <Badge className={`${getStatusColor(project.status)} border text-xs`}>
                              {project.status}
                            </Badge>
                            {project.priority && (
                              <Flag className={`w-4 h-4 ${getPriorityColor(project.priority)}`} />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
                        </div>
                        {expandedProject === project._id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </div>

                      {/* Project Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-400">Budget</p>
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(project.budget || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Spent</p>
                          <p className="text-sm font-semibold text-yellow-400">
                            {formatCurrency(project.spent || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Department</p>
                          <p className="text-sm font-semibold text-white">{project.department || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Start Date</p>
                          <p className="text-sm font-semibold text-white">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {project.progress !== undefined && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-cyan-400 font-semibold">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      )}

                      {/* Expanded Details */}
                      {expandedProject === project._id && (
                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Full Description</p>
                            <p className="text-sm text-gray-300">{project.description}</p>
                          </div>
                          
                          {project.endDate && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">End Date</p>
                              <p className="text-sm text-white">
                                {new Date(project.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${project._id}`);
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            View Full Details
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Milestones View */}
          {view === 'milestones' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MilestoneIcon className="w-5 h-5" />
                  Project Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProjects.map((project: any) => (
                    <div key={project._id} className="border-l-4 border-cyan-500 pl-4 py-2">
                      <h4 className="font-semibold text-white mb-2">{project.title}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${project.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className="text-sm text-gray-300">Project Status: {project.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-400">
                            {project.startDate ? `Started: ${new Date(project.startDate).toLocaleDateString()}` : 'No start date'}
                          </span>
                        </div>
                        {project.endDate && (
                          <div className="flex items-center gap-2">
                            <Flag className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              Target: {new Date(project.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events View */}
          {view === 'events' && (
            <div className="space-y-4">
              {events.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No events found</p>
                  </CardContent>
                </Card>
              ) : (
                events.map((event: any) => (
                  <Card key={event._id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                            <Badge className={`${getStatusColor(event.status)} border text-xs`}>
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{event.description}</p>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-400">Start Date</p>
                              <p className="text-white">
                                {new Date(event.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">End Date</p>
                              <p className="text-white">
                                {new Date(event.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Location</p>
                              <p className="text-white">{event.location || 'TBD'}</p>
                            </div>
                          </div>

                          {event.progress !== undefined && (
                            <div className="mt-4">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Completion</span>
                                <span className="text-cyan-400 font-semibold">{event.progress}%</span>
                              </div>
                              <Progress value={event.progress} className="h-2" />
                            </div>
                          )}
                        </div>
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
  );
}
