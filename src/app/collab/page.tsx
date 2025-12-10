"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus,
  Bell,
  Crown,
  Shield,
  Briefcase,
  User as UserIcon,
  MessageSquare,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { MembersList } from '@/components/collab/MembersList';
import { ChatInterface } from '@/components/collab/ChatInterface';
import { ChatRoomsList } from '@/components/collab/ChatRoomsList';
import { NotificationsPanel } from '@/components/collab/NotificationsPanel';
import { Id } from '../../../convex/_generated/dataModel';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default function CollabPage() {
  const { user, isLoaded } = useUser();
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"chatRooms"> | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'members'>('chat');
  
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const onlineUsers = useQuery(
    api.presence.getOnlineUsers,
    user ? { includeAway: true } : "skip"
  );
  
  const unreadCount = useQuery(
    api.notifications.getUnreadNotificationsCount,
    user ? {} : "skip"
  );
  
  const getOrCreateChat = useMutation(api.messaging.getOrCreateDirectChat);
  const createGroupChat = useMutation(api.messaging.createGroupChat);
  const updatePresence = useMutation(api.presence.updatePresence);

  useEffect(() => {
    if (user) {
      updatePresence({ status: "online", currentPage: "/collab" }).catch(console.error);

      const interval = setInterval(() => {
        updatePresence({ status: "online", currentPage: "/collab" }).catch(console.error);
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [user, updatePresence]);

  const handleStartDirectChat = async (participantId: Id<"users">, userName: string) => {
    try {
      const roomId = await getOrCreateChat({ participantId });
      setSelectedRoomId(roomId);
      setActiveView('chat');
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const handleStartGroupChat = async (participantIds: Id<"users">[], userNames: string) => {
    try {
      const roomId = await createGroupChat({
        name: `Group: ${userNames.split(", ").slice(0, 3).join(", ")}${participantIds.length > 3 ? "..." : ""}`,
        participantIds,
      });
      setSelectedRoomId(roomId);
      setActiveView('chat');
    } catch (error) {
      console.error("Failed to create group chat:", error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-12 h-12 text-blue-400 animate-pulse" />
          <p className="text-white text-lg">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white mb-2">Join Your Team</CardTitle>
              <p className="text-gray-300">
                Collaborate in real-time with your community
              </p>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignInButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  <Users className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </SignUpButton>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getRoleInfo = (userLevel: any) => {
    if (!userLevel) return { role: 'WORKER', color: 'text-gray-400', icon: UserIcon };
    
    switch (userLevel.name) {
      case 'ADMIN': return { role: 'ADMIN', color: 'text-red-400', icon: Crown };
      case 'MANAGER': return { role: 'MANAGER', color: 'text-blue-400', icon: Shield };
      case 'BUILDER': return { role: 'BUILDER', color: 'text-emerald-400', icon: Briefcase };
      default: return { role: 'WORKER', color: 'text-gray-400', icon: UserIcon };
    }
  };

  const roleInfo = getRoleInfo(currentUser?.userLevel);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md shadow-xl border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BarangayLink Collaboration</h1>
                <p className="text-xs text-gray-400">Real-time workspace</p>
              </div>
            </div>

            {/* User Info & Stats */}
            <div className="flex items-center space-x-4">
              {/* Online Count */}
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hidden sm:flex">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                {onlineUsers?.length || 0} online
              </Badge>

              {/* Notifications Badge */}
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                {unreadCount && unreadCount > 0 ? (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </div>
                ) : null}
              </div>

              {/* User Avatar */}
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
                <Avatar className="w-10 h-10 border-2 border-gray-700">
                  <AvatarImage src={currentUser?.imageUrl || user.imageUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {(currentUser?.name || user.firstName || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-white">
                    {currentUser?.name || user.firstName || user.fullName}
                  </p>
                  <div className="flex items-center space-x-1">
                    <RoleIcon className={`w-3 h-3 ${roleInfo.color}`} />
                    <span className={`text-xs ${roleInfo.color}`}>{roleInfo.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Screen Layout */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          
          {/* Left Sidebar - Notifications */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
              <NotificationsPanel />
            </Card>
          </div>

          {/* Center - Chat Interface */}
          <div className="lg:col-span-6 h-full">
            <Card className="h-full shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
              {activeView === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Chat Rooms List on Top */}
                  {!selectedRoomId && (
                    <div className="h-full">
                      <ChatRoomsList 
                        selectedRoomId={selectedRoomId}
                        onSelectRoom={setSelectedRoomId}
                      />
                    </div>
                  )}
                  
                  {/* Active Chat */}
                  {selectedRoomId && (
                    <ChatInterface 
                      roomId={selectedRoomId}
                      onBack={() => setSelectedRoomId(null)}
                    />
                  )}
                </div>
              )}

              {activeView === 'members' && (
                <div className="h-full">
                  <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveView('chat')}
                      className="mr-3"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h3 className="text-lg font-bold text-white">All Members</h3>
                  </div>
                  <div className="h-[calc(100%-60px)]">
                    <MembersList 
                      onStartChat={handleStartDirectChat}
                      onStartGroupChat={handleStartGroupChat}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar - Members List */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
              <MembersList 
                onStartChat={handleStartDirectChat}
                onStartGroupChat={handleStartGroupChat}
              />
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
