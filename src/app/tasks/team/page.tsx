"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  Target,
  Award,
  Calendar,
  User,
  Zap,
  BarChart3,
  ListTodo,
  FolderOpen
} from 'lucide-react';

export default function TeamTasksPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get current user
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Get all projects user has access to
  const projects = useQuery(api.projects.getAllProjects);
  
  // Get tasks for selected project
  const projectTasks = useQuery(
    api.gamifiedTasks.getProjectTasks,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  // Get project stats
  const projectStats = useQuery(
    api.gamifiedTasks.getProjectStats,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  // Get all team members for selected project
  const teamMembers = useQuery(
    api.projects.getProjectTeamMembers,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  const selectedProject = projects?.find(p => p._id === selectedProjectId);

  // Group tasks by team member
  const tasksByMember = projectTasks?.reduce((acc: any, task: any) => {
    const assignedUserId = task.assignedTo;
    if (!acc[assignedUserId]) {
      acc[assignedUserId] = [];
    }
    acc[assignedUserId].push(task);
    return acc;
  }, {}) || {};

  // Filter tasks
  const filteredTasks = projectTasks?.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'todo': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'easy': return 'text-green-400';
      case 'trivial': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-500" />
              Team Tasks & Progress
            </h1>
            <p className="text-gray-400 mt-2">View team workload and project progress</p>
          </div>
        </div>

        {/* Project Selector */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-500" />
              Select a Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects && projects.length > 0 ? (
                projects.map((project: any) => (
                  <button
                    key={project._id}
                    onClick={() => setSelectedProjectId(project._id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedProjectId === project._id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{project.title}</h3>
                      <Badge className={getPriorityColor(project.priority)} variant="outline">
                        {project.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {project.assignedTo?.length || 0} members
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {project.progress || 0}% complete
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No projects available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Overview (when selected) */}
        {selectedProject && projectStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <ListTodo className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{projectStats.totalTasks}</div>
                    <div className="text-sm text-gray-400">Total Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{projectStats.completedTasks}</div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{projectStats.inProgressTasks}</div>
                    <div className="text-sm text-gray-400">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{projectStats.totalXP}</div>
                    <div className="text-sm text-gray-400">Total XP</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search (when project selected) */}
        {selectedProject && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks..."
                    className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Member Tasks (when project selected) */}
        {selectedProject && teamMembers && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
              Team Workload
            </h2>

            {teamMembers.map((member: any) => {
              const memberTasks = tasksByMember[member._id] || [];
              const completed = memberTasks.filter((t: any) => t.status === 'completed').length;
              const inProgress = memberTasks.filter((t: any) => t.status === 'in_progress').length;
              const todo = memberTasks.filter((t: any) => t.status === 'todo').length;
              const totalXP = memberTasks.reduce((sum: number, t: any) => 
                sum + (t.status === 'completed' ? (t.experienceReward || 0) : 0), 0
              );

              return (
                <Card key={member._id} className="bg-gray-800/50 border-gray-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.imageUrl} />
                          <AvatarFallback className="bg-emerald-600 text-white">
                            {member.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>{member.position}</span>
                            <span>•</span>
                            <Badge className="bg-gray-700/50 text-gray-300 border-gray-600/20">
                              {member.userLevel?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{completed}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{inProgress}</div>
                          <div className="text-xs text-gray-500">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-400">{todo}</div>
                          <div className="text-xs text-gray-500">To Do</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{totalXP}</div>
                          <div className="text-xs text-gray-500">XP Earned</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {memberTasks.length > 0 ? (
                      <div className="space-y-3">
                        {memberTasks
                          .filter((task: any) => {
                            const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
                            return matchesSearch && matchesStatus;
                          })
                          .map((task: any) => (
                          <div
                            key={task._id}
                            className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-white">{task.title}</h4>
                                  <Badge className={getStatusColor(task.status)} variant="outline">
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={getPriorityColor(task.priority)} variant="outline">
                                    {task.priority}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  <span className={`flex items-center gap-1 ${getDifficultyColor(task.difficulty)}`}>
                                    <Zap className="w-3 h-3" />
                                    {task.difficulty}
                                  </span>
                                  <span className="flex items-center gap-1 text-yellow-400">
                                    <Award className="w-3 h-3" />
                                    {task.experienceReward || 0} XP
                                  </span>
                                  {task.estimatedHours && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.estimatedHours}h estimated
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <User className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm">No tasks assigned yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {teamMembers.length === 0 && (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No team members in this project</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Prompt to select project */}
        {!selectedProject && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Project</h3>
              <p className="text-gray-400">Choose a project above to view team tasks and progress</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
