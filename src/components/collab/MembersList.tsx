"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MessageCircle,
  Search,
  Circle,
  Crown,
  Shield,
  Briefcase,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Id } from "../../../convex/_generated/dataModel";

interface MembersListProps {
  onStartChat: (userId: Id<"users">, userName: string) => void;
  onStartGroupChat: (userIds: Id<"users">[], userName: string) => void;
}

export function MembersList({ onStartChat, onStartGroupChat }: MembersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(new Set());
  
  const users = useQuery(api.presence.getAllUsersWithStatus);
  const heartbeat = useMutation(api.presence.heartbeat);

  // Send heartbeat every 30 seconds
  useMemo(() => {
    const interval = setInterval(() => {
      heartbeat().catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [heartbeat]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const onlineCount = users?.filter((u) => u.status === "online").length || 0;
  const totalCount = users?.length || 0;

  const getRoleIcon = (userLevel: string) => {
    switch (userLevel) {
      case "ADMIN":
        return <Crown className="w-4 h-4 text-red-400" />;
      case "MANAGER":
        return <Shield className="w-4 h-4 text-blue-400" />;
      case "BUILDER":
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (userLevel: string) => {
    switch (userLevel) {
      case "ADMIN":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "MANAGER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "BUILDER":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusColor = (status: "online" | "away" | "offline") => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const toggleUserSelection = (userId: Id<"users">) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleStartGroupChat = () => {
    if (selectedUsers.size >= 2) {
      const userNames = Array.from(selectedUsers)
        .map((id) => users?.find((u) => u._id === id)?.name)
        .filter(Boolean)
        .join(", ");
      onStartGroupChat(Array.from(selectedUsers), userNames);
      setSelectedUsers(new Set());
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Team Members</h3>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            {onlineCount}/{totalCount} online
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
          />
        </div>

        {/* Group Chat Button */}
        {selectedUsers.size >= 2 && (
          <Button
            onClick={handleStartGroupChat}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Start Group Chat ({selectedUsers.size} selected)
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredUsers.map((member) => (
          <Card
            key={member._id}
            className={`group p-3 bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 transition-all cursor-pointer ${
              selectedUsers.has(member._id) ? "ring-2 ring-blue-500 bg-gray-800" : ""
            }`}
            onClick={() => toggleUserSelection(member._id)}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar with Status */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12 border-2 border-gray-700">
                  <AvatarImage src={member.imageUrl} alt={member.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {member.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-800 ${getStatusColor(
                    member.status
                  )}`}
                />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                  {getRoleIcon(member.userLevel)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={`text-xs ${getRoleColor(member.userLevel)}`}>
                    {member.userLevel}
                  </Badge>
                  {member.status === "online" && (
                    <span className="text-xs text-emerald-400 flex items-center">
                      <Circle className="w-2 h-2 fill-current mr-1" />
                      Active
                    </span>
                  )}
                </div>

                {member.department && (
                  <p className="text-xs text-gray-400 truncate mt-1">{member.department}</p>
                )}
              </div>

              {/* Chat Button */}
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartChat(member._id, member.name);
                }}
              >
                <MessageCircle className="w-4 h-4 text-blue-400" />
              </Button>
            </div>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
