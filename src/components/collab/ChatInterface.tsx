"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Users,
  MessageCircle,
  Smile,
  Paperclip,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";

interface ChatInterfaceProps {
  roomId: Id<"chatRooms"> | null;
  onBack: () => void;
}

export function ChatInterface({ roomId, onBack }: ChatInterfaceProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.chat.getRoomMessages,
    roomId ? { roomId, limit: 100 } : "skip"
  );
  
  const chatRooms = useQuery(api.chat.getUserChatRooms);
  const sendMessage = useMutation(api.chat.sendMessage);
  const markAsRead = useMutation(api.chat.markMessagesAsRead);

  const currentRoom = chatRooms?.find((room) => room._id === roomId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when room is opened
  useEffect(() => {
    if (roomId) {
      markAsRead({ roomId }).catch(console.error);
    }
  }, [roomId, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !roomId) return;

    try {
      await sendMessage({
        roomId,
        content: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!roomId || !currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400">
        <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No chat selected</p>
        <p className="text-sm">Select a member or start a conversation</p>
      </div>
    );
  }

  const otherParticipants = currentRoom.participants.filter(
    (p: any) => p._id !== user?.id
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {currentRoom.type === "direct" && otherParticipants[0] ? (
            <>
              <Avatar className="w-10 h-10 border-2 border-gray-700">
                <AvatarImage src={otherParticipants[0].imageUrl} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {otherParticipants[0].name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">{otherParticipants[0].name}</h3>
                <p className="text-xs text-gray-400">{otherParticipants[0].position}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{currentRoom.name}</h3>
                <p className="text-xs text-gray-400">{currentRoom.participants.length} members</p>
              </div>
            </>
          )}
        </div>

        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg: any) => {
          const isOwn = msg.sender === user?.id;
          
          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}
            >
              {!isOwn && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={msg.senderImage} />
                  <AvatarFallback className="bg-gray-700 text-white text-xs">
                    {msg.senderName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <span className="text-xs text-gray-400 mb-1 px-1">{msg.senderName}</span>
                )}
                
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                      : "bg-gray-800 text-gray-100 border border-gray-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>

                <span className="text-xs text-gray-500 mt-1 px-1">
                  {formatDistanceToNow(msg._creationTime, { addSuffix: true })}
                </span>
              </div>

              {isOwn && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {user?.firstName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />

        {(!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700/50 bg-gray-900/50">
        <div className="flex items-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white mb-2"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
              rows={1}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white mb-2"
          >
            <Smile className="w-5 h-5" />
          </Button>

          <Button
            type="submit"
            disabled={!message.trim()}
            className="mb-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
