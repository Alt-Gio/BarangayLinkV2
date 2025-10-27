"use client";

import { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Users,
  ArrowLeft,
  Briefcase,
  ListChecks,
  TrendingUp,
} from 'lucide-react';

export default function MilestoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const milestoneId = resolvedParams.id;
  
  const { currentUser } = useOfflineData();
  const milestone = useQuery(api.milestones.getMilestoneDetails, { 
    milestoneId: milestoneId as any 
  });

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

  if (!milestone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Milestone not found</p>
          <Button 
            onClick={() => window.location.href = '/events/sprints'}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Back to Sprint Board
          </Button>
        </div>
      </div>
    );
  }

  const totalTasks = milestone.tasks?.length || 0;
  const completedTasks = milestone.tasks?.filter((t: any) => t.completed).length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const daysLeft = milestone.targetDate 
    ? Math.ceil((milestone.targetDate - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'blocked': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Milestone Details"
        dashboardSubtitle="View milestone progress"
        isOpen={false}
        onToggle={() => {}}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/events/sprints'}
              className="border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sprint Board
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.location.href = `/milestones/${milestoneId}/kanban`}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Open Kanban Board
              </Button>
              <Badge className={getStatusColor(milestone.status)}>
                {milestone.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Milestone Overview */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl text-white flex items-center gap-3 mb-2">
                    <Target className="w-8 h-8 text-blue-400" />
                    {milestone.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-purple-500/20 text-purple-300">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {milestone.projectName}
                    </Badge>
                    <Badge className="bg-gray-700 text-gray-300">
                      {milestone.projectDepartment}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300">{milestone.description}</p>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Progress</span>
                  <span className="text-sm font-bold text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progress >= 80
                        ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                        : progress >= 50
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                        : 'bg-gradient-to-r from-red-500 to-pink-400'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {completedTasks} of {totalTasks} tasks completed
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Target Date</span>
                  </div>
                  <p className="text-white font-semibold">
                    {milestone.targetDate 
                      ? new Date(milestone.targetDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Time Left</span>
                  </div>
                  <p className={`font-semibold ${daysLeft && daysLeft <= 3 ? 'text-red-400' : 'text-white'}`}>
                    {daysLeft !== null ? `${daysLeft} days` : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <ListChecks className="w-4 h-4" />
                    <span className="text-xs">Total Tasks</span>
                  </div>
                  <p className="text-white font-semibold">{totalTasks}</p>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Completion</span>
                  </div>
                  <p className="text-white font-semibold">{progress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                Tasks ({totalTasks})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!milestone.tasks || milestone.tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ListChecks className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tasks in this milestone</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestone.tasks.map((task: any) => (
                    <div
                      key={task._id}
                      className={`p-4 rounded-lg border transition-all ${
                        task.completed
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {task.completed && (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            )}
                            <h4 className={`font-semibold ${task.completed ? 'text-green-300 line-through' : 'text-white'}`}>
                              {task.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                              {task.storyPoints || 0} pts
                            </Badge>
                            <Badge className="bg-purple-500/20 text-purple-300 text-xs capitalize">
                              {task.priority || 'medium'}
                            </Badge>
                            {task.assignees && task.assignees.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {task.assignees.length} assigned
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {task.dueDate && (
                          <div className="text-xs text-gray-400">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
