"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bell,
  BellRing,
  Check,
  X,
  UserPlus,
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveNotificationsProps {
  userId: string;
}

export function LiveNotifications({ userId }: LiveNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Convex notifications
  const notifications = useQuery(api.notifications.getUserNotifications, { userId });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const getNotificationMessage = (event: any) => {
    switch (event.type) {
      case 'USER_JOINED':
        return `${event.user.name} joined the workspace`;
      case 'USER_LEFT':
        return `${event.user.name} left the workspace`;
      case 'CHAT_MESSAGE':
        return `${event.user.name}: ${event.message}`;
      case 'NOTIFICATION':
        return event.message;
      default:
        return 'New notification';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'USER_JOINED':
      case 'USER_LEFT':
        return UserPlus;
      case 'CHAT_MESSAGE':
        return MessageSquare;
      case 'success':
        return CheckCircle2;
      case 'error':
        return XCircle;
      case 'warning':
        return AlertCircle;
      case 'info':
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({ userId });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId: notificationId as any });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  const allNotifications = (notifications || []).sort((a: any, b: any) => 
    (b.createdAt || 0) - (a.createdAt || 0)
  );

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-blue-400 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5 text-gray-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 w-80 sm:w-96 max-h-[600px] overflow-hidden bg-gray-900 border-gray-700 shadow-2xl z-50">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {allNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No notifications</p>
                  <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {allNotifications.map((notification: any) => {
                    const Icon = getNotificationIcon(notification.type);
                    const isUnread = !notification.isRead;
                    
                    return (
                      <div
                        key={notification._id}
                        className={`p-4 transition-colors ${
                          isUnread
                            ? 'bg-blue-500/10 hover:bg-blue-500/20'
                            : 'bg-transparent hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-white text-sm">
                                  {notification.title}
                                </h4>
                                {notification.message && (
                                  <p className="text-gray-400 text-sm mt-1">
                                    {notification.message}
                                  </p>
                                )}
                                <p className="text-gray-500 text-xs mt-1">
                                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                              {isUnread && (
                                <Button
                                  onClick={() => handleMarkAsRead(notification._id)}
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark read
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDelete(notification._id)}
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-red-400 hover:bg-red-900/20 text-xs"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
