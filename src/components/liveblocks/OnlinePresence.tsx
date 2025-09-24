"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OnlinePresenceProps {
  maxVisible?: number;
  showSelf?: boolean;
}

interface UserData {
  id: string;
  name: string;
  avatar: string;
  isCurrentUser: boolean;
}

// Standalone version that doesn't require RoomProvider
export function OnlinePresence({ maxVisible = 5, showSelf = false }: OnlinePresenceProps) {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span>Not signed in</span>
      </div>
    );
  }

  // For now, show just the current user as a placeholder
  // This will be enhanced when we have proper room context
  const onlineUsers: UserData[] = showSelf ? [{
    id: user.id,
    name: user.fullName || user.firstName || 'You',
    avatar: user.imageUrl || '',
    isCurrentUser: true
  }] : [];

  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, onlineUsers.length - maxVisible);

  if (onlineUsers.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span>Join a room to see others online</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {onlineUsers.length} online
          </span>
        </div>
        
        <div className="flex -space-x-2">
          {visibleUsers.map((userData, index) => (
            <Tooltip key={userData.id || index}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage 
                      src={userData.avatar} 
                      alt={userData.name} 
                    />
                    <AvatarFallback className="text-xs">
                      {userData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  {userData.isCurrentUser && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 text-xs px-1 py-0"
                    >
                      You
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{userData.name}</p>
                {userData.isCurrentUser && <p className="text-xs text-gray-400">(You)</p>}
              </TooltipContent>
            </Tooltip>
          ))}
          
          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-8 h-8 bg-gray-200 border-2 border-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{hiddenCount}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hiddenCount} more user{hiddenCount > 1 ? 's' : ''} online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Compact version for navigation bars
export function CompactOnlinePresence() {
  const { user } = useUser();
  const onlineCount = user ? 1 : 0; // Just current user for now

  if (!user) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-sm font-medium text-gray-500">
          Offline
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium text-green-700">
        {onlineCount} online
      </span>
    </div>
  );
}
