"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Menu,
  Flag,
  Calendar,
  Target,
  TrendingUp,
  ListTodo,
  Briefcase,
  Users,
  Filter,
  Search,
  ArrowRight,
  CheckCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

export default function MyDutiesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();
  
  // Get user's event tasks
  const myEventTasks = useQuery(api.eventControl.getMyEventTasks);
  
  // Get user's project tasks
  const myProjectTasks = useQuery(api.gamifiedTasks.getMyProjectTasks);

  // Mutations
  const updateEventTaskStatus = useMutation(api.eventControl.updateTaskStatus);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your duties...</p>
        </div>
      </div>
    );
  }

  // Process event tasks
  const eventTasks = myEventTasks || [];
  
  // Process project tasks
  const allProjectTasks = myProjectTasks ? Object.values(myProjectTasks).flatMap((group: any) => group.tasks) : [];
  const uniqueProjectTasks = Array.from(new Map(allProjectTasks.map((task: any) => [task._id, task])).values());

  // Apply filters to event tasks
  let filteredEventTasks = eventTasks;
  
  if (searchQuery) {
    filteredEventTasks = filteredEventTasks.filter((task: any) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.event?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (filterPriority !== 'all') {
    filteredEventTasks = filteredEventTasks.filter((task: any) => task.priority === filterPriority);
  }
  
  if (filterStatus !== 'all') {
    filteredEventTasks = filteredEventTasks.filter((task: any) => task.status === filterStatus);
  }
  
  if (showOverdueOnly) {
    filteredEventTasks = filteredEventTasks.filter((task: any) => 
      task.dueDate && task.dueDate < Date.now() && task.status !== 'done'
    );
  }
  
  // Sort tasks
  filteredEventTasks = [...filteredEventTasks].sort((a: any, b: any) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    } else if (sortBy === 'priority') {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 99);
    } else {
      const statusOrder = { blocked: 0, in_progress: 1, in_review: 2, todo: 3, done: 4 };
      return (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99);
    }
  });

  // Calculate stats
  const totalDuties = eventTasks.length + uniqueProjectTasks.length;
  const eventDutiesCount = eventTasks.length;
  const projectDutiesCount = uniqueProjectTasks.length;
  
  const completedEventTasks = eventTasks.filter((t: any) => t.status === 'done').length;
  const inProgressEventTasks = eventTasks.filter((t: any) => t.status === 'in_progress').length;
  const overdueEventTasks = eventTasks.filter((t: any) => t.dueDate && t.dueDate < Date.now() && t.status !== 'done').length;
  
  const upcomingEvents = eventTasks.filter((t: any) => 
    t.event?.startDate && t.event.startDate < Date.now() + (7 * 24 * 60 * 60 * 1000)
  ).length;

  const handleEventTaskStatusChange = async (taskId: Id<"eventTasks">, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      await updateEventTaskStatus({ 
        taskId, 
        newStatus: newStatus as "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked"
      });
      setSuccessMessage(`Task ${newStatus === 'done' ? 'completed' : 'updated'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update task status. Please try again.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-emerald-500/20 text-emerald-300";
      case "in_progress": return "bg-blue-500/20 text-blue-300";
      case "in_review": return "bg-purple-500/20 text-purple-300";
      case "blocked": return "bg-red-500/20 text-red-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="My Duties"
        dashboardSubtitle="All your assignments"
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
          <h1 className="text-lg font-semibold text-white">My Duties</h1>
          <div className="w-9" />
        </div>

        <div className="p-6 space-y-6">
          <div className="max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-emerald-400" />
                  My Duties
                </h1>
                <p className="text-gray-400 mt-1">All your assigned duties from events and projects</p>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                      <ListTodo className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Total Duties</div>
                      <div className="text-2xl font-bold text-white">{totalDuties}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Event Duties</div>
                      <div className="text-2xl font-bold text-white">{eventDutiesCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Events Soon</div>
                      <div className="text-2xl font-bold text-white">{upcomingEvents}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">In Progress</div>
                      <div className="text-2xl font-bold text-white">{inProgressEventTasks}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300">{successMessage}</span>
              </div>
            )}

            {/* Filters */}
            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search duties..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'status')}
                  className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showOverdueOnly 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/50' 
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  {showOverdueOnly ? 'Showing Overdue Only' : 'Show Overdue Only'}
                  {overdueEventTasks > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">{overdueEventTasks}</Badge>
                  )}
                </button>
                
                {(searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || showOverdueOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterPriority('all');
                      setFilterStatus('all');
                      setShowOverdueOnly(false);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Event Duties Section */}
            {filteredEventTasks.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Event Duties</h2>
                  <Badge className="bg-emerald-500/20 text-emerald-300 ml-auto">
                    {filteredEventTasks.length} duties
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEventTasks.map((task: any) => {
                    const isPastDue = task.dueDate && task.dueDate < Date.now() && task.status !== 'done';
                    const isEventSoon = task.event?.startDate && task.event.startDate < Date.now() + (7 * 24 * 60 * 60 * 1000);

                    return (
                      <Card 
                        key={task._id} 
                        className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 hover:border-emerald-500/50 transition-all ${isPastDue ? 'border-red-500/50 shadow-lg shadow-red-500/10' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Event Badge */}
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                              <span 
                                className="text-sm font-semibold text-emerald-400 truncate cursor-pointer hover:text-emerald-300"
                                onClick={() => window.location.href = `/events/${task.event._id}/control`}
                              >
                                {task.event?.title}
                              </span>
                              {isEventSoon && (
                                <Badge className="bg-orange-500/20 text-orange-300 text-xs ml-auto">
                                  Soon
                                </Badge>
                              )}
                            </div>

                            {/* Task Title */}
                            <h4 className="font-semibold text-white line-clamp-2">{task.title}</h4>

                            {/* Task Description */}
                            {task.description && (
                              <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                            )}

                            {/* Task Meta */}
                            <div className="flex flex-wrap gap-2">
                              <Badge className={`text-xs border ${getPriorityColor(task.priority)}`}>
                                <Flag className="w-3 h-3 mr-1" />
                                {task.priority}
                              </Badge>

                              <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {task.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                                {task.status === 'blocked' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {task.status === 'todo' && <Circle className="w-3 h-3 mr-1" />}
                                {task.status.replace('_', ' ')}
                              </Badge>

                              {task.estimatedHours && (
                                <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {task.estimatedHours}h
                                </Badge>
                              )}
                            </div>

                            {/* Event Details */}
                            <div className="pt-2 border-t border-gray-700/50 space-y-1">
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>Event: {new Date(task.event.startDate).toLocaleDateString()}</span>
                              </div>
                              
                              {task.dueDate && (
                                <div className={`flex items-center gap-2 text-xs ${isPastDue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                  {isPastDue && <AlertCircle className="w-3 h-3 ml-auto animate-pulse" />}
                                </div>
                              )}

                              {task.creator && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage src={task.creator.imageUrl} />
                                    <AvatarFallback className="bg-emerald-600 text-white text-xs">
                                      {task.creator.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>By {task.creator.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {task.progress > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>Progress</span>
                                  <span className="text-emerald-400 font-semibold">{task.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Status Update Buttons */}
                            <div className="flex gap-2">
                              {task.status !== 'in_progress' && task.status !== 'done' && (
                                <Button 
                                  size="sm"
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-50"
                                  onClick={() => handleEventTaskStatusChange(task._id, 'in_progress')}
                                  disabled={updatingTaskId === task._id}
                                >
                                  {updatingTaskId === task._id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                  ) : (
                                    <Zap className="w-3 h-3 mr-1" />
                                  )}
                                  Start
                                </Button>
                              )}
                              
                              {task.status === 'in_progress' && (
                                <Button 
                                  size="sm"
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50"
                                  onClick={() => handleEventTaskStatusChange(task._id, 'done')}
                                  disabled={updatingTaskId === task._id}
                                >
                                  {updatingTaskId === task._id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                  ) : (
                                    <CheckCheck className="w-3 h-3 mr-1" />
                                  )}
                                  Complete
                                </Button>
                              )}
                              
                              <Button 
                                size="sm"
                                variant="outline"
                                className="flex-1 border-gray-600 hover:bg-gray-700 text-xs"
                                onClick={() => window.location.href = `/events/${task.event._id}/control`}
                              >
                                <Target className="w-3 h-3 mr-1" />
                                Event Board
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Project Duties Section */}
            {uniqueProjectTasks.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Project Duties</h2>
                  <Badge className="bg-blue-500/20 text-blue-300 ml-auto">
                    {uniqueProjectTasks.length} duties
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniqueProjectTasks.slice(0, 6).map((task: any) => (
                    <Card 
                      key={task._id} 
                      className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 hover:border-blue-500/50 transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Project Badge */}
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-blue-400 truncate">
                              Project Task
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4 className="font-semibold text-white line-clamp-2">{task.title}</h4>

                          {/* Task Description */}
                          {task.description && (
                            <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                          )}

                          {/* Task Meta */}
                          <div className="flex flex-wrap gap-2">
                            {task.priority && (
                              <Badge className={`text-xs border ${getPriorityColor(task.priority)}`}>
                                <Flag className="w-3 h-3 mr-1" />
                                {task.priority}
                              </Badge>
                            )}

                            {task.status && (
                              <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {task.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                                {task.status === 'blocked' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {task.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>

                          {/* View Project Button */}
                          <Button 
                            size="sm"
                            variant="outline"
                            className="w-full border-gray-600 hover:bg-gray-700 text-xs"
                            onClick={() => window.location.href = '/projects'}
                          >
                            <Target className="w-3 h-3 mr-1" />
                            View in Projects
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {uniqueProjectTasks.length > 6 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline"
                      className="border-gray-600 hover:bg-gray-700"
                      onClick={() => window.location.href = '/projects'}
                    >
                      View All {uniqueProjectTasks.length} Project Duties
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {filteredEventTasks.length === 0 && uniqueProjectTasks.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No duties found</h3>
                <p className="text-gray-500">
                  {searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || showOverdueOnly
                    ? 'Try adjusting your filters' 
                    : 'You have no assigned duties at the moment'}
                </p>
              </div>
            )}
            
            {filteredEventTasks.length === 0 && uniqueProjectTasks.length > 0 && (
              <div className="text-center py-8 mb-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400 mb-1">No event duties found</h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || showOverdueOnly
                    ? 'Try adjusting your filters' 
                    : 'You have no assigned event duties at the moment'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
