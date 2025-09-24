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
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Reply, 
  Heart,
  ThumbsUp,
  Crown,
  Shield,
  Briefcase,
  User as UserIcon,
  MessageCircle
} from "lucide-react";
import { OnlinePresence } from "./OnlinePresence";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system';
  replyTo?: string;
  reactions?: { emoji: string; users: string[] }[];
}

interface EnhancedMessengerChatProps {
  roomId: string;
  className?: string;
}

export function EnhancedMessengerChat({ 
  roomId, 
  className = ""
}: EnhancedMessengerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const broadcast = useBroadcastEvent();
  const others = useOthers();
  const self = useSelf();
  const { user } = useUser();
  
  // Get current user from Convex
  const currentUser = useQuery(
    api.liveblocks.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get role info for display
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'ADMIN': return { 
        color: 'text-red-400 bg-red-900/20 border-red-500', 
        icon: Crown, 
        label: 'ADMIN' 
      };
      case 'MANAGER': return { 
        color: 'text-blue-400 bg-blue-900/20 border-blue-500', 
        icon: Shield, 
        label: 'MANAGER' 
      };
      case 'BUILDER': return { 
        color: 'text-emerald-400 bg-emerald-900/20 border-emerald-500', 
        icon: Briefcase, 
        label: 'BUILDER' 
      };
      default: return { 
        color: 'text-gray-400 bg-gray-900/20 border-gray-500', 
        icon: UserIcon, 
        label: 'WORKER' 
      };
    }
  };

  // Listen for chat events
  useEventListener(({ event, user: eventUser }) => {
    if (!eventUser) return;
    
    if (event.type === "CHAT_MESSAGE") {
      const chatMessage: ChatMessage = {
        id: `${eventUser.id}-${Date.now()}`,
        userId: eventUser.id,
        userName: eventUser.info?.name || `User ${eventUser.id.slice(-4)}`,
        userAvatar: eventUser.info?.avatar,
        userRole: eventUser.info?.role || 'WORKER',
        message: event.message,
        timestamp: Date.now(),
        type: 'message',
        replyTo: event.replyTo,
        reactions: []
      };
      
      setMessages(prev => [...prev, chatMessage]);
      setIsTyping(prev => prev.filter(id => id !== eventUser.id));
    }
    
    if (event.type === "USER_TYPING") {
      if (event.isTyping) {
        setIsTyping(prev => [...prev.filter(id => id !== eventUser.id), eventUser.id]);
      } else {
        setIsTyping(prev => prev.filter(id => id !== eventUser.id));
      }
    }

    if (event.type === "NOTIFICATION" && (event as any).messageId) {
      const customEvent = event as any;
      setMessages(prev => prev.map(msg => {
        if (msg.id === customEvent.messageId) {
          const reactions = [...(msg.reactions || [])];
          const existingReaction = reactions.find(r => r.emoji === customEvent.emoji);
          
          if (existingReaction) {
            if (existingReaction.users.includes(eventUser?.id || '')) {
              existingReaction.users = existingReaction.users.filter(id => id !== (eventUser?.id || ''));
              if (existingReaction.users.length === 0) {
                return { ...msg, reactions: reactions.filter(r => r.emoji !== customEvent.emoji) };
              }
            } else {
              existingReaction.users.push(eventUser?.id || '');
            }
          } else {
            reactions.push({ emoji: customEvent.emoji, users: [eventUser?.id || ''] });
          }
          
          return { ...msg, reactions };
        }
        return msg;
      }));
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
      replyTo: replyTo?.id,
      user: {
        name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You',
        id: user.id,
        avatar: user.imageUrl,
        role: currentUser?.userLevel?.name || 'WORKER'
      }
    });
    
    // Add own message immediately to UI
    const ownMessage: ChatMessage = {
      id: `${user.id}-${timestamp}`,
      userId: user.id,
      userName: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You',
      userAvatar: user.imageUrl,
      userRole: currentUser?.userLevel?.name || 'WORKER',
      message: messageText,
      timestamp,
      type: 'message',
      replyTo: replyTo?.id,
      reactions: []
    };
    
    setMessages(prev => [...prev, ownMessage]);
    setNewMessage("");
    setReplyTo(null);
  };

  // Add reaction to message
  const addReaction = (messageId: string, emoji: string) => {
    if (!user) return;

    broadcast({
      type: "NOTIFICATION",
      messageId,
      emoji,
      user: {
        id: user.id,
        name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'You'
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
    if (e.key === 'Escape') {
      setReplyTo(null);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get typing users names
  const typingUsers = isTyping
    .map(userId => {
      const otherUser = others.find(other => other.id === userId);
      return otherUser?.info?.name || 'Someone';
    })
    .filter(Boolean);

  // Find replied message
  const getRepliedMessage = (replyId: string) => {
    return messages.find(msg => msg.id === replyId);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-700/50">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Team Chat</h3>
            <p className="text-sm text-gray-400">
              {others.length + 1} member{others.length !== 0 ? 's' : ''} • {roomId}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <OnlinePresence maxVisible={4} />
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h4 className="text-lg font-medium text-gray-400 mb-2">No messages yet</h4>
              <p className="text-gray-500">Start the conversation with your team!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.userId === user?.id;
              const roleInfo = getRoleInfo(message.userRole || 'WORKER');
              const RoleIcon = roleInfo.icon;
              const repliedMessage = message.replyTo ? getRepliedMessage(message.replyTo) : null;
              
              // Group consecutive messages from same user
              const prevMessage = messages[index - 1];
              const isGrouped = prevMessage && 
                prevMessage.userId === message.userId && 
                (message.timestamp - prevMessage.timestamp) < 300000; // 5 minutes
              
              return (
                <div key={message.id} className={`group ${isGrouped ? 'mt-1' : 'mt-6'}`}>
                  {message.type === 'system' ? (
                    <div className="text-center">
                      <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                        {message.message}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isGrouped && (
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback className="text-sm bg-gray-700 text-white">
                              {message.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1">
                            <div className={`w-5 h-5 rounded-full border-2 border-gray-800 flex items-center justify-center ${roleInfo.color}`}>
                              <RoleIcon className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex-1 min-w-0 ${isGrouped ? 'ml-13' : ''} ${isOwnMessage && isGrouped ? 'mr-13' : ''}`}>
                        {!isGrouped && (
                          <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                            <span className="text-sm font-semibold text-white">
                              {message.userName}
                              {isOwnMessage && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                            </span>
                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${roleInfo.color}`}>
                              {roleInfo.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        {/* Reply indicator */}
                        {repliedMessage && (
                          <div className={`mb-2 p-2 bg-gray-700/30 rounded-l-2 border-l-2 border-gray-500 ${isOwnMessage ? 'ml-auto max-w-xs' : 'max-w-xs'}`}>
                            <div className="flex items-center space-x-1 mb-1">
                              <Reply className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Replying to {repliedMessage.userName}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 truncate">
                              {repliedMessage.message}
                            </p>
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div className={`group-hover:bg-gray-700/20 rounded-lg p-3 transition-colors ${
                          isOwnMessage ? 'bg-emerald-600 text-white ml-auto max-w-md' : 'bg-gray-700 text-gray-100 max-w-md'
                        }`}>
                          <p className="text-sm break-words">{message.message}</p>
                          
                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.reactions.map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  onClick={() => addReaction(message.id, reaction.emoji)}
                                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded-full text-xs transition-colors"
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-gray-300">{reaction.users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Quick reactions */}
                        <div className={`opacity-0 group-hover:opacity-100 flex items-center space-x-1 mt-1 transition-opacity ${
                          isOwnMessage ? 'justify-end' : ''
                        }`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addReaction(message.id, '👍')}
                            className="h-6 w-6 p-0 hover:bg-gray-600"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addReaction(message.id, '❤️')}
                            className="h-6 w-6 p-0 hover:bg-gray-600"
                          >
                            <Heart className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyTo(message)}
                            className="h-6 w-6 p-0 hover:bg-gray-600"
                          >
                            <Reply className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-3 px-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-400">
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

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-700/50 border-t border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                Replying to <span className="text-white font-medium">{replyTo.userName}</span>
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setReplyTo(null)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
          <p className="text-sm text-gray-300 truncate mt-1">
            {replyTo.message}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-600">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <Paperclip className="w-5 h-5 text-gray-400" />
          </Button>
          
          <div className="flex-1 flex items-center space-x-2 bg-gray-700 rounded-2xl px-4 py-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 border-0 bg-transparent text-white placeholder-gray-400 focus-visible:ring-0"
            />
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <Smile className="w-5 h-5 text-gray-400" />
            </Button>
          </div>
          
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            size="sm"
            className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
