"use client";

import { useState, useRef, useEffect } from "react";
import { useBroadcastEvent, useEventListener, useOthers, useSelf } from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, MessageCircle, X } from "lucide-react";
import { OnlinePresence } from "./OnlinePresence";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system';
}

interface RealtimeChatProps {
  roomId: string;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function RealtimeChat({ 
  roomId, 
  className = "", 
  isMinimized = false, 
  onToggleMinimize 
}: RealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const broadcast = useBroadcastEvent();
  const others = useOthers();
  const self = useSelf();
  const { user } = useUser();
  
  // Get active users for better user resolution
  const activeUsers = useQuery(api.liveblocks.getActiveUsers);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for chat events
  useEventListener(({ event, user: eventUser }) => {
    if (!eventUser) return;
    
    if (event.type === "CHAT_MESSAGE") {
      const chatMessage: ChatMessage = {
        id: `${eventUser.id}-${Date.now()}`,
        userId: eventUser.id,
        userName: eventUser.info?.name || `User ${eventUser.id.slice(-4)}`,

        userAvatar: eventUser.info?.avatar,
        message: event.message,
        timestamp: Date.now(),
        type: 'message'
      };
      
      setMessages(prev => [...prev, chatMessage]);
      
      // Remove typing indicator for this user
      setIsTyping(prev => prev.filter(id => id !== eventUser.id));
    }
    
    if (event.type === "USER_TYPING") {
      if (event.isTyping) {
        setIsTyping(prev => [...prev.filter(id => id !== eventUser.id), eventUser.id]);
      } else {
        setIsTyping(prev => prev.filter(id => id !== eventUser.id));
      }
    }
    
    if (event.type === "USER_JOINED") {
      const systemMessage: ChatMessage = {
        id: `system-${eventUser.id}-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        message: `${event.user.name} joined the chat`,
        timestamp: Date.now(),
        type: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    }
    
    if (event.type === "USER_LEFT") {
      const systemMessage: ChatMessage = {
        id: `system-${eventUser.id}-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        message: `${event.user.name} left the chat`,
        timestamp: Date.now(),
        type: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  });

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;
    
    const messageText = newMessage.trim();
    const timestamp = Date.now();
    
    // Broadcast to other users
    broadcast({
      type: "CHAT_MESSAGE",
      message: messageText,
      user: {
        name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You',
        id: user.id,
        avatar: user.imageUrl,
      }
    });
    
    // Add own message immediately to UI
    const ownMessage: ChatMessage = {
      id: `${user.id}-${timestamp}`,
      userId: user.id,
      userName: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You',
      userAvatar: user.imageUrl,
      message: messageText,
      timestamp,
      type: 'message'
    };
    
    setMessages(prev => [...prev, ownMessage]);
    setNewMessage("");
    
    // Stop typing indicator
    broadcast({
      type: "USER_TYPING",
      isTyping: false,
      user: {
        name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You',
        id: user.id,
      }
    });
  };

  // Handle typing
  const handleTyping = (value: string) => {
    if (!user) return;
    
    setNewMessage(value);
    
    if (value.trim()) {
      broadcast({
        type: "USER_TYPING",
        isTyping: true,
        user: {
          name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You',
          id: user.id,
        }
      });
    } else {
      broadcast({
        type: "USER_TYPING",
        isTyping: false,
        user: {
          name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You',
          id: user.id,
        }
      });
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get typing users names
  const typingUsers = isTyping
    .map(userId => {
      const otherUser = others.find(other => other.id === userId);
      return otherUser?.info?.name || 'Someone';
    })
    .filter(Boolean);

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border ${className}`}>
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
          onClick={onToggleMinimize}
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Chat</span>
            <Badge variant="secondary" className="text-xs">
              {others.length + 1}
            </Badge>
          </div>
          <Button variant="ghost" size="sm">
            <Users className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg border border-gray-600 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-white">Team Chat</h3>
          <Badge variant="secondary" className="text-xs">
            Room: {roomId}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <OnlinePresence maxVisible={3} />
          {onToggleMinimize && (
            <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 h-96">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                {message.type === 'system' ? (
                  <div className="w-full text-center">
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
                      {message.message}
                    </span>
                  </div>
                ) : (
                  <>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.userAvatar} alt={message.userName} />
                      <AvatarFallback className="text-xs">
                        {message.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">
                          {message.userName}
                          {message.userId === user?.id && (
                            <span className="text-xs text-gray-400 ml-1">(You)</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 mt-1 break-words">
                        {message.message}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.join(', ')} are typing...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-600">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
