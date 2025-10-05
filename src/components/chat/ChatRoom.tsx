import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send, Paperclip, Smile, MoreVertical, Phone, Video,
  ArrowLeft, Circle, Check, CheckCheck, Reply, Edit2, Trash2
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface ChatRoomProps {
  roomId: Id<"chatRooms">;
  onBack?: () => void;
}

export function ChatRoom({ roomId, onBack }: ChatRoomProps) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = useQuery(api.messaging.getChatRoom, { roomId });
  const messages = useQuery(api.messaging.getRoomMessages, { roomId, limit: 100 });
  const currentUser = useQuery(api.users.getCurrentUser);
  const onlineUsers = useQuery(api.messaging.getOnlineUsers);

  const sendMessageMutation = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markAsRead);
  const editMessageMutation = useMutation(api.messaging.editMessage);
  const deleteMessageMutation = useMutation(api.messaging.deleteMessage);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when room opens
  useEffect(() => {
    if (roomId) {
      markAsRead({ roomId });
    }
  }, [roomId, markAsRead]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      if (editingMessage) {
        await editMessageMutation({
          messageId: editingMessage._id,
          content: message,
        });
        setEditingMessage(null);
      } else {
        await sendMessageMutation({
          roomId,
          content: message,
          replyTo: replyTo?._id,
        });
        setReplyTo(null);
      }
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: Id<"messages">) => {
    if (confirm("Delete this message?")) {
      try {
        await deleteMessageMutation({ messageId });
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (!room || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const otherUser = room.type === "direct" 
    ? room.participants.find((p: any) => p._id !== currentUser._id)
    : null;

  const isOnline = otherUser && onlineUsers?.some((u) => u._id === otherUser._id);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          
          {room.type === "direct" && otherUser ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={otherUser.imageUrl || "/default-avatar.png"}
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-gray-900 rounded-full"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{otherUser.name}</h3>
                <p className="text-xs text-gray-400">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-white">{room.name}</h3>
              <p className="text-xs text-gray-400">
                {room.participants.length} participants
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg: any) => {
          const isOwn = msg.sender === currentUser._id;
          const isRead = msg.readBy.length > 1;

          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
            >
              <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                {/* Sender Name (for group chats) */}
                {!isOwn && room.type !== "direct" && (
                  <span className="text-xs text-gray-400 mb-1 px-3">
                    {msg.senderName}
                  </span>
                )}

                {/* Reply Preview */}
                {msg.replyToMessage && (
                  <div className={`${isOwn ? "bg-emerald-900/30" : "bg-gray-700/50"} px-3 py-1 rounded-t-lg text-xs text-gray-400 border-l-2 border-emerald-500`}>
                    <p className="font-semibold">Replying to:</p>
                    <p className="truncate">{msg.replyToMessage.content}</p>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-emerald-600 text-white rounded-tr-sm"
                      : "bg-gray-700 text-white rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-70">
                      {formatMessageTime(msg._creationTime)}
                    </span>
                    {msg.isEdited && (
                      <span className="text-xs opacity-70">edited</span>
                    )}
                    {isOwn && (
                      <span className="text-xs">
                        {isRead ? (
                          <CheckCheck className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons (on hover) */}
                  <div className={`absolute top-0 ${isOwn ? "left-0" : "right-0"} -translate-x-full -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="p-1 bg-gray-800 rounded-full hover:bg-gray-700"
                    >
                      <Reply className="w-3 h-3 text-gray-400" />
                    </button>
                    {isOwn && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setMessage(msg.content);
                          }}
                          className="p-1 bg-gray-800 rounded-full hover:bg-gray-700"
                        >
                          <Edit2 className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="p-1 bg-gray-800 rounded-full hover:bg-gray-700"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply/Edit Banner */}
      {(replyTo || editingMessage) && (
        <div className="bg-gray-800/50 border-t border-white/10 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {replyTo && <Reply className="w-4 h-4 text-emerald-500" />}
            {editingMessage && <Edit2 className="w-4 h-4 text-blue-500" />}
            <div>
              <p className="text-xs text-gray-400">
                {replyTo && `Replying to ${replyTo.senderName}`}
                {editingMessage && "Editing message"}
              </p>
              <p className="text-sm text-white truncate max-w-md">
                {(replyTo || editingMessage)?.content}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setReplyTo(null);
              setEditingMessage(null);
              setMessage("");
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-gray-800/50 border-t border-white/10 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Smile className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border-gray-600 text-white"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
