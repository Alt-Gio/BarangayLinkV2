"use client";

import { useState, useEffect } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  Settings, 
  Minimize2, 
  Maximize2,
  X,
  Volume2,
  VolumeX
} from "lucide-react";
import { OnlinePresence } from "./OnlinePresence";
import { OnlineUsersList } from "./OnlineUsersList";
import { RealtimeChat } from "./RealtimeChat";

interface CollaborationHubProps {
  roomId?: string;
  className?: string;
  defaultOpen?: boolean;
}

export function CollaborationHub({ 
  roomId = "general-chat", 
  className = "",
  defaultOpen = false 
}: CollaborationHubProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { user } = useUser();

  // Auto-open when user joins
  useEffect(() => {
    if (user && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isOpen]);

  // Handle chat start from user list
  const handleStartChat = (userId: string, userName: string) => {
    setActiveTab("chat");
    // You could implement private messaging here
  };

  // Floating action button when closed
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          <Users className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="bg-white rounded-lg shadow-lg border p-3 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Collaboration</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-2">
            <OnlinePresence maxVisible={4} showSelf={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoomProvider 
      id={roomId}
      initialPresence={{
        user: {
          id: user?.id || '',
          name: user?.fullName || user?.firstName || 'Anonymous',
          avatar: user?.imageUrl || '',
          role: 'WORKER', // This should come from your user data
          level: 1, // This should come from your user data
        },
        cursor: null,
        selection: null,
      }}
    >
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="bg-white rounded-lg shadow-xl border w-96 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Collaboration Hub</h3>
              <Badge variant="secondary" className="text-xs">
                {roomId}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8 p-0"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 m-2">
                <TabsTrigger value="chat" className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 m-0 p-0">
                <RealtimeChat 
                  roomId={roomId}
                  className="h-full border-0 shadow-none rounded-none"
                />
              </TabsContent>

              <TabsContent value="users" className="flex-1 m-0 p-0">
                <OnlineUsersList 
                  className="h-full border-0 shadow-none rounded-none"
                  onStartChat={handleStartChat}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer with presence */}
          <div className="p-3 border-t bg-gray-50 rounded-b-lg">
            <OnlinePresence maxVisible={5} showSelf={false} />
          </div>
        </div>
      </div>
    </RoomProvider>
  );
}
