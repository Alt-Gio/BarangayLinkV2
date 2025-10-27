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
    status: task?.status || 'todo',
    difficulty: task?.difficulty || 'medium',
    assignedTo: task?.assignedTo || [],
    tags: task?.tags || [],
    dueDate: task?.dueDate || null,
  });
  const [tagInput, setTagInput] = useState('');

  const updateTask = useMutation(api.tasks.updateTask);
  const updateStoryPoints = useMutation(api.tasks.updateTask);

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
              {isEditing ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white h-10 rounded-md px-3 focus:border-blue-500 focus:outline-none"
                >
                  <option value="todo">📝 To Do</option>
                  <option value="task_list">📋 Task List</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="review">👀 In Review</option>
                  <option value="completed">✅ Completed</option>
                </select>
              ) : (
                <Badge className={`
                  ${task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    task.status === 'review' ? 'bg-purple-500/20 text-purple-300' :
                    task.status === 'task_list' ? 'bg-indigo-500/20 text-indigo-300' :
                    'bg-gray-500/20 text-gray-300'}
                `}>
                  {task.status?.replace('_', ' ') || 'todo'}
                </Badge>
              )}
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
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white h-10 rounded-md px-3 focus:border-blue-500 focus:outline-none"
                >
                  <option value="todo">🎯 Feature</option>
                  <option value="daily">🔄 Recurring</option>
                </select>
              ) : (
                <Badge className="bg-gray-700 text-gray-300">
                  {task.type === 'todo' ? '🎯' : task.type === 'daily' ? '🔄' : '📝'} {task.type === 'todo' ? 'Feature' : task.type === 'daily' ? 'Recurring' : task.type}
                </Badge>
              )}
            </div>
          </div>

          {/* Difficulty & Story Points */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Difficulty
            </label>
            {isEditing ? (
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700 text-white h-10 rounded-md px-3 focus:border-blue-500 focus:outline-none"
              >
                <option value="trivial">🟢 Trivial</option>
                <option value="easy">🔵 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            ) : (
              <Badge className={`${
                task.difficulty === 'trivial' ? 'bg-green-500/20 text-green-300' :
                task.difficulty === 'easy' ? 'bg-blue-500/20 text-blue-300' :
                task.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {task.difficulty || 'medium'}
              </Badge>
            )}
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
                  onClick={() => isEditing && handleUpdatePoints(points)}
                  disabled={!isEditing}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    task.storyPoints === points
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  } ${!isEditing && 'opacity-50 cursor-not-allowed'}`}
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

          {/* Assignees (Multi-Select) */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
              <User className="w-4 h-4" />
              Assigned To (Team Members)
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-400 mb-2">Select team members:</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
                      👤 You (Creator)
                    </Badge>
                    <Badge className="bg-gray-700 hover:bg-gray-600 cursor-pointer">
                      + Add Member
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Multiple users can be assigned to this task</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {task.assignedTo && task.assignedTo.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {task.assignedTo.map((userId: string, idx: number) => (
                      <Badge key={idx} className="bg-blue-600 text-white">
                        👤 Assigned {idx + 1}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-400">
                    👤 Unassigned
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">
              🏷️ Tags
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                      setTagInput('');
                    }
                  }}
                  placeholder="Add tag and press Enter"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string, idx: number) => (
                    <Badge 
                      key={idx}
                      className="bg-purple-600 text-white cursor-pointer hover:bg-red-600"
                      onClick={() => {
                        const newTags = formData.tags.filter((_: string, i: number) => i !== idx);
                        setFormData({ ...formData, tags: newTags });
                      }}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.tags && task.tags.length > 0 ? (
                  task.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} className="bg-purple-600 text-white">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No tags</span>
                )}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Due Date
            </label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value).getTime() : null })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            ) : (
              <div className={`bg-gray-800 border rounded-lg p-3 ${
                task.dueDate && task.dueDate < Date.now() 
                  ? 'border-red-500/50 text-red-300' 
                  : 'border-gray-700 text-gray-300'
              }`}>
                {task.dueDate ? (
                  <>
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {task.dueDate < Date.now() && (
                      <span className="ml-2 text-red-400 font-semibold">Overdue!</span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">No due date set</span>
                )}
              </div>
            )}
          </div>

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
