"use client";

import { useOthers, useMyPresence, useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Users, MessageCircle, Eye } from "lucide-react";

interface CollaborativeRoomProps {
  children: React.ReactNode;
  roomId: string;
  showPresence?: boolean;
}

export function CollaborativeRoom({ children, roomId, showPresence = true }: CollaborativeRoomProps) {
  const { user } = useUser();
  const currentUser = useQuery(api.users_fixed.getCurrentUser);
  const others = useOthers();
  const [myPresence, updateMyPresence] = useMyPresence();
  const broadcast = useBroadcastEvent();
  const [notifications, setNotifications] = useState<string[]>([]);

  // Listen for user join/leave events
  useEventListener(({ event }) => {
    if (event.type === "USER_JOINED") {
      setNotifications(prev => [...prev, `${event.user.name} joined the room`]);
    } else if (event.type === "USER_LEFT") {
      setNotifications(prev => [...prev, `${event.user.name} left the room`]);
    }
  });

  // Update presence when user data changes
  useEffect(() => {
    if (user && currentUser) {
      updateMyPresence({
        user: {
          id: user.id,
          name: user.fullName || "Anonymous",
          avatar: user.imageUrl || "",
          role: currentUser.userLevel?.name || "WORKER",
          level: currentUser.level || 1,
        },
        cursor: null,
        selection: null,
      });
    }
  }, [user, currentUser, updateMyPresence]);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: "text-purple-400 bg-purple-900/20 border-purple-500",
      MANAGER: "text-blue-400 bg-blue-900/20 border-blue-500",
      BUILDER: "text-green-400 bg-green-900/20 border-green-500",
      WORKER: "text-gray-400 bg-gray-900/20 border-gray-500",
    };
    return colors[role as keyof typeof colors] || colors.WORKER;
  };

  return (
    <div className="relative">
      {/* Presence Indicators */}
      {showPresence && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {/* Active Users */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">
                Active Users ({others.length + 1})
              </span>
            </div>
            
            <div className="space-y-2">
              {/* Current user */}
              {user && currentUser && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">
                      {user.fullName?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">You</p>
                    <span className={`text-xs px-1 py-0.5 rounded ${getRoleColor(currentUser.userLevel?.name || "WORKER")}`}>
                      {currentUser.userLevel?.name || "WORKER"}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Other users */}
              {others.map(({ connectionId, presence }) => (
                <div key={connectionId} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">
                      {presence.user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{presence.user?.name || "Anonymous"}</p>
                    <span className={`text-xs px-1 py-0.5 rounded ${getRoleColor(presence.user?.role || "WORKER")}`}>
                      {presence.user?.role || "WORKER"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Activity</span>
              </div>
              <div className="space-y-1">
                {notifications.slice(-3).map((notification, index) => (
                  <p key={index} className="text-xs text-gray-400">{notification}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
}
