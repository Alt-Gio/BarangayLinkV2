import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Users, MessageCircle, Circle } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (roomId: Id<"chatRooms">) => void;
}

export function NewChatModal({ onClose, onChatCreated }: NewChatModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const searchResults = useQuery(
    api.messaging.searchUsers,
    searchTerm ? { searchTerm } : "skip"
  );
  const onlineUsers = useQuery(api.messaging.getOnlineUsers);
  const createChatRoom = useMutation(api.messaging.createChatRoom);
  const currentUser = useQuery(api.users.getCurrentUser);

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0 || !currentUser) return;

    try {
      const participants = [currentUser._id, ...selectedUsers.map((u) => u._id)];
      const chatType = selectedUsers.length === 1 ? "direct" : "general";
      const chatName =
        selectedUsers.length === 1
          ? selectedUsers[0].name
          : selectedUsers.map((u) => u.name).join(", ");

      const roomId = await createChatRoom({
        name: chatName,
        type: chatType,
        participants,
      });

      onChatCreated(roomId);
      onClose();
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const toggleUserSelection = (user: any) => {
    if (selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers?.some((u) => u._id === userId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-gray-900 rounded-xl border border-white/10 max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-500" />
            New Conversation
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name, email, or department..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user._id}
                  className="bg-emerald-600 text-white pr-1"
                >
                  {user.name}
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="ml-2 hover:bg-emerald-700 rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          {!searchTerm ? (
            <div className="text-center py-8">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Search for users to start chatting</p>
            </div>
          ) : !searchResults || searchResults.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user: any) => {
                const isSelected = selectedUsers.find((u) => u._id === user._id);
                const isOnline = isUserOnline(user._id);

                return (
                  <button
                    key={user._id}
                    onClick={() => toggleUserSelection(user)}
                    className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                      isSelected ? "bg-emerald-600/20 border border-emerald-500" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={user.imageUrl || "/default-avatar.png"}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-gray-900 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <p className="text-sm text-gray-400">
                        {user.position} • {user.department}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {selectedUsers.length > 0 ? `${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} selected` : "Select users to chat with"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-white/20 text-white">
              Cancel
            </Button>
            <Button
              onClick={handleCreateChat}
              disabled={selectedUsers.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Start Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
