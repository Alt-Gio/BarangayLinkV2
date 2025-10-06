"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Users, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

interface ChatRoomsListProps {
  selectedRoomId: Id<"chatRooms"> | null;
  onSelectRoom: (roomId: Id<"chatRooms">) => void;
}

export function ChatRoomsList({ selectedRoomId, onSelectRoom }: ChatRoomsListProps) {
  const { user } = useUser();
  const chatRooms = useQuery(api.messaging.getUserChatRooms);

  const getRoomIcon = (room: any) => {
    if (room.type === "direct") {
      const otherParticipant = room.participants.find(
        (p: any) => p._id !== user?.id
      );
      
      return (
        <Avatar className="w-12 h-12 border-2 border-gray-700">
          <AvatarImage src={otherParticipant?.imageUrl} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
            {otherParticipant?.name?.substring(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>
      );
    }

    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
        <Users className="w-6 h-6 text-white" />
      </div>
    );
  };

  const getRoomName = (room: any) => {
    if (room.type === "direct") {
      const otherParticipant = room.participants.find(
        (p: any) => p._id !== user?.id
      );
      return otherParticipant?.name || "Unknown User";
    }
    return room.name;
  };

  const getRoomSubtitle = (room: any) => {
    if (room.type === "direct") {
      const otherParticipant = room.participants.find(
        (p: any) => p._id !== user?.id
      );
      return otherParticipant?.position || "";
    }
    return `${room.participants.length} members`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Messages</h3>
          {chatRooms && chatRooms.length > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              {chatRooms.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Rooms List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {chatRooms?.map((room: any) => (
            <Card
              key={room._id}
              onClick={() => onSelectRoom(room._id)}
              className={`p-3 cursor-pointer transition-all ${
                selectedRoomId === room._id
                  ? "bg-blue-600/20 border-blue-500 ring-1 ring-blue-500"
                  : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Room Icon */}
                <div className="relative flex-shrink-0">
                  {getRoomIcon(room)}
                  {room.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {room.unreadCount > 9 ? "9+" : room.unreadCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {getRoomName(room)}
                    </h4>
                    {room.lastMessageAt && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDistanceToNow(room.lastMessageAt, { addSuffix: false })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 truncate">
                      {room.lastMessage || getRoomSubtitle(room)}
                    </p>
                    
                    {room.type === "general" && (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ml-2">
                        <Hash className="w-3 h-3 mr-1" />
                        Group
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {(!chatRooms || chatRooms.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start chatting with your team!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
