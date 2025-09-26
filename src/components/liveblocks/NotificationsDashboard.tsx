"use client";

import { useState, useEffect } from "react";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Zap,
  ExternalLink,
  X,
  ArrowUp,
  ArrowDown,
  Activity,
  AlertCircle
} from "lucide-react";

interface Notification {
  id: string;
  type: 'project_update' | 'urgent_task' | 'emergency' | 'progress' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  userId?: string;
  data?: any;
  read?: boolean;
}

interface ProjectProgress {
  id: string;
  name: string;
  progress: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  department: string;
  urgency: 'low' | 'medium' | 'high';
}

export function NotificationsDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();
  const broadcast = useBroadcastEvent();

  // Get real-time data from Convex
  const projects = useQuery(api.productivity.getProjects, {});
  const recentTasks = useQuery(api.gamifiedTasks.getGamifiedTasks, {
    userId: undefined,
    type: undefined,
    status: "todo",
    projectId: undefined
  });

  // Initialize with sample notifications
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: 'notif-1',
        type: 'emergency',
        title: 'Emergency Alert',
        message: 'Flood warning issued for Barangay Center. Immediate evacuation procedures activated.',
        timestamp: Date.now() - 300000, // 5 minutes ago
        priority: 'critical',
        read: false
      },
      {
        id: 'notif-2',
        type: 'urgent_task',
        title: 'Urgent Task Assigned',
        message: 'Health screening setup needed for tomorrow\'s vaccination drive.',
        timestamp: Date.now() - 600000, // 10 minutes ago
        priority: 'high',
        read: false
      },
      {
        id: 'notif-3',
        type: 'project_update',
        title: 'Project Milestone Reached',
        message: 'Community Center Construction is now 75% complete.',
        timestamp: Date.now() - 1200000, // 20 minutes ago
        priority: 'medium',
        read: true
      },
      {
        id: 'notif-4',
        type: 'progress',
        title: 'Weekly Progress Report',
        message: 'Infrastructure department completed 8 out of 10 planned tasks this week.',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        priority: 'low',
        read: true
      }
    ];

    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);

    // Initialize project progress
    if (projects && projects.length > 0) {
      const progressData = projects.slice(0, 5).map(project => ({
        id: project._id,
        name: project.title,
        progress: Math.floor(Math.random() * 100),
        status: project.status as any,
        department: project.department || 'General',
        urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
      }));
      setProjectProgress(progressData);
    }
  }, [projects]);

  // Listen for real-time notifications through NOTIFICATION event type
  useEventListener(({ event, user: eventUser }) => {
    if (event.type === "NOTIFICATION" && (event as any).notificationType) {
      const customEvent = event as any;
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        type: customEvent.notificationType || 'system',
        title: customEvent.title || 'Notification',
        message: customEvent.message || 'New notification received',
        timestamp: Date.now(),
        priority: customEvent.priority || 'medium',
        read: false,
        userId: eventUser?.id,
        data: customEvent.data
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
      setUnreadCount(prev => prev + 1);
    }

    if (event.type === "NOTIFICATION" && (event as any).projectId) {
      const customEvent = event as any;
      setProjectProgress(prev => 
        prev.map(project => 
          project.id === customEvent.projectId 
            ? { ...project, progress: customEvent.progress || project.progress }
            : project
        )
      );
    }
  });

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Remove notification
  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Broadcast new notification
  const broadcastNotification = (type: string, title: string, message: string, priority: string = 'medium') => {
    broadcast({
      type: "NOTIFICATION",
      message: `${title}: ${message}`
    });
  };

  // Get notification icon and color
  const getNotificationStyle = (notification: Notification) => {
    switch (notification.type) {
      case 'emergency':
        return { 
          icon: AlertTriangle, 
          iconColor: 'text-red-500', 
          bgColor: 'bg-red-900/20 border-red-500',
          dotColor: 'bg-red-500'
        };
      case 'urgent_task':
        return { 
          icon: AlertCircle, 
          iconColor: 'text-orange-500', 
          bgColor: 'bg-orange-900/20 border-orange-500',
          dotColor: 'bg-orange-500'
        };
      case 'project_update':
        return { 
          icon: TrendingUp, 
          iconColor: 'text-blue-500', 
          bgColor: 'bg-blue-900/20 border-blue-500',
          dotColor: 'bg-blue-500'
        };
      case 'progress':
        return { 
          icon: Target, 
          iconColor: 'text-green-500', 
          bgColor: 'bg-green-900/20 border-green-500',
          dotColor: 'bg-green-500'
        };
      case 'achievement':
        return { 
          icon: CheckCircle, 
          iconColor: 'text-purple-500', 
          bgColor: 'bg-purple-900/20 border-purple-500',
          dotColor: 'bg-purple-500'
        };
      default:
        return { 
          icon: Bell, 
          iconColor: 'text-gray-400', 
          bgColor: 'bg-gray-900/20 border-gray-500',
          dotColor: 'bg-gray-500'
        };
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-red-400" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{Math.min(unreadCount, 9)}</span>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-white">Alerts</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            className="text-xs text-gray-400 hover:text-white"
          >
            Mark all read
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2">
            <div className="text-sm font-bold text-red-400">
              {notifications.filter(n => n.priority === 'critical').length}
            </div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-2">
            <div className="text-sm font-bold text-orange-400">
              {notifications.filter(n => n.priority === 'high').length}
            </div>
            <div className="text-xs text-gray-400">High</div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-sm text-gray-400">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const style = getNotificationStyle(notification);
              const NotificationIcon = style.icon;
              
              return (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all hover:bg-gray-700/30 cursor-pointer ${
                    notification.read ? 'bg-gray-700/10 border-gray-600' : style.bgColor
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        notification.read ? 'bg-gray-700' : style.bgColor
                      }`}>
                        <NotificationIcon className={`w-4 h-4 ${style.iconColor}`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-1.5 py-0.5 ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className={`w-2 h-2 rounded-full ${style.dotColor}`}></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Separator className="bg-gray-600" />

      {/* Live Project Progress */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Live Progress</span>
          </h4>
        </div>
        
        <div className="space-y-3">
          {projectProgress.slice(0, 3).map((project) => (
            <div key={project.id} className="bg-gray-700/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white truncate">
                  {project.name}
                </span>
                <span className="text-xs text-gray-400">
                  {project.progress}%
                </span>
              </div>
              
              <Progress value={project.progress} className="h-1.5 mb-2" />
              
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    project.urgency === 'high' ? 'border-red-500 text-red-400' :
                    project.urgency === 'medium' ? 'border-yellow-500 text-yellow-400' :
                    'border-gray-500 text-gray-400'
                  }`}
                >
                  {project.urgency}
                </Badge>
                <span className="text-xs text-gray-500">{project.department}</span>
              </div>
            </div>
          ))}
        </div>
        
        {projectProgress.length > 3 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 text-xs text-gray-400 hover:text-white"
          >
            View all projects
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
