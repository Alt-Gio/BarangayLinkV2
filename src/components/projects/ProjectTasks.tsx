"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, User, Edit, Trash2 } from 'lucide-react';

interface ProjectTasksProps {
  project: any;
  tasks: any[];
  currentUser: any;
  canManageTasks: boolean;
}

export function ProjectTasks({ project, tasks, currentUser, canManageTasks }: ProjectTasksProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    estimatedHours: ''
  });

  const createTask = useMutation(api.productivity.createTask);
  const updateTaskStatus = useMutation(api.productivity.updateTaskStatus);
  
  // Get users that can be assigned tasks (WORKERs in same department + BUILDERs)
  const assignableUsers = useQuery(api.users.getAssignableUsers, { 
    department: project.department,
    userRole: currentUser.userLevel.name 
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-900/20 text-red-400 border-red-700';
      case 'high': return 'bg-orange-900/20 text-orange-400 border-orange-700';
      case 'medium': return 'bg-yellow-900/20 text-yellow-400 border-yellow-700';
      case 'low': return 'bg-green-900/20 text-green-400 border-green-700';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/20 text-green-400 border-green-700';
      case 'in_progress': return 'bg-blue-900/20 text-blue-400 border-blue-700';
      case 'review': return 'bg-purple-900/20 text-purple-400 border-purple-700';
      case 'todo': return 'bg-gray-900/20 text-gray-400 border-gray-700';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.description || !taskForm.assignedTo) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createTask({
        projectId: project._id,
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority as any,
        assignedTo: taskForm.assignedTo as any,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : undefined,
        estimatedHours: parseFloat(taskForm.estimatedHours) || undefined
      });
      
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        estimatedHours: ''
      });
      setIsCreatingTask(false);
    } catch (error) {
      alert("Error creating task: " + error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskStatus({
        taskId: taskId as any,
        status: newStatus as any
      });
    } catch (error) {
      alert("Error updating task: " + error);
    }
  };

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed')
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Project Tasks</h2>
        {canManageTasks && (
          <Button 
            onClick={() => setIsCreatingTask(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* Create Task Form */}
      {isCreatingTask && (
        <div className="bg-gray-700/50 rounded-lg p-6 mb-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Task</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Task Title *</label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="Enter task title"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Task description and requirements"
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assign To *</label>
                <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({...taskForm, assignedTo: value})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {assignableUsers?.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.userLevel?.name || 'USER'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({...taskForm, priority: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Hours</label>
                <Input
                  type="number"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({...taskForm, estimatedHours: e.target.value})}
                  placeholder="Hours"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsCreatingTask(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTask} className="bg-green-600 hover:bg-green-700">
              Create Task
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div key={status} className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white capitalize">
                {status.replace('_', ' ')} ({statusTasks.length})
              </h3>
            </div>
            
            <div className="space-y-3">
              {statusTasks.map((task) => (
                <div key={task._id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-white text-sm">{task.title}</h4>
                    <div className="flex gap-1">
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                  
                  <div className="space-y-2 text-xs text-gray-400">
                    {task.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{task.assignee.name}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.estimatedHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedHours}h</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Controls */}
                  {(canManageTasks || task.assignedTo === currentUser._id) && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <Select 
                        value={task.status} 
                        onValueChange={(value) => handleStatusChange(task._id, value)}
                      >
                        <SelectTrigger className="w-full h-8 bg-gray-700 border-gray-600 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
