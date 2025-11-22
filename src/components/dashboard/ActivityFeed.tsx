"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Activity, CheckCircle2, MessageSquare, FileText, Calendar, 
  Target, Trophy, Bell, Users, Upload, Clock 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
  showFilters?: boolean;
}

export function ActivityFeed({ userId, limit = 50, showFilters = true }: ActivityFeedProps) {
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  
  const activities = useQuery(
    api.services.activityService.getSystemActivityFeed,
    { limit, moduleTypes: selectedTypes.length > 0 ? selectedTypes : undefined }
  );

  if (!activities) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const activityTypes = [
    { value: "task", label: "Tasks", icon: CheckCircle2, color: "bg-blue-500" },
    { value: "event", label: "Events", icon: Calendar, color: "bg-green-500" },
    { value: "project", label: "Projects", icon: Target, color: "bg-purple-500" },
    { value: "message", label: "Messages", icon: MessageSquare, color: "bg-yellow-500" },
    { value: "document", label: "Documents", icon: FileText, color: "bg-orange-500" },
  ];

  const toggleFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {activityTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedTypes.includes(type.value);
            return (
              <button
                key={type.value}
                onClick={() => toggleFilter(type.value)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
          {selectedTypes.length > 0 && (
            <button
              onClick={() => setSelectedTypes([])}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityItem key={activity._id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  activity: any;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const { icon, color, title } = getActivityStyle(activity.action);
  const Icon = icon;
  const timeAgo = formatDistanceToNow(activity.timestamp, { addSuffix: true });

  return (
    <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className={`${color} p-2 rounded-full flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <img
            src={activity.userAvatar || "/default-avatar.png"}
            alt={activity.userName}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {activity.userName}
          </span>
          <span className="text-xs text-gray-500">
            {activity.userRole && `(${activity.userRole})`}
          </span>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">
          {formatActivityMessage(activity)}
        </p>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
          {activity.metadata?.xpGained && (
            <span className="flex items-center gap-1 text-yellow-600 font-semibold">
              <Trophy className="w-3 h-3" />
              +{activity.metadata.xpGained} XP
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function getActivityStyle(action: string): { icon: any; color: string; title: string } {
  const styles: Record<string, { icon: any; color: string; title: string }> = {
    task_created: { icon: CheckCircle2, color: "bg-blue-500", title: "Task Created" },
    task_completed: { icon: CheckCircle2, color: "bg-green-500", title: "Task Completed" },
    event_checkin: { icon: Calendar, color: "bg-green-500", title: "Event Check-in" },
    event_rsvp: { icon: Calendar, color: "bg-blue-500", title: "Event RSVP" },
    milestone_completed: { icon: Target, color: "bg-purple-500", title: "Milestone Complete" },
    document_uploaded: { icon: Upload, color: "bg-orange-500", title: "Document Upload" },
    message_sent: { icon: MessageSquare, color: "bg-yellow-500", title: "Message Sent" },
    message_mention: { icon: Bell, color: "bg-red-500", title: "Mentioned" },
    project_created: { icon: Target, color: "bg-indigo-500", title: "Project Created" },
    teammate_helped: { icon: Users, color: "bg-pink-500", title: "Helped Teammate" },
  };

  return styles[action] || { icon: Activity, color: "bg-gray-500", title: "Activity" };
}

function formatActivityMessage(activity: any): string {
  const metadata = activity.metadata || {};
  
  switch (activity.action) {
    case "task_completed":
      return `completed task "${metadata.taskTitle || "Untitled"}"`;
    case "task_created":
      return `created task "${metadata.taskTitle || "Untitled"}"`;
    case "event_checkin":
      return `checked in to event "${metadata.eventTitle || "Untitled"}"`;
    case "event_rsvp":
      return `RSVP'd to event "${metadata.eventTitle || "Untitled"}"`;
    case "milestone_completed":
      return `completed milestone "${metadata.milestoneName || "Untitled"}"`;
    case "document_uploaded":
      return `uploaded document "${metadata.documentName || metadata.fileName || "Untitled"}"`;
    case "message_sent":
      return `sent a message in ${metadata.roomName || "chat"}`;
    case "message_mention":
      return `mentioned ${metadata.mentionedUserName || "someone"} in ${metadata.roomName || "chat"}`;
    case "project_created":
      return `created project "${metadata.projectName || "Untitled"}"`;
    case "teammate_helped":
      return `helped teammate with ${metadata.targetType || "something"}`;
    default:
      return `performed ${activity.action.replace(/_/g, " ")}`;
  }
}
