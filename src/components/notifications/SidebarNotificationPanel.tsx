"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SidebarNotificationPanel() {
  const router = useRouter();
  
  const notifications = useQuery(api.notifications.getAllUserNotifications, { limit: 2 });
  const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount);
  const markAsRead = useMutation(api.notifications.markAsRead);

  const handleNavigate = async (notification: any) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    
    // Navigate to action URL or notifications page
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else {
      router.push('/notifications');
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

  return (
    <div className="border-t border-gray-700 bg-gray-900/30">
      {/* Header with unread count and View All button */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-medium text-white">Notifications</p>
          {unreadCount && unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        
        {/* View All Button - On the right */}
        <button
          onClick={() => router.push('/notifications')}
          className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Always visible notification list */}
      <div className="max-h-48 overflow-y-auto">
        {!notifications || notifications.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-1 px-2 pb-2">
            {notifications.map((notification) => {
              const isUnread = !notification.isRead;
                
              return (
                <div
                  key={notification._id}
                  onClick={() => handleNavigate(notification)}
                  className={`relative px-3 py-2 rounded-lg cursor-pointer transition-all group ${
                    isUnread 
                      ? 'bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 shadow-sm shadow-teal-500/20' 
                      : 'bg-gray-800/40 hover:bg-gray-800/70 border border-transparent'
                  }`}
                >
                  {/* Subtle glow for unread */}
                  {isUnread && (
                    <div className="absolute inset-0 rounded-lg bg-teal-500/5 animate-pulse pointer-events-none" />
                  )}
                  
                  <div className="flex items-start gap-2 relative z-10">
                    {/* Icon */}
                    <span className="text-sm flex-shrink-0 mt-0.5">
                      {getCategoryIcon(notification.category)}
                    </span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        isUnread ? 'text-white' : 'text-gray-300'
                      }`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    
                    {/* Unread dot */}
                    {isUnread && (
                      <span className="w-2 h-2 bg-teal-400 rounded-full flex-shrink-0 mt-1 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
