"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPanel() {
  const notifications = useQuery(api.notifications.getAllUserNotifications, {
    limit: 50,
  });
  
  const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount);
  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "welcome":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? "20" : "30";
    
    switch (type) {
      case "error":
        return `bg-red-500/${opacity} border-red-500/30`;
      case "warning":
        return `bg-yellow-500/${opacity} border-yellow-500/30`;
      case "success":
        return `bg-emerald-500/${opacity} border-emerald-500/30`;
      case "welcome":
        return `bg-purple-500/${opacity} border-purple-500/30`;
      default:
        return `bg-blue-500/${opacity} border-blue-500/30`;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      chat: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      project_alert: "bg-red-500/20 text-red-400 border-red-500/30",
      project_announcement: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      system: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      task: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };

    return colors[category] || colors.system;
  };

  const handleMarkAsRead = async (notificationId: any) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDelete = async (notificationId: any) => {
    try {
      await deleteNotification({ notificationId });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Notifications</h3>
          </div>
          {unreadCount && unreadCount > 0 ? (
            <Badge variant="destructive" className="bg-red-600">
              {unreadCount}
            </Badge>
          ) : null}
        </div>

        {unreadCount && unreadCount > 0 ? (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            size="sm"
            className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        ) : null}
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {notifications?.map((notification: any) => (
            <Card
              key={notification._id}
              className={`p-3 ${getNotificationColor(notification.type, notification.isRead)} ${
                !notification.isRead ? "ring-1 ring-blue-500/50" : ""
              } hover:bg-opacity-50 transition-all`}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white line-clamp-2">
                      {notification.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification._id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCategoryBadge(notification.category)}`}
                      >
                        {notification.category.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                    </div>

                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {(!notifications || notifications.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs">You're all caught up!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
