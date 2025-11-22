"use client";

/**
 * Notification Icon System
 * Maps notification types/categories to beautiful Lucide icons
 * Upgrades from emojis to professional icon system
 */

import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  MessageSquare,
  FolderKanban,
  Trophy,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Megaphone,
  AlertOctagon,
  User,
  Users,
  Calendar,
  FileText,
  Send,
  UserPlus,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface IconConfig {
  icon: LucideIcon;
  className: string;
}

/**
 * Get icon for notification category
 */
export function getNotificationIcon(type: string, category?: string): IconConfig {
  // Check category first (more specific)
  if (category) {
    const categoryIcon = categoryIconMap[category];
    if (categoryIcon) return categoryIcon;
  }
  
  // Fallback to type
  const typeIcon = typeIconMap[type];
  if (typeIcon) return typeIcon;
  
  // Default
  return { icon: Bell, className: 'text-gray-400' };
}

/**
 * Category-based icon mapping
 */
const categoryIconMap: Record<string, IconConfig> = {
  // Task categories
  'task_assigned': { icon: FolderKanban, className: 'text-blue-500' },
  'task': { icon: FolderKanban, className: 'text-blue-500' },
  'task_removed': { icon: Trash2, className: 'text-red-500' },
  'task_updated': { icon: Edit, className: 'text-yellow-500' },
  'task_completed': { icon: CheckCircle, className: 'text-green-500' },
  'task_verified': { icon: CheckCircle, className: 'text-emerald-500' },
  'task_rejected': { icon: XCircle, className: 'text-red-500' },
  
  // Message categories
  'message': { icon: MessageSquare, className: 'text-purple-500' },
  'chat': { icon: MessageSquare, className: 'text-purple-500' },
  
  // Project categories
  'project_announcement': { icon: Megaphone, className: 'text-orange-500' },
  'project_alert': { icon: AlertOctagon, className: 'text-red-500' },
  'project_update': { icon: FileText, className: 'text-blue-500' },
  
  // Deadline & time
  'deadline': { icon: Clock, className: 'text-orange-500' },
  'due_soon': { icon: Clock, className: 'text-yellow-500' },
  'overdue': { icon: AlertTriangle, className: 'text-red-500' },
  
  // Achievement
  'achievement': { icon: Trophy, className: 'text-yellow-500' },
  'level_up': { icon: Trophy, className: 'text-emerald-500' },
  
  // User & team
  'user_invited': { icon: UserPlus, className: 'text-blue-500' },
  'team_update': { icon: Users, className: 'text-purple-500' },
  
  // Calendar
  'event': { icon: Calendar, className: 'text-indigo-500' },
  'reminder': { icon: Clock, className: 'text-yellow-500' },
};

/**
 * Type-based icon mapping (fallback)
 */
const typeIconMap: Record<string, IconConfig> = {
  'success': { icon: CheckCircle, className: 'text-green-500' },
  'error': { icon: XCircle, className: 'text-red-500' },
  'warning': { icon: AlertTriangle, className: 'text-yellow-500' },
  'info': { icon: Info, className: 'text-blue-500' },
  'welcome': { icon: User, className: 'text-emerald-500' },
  
  // Task types
  'task_assigned': { icon: FolderKanban, className: 'text-blue-500' },
  'task_completed': { icon: CheckCircle, className: 'text-green-500' },
  'task_verified': { icon: CheckCircle, className: 'text-emerald-500' },
  'task_rejected': { icon: XCircle, className: 'text-red-500' },
};

/**
 * Render icon component
 */
export function NotificationIcon({ 
  type, 
  category, 
  size = 20 
}: { 
  type: string; 
  category?: string; 
  size?: number;
}) {
  const { icon: Icon, className } = getNotificationIcon(type, category);
  
  return <Icon className={className} style={{ width: size, height: size }} />;
}

/**
 * Get priority color classes
 */
export function getPriorityColorClasses(priority?: string, isRead?: boolean) {
  const baseOpacity = isRead ? '5' : '10';
  
  switch (priority) {
    case 'critical':
    case 'urgent':
      return {
        background: `bg-red-500/${baseOpacity}`,
        border: 'border-red-500',
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400',
      };
    case 'high':
      return {
        background: `bg-orange-500/${baseOpacity}`,
        border: 'border-orange-500',
        text: 'text-orange-400',
        badge: 'bg-orange-500/20 text-orange-400',
      };
    case 'medium':
      return {
        background: `bg-teal-500/${baseOpacity}`,
        border: 'border-teal-500',
        text: 'text-teal-400',
        badge: 'bg-teal-500/20 text-teal-400',
      };
    case 'low':
      return {
        background: `bg-gray-500/${baseOpacity}`,
        border: 'border-gray-500',
        text: 'text-gray-400',
        badge: 'bg-gray-500/20 text-gray-400',
      };
    default:
      return {
        background: isRead ? '' : `bg-teal-500/${baseOpacity}`,
        border: isRead ? 'border-gray-700' : 'border-teal-500',
        text: 'text-gray-400',
        badge: 'bg-gray-500/20 text-gray-400',
      };
  }
}
