"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Trash2, Check, CheckCheck, Filter, X, Menu } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function NotificationsPage() {
  const router = useRouter();
  const { userRole } = useDashboardData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  const allNotifications = useQuery(api.notifications.getAllUserNotifications, {
    limit: 100,
  });
  
  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Filter notifications
  const notifications = allNotifications?.filter(n => {
    if (filter === 'unread' && n.isRead) return false;
    if (categoryFilter && n.category !== categoryFilter && n.metadata?.category !== categoryFilter) return false;
    return true;
  });

  const unreadCount = allNotifications?.filter(n => !n.isRead).length || 0;

  // Get unique categories
  const categories = Array.from(
    new Set(
      allNotifications?.map(n => n.category || n.metadata?.category).filter(Boolean) || []
    )
  );

  const getNotificationIcon = (type: string, category?: string) => {
    if (category) {
      switch (category) {
        case 'task_assigned':
        case 'task':
          return '📋';
        case 'task_removed':
          return '❌';
        case 'task_updated':
          return '✏️';
        case 'message':
        case 'chat':
          return '💬';
        case 'project_announcement':
          return '📢';
        case 'project_alert':
          return '🚨';
        case 'deadline':
          return '⏰';
        default:
          break;
      }
    }
    
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'task_verified':
        return '✔️';
      case 'task_rejected':
        return '❌';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'welcome':
        return '👋';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority?: string, isRead?: boolean) => {
    const baseOpacity = isRead ? '5' : '10';
    
    switch (priority) {
      case 'urgent':
        return `bg-red-500/${baseOpacity} border-red-500`;
      case 'high':
        return `bg-orange-500/${baseOpacity} border-orange-500`;
      case 'medium':
        return `bg-teal-500/${baseOpacity} border-teal-500`;
      case 'low':
        return `bg-gray-500/${baseOpacity} border-gray-500`;
      default:
        return isRead ? 'border-gray-700' : `bg-teal-500/${baseOpacity} border-teal-500`;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.relatedType === 'eventTask' || notification.metadata?.data?.taskId) {
      router.push('/tasks/my-duties');
    } else if (notification.metadata?.data?.projectId) {
      router.push(`/projects/${notification.metadata.data.projectId}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole={userRole || 'WORKER'}
        dashboardTitle="Notifications"
        dashboardSubtitle="Your activity updates"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Notifications</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        <div className="p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Bell className="w-8 h-8 text-teal-500" />
                Notifications
              </h1>
              <p className="text-gray-400 mt-2">
                {unreadCount > 0 ? (
                  <span className="text-teal-400 font-semibold">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>You're all caught up! 🎉</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg transition-all shadow-lg hover:shadow-teal-500/50"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg active:scale-95 transition-all ${
                filter === 'all'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              All ({allNotifications?.length || 0})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg active:scale-95 transition-all ${
                filter === 'unread'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
            
            {/* Category Filters */}
            {categories.length > 0 && (
              <>
                <div className="w-px bg-gray-700 mx-2" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : (cat as string))}
                    className={`px-3 py-2 rounded-lg text-sm active:scale-95 transition-all ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    {cat?.replace(/_/g, ' ')}
                  </button>
                ))}
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className="px-2 py-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white active:scale-95 transition-all"
                    title="Clear filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-gray-800 rounded-lg p-5 border-l-4 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                  getPriorityColor(notification.metadata?.priority, notification.isRead)
                } ${!notification.isRead ? 'shadow-lg shadow-teal-500/10' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {getNotificationIcon(notification.type, notification.category || notification.metadata?.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold text-lg">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50 animate-pulse" />
                          )}
                        </div>
                        {(notification.category || notification.metadata?.category) && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 mt-1 inline-block">
                            {(notification.category || notification.metadata?.category)?.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead({ notificationId: notification._id });
                            }}
                            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition-all"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification({ notificationId: notification._id });
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-400 mt-2">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        🕒 {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                      {notification.metadata?.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          notification.metadata.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                          notification.metadata.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          notification.metadata.priority === 'medium' ? 'bg-teal-500/20 text-teal-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {notification.metadata.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800 rounded-lg p-16 text-center border border-gray-700">
              <Bell className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {filter === 'unread' 
                  ? "You've read all your notifications!" 
                  : "When you receive notifications, they'll appear here"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
      </div>
    </div>
  );
}
