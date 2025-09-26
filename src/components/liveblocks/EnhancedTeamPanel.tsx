"use client";

import { useState } from "react";
import { useOthers, useSelf, useBroadcastEvent } from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  MessageCircle, 
  Phone, 
  MoreHorizontal,
  Crown,
  Shield,
  Briefcase,
  User as UserIcon,
  Search,
  Settings,
  UserCheck,
  Zap,
  Activity
} from "lucide-react";

interface EnhancedTeamPanelProps {
  className?: string;
  onStartChat?: (userId: string, userName: string) => void;
}

export function EnhancedTeamPanel({ className = "", onStartChat }: EnhancedTeamPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const others = useOthers();
  const self = useSelf();
  const { user } = useUser();
  const broadcast = useBroadcastEvent();
  
  // Get all users from Convex for better role information
  const allConvexUsers = useQuery(api.liveblocks.getActiveUsers);
  const currentUser = useQuery(
    api.liveblocks.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  // Combine online users with Convex user data
  const allUsers = [
    ...(self ? [{
      ...self,
      isSelf: true,
      presence: self.presence || {},
      info: {
        name: user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'You',
        avatar: user?.imageUrl || '',
        role: currentUser?.userLevel?.name || 'WORKER',
        level: currentUser?.level || 1,
        department: currentUser?.department || '',
        status: 'online',
        ...self.info
      }
    }] : []),
    ...others.map(other => {
      // Find matching Convex user data
      const convexUser = allConvexUsers?.find(cu => cu.clerkId === other.id);
      return {
        ...other,
        isSelf: false,
        info: {
          name: other.info?.name || convexUser?.name || `User ${String(other.connectionId)?.slice(-4) || 'Unknown'}`,
          avatar: other.info?.avatar || convexUser?.imageUrl || '',
          role: other.info?.role || 'WORKER',
          level: other.info?.level || 1,
          department: convexUser?.department || '',
          status: 'online',
          ...other.info
        }
      };
    })
  ];

  // Filter users by search term
  const filteredUsers = allUsers.filter(onlineUser =>
    onlineUser.info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    onlineUser.info.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (onlineUser.info.department && onlineUser.info.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort users by role hierarchy (ADMIN > MANAGER > BUILDER > WORKER)
  const sortedUsers = filteredUsers.sort((a, b) => {
    const roleOrder = { ADMIN: 4, MANAGER: 3, BUILDER: 2, WORKER: 1 };
    const aRole = roleOrder[a.info.role as keyof typeof roleOrder] || 1;
    const bRole = roleOrder[b.info.role as keyof typeof roleOrder] || 1;
    
    if (aRole !== bRole) return bRole - aRole;
    return a.info.name.localeCompare(b.info.name);
  });

  // Group users by role
  const usersByRole = {
    ADMIN: sortedUsers.filter(u => u.info.role === 'ADMIN'),
    MANAGER: sortedUsers.filter(u => u.info.role === 'MANAGER'),
    BUILDER: sortedUsers.filter(u => u.info.role === 'BUILDER'),
    WORKER: sortedUsers.filter(u => u.info.role === 'WORKER'),
  };

  // Get role display info
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'ADMIN': 
        return { 
          color: 'text-red-400 bg-red-900/20 border-red-500', 
          icon: Crown, 
          label: 'ADMIN',
          description: 'System Administrator'
        };
      case 'MANAGER': 
        return { 
          color: 'text-blue-400 bg-blue-900/20 border-blue-500', 
          icon: Shield, 
          label: 'MANAGER',
          description: 'Project Manager'
        };
      case 'BUILDER': 
        return { 
          color: 'text-emerald-400 bg-emerald-900/20 border-emerald-500', 
          icon: Briefcase, 
          label: 'BUILDER',
          description: 'Community Builder'
        };
      default: 
        return { 
          color: 'text-gray-400 bg-gray-900/20 border-gray-500', 
          icon: UserIcon, 
          label: 'WORKER',
          description: 'Community Member'
        };
    }
  };

  // Handle chat request
  const handleChatRequest = (targetUser: any) => {
    if (targetUser.isSelf) return;
    
    broadcast({
      type: "CHAT_REQUEST",
      fromUser: {
        id: user?.id || 'unknown',
        name: user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Anonymous'
      },
      toUser: {
        id: targetUser.id,
        name: targetUser.info.name
      }
    });
    
    onStartChat?.(targetUser.id, targetUser.info.name);
  };

  const renderUserGroup = (role: string, users: any[]) => {
    if (users.length === 0) return null;
    
    const roleInfo = getRoleInfo(role);
    const RoleIcon = roleInfo.icon;

    return (
      <div key={role} className="mb-6">
        <div className="flex items-center space-x-2 mb-3 px-3">
          <div className={`w-6 h-6 rounded-md ${roleInfo.color} flex items-center justify-center`}>
            <RoleIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{roleInfo.label}</h4>
            <p className="text-xs text-gray-400">{users.length} member{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {users.map((onlineUser) => (
            <div
              key={onlineUser.connectionId || onlineUser.id}
              className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors mx-2 ${
                onlineUser.isSelf ? 'bg-blue-900/20 border border-blue-500/30' : ''
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={onlineUser.info.avatar} 
                      alt={onlineUser.info.name} 
                    />
                    <AvatarFallback className="text-sm bg-gray-700 text-white">
                      {onlineUser.info.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  
                  {/* Role badge */}
                  <div className="absolute -top-1 -left-1">
                    <div className={`w-5 h-5 rounded-full border-2 border-gray-800 flex items-center justify-center ${roleInfo.color}`}>
                      <RoleIcon className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white truncate">
                      {onlineUser.info.name}
                      {onlineUser.isSelf && (
                        <span className="text-xs text-blue-400 ml-1">(You)</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                      Level {onlineUser.info.level}
                    </span>
                    
                    {onlineUser.info.department && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className="text-xs text-gray-400 truncate">
                          {onlineUser.info.department}
                        </span>
                      </>
                    )}
                    
                    <div className="flex items-center space-x-1 ml-auto">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-400">Online</span>
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
                    className="h-8 w-8 p-0 hover:bg-gray-600"
                    title="Start chat"
                  >
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-600"
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-800 flex flex-col h-full ${className}`}>
      {/* Search */}
      <div className="p-4 border-b border-gray-600">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* Team Stats */}
      <div className="p-4 border-b border-gray-600 bg-gray-700/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">{allUsers.length}</div>
            <div className="text-xs text-gray-400">Online Now</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {Object.keys(usersByRole).reduce((acc, role) => 
                acc + (usersByRole[role as keyof typeof usersByRole].length > 0 ? 1 : 0), 0
              )}
            </div>
            <div className="text-xs text-gray-400">Active Roles</div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {searchTerm ? (
            // Show filtered results
            <div>
              <h3 className="text-sm font-semibold text-gray-400 px-3 mb-3">
                Search Results ({filteredUsers.length})
              </h3>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((onlineUser) => {
                    const roleInfo = getRoleInfo(onlineUser.info.role);
                    return (
                      <div
                        key={onlineUser.connectionId || onlineUser.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors mx-2"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={onlineUser.info.avatar} alt={onlineUser.info.name} />
                          <AvatarFallback className="text-xs bg-gray-700 text-white">
                            {onlineUser.info.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {onlineUser.info.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`text-xs ${roleInfo.color}`}>
                              {roleInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Show grouped by role
            <div>
              {Object.entries(usersByRole).map(([role, users]) => 
                renderUserGroup(role, users)
              )}
              
              {sortedUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h4 className="text-lg font-medium text-gray-400 mb-2">No team members online</h4>
                  <p className="text-gray-500">Invite your team to start collaborating!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-600 bg-gray-700/30">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Live updates</span>
          </div>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
