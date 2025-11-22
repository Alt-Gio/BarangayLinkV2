"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, CheckCheck, X, Volume2, VolumeX } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationIcon, getPriorityColorClasses } from '@/lib/notificationIcons';
import { playNotificationSound, setSoundEnabled, isSoundEnabled } from '@/lib/notificationSounds';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  
  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setSoundEnabled(newState);
    if (newState) playNotificationSound('medium');
  };

  // Get notifications
  const notifications = useQuery(api.notifications.getResidentNotifications, { 
    limit: 10 
  });
  
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (notificationId: Id<"notifications">) => {
    try {
      await deleteNotification({ notificationId });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // Removed - now using NotificationIcon component

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative p-2 hover:bg-gray-700"
        >
          <Bell className="w-5 h-5 text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-96 max-h-[600px] overflow-y-auto bg-gray-900 border-gray-700 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="text-gray-400 hover:text-blue-400 transition-colors p-1"
              title={soundOn ? 'Mute notifications' : 'Enable sounds'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-800">
          <AnimatePresence>
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => {
              const priorityColors = getPriorityColorClasses(notification.metadata?.priority, notification.isRead);
              return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className={`p-4 hover:bg-gray-800/50 transition-colors border-l-2 ${
                  priorityColors.border} ${!notification.isRead ? "bg-blue-500/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <NotificationIcon 
                      type={notification.type}
                      category={notification.category || notification.metadata?.category}
                      size={20}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${!notification.isRead ? "text-white" : "text-gray-300"}`}>
                        {notification.title}
                      </h4>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="flex-shrink-0 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                    
                    {/* Priority Badge */}
                    {notification.metadata?.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${priorityColors.badge}`}>
                        {notification.metadata.priority.toUpperCase()}
                      </span>
                    )}

                    {/* Action button if has actionUrl */}
                    {notification.actionUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full border-blue-600 text-blue-400 hover:bg-blue-600/20"
                        onClick={() => {
                          window.location.href = notification.actionUrl!;
                          handleMarkAsRead(notification._id);
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            }
            )
          ) : (
            /* Empty State */
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No notifications yet</p>
              <p className="text-gray-500 text-xs mt-1">
                You'll be notified when your certificates are processed
              </p>
            </div>
          )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t border-gray-700 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300"
              onClick={() => {
                setIsOpen(false);
                // Could navigate to full notifications page
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
