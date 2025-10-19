"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  Edit2,
  Save,
  Trash2,
  Calendar,
  User,
  Flag,
  Zap,
  MessageSquare,
  Paperclip,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface TaskDetailsPanelProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const taskTypeIcons: Record<string, string> = {
  story: '📖',
  bug: '🐛',
  task: '✅',
  epic: '🎯',
  feature: '⭐',
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-300' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-300' },
};

const fibonacciPoints = [1, 2, 3, 5, 8, 13, 21];

export function TaskDetailsPanel({ task, isOpen, onClose, onUpdate }: TaskDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    type: task?.type || 'task',
  });

  const updateTask = useMutation(api.gamifiedTasks.updateTask);
  const updateStoryPoints = useMutation(api.sprintsEnhanced.updateStoryPoints);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    try {
      await updateTask({
        taskId: task._id,
        ...formData,
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task');
    }
  };

  const handleUpdatePoints = async (points: number) => {
    try {
      await updateStoryPoints({
        taskId: task._id,
        storyPoints: points,
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update story points:', error);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-gray-900 border-l border-gray-700 z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{taskTypeIcons[task.type] || '📄'}</span>
            <div>
              <h2 className="text-lg font-bold text-white">Task Details</h2>
              <p className="text-xs text-gray-400 font-mono">
                {task._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Title</label>
            {isEditing ? (
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white text-lg font-semibold"
              />
            ) : (
              <h3 className="text-xl font-bold text-white">{task.title}</h3>
            )}
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Status
              </label>
              <Badge className={`
                ${task.sprintStatus === 'done' ? 'bg-green-500/20 text-green-300' :
                  task.sprintStatus === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                  task.sprintStatus === 'in_review' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-gray-500/20 text-gray-300'}
              `}>
                {task.sprintStatus?.replace('_', ' ') || 'todo'}
              </Badge>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                <Flag className="w-4 h-4" />
                Priority
              </label>
              {isEditing ? (
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                  {task.priority}
                </Badge>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Type</label>
              {isEditing ? (
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className="bg-gray-700 text-gray-300">
                  {taskTypeIcons[task.type]} {task.type}
                </Badge>
              )}
            </div>
          </div>

          {/* Story Points */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Story Points
            </label>
            <div className="grid grid-cols-7 gap-2">
              {fibonacciPoints.map((points) => (
                <button
                  key={points}
                  onClick={() => handleUpdatePoints(points)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    task.storyPoints === points
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-lg font-bold">{points}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Description</label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Add task description..."
              />
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {task.description || 'No description provided'}
                </p>
              </div>
            )}
          </div>

          {/* Assignee */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
              <User className="w-4 h-4" />
              Assignee
            </label>
            {task.assignee ? (
              <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
                <Avatar className="w-10 h-10 border border-gray-600">
                  <AvatarImage src={task.assignee.imageUrl} />
                  <AvatarFallback className="bg-blue-600">
                    {task.assignee.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-medium">{task.assignee.name}</div>
                  <div className="text-xs text-gray-400">{task.assignee.email}</div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-400">
                Unassigned
              </div>
            )}
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              <div className={`bg-gray-800 border rounded-lg p-3 ${
                task.dueDate < Date.now() 
                  ? 'border-red-500/50 text-red-300' 
                  : 'border-gray-700 text-gray-300'
              }`}>
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {task.dueDate < Date.now() && (
                  <span className="ml-2 text-red-400 font-semibold">Overdue!</span>
                )}
              </div>
            </div>
          )}

          {/* Activity */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Activity
            </label>
            <div className="space-y-2">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-400">Created</div>
                <div className="text-sm text-white">
                  {new Date(task._creationTime).toLocaleString()}
                </div>
              </div>
              {task.updatedAt && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Last Updated</div>
                  <div className="text-sm text-white">
                    {new Date(task.updatedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              className="flex-1 border-red-600 text-red-400 hover:bg-red-600/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Task
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
