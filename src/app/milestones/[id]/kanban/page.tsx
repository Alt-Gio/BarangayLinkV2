"use client";

import { use, useState, useEffect } from 'react';
import * as React from 'react';
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
import { TaskDetailsPanel } from '@/components/sprints/TaskDetailsPanel';
import { InlineColumnEditor } from '@/components/kanban/InlineColumnEditor';
import { QuickFilters, FilterState } from '@/components/sprints/QuickFilters';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast, Toaster } from 'sonner';
import {
  MoreVertical,
  Flag,
  User,
  Target,
  Menu,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Briefcase,
  BarChart3,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';

const taskTypeIcons: Record<string, string> = {
  story: '📖',
  bug: '🐛',
  task: '✅',
  todo: '📝',
  epic: '🎯',
  feature: '⭐',
};

const priorityColors: Record<string, string> = {
  low: 'border-l-blue-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

interface Column {
  id: string;
  title: string;
  tasks: any[];
  color: string;
  isDefault?: boolean;
  isAddButton?: boolean;
  columnId?: any;
}

export default function MilestoneKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const milestoneId = resolvedParams.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [view, setView] = useState<'board' | 'backlog' | 'burndown' | 'velocity'>('board');
  const [activeColumnEditor, setActiveColumnEditor] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assignedToMe: false,
    priorities: [],
    types: [],
    showOverdue: false,
  });
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'todo',
    difficulty: 'medium',
    priority: 'medium',
    storyPoints: 3,
    dueDate: '',
    assignedTo: [] as string[],
    status: 'todo',
    tags: [] as string[],
  });

  const { currentUser } = useOfflineData();
  
  // Get milestone details with tasks
  const milestone = useQuery(
    api.milestones.getMilestoneDetails,
    { milestoneId: milestoneId as any }
  );

  // Get kanban columns from database
  const dbColumns = useQuery(
    api.kanbanColumns.getColumns,
    { milestoneId: milestoneId as any }
  );

  // Initialize default columns if none exist
  const initColumns = useMutation(api.kanbanColumns.initializeDefaultColumns);
  
  const updateTaskStatus = useMutation(api.tasks.updateTask);
  const createTask = useMutation(api.tasks.createTask);

  const removeTaskList = useMutation(api.kanbanColumns.removeTaskListColumns);
  const toggleWorkingOnIt = useMutation(api.tasks.toggleWorkingOnIt);
  
  // Notification mutations
  const notifyTaskAssignment = useMutation(api.taskNotifications.notifyTaskAssignment);
  const notifyWorkingOnItMutation = useMutation(api.taskNotifications.notifyWorkingOnIt);
  const notifyTaskCompleted = useMutation(api.taskNotifications.notifyTaskCompleted);
  const notifyTaskReadyForReview = useMutation(api.taskNotifications.notifyTaskReadyForReview);

  // Initialize columns on first load
  React.useEffect(() => {
    if (dbColumns === null) {
      initColumns({ milestoneId: milestoneId as any });
    }
  }, [dbColumns, initColumns, milestoneId]);

  // Auto-remove "Task List" column if it exists
  React.useEffect(() => {
    if (dbColumns && dbColumns.some((col: any) => col.statusKey === 'task_list')) {
      console.log('Found Task List column, removing...');
      removeTaskList({ milestoneId: milestoneId as any });
    }
  }, [dbColumns, removeTaskList, milestoneId]);

  const tasks = milestone?.tasks || [];

  // Filter tasks
  const filterTasks = (taskList: any[]) => {
    if (!taskList) return [];
    
    let filtered = [...taskList];

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
        t.assignedTo && t.assignedTo.includes(currentUser._id)
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

  const filteredTasks = filterTasks(tasks);

  // Build dynamic columns from database
  const columns: Column[] = React.useMemo(() => {
    if (!dbColumns || dbColumns.length === 0) {
      // Return empty while loading
      return [];
    }

    const cols: Column[] = dbColumns.map((col: any) => ({
      id: col.statusKey,
      title: col.title,
      tasks: filteredTasks.filter((t: any) => t.status === col.statusKey),
      color: `bg-${col.color}-600`,
      isDefault: col.isDefault,
      columnId: col._id,
    }));

    return cols;
  }, [dbColumns, filteredTasks]);

  const selectedTask = selectedTaskId
    ? tasks.find((t: any) => t._id === selectedTaskId)
    : null;

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const task = tasks.find((t: any) => t._id === draggableId);
    if (!task) return;

    // Find target column
    const targetColumn = columns.find(c => c.id === destination.droppableId);
    const targetDbColumn = dbColumns?.find((col: any) => col.statusKey === destination.droppableId);
    
    // Get current user role (default to worker if missing)
    const userRole = currentUser?.role || 'worker';
    const userId = currentUser?._id;

    // **ROLE-BASED PERMISSION CHECKS**
    
    // 1. Check if task is locked in Review
    if (task.status === 'review') {
      // Only Manager+ can move from Review
      if (userRole === 'builder' || userRole === 'worker') {
        toast.error('🔒 Task is in review, waiting for Manager approval');
        return;
      }
    }

    // 2. Check if task is locked in Done
    if (task.status === 'completed' && task.completedBy) {
      // Only person who marked it done or equal/higher role can move it
      if (userId !== task.completedBy) {
        const canMoveFromDone = 
          userRole === 'admin' || 
          userRole === 'captain' || 
          (userRole === 'manager' && task.completedByRole !== 'admin' && task.completedByRole !== 'captain');
        
        if (!canMoveFromDone) {
          toast.error('🔒 Only the person who marked this done or higher role can move it');
          return;
        }
      }
    }

    // 3. Check if user can move this task
    const isAssigned = task.assignedTo?.includes(userId);
    
    if (userRole === 'worker') {
      if (!isAssigned) {
        toast.error('❌ Workers can only move tasks assigned to them');
        return;
      }
    } else if (userRole === 'builder') {
      if (!isAssigned && task.createdBy !== userId) {
        toast.error('❌ Builders can only move their own tasks or assigned tasks');
        return;
      }
    }
    // Manager and Admin/Captain can move Builder/Worker tasks
    
    // Validate task against column rules
    if (targetDbColumn?.rules) {
      const rules = targetDbColumn.rules;
      const errors: string[] = [];

      if (rules.requiresAssignment && (!task.assignedTo || task.assignedTo.length === 0)) {
        errors.push('Task must have at least one assignee');
      }
      if (rules.requiresDescription && !task.description) {
        errors.push('Task must have a description');
      }
      if (rules.requiresStoryPoints && !task.storyPoints) {
        errors.push('Task must have story points assigned');
      }
      if (rules.minStoryPoints && task.storyPoints && task.storyPoints < rules.minStoryPoints) {
        errors.push(`Task must have at least ${rules.minStoryPoints} story points`);
      }
      if (rules.requiresPriority && !task.priority) {
        errors.push('Task must have a priority set');
      }
      if (rules.requiresDueDate && !task.dueDate) {
        errors.push('Task must have a due date');
      }

      if (errors.length > 0) {
        toast.error(
          <div>
            <div className="font-bold">Cannot move to {targetColumn?.title}</div>
            <ul className="mt-1 text-sm">
              {errors.map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          </div>
        );
        return;
      }
    }

    try {
      const updates: any = {
        taskId: draggableId as Id<"tasks">,
        status: destination.droppableId as any,
        completed: destination.droppableId === 'completed',
      };

      // If moving to Done, mark who completed it
      if (destination.droppableId === 'completed') {
        updates.completedBy = userId;
        updates.completedByRole = userRole;
      }

      // If moving to Review, lock it
      if (destination.droppableId === 'review') {
        updates.lastMovedBy = userId;
        updates.lockedInReview = true;
      }

      await updateTaskStatus(updates);
      
      // **SEND NOTIFICATIONS**
      try {
        // Notify when task moved to Done
        if (destination.droppableId === 'completed' && userId) {
          await notifyTaskCompleted({
            taskId: draggableId as any,
            completedByUserId: userId as any,
          });
        }
        
        // Notify when task moved to Review
        if (destination.droppableId === 'review' && userId) {
          await notifyTaskReadyForReview({
            taskId: draggableId as any,
            movedByUserId: userId as any,
            milestoneId: milestoneId as any,
          });
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Don't fail the whole operation if notification fails
      }
      
      // Show success message with role info
      if (destination.droppableId === 'completed') {
        toast.success(`✅ Task completed! Checked by ${currentUser?.name} (${userRole})`);
      } else {
        toast.success(`Task moved to ${targetColumn?.title}!`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
      console.error('Drag error:', error);
    }
  };

  const handleToggleWorkingOnIt = async (taskId: string) => {
    try {
      const result = await toggleWorkingOnIt({ taskId: taskId as any });
      
      // Notify team members when starting to work
      if (result.working && currentUser?._id) {
        try {
          await notifyWorkingOnItMutation({
            taskId: taskId as any,
            workingUserId: currentUser._id as any,
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }
      }
      
      if (result.working) {
        toast.success('✅ You are now working on this task');
      } else {
        toast.success('⏸️ Stopped working on task');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update working status');
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) {
      toast.error('Task title is required');
      return;
    }

    // Get current user role
    const userRole = currentUser?.role || 'worker';

    // **STORY POINT LIMIT CHECK**
    if (userRole === 'worker' && taskForm.storyPoints > 3) {
      toast.error('⚠️ Workers can only create tasks up to 3 story points');
      return;
    }
    
    if (userRole === 'builder' && taskForm.storyPoints >= 8) {
      toast.error('⚠️ Builders cannot create tasks with 8+ story points');
      return;
    }

    try {
      // Get projectId from milestone
      if (!milestone?.projectId) {
        toast.error('Milestone must be linked to a project');
        return;
      }

      const newTaskId = await createTask({
        projectId: milestone.projectId,
        milestoneId: milestoneId as any,
        title: taskForm.title,
        description: taskForm.description,
        type: taskForm.type as any,
        difficulty: taskForm.difficulty as any,
        priority: taskForm.priority as any,
        storyPoints: taskForm.storyPoints,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : undefined,
        assignedTo: taskForm.assignedTo.length > 0 ? taskForm.assignedTo as any : undefined,
        status: taskForm.status as any,
        tags: taskForm.tags.length > 0 ? taskForm.tags : undefined,
      });

      // Send assignment notifications
      if (taskForm.assignedTo.length > 0 && currentUser?._id && newTaskId) {
        try {
          await notifyTaskAssignment({
            taskId: newTaskId as any,
            assignedUserIds: taskForm.assignedTo as any,
            assignedByUserId: currentUser._id as any,
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }
      }

      toast.success('Task created successfully!');
      setIsCreateTaskOpen(false);
      setTaskForm({
        title: '',
        description: '',
        type: 'todo',
        difficulty: 'medium',
        priority: 'medium',
        storyPoints: 3,
        dueDate: '',
        assignedTo: [],
        status: 'todo',
        tags: [],
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading milestone board...</p>
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

  const totalPoints = tasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);
  const completedPoints = tasks
    .filter((t: any) => t.completed || t.status === 'done')
    .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);
  const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const daysLeft = milestone.targetDate 
    ? Math.ceil((milestone.targetDate - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Milestone Kanban"
        dashboardSubtitle="Task management board"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-gray-700 text-white">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Milestone Board</h1>
          <div className="w-9" />
        </div>

        {/* Header */}
        <div className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/milestones/${milestoneId}`}
                className="border-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Details
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-400" />
                  {milestone.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {milestone.projectName}
                  </Badge>
                  <Badge className="bg-gray-700 text-gray-300 text-xs">
                    {milestone.projectDepartment}
                  </Badge>
                  {milestone.isRequired && (
                    <Badge className="bg-red-500/20 text-red-300 text-xs">
                      Critical
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>

          {/* View Tabs */}
          <div className="flex items-center justify-between mb-4">
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
                <Layers className="w-4 h-4 mr-2" />
                Tasks List
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setFilters({ ...filters, assignedToMe: !filters.assignedToMe })}
                  variant={filters.assignedToMe ? 'default' : 'outline'}
                  size="sm"
                  className={filters.assignedToMe ? 'bg-emerald-600' : 'border-gray-600'}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Tasks
                </Button>
                <QuickFilters onFilterChange={setFilters} currentUser={currentUser} />
              </div>
            )}
          </div>

          {/* Metrics */}
          {view === 'board' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Total Tasks</div>
                <div className="text-xl font-bold text-white">{tasks.length}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Completed</div>
                <div className="text-xl font-bold text-green-400">
                  {tasks.filter((t: any) => t.completed).length}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Total Points</div>
                <div className="text-xl font-bold text-purple-400">{totalPoints}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Progress</div>
                <div className="text-xl font-bold text-blue-400">{progress}%</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Days Left</div>
                <div className={`text-xl font-bold ${
                  daysLeft && daysLeft <= 3 ? 'text-red-400' : 'text-white'
                }`}>
                  {daysLeft !== null ? daysLeft : 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Board View */}
        {view === 'board' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(250px, 1fr))` }}>
                {columns.map((column) => (
                  <div key={column.id} className="flex flex-col min-h-0">
                    {/* Regular Column */}
                    <>
                        <div className={`${column.color} rounded-t-lg p-3 flex items-center justify-between relative`}>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{column.title}</h3>
                            <Badge className="bg-white/20 text-white">{column.tasks.length}</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Delete button - Only Manager, Admin, Captain */}
                            {!column.isDefault && column.columnId && (
                              ((currentUser?.role || 'worker') === 'admin' || 
                               (currentUser?.role || 'worker') === 'captain' || 
                               (currentUser?.role || 'worker') === 'manager') && (
                                <button 
                                  onClick={() => setActiveColumnEditor(activeColumnEditor === `delete-${column.id}` ? null : `delete-${column.id}`)}
                                  className="text-white hover:bg-white/10 rounded p-1 transition-colors"
                                  title="Delete column"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              )
                            )}
                            {/* Add button - Everyone except Worker */}
                            {((currentUser?.role || 'worker') === 'admin' || 
                              (currentUser?.role || 'worker') === 'captain' || 
                              (currentUser?.role || 'worker') === 'manager' ||
                              (currentUser?.role || 'worker') === 'builder') && (
                              <button
                                onClick={() => setActiveColumnEditor(activeColumnEditor === column.id ? null : column.id)}
                                className="text-white hover:bg-white/10 rounded p-1 transition-colors"
                                title="Add column"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Inline Column Editor for adding new column */}
                          {activeColumnEditor === column.id && (
                            <InlineColumnEditor
                              milestoneId={milestoneId}
                              columnId={undefined}
                              isDefault={false}
                              insertAfterId={column.columnId} // Insert after this column
                              onClose={() => setActiveColumnEditor(null)}
                              onRefresh={() => {
                                // Will trigger re-fetch automatically
                              }}
                            />
                          )}

                          {/* Inline Column Editor for deleting */}
                          {activeColumnEditor === `delete-${column.id}` && column.columnId && (
                            <InlineColumnEditor
                              milestoneId={milestoneId}
                              columnId={column.columnId}
                              isDefault={column.isDefault}
                              onClose={() => setActiveColumnEditor(null)}
                              onRefresh={() => {
                                // Will trigger re-fetch automatically
                              }}
                            />
                          )}
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
                                      <TaskCard 
                                        task={task} 
                                        onToggleWorkingOnIt={handleToggleWorkingOnIt}
                                        currentUserId={currentUser?._id}
                                      />
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
                      </>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        {/* Backlog/Tasks List View */}
        {view === 'backlog' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              <BacklogPanel
                backlog={filteredTasks || []}
                activeSprint={null}
                onRefresh={() => {}}
              />
            </div>
          </div>
        )}

        {/* Burndown View */}
        {view === 'burndown' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <TrendingDown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Burndown Chart</h3>
                <p className="text-gray-400">Track daily progress towards milestone completion</p>
                <div className="mt-8 bg-gray-800 rounded-lg p-8">
                  <p className="text-gray-500">Burndown data coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Velocity View */}
        {view === 'velocity' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Velocity Chart</h3>
                <p className="text-gray-400">Analyze team velocity across milestones</p>
                <div className="mt-8 bg-gray-800 rounded-lg p-8">
                  <p className="text-gray-500">Velocity data coming soon...</p>
                </div>
              </div>
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

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-400" />
              Create New Task
            </DialogTitle>
            <p className="text-sm text-gray-400 mt-2">Add a new task to {milestone.title}</p>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div>
              <Label className="text-white font-semibold flex items-center gap-2">
                Task Title
                <span className="text-red-400">*</span>
              </Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g., Implement user dashboard"
                className="bg-gray-900/50 border-gray-600 text-white mt-2 h-11 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <Label className="text-white font-semibold">Description</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Provide detailed information about what needs to be done..."
                rows={4}
                className="bg-gray-900/50 border-gray-600 text-white mt-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-semibold">Task Type</Label>
                <select
                  value={taskForm.type}
                  onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white mt-2 h-11 rounded-md px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="todo">🎯 Feature</option>
                  <option value="daily">🔄 Recurring</option>
                </select>
              </div>

              <div>
                <Label className="text-white font-semibold">Initial Status</Label>
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white mt-2 h-11 rounded-md px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                >
                  {/* Dynamic options from database columns */}
                  {dbColumns && dbColumns.map((col: any) => (
                    <option key={col._id} value={col.statusKey}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-semibold">Difficulty</Label>
                <select
                  value={taskForm.difficulty}
                  onChange={(e) => setTaskForm({ ...taskForm, difficulty: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white mt-2 h-11 rounded-md px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="trivial">🟢 Trivial</option>
                  <option value="easy">🔵 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>

              <div>
                <Label className="text-white font-semibold">Priority</Label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white mt-2 h-11 rounded-md px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="low">🔵 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
            </div>

            {/* Story Points */}
            <div>
              <Label className="text-white font-semibold">Story Points</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {[1, 2, 3, 5, 8, 13, 21].map((points) => (
                  <button
                    key={points}
                    type="button"
                    onClick={() => setTaskForm({ ...taskForm, storyPoints: points })}
                    className={`h-11 rounded-lg border-2 transition-all font-bold ${
                      taskForm.storyPoints === points
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {points}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                1=Trivial, 2=Simple, 3=Easy, 5=Medium, 8=Complex, 13=Large, 21=Epic
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-semibold">Assign To</Label>
                <select
                  value={taskForm.assignedTo[0] || 'unassigned'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTaskForm({ 
                      ...taskForm, 
                      assignedTo: value === 'unassigned' ? [] : [value] 
                    });
                  }}
                  className="w-full bg-gray-950 border border-gray-700 text-white mt-2 h-11 rounded-md px-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="unassigned">👤 Unassigned</option>
                  {currentUser && (
                    <option value={currentUser._id}>👤 Me ({currentUser.name})</option>
                  )}
                </select>
              </div>

              <div>
                <Label className="text-white font-semibold">Due Date</Label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full bg-gray-900/50 border-gray-600 text-white mt-2 h-11 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <Label className="text-white font-semibold">Tags (comma separated)</Label>
              <Input
                type="text"
                placeholder="e.g., frontend, urgent, bug-fix"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                  setTaskForm({ ...taskForm, tags });
                }}
                className="w-full bg-gray-900/50 border-gray-600 text-white mt-2 h-11 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-700">
              <Button 
                onClick={handleCreateTask} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-11 font-semibold shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Task
              </Button>
              <Button 
                onClick={() => setIsCreateTaskOpen(false)} 
                variant="outline" 
                className="border-gray-600 hover:bg-gray-700 h-11 px-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Container */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

function TaskCard({ task, onToggleWorkingOnIt, currentUserId }: { 
  task: any; 
  onToggleWorkingOnIt: (taskId: string) => void;
  currentUserId?: string;
}) {
  const isWorkingOnIt = task.workingOnIt === currentUserId;
  const canShowWorkingButton = task.status === 'in_progress' || 
    (task.status !== 'todo' && task.status !== 'review' && task.status !== 'completed');
  
  // Check if task is locked
  const isLockedInReview = task.status === 'review' && task.lockedInReview;
  const isLockedInDone = task.status === 'completed' && task.completedBy;
  
  return (
    <Card 
      className={`bg-gray-800 border-gray-700 border-l-4 ${priorityColors[task.priority]} hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group ${
        (isLockedInReview || isLockedInDone) ? 'ring-2 ring-yellow-500/30' : ''
      }`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{taskTypeIcons[task.type] || '📄'}</span>
            <span className="text-xs text-gray-400 font-mono">
              {task._id.slice(-4).toUpperCase()}
            </span>
            {task.workingOnIt && (
              <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                <span className="animate-pulse">🔧</span>
                {task.workingOnIt === currentUserId ? 'You' : 'Working'}
              </span>
            )}
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Locked Indicators */}
        {isLockedInReview && (
          <div className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
            🔒 Waiting for Manager approval
          </div>
        )}
        
        {isLockedInDone && task.completedByRole && (
          <div className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
            ✅ Checked by {task.completedByRole}
          </div>
        )}

        <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs text-gray-400 line-clamp-1">{task.description}</p>
        )}

        {/* Working On It Button */}
        {canShowWorkingButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWorkingOnIt(task._id);
            }}
            className={`w-full py-1.5 px-2 rounded text-xs font-medium transition-all ${
              isWorkingOnIt
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30'
                : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
            }`}
          >
            {isWorkingOnIt ? '⏸️ Stop Working' : '🔧 Start Working'}
          </button>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-2 flex-wrap">
            {task.storyPoints && (
              <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                {task.storyPoints} pts
              </Badge>
            )}
            {task.difficulty && (
              <Badge className={`text-xs ${
                task.difficulty === 'trivial' ? 'bg-green-500/20 text-green-300' :
                task.difficulty === 'easy' ? 'bg-blue-500/20 text-blue-300' :
                task.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {task.difficulty}
              </Badge>
            )}
            {(task.priority === 'high' || task.priority === 'urgent') && (
              <Flag className={`w-3 h-3 ${
                task.priority === 'urgent' ? 'text-red-400' : 'text-orange-400'
              }`} />
            )}
            {task.completed && (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            )}
          </div>

          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 3).map((assignee: any, idx: number) => (
                <Avatar key={idx} className="w-6 h-6 border border-gray-600">
                  <AvatarImage src={assignee.imageUrl} />
                  <AvatarFallback className="text-xs bg-blue-600">
                    {assignee.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
