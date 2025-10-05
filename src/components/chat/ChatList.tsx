import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MessageCircle, Users, Briefcase, Hash, Circle } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface ChatListProps {
  selectedRoomId?: Id<"chatRooms">;
  onSelectRoom: (roomId: Id<"chatRooms">) => void;
}

export function ChatList({ selectedRoomId, onSelectRoom }: ChatListProps) {
  const chatRooms = useQuery(api.messaging.getMyChatRooms);
  const onlineUsers = useQuery(api.messaging.getOnlineUsers);

  if (!chatRooms) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "direct":
        return <MessageCircle className="w-5 h-5" />;
      case "project":
        return <Briefcase className="w-5 h-5" />;
      case "department":
        return <Users className="w-5 h-5" />;
      default:
        return <Hash className="w-5 h-5" />;
    }
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers?.some((u) => u._id === userId);
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        <p className="text-sm text-gray-400 mt-1">{chatRooms.length} conversations</p>
      </div>

      {/* Chat Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">No conversations yet</p>
            <p className="text-gray-500 text-sm mt-2">Start a new chat to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chatRooms.map((room: any) => {
              const isSelected = selectedRoomId === room._id;
              const otherUser = room.type === "direct" ? room.participants.find((p: any) => p._id !== room.participants[0]._id) : null;
              const isOnline = otherUser && onlineUsers ? isUserOnline(otherUser._id) : false;

              return (
                <button
                  key={room._id}
                  onClick={() => onSelectRoom(room._id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                    isSelected ? "bg-emerald-600/20 border-l-4 border-emerald-500" : ""
                  }`}
                >
                  {/* Avatar/Icon */}
                  <div className="relative flex-shrink-0">
                    {room.type === "direct" && otherUser ? (
                      <div className="relative">
                        <img
                          src={otherUser.imageUrl || "/default-avatar.png"}
                          alt={otherUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-gray-900 rounded-full"></div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-300">
                        {getRoomIcon(room.type)}
                      </div>
                    )}
                  </div>

                  {/* Room Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {room.displayName}
                      </h3>
                      {room.lastMessageAt && (
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTimestamp(room.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {room.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {room.unreadCount > 0 && (
                    <Badge className="bg-emerald-600 text-white rounded-full min-w-[1.5rem] h-6 flex items-center justify-center">
                      {room.unreadCount > 99 ? "99+" : room.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
