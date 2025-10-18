"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SidebarNotificationPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const notifications = useQuery(api.notifications.getAllUserNotifications, { limit: 2 });
  const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount);
  const markAsRead = useMutation(api.notifications.markAsRead);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    
    // Expand/collapse
    if (expandedId === notification._id) {
      setExpandedId(null);
    } else {
      setExpandedId(notification._id);
    }
  };

  const handleNavigate = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };


  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'task_assigned': return '📋';
      case 'task_completed': return '✅';
      case 'task_comment': return '💬';
      case 'mention': return '👤';
      case 'message': return '💬';
      case 'project_updated': return '📢';
      case 'project_milestone': return '🎉';
      case 'project_completed': return '🎊';
      case 'deadline': return '⏰';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-red-500 bg-red-500/10';
      case 'high': return 'border-l-4 border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-l-4 border-teal-500 bg-teal-500/10';
      default: return 'border-l-4 border-gray-600 bg-gray-800/50';
    }
  };

  return (
    <div className="border-t border-gray-700">
      {/* Toggle Button - Compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-800/50 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition-colors" />
            {unreadCount && unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-white">Notifications</p>
            <p className="text-xs text-gray-500">
              {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread`}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>

      {/* Notification List - Inline Panel */}
      {isOpen && (
        <div className="bg-gray-900/50 border-t border-gray-700">
          {!notifications || notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No notifications yet</p>
              <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {notifications.map((notification) => {
                const isExpanded = expandedId === notification._id;
                const priority = notification.metadata?.priority;
                
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative ${getPriorityColor(priority)} hover:bg-gray-800/70 transition-all cursor-pointer`}
                  >
                    {/* Minimized View - Compact */}
                    {!isExpanded ? (
                      <div className="px-3 py-2 flex items-center gap-2">
                        {/* Icon */}
                        <span className="text-base flex-shrink-0">
                          {getCategoryIcon(notification.category)}
                        </span>
                        
                        {/* Brief Context */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 truncate">
                            {notification.title}
                          </p>
                        </div>
                        
                        {/* Time */}
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true }).replace(' ago', '')}
                        </span>

                        {/* Unread Indicator */}
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    ) : (
                      /* Expanded View - Full Details */
                      <div className="px-3 py-3 space-y-2">
                        {/* Header */}
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">
                            {getCategoryIcon(notification.category)}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        {/* Full Message */}
                        <p className="text-sm text-gray-300 pl-7">
                          {notification.message}
                        </p>
                        
                        {/* Metadata */}
                        {notification.metadata?.data && (
                          <div className="text-xs text-gray-400 space-y-1 bg-gray-800/50 rounded p-2 ml-7">
                            {notification.metadata.data.taskTitle && (
                              <p><span className="font-medium">Task:</span> {notification.metadata.data.taskTitle}</p>
                            )}
                            {notification.metadata.data.projectTitle && (
                              <p><span className="font-medium">Project:</span> {notification.metadata.data.projectTitle}</p>
                            )}
                            {notification.metadata.data.assignedByName && (
                              <p><span className="font-medium">By:</span> {notification.metadata.data.assignedByName}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-2 pl-7">
                          {notification.actionUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(notification);
                              }}
                              className="flex-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded transition-colors"
                            >
                              View Details
                            </button>
                          )}
                          {!notification.isRead && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await markAsRead({ notificationId: notification._id });
                              }}
                              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* View All Link */}
          {notifications && notifications.length > 0 && (
            <button
              onClick={() => {
                router.push('/notifications');
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-sm text-teal-400 hover:text-teal-300 hover:bg-gray-800/50 transition-colors border-t border-gray-700"
            >
              View All Notifications →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
