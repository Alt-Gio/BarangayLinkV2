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
  Trophy,
  Zap,
  Calendar,
  Star,
  MoreVertical,
  Filter,
  Search,
  Plus,
  Target,
  Flame,
  CheckCheck,
  AlertTriangle,
  Briefcase,
  ListTodo,
  ArrowRight
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

export default function MyTasksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'event' | 'project'>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current user from offline context (cached, saves bandwidth!)
  const { currentUser, isOnline } = useOfflineData();
  
  // Get user's tasks from all projects
  const myProjectTasks = useQuery(api.gamifiedTasks.getMyProjectTasks);
  
  // Get user's event tasks (NEW!)
  const myEventTasks = useQuery(api.eventControl.getMyEventTasks);
  
  // Get user's projects
  const myProjects = useQuery(api.productivity.getProjects, { limit: 100 });
  
  // Get user stats
  const userStats = useQuery(api.gamifiedTasks.getUserStats, {});

  // Mutations
  const updateTaskStatus = useMutation(api.gamifiedTasks.updateTaskStatus);
  const updateEventTaskStatus = useMutation(api.eventControl.updateTaskStatus);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="bg-white/10 rounded-lg p-3 space-y-2">
              <div className="h-3 bg-white/15 rounded animate-pulse" />
              <div className="h-3 bg-white/15 rounded animate-pulse w-4/5" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Flatten project tasks into a single array
  const allProjectTasks = myProjectTasks ? Object.values(myProjectTasks).flatMap((group: any) => group.tasks) : [];
  
  // Remove duplicates based on task._id
  const uniqueTasks = Array.from(new Map(allProjectTasks.map((task: any) => [task._id, task])).values());
  
  // Apply filters
  let filteredTasks = uniqueTasks;
  
  if (searchQuery) {
    filteredTasks = filteredTasks.filter((task: any) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (filterPriority !== 'all') {
    filteredTasks = filteredTasks.filter((task: any) => task.priority === filterPriority);
  }
  
  if (filterProject !== 'all') {
    filteredTasks = filteredTasks.filter((task: any) => task.projectId === filterProject);
  }
  
  // Group tasks by status (Kanban columns)
  const tasksByStatus = {
    todo: filteredTasks.filter((t: any) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t: any) => t.status === 'in_progress'),
    review: filteredTasks.filter((t: any) => t.status === 'review'),
    completed: filteredTasks.filter((t: any) => t.status === 'completed'),
  };
  
  // Process event tasks
  const eventTasks = myEventTasks || [];
  
  // Filter event tasks
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
  
  // Sort event tasks
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
  
  // Stats
  const totalTasks = uniqueTasks.length + eventTasks.length;
  const completedTasks = tasksByStatus.completed.length;
  const inProgressTasks = tasksByStatus.in_progress.length;
  const todoTasks = tasksByStatus.todo.length;
  const reviewTasks = tasksByStatus.review.length;
  const eventTaskCount = eventTasks.length;
  const projectTaskCount = uniqueTasks.length;
  const overdueEventTasks = eventTasks.filter((t: any) => 
    t.dueDate && t.dueDate < Date.now() && t.status !== 'done'
  ).length;
  const completedEventTasks = eventTasks.filter((t: any) => t.status === 'done').length;
  const inProgressEventTasks = eventTasks.filter((t: any) => t.status === 'in_progress').length;

  // User stats
  const level = userStats?.user?.level || 1;
  const xp = userStats?.user?.experience || 0;
  const xpToNextLevel = userStats?.nextLevelXP || (level * 100);
  const xpProgress = (xp / xpToNextLevel) * 100;
  const streak = userStats?.user?.streakCount || 0;
  const gold = userStats?.user?.gold || 0;

  const handleStatusChange = async (taskId: Id<"tasks">, newStatus: string) => {
    try {
      await updateTaskStatus({ 
        taskId, 
        status: newStatus as "todo" | "in_progress" | "review" | "completed" | "cancelled"
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "trivial": return "bg-gray-500/20 text-gray-300";
      case "easy": return "bg-green-500/20 text-green-300";
      case "medium": return "bg-yellow-500/20 text-yellow-300";
      case "hard": return "bg-red-500/20 text-red-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "text-gray-400";
      case "medium": return "text-blue-400";
      case "high": return "text-orange-400";
      case "urgent": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  // Status columns configuration
  const statusColumns = [
    { 
      id: "todo", 
      label: "To Do", 
      icon: Circle, 
      color: "text-gray-400",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-500/30"
    },
    { 
      id: "in_progress", 
      label: "In Progress", 
      icon: Clock, 
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30"
    },
    { 
      id: "review", 
      label: "Review", 
      icon: AlertCircle, 
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30"
    },
    { 
      id: "completed", 
      label: "Completed", 
      icon: CheckCircle2, 
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-500/30"
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="My Tasks"
        dashboardSubtitle="Manage your tasks"
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
          <h1 className="text-lg font-semibold text-white">My Tasks</h1>
          <div className="w-9" />
        </div>

        <div className="p-6 space-y-6">
          <div className="max-w-[1920px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-emerald-400" />
                  My Tasks
                </h1>
                <p className="text-gray-400 mt-1">All your tasks from events and projects in one place</p>
              </div>
            </div>

            {/* Player Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Star className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Level</div>
                      <div className="text-2xl font-bold text-white">{level}</div>
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
                    <div className="flex-1">
                      <div className="text-xs text-gray-400">Experience</div>
                      <div className="text-sm font-bold text-white">{xp} / {xpToNextLevel} XP</div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${xpProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Streak</div>
                      <div className="text-2xl font-bold text-white">{streak} days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Gold</div>
                      <div className="text-2xl font-bold text-white">{gold}</div>
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

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                      <ListTodo className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Total Tasks</div>
                      <div className="text-2xl font-bold text-white">{totalTasks}</div>
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
                      <div className="text-xs text-gray-400">Event Tasks</div>
                      <div className="text-2xl font-bold text-white">{eventTaskCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Project Tasks</div>
                      <div className="text-2xl font-bold text-white">{projectTaskCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Overdue</div>
                      <div className="text-2xl font-bold text-white">{overdueEventTasks}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalTasks}</div>
                    <div className="text-xs text-gray-400 mt-1">Total Tasks</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-300">{todoTasks}</div>
                    <div className="text-xs text-gray-400 mt-1">To Do</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-300">{inProgressTasks}</div>
                    <div className="text-xs text-blue-400 mt-1">In Progress</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-300">{reviewTasks}</div>
                    <div className="text-xs text-yellow-400 mt-1">Review</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-300">{completedTasks}</div>
                    <div className="text-xs text-emerald-400 mt-1">Completed</div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                    placeholder="Search tasks..."
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Projects</option>
                {myProjects?.map((project: any) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium active:scale-95 transition-all ${
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
                
                {(searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || filterProject !== 'all' || showOverdueOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterPriority('all');
                      setFilterStatus('all');
                      setFilterProject('all');
                      setShowOverdueOnly(false);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600 active:scale-95 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusColumns.map((column) => {
                const Icon = column.icon;
                const columnTasks = tasksByStatus[column.id as keyof typeof tasksByStatus];

                return (
                  <div key={column.id} className="space-y-3">
                    {/* Column Header */}
                    <div className={`${column.bgColor} ${column.borderColor} border rounded-lg p-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${column.color}`} />
                          <span className={`font-semibold ${column.color}`}>{column.label}</span>
                        </div>
                        <Badge className="bg-gray-700/50 text-white">{columnTasks.length}</Badge>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-2 min-h-[200px]">
                      {columnTasks.map((task: any) => {
                        const project = myProjects?.find((p: any) => p._id === task.projectId);
                        
                        return (
                          <Card 
                            key={task._id} 
                            className="bg-gray-800/70 border-gray-700/50 hover:border-emerald-500/30 transition-all cursor-pointer"
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Task Title */}
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-white text-sm line-clamp-2">{task.title}</h4>
                                  <button className="text-gray-400 hover:text-white">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Project Badge */}
                                {project && (
                                  <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                                    📁 {project.title}
                                  </Badge>
                                )}

                                {/* Task Meta */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getDifficultyColor(task.difficulty)}>
                                    <Trophy className="w-3 h-3 mr-1" />
                                    {task.difficulty}
                                  </Badge>

                                  {task.priority && (
                                    <Badge className={`${getPriorityColor(task.priority)} bg-gray-700/30`}>
                                      <Flag className="w-3 h-3 mr-1" />
                                      {task.priority}
                                    </Badge>
                                  )}

                                  {task.experienceReward && (
                                    <Badge className="bg-purple-500/20 text-purple-300">
                                      <Zap className="w-3 h-3 mr-1" />
                                      {task.experienceReward} XP
                                    </Badge>
                                  )}
                                </div>

                                {/* Assignees */}
                                {task.assignees && task.assignees.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {task.assignees.slice(0, 3).map((assignee: any) => (
                                      <Avatar key={assignee._id} className="w-6 h-6">
                                        <AvatarImage src={assignee.imageUrl} />
                                        <AvatarFallback className="bg-emerald-600 text-white text-xs">
                                          {assignee.name?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {task.assignees.length > 3 && (
                                      <span className="text-xs text-gray-400 ml-1">
                                        +{task.assignees.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Due Date */}
                                {task.dueDate && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                )}

                                {/* Status Actions */}
                                <div className="flex gap-1 flex-wrap">
                                  {statusColumns
                                    .filter(s => s.id !== column.id)
                                    .map((targetStatus) => (
                                      <button
                                        key={targetStatus.id}
                                        onClick={() => handleStatusChange(task._id, targetStatus.id)}
                                        className={`text-xs px-2 py-1 rounded ${targetStatus.bgColor} ${targetStatus.color} hover:opacity-80 transition-opacity`}
                                        title={`Move to ${targetStatus.label}`}
                                      >
                                        {targetStatus.label}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No tasks in {column.label.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Event Tasks Section */}
            {filteredEventTasks && filteredEventTasks.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <Calendar className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Event Tasks</h2>
                    <p className="text-sm text-gray-400">Tasks from events - quick actions available</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 ml-auto">
                    {filteredEventTasks.length} tasks
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEventTasks.map((task: any) => {
                    const isPastDue = task.dueDate && task.dueDate < Date.now() && task.status !== 'done';
                    const isEventSoon = task.event?.startDate && task.event.startDate < Date.now() + (7 * 24 * 60 * 60 * 1000);

                    return (
                      <Card 
                        key={task._id} 
                        className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 hover:border-emerald-500/50 transition-all cursor-pointer ${isPastDue ? 'border-red-500/50' : ''}`}
                        onClick={() => window.location.href = `/events/${task.event._id}/control`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Event Badge */}
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm font-semibold text-emerald-400 truncate">
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
                              <Badge className={`text-xs ${
                                task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                                task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-blue-500/20 text-blue-300'
                              }`}>
                                <Flag className="w-3 h-3 mr-1" />
                                {task.priority}
                              </Badge>

                              <Badge className={`text-xs ${
                                task.status === 'done' ? 'bg-emerald-500/20 text-emerald-300' :
                                task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                                task.status === 'blocked' ? 'bg-red-500/20 text-red-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
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
                                <div className={`flex items-center gap-2 text-xs ${isPastDue ? 'text-red-400' : 'text-gray-400'}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                  {isPastDue && <AlertCircle className="w-3 h-3 ml-auto" />}
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
                                  <span>Assigned by {task.creator.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {task.progress > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>Progress</span>
                                  <span>{task.progress}%</span>
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
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs disabled:opacity-50 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventTaskStatusChange(task._id, 'in_progress');
                                  }}
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
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs disabled:opacity-50 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventTaskStatusChange(task._id, 'done');
                                  }}
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
                                className="flex-1 border-gray-600 hover:bg-gray-700 active:scale-95 text-xs transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/events/${task.event._id}/control`;
                                }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
