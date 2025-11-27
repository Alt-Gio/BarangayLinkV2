"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart3,
  Plus,
  Search,
  SortAsc,
  Filter,
  Zap,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Edit,
  XCircle,
} from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

interface BacklogPanelProps {
  backlog: any[];
  activeSprint: any;
  onRefresh: () => void;
}

const taskTypeIcons: Record<string, string> = {
  story: '📖',
  bug: '🐛',
  task: '✅',
  epic: '🎯',
  feature: '⭐',
};

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-300',
  medium: 'bg-yellow-500/20 text-yellow-300',
  high: 'bg-orange-500/20 text-orange-300',
  critical: 'bg-red-500/20 text-red-300',
};

const fibonacciPoints = [1, 2, 3, 5, 8, 13, 21];

export function BacklogPanel({ backlog, activeSprint, onRefresh }: BacklogPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'created' | 'type'>('priority');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [showEstimateDialog, setShowEstimateDialog] = useState(false);

  const addTaskToSprint = useMutation(api.sprintsEnhanced.addTaskToSprint);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const handleMarkComplete = async (taskId: string, currentStatus: string) => {
    try {
      const isComplete = currentStatus === 'done';
      await updateTask({
        taskId: taskId as Id<"tasks">,
        status: isComplete ? 'todo' : 'done',
        completed: !isComplete,
      });
      toast.success(isComplete ? 'Task reopened' : 'Task marked as complete! 🎉');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"?`)) return;
    
    try {
      await deleteTask({ taskId: taskId as Id<"tasks"> });
      toast.success('Task deleted');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const handleAddToSprint = async (taskId: string, points: number) => {
    if (!activeSprint) {
      alert('No active sprint! Create one first.');
      return;
    }

    try {
      await addTaskToSprint({
        sprintId: activeSprint._id,
        taskId: taskId as Id<"tasks">,
        storyPoints: points,
      });
      setShowEstimateDialog(false);
      setSelectedTaskId(null);
      onRefresh();
    } catch (error: any) {
      alert(error.message || 'Failed to add task to sprint');
    }
  };

  // Filter and sort backlog
  let filteredBacklog = backlog || [];

  // Search filter
  if (searchQuery) {
    filteredBacklog = filteredBacklog.filter((task: any) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Priority filter
  if (filterPriority !== 'all') {
    filteredBacklog = filteredBacklog.filter((task: any) => task.priority === filterPriority);
  }

  // Type filter
  if (filterType !== 'all') {
    filteredBacklog = filteredBacklog.filter((task: any) => task.type === filterType);
  }

  // Sort
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  filteredBacklog = [...filteredBacklog].sort((a: any, b: any) => {
    if (sortBy === 'priority') {
      return priorityOrder[a.priority as keyof typeof priorityOrder] - 
             priorityOrder[b.priority as keyof typeof priorityOrder];
    } else if (sortBy === 'created') {
      return b._creationTime - a._creationTime;
    } else {
      return a.type.localeCompare(b.type);
    }
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Product Backlog
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {filteredBacklog.length} of {backlog?.length || 0} tasks
          </p>
        </div>
        
        {activeSprint && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-300">Sprint Capacity</div>
            <div className="text-lg font-bold text-white">
              {activeSprint.metrics.committedPoints || 0} / {activeSprint.capacity} pts
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>

        {/* Priority Filter */}
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SortAsc className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="created">Created Date</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Backlog List */}
      <div className="space-y-2">
        {filteredBacklog.length > 0 ? (
          filteredBacklog.map((task: any) => (
            <Card 
              key={task._id} 
              className={`bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group ${
                task.status === 'done' || task.completed ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Task Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{taskTypeIcons[task.type] || '📄'}</span>
                      <span className="text-xs text-gray-500 font-mono">
                        {task._id.slice(-4).toUpperCase()}
                      </span>
                      <h3 className={`font-medium flex-1 ${
                        task.status === 'done' || task.completed ? 'line-through text-gray-400' : 'text-white'
                      }`}>{task.title}</h3>
                      {(task.status === 'done' || task.completed) && (
                        <Badge className="bg-emerald-500/20 text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Done
                        </Badge>
                      )}
                      <Badge className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5 border border-gray-600">
                            <AvatarImage src={task.assignee.imageUrl} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-400">
                            {task.assignee.name}
                          </span>
                        </div>
                      )}
                      
                      {task.estimatedPoints > 0 && (
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                          {task.estimatedPoints} pts (estimated)
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Quick Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleMarkComplete(task._id, task.status)}
                        >
                          {task.status === 'done' || task.completed ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2 text-yellow-400" />
                              <span className="text-white">Reopen Task</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                              <span className="text-white">Mark as Complete</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteTask(task._id, task.title)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog 
                      open={showEstimateDialog && selectedTaskId === task._id}
                      onOpenChange={(open) => {
                        setShowEstimateDialog(open);
                        if (!open) setSelectedTaskId(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTaskId(task._id);
                            setStoryPoints(task.estimatedPoints || 3);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Sprint
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-400" />
                            Estimate Story Points
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-medium mb-2">{task.title}</h4>
                            <p className="text-sm text-gray-400">{task.description}</p>
                          </div>

                          <div>
                            <label className="text-sm text-gray-300 mb-2 block">
                              Select Story Points (Fibonacci Scale)
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {fibonacciPoints.map((points) => (
                                <button
                                  key={points}
                                  onClick={() => setStoryPoints(points)}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    storyPoints === points
                                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                                  }`}
                                >
                                  <div className="text-lg font-bold">{points}</div>
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              1=Trivial, 2=Simple, 3=Easy, 5=Medium, 8=Complex, 13=Large, 21=Epic
                            </p>
                          </div>

                          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                            <div className="text-sm text-blue-300">
                              Selected: <span className="font-bold text-white">{storyPoints} story points</span>
                            </div>
                            {activeSprint && (
                              <div className="text-xs text-gray-400 mt-1">
                                Sprint capacity: {activeSprint.metrics.committedPoints || 0} / {activeSprint.capacity} pts
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAddToSprint(task._id, storyPoints)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              Add to Sprint
                            </Button>
                            <Button
                              onClick={() => {
                                setShowEstimateDialog(false);
                                setSelectedTaskId(null);
                              }}
                              variant="outline"
                              className="border-gray-600"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery || filterPriority !== 'all' || filterType !== 'all'
                ? 'No tasks match your filters'
                : 'No tasks in backlog'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
