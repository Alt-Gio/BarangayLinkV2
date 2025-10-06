/**
 * Optimized Card Components with React.memo
 * Prevents unnecessary re-renders in lists
 */

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project, Task, User, Event } from '@/types';
import { formatDate, getRelativeTime } from '@/lib/utils';
import { Calendar, MapPin, Users, Clock, DollarSign } from 'lucide-react';

// ============================================
// PROJECT CARD (Heavy Component)
// ============================================

interface ProjectCardProps {
  project: Project;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export const ProjectCard = memo<ProjectCardProps>(({ 
  project, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'completed': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Ongoing'}</span>
          </div>
          
          {project.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{project.location}</span>
            </div>
          )}
          
          {project.budget && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Budget: ₱{project.budget.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{project.teamMembers?.length || 0} members</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          {onView && (
            <Button size="sm" onClick={() => onView(project._id)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(project._id)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(project._id)}>
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.project._id === nextProps.project._id &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.progressPercentage === nextProps.project.progressPercentage &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onView === nextProps.onView
  );
});

ProjectCard.displayName = 'ProjectCard';

// ============================================
// TASK CARD
// ============================================

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TaskCard = memo<TaskCardProps>(({ 
  task, 
  onComplete, 
  onEdit, 
  onDelete 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'easy': return 'text-green-500';
      case 'trivial': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const isCompleted = task.status === 'completed';

  return (
    <Card className={`hover:shadow-md transition-shadow ${isCompleted ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{task.type}</Badge>
              <Badge className={getDifficultyColor(task.difficulty)}>
                {task.difficulty}
              </Badge>
              {task.dueDate && (
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {getRelativeTime(task.dueDate)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {onComplete && !isCompleted && (
              <Button size="sm" onClick={() => onComplete(task._id)}>
                Complete
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(task._id)}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = 'TaskCard';

// ============================================
// USER CARD
// ============================================

interface UserCardProps {
  user: User;
  onView?: (id: string) => void;
  onMessage?: (id: string) => void;
}

export const UserCard = memo<UserCardProps>(({ user, onView, onMessage }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.position}</p>
            <Badge variant="outline" className="mt-1">
              {user.department || 'No department'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {onView && (
              <Button size="sm" variant="outline" onClick={() => onView(user._id)}>
                View
              </Button>
            )}
            {onMessage && (
              <Button size="sm" onClick={() => onMessage(user._id)}>
                Message
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

UserCard.displayName = 'UserCard';

// ============================================
// EVENT CARD
// ============================================

interface EventCardProps {
  event: Event;
  onView?: (id: string) => void;
  onRegister?: (id: string) => void;
}

export const EventCard = memo<EventCardProps>(({ event, onView, onRegister }) => {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-500';
      case 'meeting': return 'bg-blue-500';
      case 'community': return 'bg-green-500';
      case 'project': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium">{event.title}</h3>
          <Badge className={getEventTypeColor(event.type)}>
            {event.type}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{event.attendees?.length || 0} attendees</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          {onView && (
            <Button size="sm" variant="outline" onClick={() => onView(event._id)}>
              View Details
            </Button>
          )}
          {onRegister && (
            <Button size="sm" onClick={() => onRegister(event._id)}>
              Register
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

EventCard.displayName = 'EventCard';

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// Import optimized components
import { ProjectCard, TaskCard, UserCard, EventCard } from '@/components/optimized/OptimizedCards';

// Use in lists - they won't re-render unless their data changes!
function ProjectsList({ projects }) {
  const handleEdit = useCallback((id) => {
    // handle edit
  }, []);

  return (
    <div className="grid gap-4">
      {projects.map(project => (
        <ProjectCard 
          key={project._id} 
          project={project}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
}

// Benefits:
// - Components only re-render when their props change
// - Prevents cascade re-renders in large lists
// - Better performance with 100+ items
// - Custom comparison for fine-grained control
*/
