"use client";

import { useState } from "react";
import { useOthers, useSelf, useBroadcastEvent } from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  MessageCircle, 
  Video, 
  Phone, 
  MoreHorizontal,
  Crown,
  Shield,
  Hammer,
  User
} from "lucide-react";

interface OnlineUsersListProps {
  className?: string;
  onStartChat?: (userId: string, userName: string) => void;
}

export function OnlineUsersList({ className = "", onStartChat }: OnlineUsersListProps) {
  const others = useOthers();
  const self = useSelf();
  const { user } = useUser();
  const broadcast = useBroadcastEvent();
  
  // Get all online users including self
  const allUsers = [
    ...(self ? [{
      ...self,
      isSelf: true,
      presence: self.presence || {},
      info: {
        name: user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'You',
        avatar: user?.imageUrl || '',
        role: self.presence?.user?.role || 'WORKER',
        level: self.presence?.user?.level || 1,
        ...self.info
      }
    }] : []),
    ...others.map(other => ({
      ...other,
      isSelf: false,
      info: {
        name: other.info?.name || other.presence?.user?.name || `User ${String(other.connectionId || 'Unknown').slice(-4)}`,
        avatar: other.info?.avatar || other.presence?.user?.avatar || '',
        role: other.presence?.user?.role || other.info?.role || 'WORKER',
        level: other.presence?.user?.level || other.info?.level || 1,
        ...other.info
      }
    }))
  ];

  // Sort users by role hierarchy (ADMIN > MANAGER > BUILDER > WORKER)
  const sortedUsers = allUsers.sort((a, b) => {
    const roleOrder = { ADMIN: 4, MANAGER: 3, BUILDER: 2, WORKER: 1 };
    const aRole = roleOrder[a.info.role as keyof typeof roleOrder] || 1;
    const bRole = roleOrder[b.info.role as keyof typeof roleOrder] || 1;
    
    if (aRole !== bRole) return bRole - aRole;
    return a.info.name.localeCompare(b.info.name);
  });

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'MANAGER': return <Shield className="w-3 h-3 text-blue-500" />;
      case 'BUILDER': return <Hammer className="w-3 h-3 text-green-500" />;
      default: return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'BUILDER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle chat request
  const handleChatRequest = (targetUser: any) => {
    if (targetUser.isSelf) return;
    
    broadcast({
      type: "CHAT_REQUEST",
      fromUser: {
        id: user?.id || 'unknown',
        name: user?.fullName || user?.firstName || 'Anonymous'
      },
      toUser: {
        id: targetUser.id,
        name: targetUser.info?.name || 'Unknown User'
      }
    });
    
    onStartChat?.(targetUser.id, targetUser.info?.name || 'Unknown User');
  };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg border border-gray-600 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-white">Online Users</h3>
          <Badge variant="secondary" className="text-xs">
            {allUsers.length}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="h-96">
        <div className="p-2">
          {sortedUsers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No users online</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedUsers.map((onlineUser) => (
                <div
                  key={onlineUser.connectionId || onlineUser.id}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors ${
                    onlineUser.isSelf ? 'bg-blue-900/30 border border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={onlineUser.info.avatar} 
                          alt={onlineUser.info.name} 
                        />
                        <AvatarFallback className="text-sm">
                          {onlineUser.info.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Online indicator */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      
                      {/* Role icon */}
                      <div className="absolute -top-1 -left-1 bg-white rounded-full p-0.5 border">
                        {getRoleIcon(onlineUser.info.role)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-white truncate">
                          {onlineUser.info.name}
                          {onlineUser.isSelf && (
                            <span className="text-xs text-blue-600 ml-1">(You)</span>
                          )}
                        </p>
                        
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-1.5 py-0.5 ${getRoleColor(onlineUser.info.role)}`}
                        >
                          {onlineUser.info.role}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-400">
                          Level {onlineUser.info.level}
                        </span>
                        
                        {/* Activity status */}
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  {!onlineUser.isSelf && (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChatRequest(onlineUser)}
                        className="h-8 w-8 p-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-600 bg-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>
            {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} online
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
