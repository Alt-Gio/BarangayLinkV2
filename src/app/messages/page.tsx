"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatList } from "@/components/chat/ChatList";
import { EnhancedChatRoom } from "@/components/chat/EnhancedChatRoom";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Menu,
  Plus,
  Users,
  Circle,
  Megaphone
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"chatRooms"> | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMobileChatList, setShowMobileChatList] = useState(true);

  const currentUser = useQuery(api.users.getCurrentUser);
  const onlineUsers = useQuery(api.messaging.getOnlineUsers);
  const updateOnlineStatus = useMutation(api.messaging.updateOnlineStatus);
  const getOrCreateDirectChat = useMutation(api.messaging.getOrCreateDirectChat);

  useEffect(() => {
    if (currentUser) {
      updateOnlineStatus({});
      const interval = setInterval(() => {
        updateOnlineStatus({});
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [currentUser, updateOnlineStatus]);

  useEffect(() => {
    if (selectedRoomId) {
      document.body.setAttribute('data-hide-bottom-nav', 'true');
    } else {
      document.body.removeAttribute('data-hide-bottom-nav');
    }
    
    return () => {
      document.body.removeAttribute('data-hide-bottom-nav');
    };
  }, [selectedRoomId]);

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  const handleSelectRoom = (roomId: Id<"chatRooms">) => {
    setSelectedRoomId(roomId);
    setShowMobileChatList(false);
  };

  const handleBackToList = () => {
    setSelectedRoomId(null);
    setShowMobileChatList(true);
  };

  const handleClickOnlineUser = async (userId: Id<"users">) => {
    try {
      // Don't start a chat with yourself
      if (userId === currentUser._id) return;
      
      // Get or create direct message room with this user
      const roomId = await getOrCreateDirectChat({ participantId: userId });
      
      // Select the room to open the chat
      setSelectedRoomId(roomId);
      setShowMobileChatList(false);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Messages"
        dashboardSubtitle="Chat with your team"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Header - Hidden when in chat */}
        {!selectedRoomId && (
          <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-800 p-4 flex items-center justify-between z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">Messages</h1>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Chat List Sidebar */}
        <div
          className={`${
            showMobileChatList ? "block" : "hidden"
          } md:block w-full md:w-80 lg:w-96 border-r border-white/10 bg-gray-800/50 md:mt-0 mt-16`}
        >
          <div className="h-full flex flex-col">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-white">Messages</h2>
              </div>
              <Button
                onClick={() => setShowNewChatModal(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>
            </div>

            {/* Online Users */}
            {onlineUsers && onlineUsers.length > 0 && (
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-white">
                    Online ({onlineUsers.length})
                  </span>
                </div>
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                  {onlineUsers.slice(0, 10).map((user: any) => {
                    const isCurrentUser = user._id === currentUser._id;
                    return (
                      <button
                        key={user._id}
                        onClick={() => handleClickOnlineUser(user._id)}
                        disabled={isCurrentUser}
                        className={`flex flex-col items-center gap-1 min-w-[60px] rounded-lg p-2 transition-all ${
                          isCurrentUser 
                            ? 'cursor-default bg-emerald-500/10' 
                            : 'cursor-pointer hover:bg-white/5 group'
                        }`}
                        title={isCurrentUser ? 'This is you' : `Chat with ${user.name}`}
                      >
                        <div className="relative">
                          <img
                            src={user.imageUrl || "/default-avatar.png"}
                            alt={user.name}
                            className={`w-12 h-12 rounded-full object-cover border-2 transition-colors ${
                              isCurrentUser 
                                ? 'border-emerald-400' 
                                : 'border-emerald-500 group-hover:border-emerald-400'
                            }`}
                          />
                          <div className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-gray-800 rounded-full ${
                            !isCurrentUser && 'group-hover:animate-pulse'
                          }`}></div>
                        </div>
                        <span className={`text-xs truncate w-full text-center transition-colors ${
                          isCurrentUser 
                            ? 'text-emerald-400 font-semibold' 
                            : 'text-gray-400 group-hover:text-gray-200'
                        }`}>
                          {isCurrentUser ? 'You' : user.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat List */}
            <div className="flex-1 overflow-hidden">
              <ChatList selectedRoomId={selectedRoomId || undefined} onSelectRoom={handleSelectRoom} />
            </div>
          </div>
        </div>

        {/* Chat Room Area */}
        <div className={`${showMobileChatList ? "hidden" : "block"} md:block flex-1 ${selectedRoomId ? "" : "md:mt-0 mt-16"}`}>
          {selectedRoomId ? (
            <EnhancedChatRoom roomId={selectedRoomId} onBack={handleBackToList} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-gray-900/50">
              <MessageCircle className="w-16 h-16 sm:w-24 sm:h-24 text-gray-700 mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome to Messages</h2>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 max-w-md px-4">
                Select a conversation from the sidebar or start a new chat to begin messaging your team
              </p>
              <Button
                onClick={() => setShowNewChatModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base w-full sm:w-auto max-w-xs"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start New Conversation
              </Button>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-12 max-w-md w-full px-4">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 mb-2 mx-auto" />
                  <p className="text-xl sm:text-2xl font-bold text-white">{onlineUsers?.length || 0}</p>
                  <p className="text-xs sm:text-sm text-gray-400">Online Now</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 mx-auto" />
                  <p className="text-xl sm:text-2xl font-bold text-white">0</p>
                  <p className="text-xs sm:text-sm text-gray-400">Unread Messages</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(roomId) => {
            setSelectedRoomId(roomId);
            setShowMobileChatList(false);
          }}
        />
      )}
    </div>
  );
}
