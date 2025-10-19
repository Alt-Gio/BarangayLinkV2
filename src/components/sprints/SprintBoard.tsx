"use client";

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Flag,
  MessageSquare,
  Paperclip,
  User,
} from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  type: 'story' | 'bug' | 'task' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  storyPoints?: number;
  assignedTo?: any;
  dueDate?: number;
  description?: string;
  comments?: number;
  attachments?: number;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

interface SprintBoardProps {
  sprint: any;
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
}

const taskTypeIcons: Record<string, string> = {
  story: '📖',
  bug: '🐛',
  task: '✅',
  epic: '🎯',
};

const priorityColors: Record<string, string> = {
  low: 'border-l-blue-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
};

export function SprintBoard({ sprint, onTaskMove, onTaskClick }: SprintBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', tasks: [], color: 'bg-gray-700' },
    { id: 'in_progress', title: 'In Progress', tasks: [], color: 'bg-blue-600' },
    { id: 'in_review', title: 'In Review', tasks: [], color: 'bg-purple-600' },
    { id: 'done', title: 'Done', tasks: [], color: 'bg-green-600' },
  ]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within same column
      return;
    }

    // Move task to new column
    onTaskMove(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full">
            {/* Column Header */}
            <div className={`${column.color} rounded-t-lg p-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{column.title}</h3>
                <Badge className="bg-white/20 text-white">
                  {column.tasks.length}
                </Badge>
              </div>
              <button className="text-white hover:bg-white/10 rounded p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 bg-gray-800/50 rounded-b-lg p-2 space-y-2 min-h-[200px] transition-colors ${
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
                          onClick={() => onTaskClick(task)}
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
                  
                  {/* Empty State */}
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
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card 
      className={`bg-gray-800 border-gray-700 border-l-4 ${priorityColors[task.priority]} hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group`}
    >
      <div className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{taskTypeIcons[task.type]}</span>
            <span className="text-xs text-gray-400 font-mono">
              TASK-{task._id.slice(-4).toUpperCase()}
            </span>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {/* Metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            {/* Story Points */}
            {task.storyPoints && (
              <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                {task.storyPoints} pts
              </Badge>
            )}

            {/* Priority */}
            {task.priority === 'high' || task.priority === 'critical' ? (
              <Flag className={`w-3 h-3 ${
                task.priority === 'critical' ? 'text-red-400' : 'text-orange-400'
              }`} />
            ) : null}

            {/* Comments */}
            {task.comments && task.comments > 0 ? (
              <div className="flex items-center gap-1 text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs">{task.comments}</span>
              </div>
            ) : null}

            {/* Attachments */}
            {task.attachments && task.attachments > 0 ? (
              <div className="flex items-center gap-1 text-gray-400">
                <Paperclip className="w-3 h-3" />
                <span className="text-xs">{task.attachments}</span>
              </div>
            ) : null}
          </div>

          {/* Assignee */}
          {task.assignedTo ? (
            <Avatar className="w-6 h-6 border border-gray-600">
              <AvatarImage src={task.assignedTo.imageUrl} />
              <AvatarFallback className="text-xs bg-blue-600">
                {task.assignedTo.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
          )}
        </div>

        {/* Due Date Warning */}
        {task.dueDate && task.dueDate < Date.now() + 86400000 && (
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
