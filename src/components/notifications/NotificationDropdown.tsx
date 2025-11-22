"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { X, Check, Trash2, Bell, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationIcon, getPriorityColorClasses } from '@/lib/notificationIcons';
import { playNotificationSound, setSoundEnabled, isSoundEnabled } from '@/lib/notificationSounds';
import { useState } from 'react';

interface Props {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: Props) {
  const router = useRouter();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  
  const notifications = useQuery(api.notifications.getAllUserNotifications, { 
    limit: 10 
  });
  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  
  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setSoundEnabled(newState);
    if (newState) playNotificationSound('medium');
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    
    // Navigate to related page if actionUrl exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    } else if (notification.relatedType === 'eventTask' || notification.metadata?.data?.taskId) {
      router.push('/tasks/my-duties');
      onClose();
    } else if (notification.metadata?.data?.projectId) {
      router.push(`/projects/${notification.metadata.data.projectId}`);
      onClose();
    }
  };

  // Removed - now using NotificationIcon component from @/lib/notificationIcons

  // Removed - now using getPriorityColorClasses from @/lib/notificationIcons

  return (
    <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/95 backdrop-blur sticky top-0">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-400" />
          Notifications
        </h3>
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="text-gray-400 hover:text-teal-400 transition-colors"
            title={soundOn ? 'Mute notifications' : 'Enable sounds'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          {notifications && notifications.some(n => !n.isRead) && (
            <button
              onClick={() => markAllRead()}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              title="Mark all as read"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        <AnimatePresence>
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => {
            const priorityColors = getPriorityColorClasses(notification.metadata?.priority, notification.isRead);
            return (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className={`p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-all cursor-pointer border-l-4 ${
                priorityColors.background} ${priorityColors.border} ${!notification.isRead ? 'bg-teal-500/5' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <NotificationIcon 
                    type={notification.type} 
                    category={notification.category || notification.metadata?.category}
                    size={24}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white line-clamp-1">
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1 shadow-lg shadow-teal-500/50" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification({ notificationId: notification._id });
                      }}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {notification.metadata?.priority && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColors.badge}`}>
                        {notification.metadata.priority.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            );
          }
          )
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="p-3 border-t border-gray-700 bg-gray-800/95">
          <button
            onClick={() => {
              router.push('/notifications');
              onClose();
            }}
            className="w-full text-sm text-teal-400 hover:text-teal-300 font-medium flex items-center justify-center gap-2 py-2 hover:bg-gray-700/50 rounded transition-all"
          >
            View All Notifications
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
