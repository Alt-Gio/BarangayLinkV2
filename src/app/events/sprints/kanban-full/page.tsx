"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BacklogPanel } from '@/components/sprints/BacklogPanel';
import { BurndownChart } from '@/components/sprints/BurndownChart';
import { VelocityChart } from '@/components/sprints/VelocityChart';
import { TaskDetailsPanel } from '@/components/sprints/TaskDetailsPanel';
import { QuickFilters, FilterState } from '@/components/sprints/QuickFilters';
import { SprintPlanningWizard } from '@/components/sprints/SprintPlanningWizard';
import {
  MoreVertical,
  AlertCircle,
  Flag,
  User,
  Target,
  Menu,
  Plus,
  BarChart3,
  TrendingDown,
  Rocket,
} from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';

const taskTypeIcons: Record<string, string> = {
  story: '📖',
  bug: '🐛',
  task: '✅',
  epic: '🎯',
  feature: '⭐',
};

const priorityColors: Record<string, string> = {
  low: 'border-l-blue-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
};

interface Column {
  id: string;
  title: string;
  tasks: any[];
  color: string;
}

export default function SprintKanbanFullPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [view, setView] = useState<'board' | 'backlog' | 'burndown' | 'velocity'>('board');
  const [showPlanningWizard, setShowPlanningWizard] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assignedToMe: false,
    priorities: [],
    types: [],
    showOverdue: false,
  });

  const { currentUser } = useOfflineData();
  
  const activeSprint = useQuery(api.sprintsEnhanced.getActiveSprint, {});
  const backlog = useQuery(api.sprintsEnhanced.getBacklog, {});
  const burndownData = useQuery(
    api.sprintsEnhanced.getSprintBurndown,
    activeSprint ? { sprintId: activeSprint._id } : "skip"
  );
  const velocityData = useQuery(api.sprintsEnhanced.getVelocityHistory, {});
  const projects = useQuery(api.projects.getAllProjects);
  
  const updateTaskStatus = useMutation(api.sprintsEnhanced.updateTaskStatus);

  // Filter tasks
  const filterTasks = (tasks: any[]) => {
    if (!tasks) return [];
    
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Assigned to me
    if (filters.assignedToMe && currentUser) {
      filtered = filtered.filter(t =>
        t.assignee && t.assignee._id === currentUser._id
      );
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(t => filters.priorities.includes(t.priority));
    }

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(t => filters.types.includes(t.type));
    }

    // Overdue filter
    if (filters.showOverdue) {
      filtered = filtered.filter(t => t.dueDate && t.dueDate < Date.now());
    }

    return filtered;
  };

  const filteredTasks = activeSprint ? filterTasks(activeSprint.tasks || []) : [];

  const columns: Column[] = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: filteredTasks.filter((t: any) => t.sprintStatus === 'todo'),
      color: 'bg-gray-600',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: filteredTasks.filter((t: any) => t.sprintStatus === 'in_progress'),
      color: 'bg-blue-600',
    },
    {
      id: 'in_review',
      title: 'In Review',
      tasks: filteredTasks.filter((t: any) => t.sprintStatus === 'in_review'),
      color: 'bg-purple-600',
    },
    {
      id: 'done',
      title: 'Done',
      tasks: filteredTasks.filter((t: any) => t.sprintStatus === 'done'),
      color: 'bg-green-600',
    },
  ];

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    try {
      await updateTaskStatus({
        taskId: draggableId as Id<"tasks">,
        newStatus: destination.droppableId as any,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const selectedTask = selectedTaskId
    ? activeSprint?.tasks?.find((t: any) => t._id === selectedTaskId)
    : null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sprint board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Sprint Kanban"
        dashboardSubtitle="Full JIRA-style experience"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-gray-700 text-white">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Sprint Board</h1>
          <div className="w-9" />
        </div>

        {/* Header */}
        <div className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-400" />
                {activeSprint?.name || 'No Active Sprint'}
              </h1>
              {activeSprint?.goal && (
                <p className="text-gray-400 mt-1">🎯 {activeSprint.goal}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPlanningWizard(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                New Sprint
              </Button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'board' ? 'default' : 'outline'}
                onClick={() => setView('board')}
                size="sm"
                className={view === 'board' ? 'bg-blue-600' : 'border-gray-600'}
              >
                Board
              </Button>
              <Button
                variant={view === 'backlog' ? 'default' : 'outline'}
                onClick={() => setView('backlog')}
                size="sm"
                className={view === 'backlog' ? 'bg-blue-600' : 'border-gray-600'}
              >
                Backlog
              </Button>
              <Button
                variant={view === 'burndown' ? 'default' : 'outline'}
                onClick={() => setView('burndown')}
                size="sm"
                className={view === 'burndown' ? 'bg-blue-600' : 'border-gray-600'}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Burndown
              </Button>
              <Button
                variant={view === 'velocity' ? 'default' : 'outline'}
                onClick={() => setView('velocity')}
                size="sm"
                className={view === 'velocity' ? 'bg-blue-600' : 'border-gray-600'}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Velocity
              </Button>
            </div>

            {view === 'board' && (
              <QuickFilters onFilterChange={setFilters} currentUser={currentUser} />
            )}
          </div>

          {/* Sprint Metrics */}
          {activeSprint && view === 'board' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Total Points</div>
                <div className="text-xl font-bold text-white">{activeSprint.metrics.totalPoints}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Completed</div>
                <div className="text-xl font-bold text-green-400">{activeSprint.metrics.completedPoints}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Remaining</div>
                <div className="text-xl font-bold text-orange-400">{activeSprint.metrics.remainingPoints}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Velocity</div>
                <div className="text-xl font-bold text-purple-400">{activeSprint.metrics.velocity} pts/day</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Days Left</div>
                <div className="text-xl font-bold text-blue-400">{activeSprint.metrics.daysRemaining}</div>
              </div>
            </div>
          )}
        </div>

        {/* Board View */}
        {view === 'board' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
            {!activeSprint ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Active Sprint</h3>
                  <p className="text-gray-400 mb-4">Create a sprint to start planning</p>
                  <Button
                    onClick={() => setShowPlanningWizard(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Create Sprint
                  </Button>
                </div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                  {columns.map((column) => (
                    <div key={column.id} className="flex flex-col min-h-0">
                      <div className={`${column.color} rounded-t-lg p-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{column.title}</h3>
                          <Badge className="bg-white/20 text-white">{column.tasks.length}</Badge>
                        </div>
                        <button className="text-white hover:bg-white/10 rounded p-1">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 bg-gray-800/30 rounded-b-lg p-2 space-y-2 overflow-y-auto ${
                              snapshot.isDraggingOver ? 'bg-blue-500/10 border-2 border-blue-500/50' : ''
                            }`}
                          >
                            {column.tasks.map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedTaskId(task._id)}
                                    className={`transform transition-all ${
                                      snapshot.isDragging ? 'rotate-2 scale-105' : ''
                                    }`}
                                  >
                                    <TaskCard task={task} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            
                            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
                              <div className="text-center py-8 text-gray-500 text-sm">
                                Drop tasks here
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            )}
          </div>
        )}

        {/* Backlog View */}
        {view === 'backlog' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              <BacklogPanel
                backlog={backlog || []}
                activeSprint={activeSprint}
                onRefresh={() => {}}
              />
            </div>
          </div>
        )}

        {/* Burndown View */}
        {view === 'burndown' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              {burndownData ? (
                <BurndownChart burndownData={burndownData} />
              ) : (
                <div className="text-center py-12">
                  <TrendingDown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No burndown data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Velocity View */}
        {view === 'velocity' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              {velocityData ? (
                <VelocityChart velocityData={velocityData} />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Complete sprints to see velocity data</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetailsPanel
          task={selectedTask}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={() => {}}
        />
      )}

      {/* Sprint Planning Wizard */}
      <SprintPlanningWizard
        isOpen={showPlanningWizard}
        onClose={() => setShowPlanningWizard(false)}
        onSuccess={() => {}}
        projects={projects || []}
      />
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <Card 
      className={`bg-gray-800 border-gray-700 border-l-4 ${priorityColors[task.priority]} hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{taskTypeIcons[task.type] || '📄'}</span>
            <span className="text-xs text-gray-400 font-mono">
              {task._id.slice(-4).toUpperCase()}
            </span>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug">
          {task.title}
        </h4>

        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            {task.storyPoints && (
              <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                {task.storyPoints} pts
              </Badge>
            )}
            {(task.priority === 'high' || task.priority === 'critical') && (
              <Flag className={`w-3 h-3 ${
                task.priority === 'critical' ? 'text-red-400' : 'text-orange-400'
              }`} />
            )}
          </div>

          {task.assignee ? (
            <Avatar className="w-6 h-6 border border-gray-600">
              <AvatarImage src={task.assignee.imageUrl} />
              <AvatarFallback className="text-xs bg-blue-600">
                {task.assignee.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
