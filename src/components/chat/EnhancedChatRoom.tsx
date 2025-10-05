import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send, Paperclip, Smile, MoreVertical, Image as ImageIcon,
  ArrowLeft, Check, CheckCheck, Reply, Edit2, Trash2, File, X, Upload, AtSign
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface EnhancedChatRoomProps {
  roomId: Id<"chatRooms">;
  onBack?: () => void;
}

export function EnhancedChatRoom({ roomId, onBack }: EnhancedChatRoomProps) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const room = useQuery(api.messaging.getChatRoom, { roomId });
  const messages = useQuery(api.messaging.getRoomMessages, { roomId, limit: 100 });
  const currentUser = useQuery(api.users.getCurrentUser);
  const onlineUsers = useQuery(api.messaging.getOnlineUsers);
  const typingUsers = useQuery(api.messaging.getTypingUsers, { roomId });

  const sendMessageMutation = useMutation(api.messaging.sendMessage);
  const markAsRead = useMutation(api.messaging.markAsRead);
  const editMessageMutation = useMutation(api.messaging.editMessage);
  const deleteMessageMutation = useMutation(api.messaging.deleteMessage);
  const setTyping = useMutation(api.messaging.setTyping);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.createDocument);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (roomId) {
      markAsRead({ roomId });
    }
  }, [roomId, markAsRead]);

  // Handle typing indicator
  const handleTyping = () => {
    setTyping({ roomId, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ roomId, isTyping: false });
    }, 3000);
  };

  // Handle @mention
  const handleMentionClick = (userName: string) => {
    const currentText = message;
    const lastAtIndex = currentText.lastIndexOf('@');
    const beforeMention = currentText.substring(0, lastAtIndex);
    setMessage(`${beforeMention}@${userName} `);
    setShowMentions(false);
    setMentionSearch("");
    inputRef.current?.focus();
  };

  // Detect @ symbol for mentions
  useEffect(() => {
    const lastChar = message[message.length - 1];
    const words = message.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord && lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionSearch(lastWord.substring(1));
    } else {
      setShowMentions(false);
      setMentionSearch("");
    }
  }, [message]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const { storageId } = await result.json();

      const documentId = await createDocument({
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageId,
        category: 'Chat Attachments',
        tags: ['chat'],
        isPublic: false,
        accessLevel: 'internal',
      });

      await sendMessageMutation({
        roomId,
        content: `📎 ${file.name}`,
        messageType: 'file',
        attachments: [documentId],
      });

      setShowFileUpload(false);
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file");
    }
  };

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
      setTyping({ roomId, isTyping: false });
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
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + 
           " " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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

  const mentionableUsers = room.participants.filter((p: any) => {
    if (p._id === currentUser._id) return false;
    if (!mentionSearch) return true;
    return p.name.toLowerCase().includes(mentionSearch.toLowerCase());
  });

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
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.map((msg: any, index: number) => {
          const isOwn = msg.sender === currentUser._id;
          const isRead = msg.readBy.length > 1;
          const showSender = !isOwn && room.type !== "direct" && 
                            (index === 0 || messages[index - 1].sender !== msg.sender);

          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} group relative`}
            >
              <div className={`max-w-[75%] flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                {/* Avatar for other users */}
                {!isOwn && showSender && (
                  <img
                    src={msg.senderImage || "/default-avatar.png"}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                {!isOwn && !showSender && (
                  <div className="w-8 flex-shrink-0"></div>
                )}

                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {/* Sender Name */}
                  {showSender && !isOwn && (
                    <span className="text-xs text-gray-400 mb-1 px-3">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Reply Preview */}
                  {msg.replyToMessage && (
                    <div className={`px-3 py-1 rounded-t-lg text-xs mb-1 border-l-2 ${
                      isOwn 
                        ? "bg-emerald-900/30 border-emerald-500 text-gray-300" 
                        : "bg-gray-700/50 border-gray-400 text-gray-400"
                    }`}>
                      <p className="font-semibold">Replying to:</p>
                      <p className="truncate max-w-md">{msg.replyToMessage.content}</p>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative px-4 py-2 ${
                      isOwn
                        ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm"
                        : "bg-gray-700 text-white rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <File className="w-4 h-4" />
                        <span className="text-xs underline">View attachment</span>
                      </div>
                    )}

                    {/* Action Buttons (on hover) */}
                    <div className={`absolute -top-8 ${isOwn ? "right-0" : "left-0"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-gray-800 rounded-full shadow-lg p-1`}>
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                        title="Reply"
                      >
                        <Reply className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      {isOwn && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessage(msg);
                              setMessage(msg.content);
                            }}
                            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timestamp and Status */}
                  <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(msg._creationTime)}
                    </span>
                    {msg.isEdited && (
                      <span className="text-xs text-gray-400">• edited</span>
                    )}
                    {isOwn && (
                      <span className="text-xs">
                        {isRead ? (
                          <CheckCheck className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <span className="text-xs text-gray-400">
              {typingUsers.map((u: any) => u.name).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Suggestions */}
      {showMentions && mentionableUsers.length > 0 && (
        <div className="border-t border-white/10 bg-gray-800/50 p-2 shadow-lg">
          <div className="flex items-center gap-2 px-2 py-1">
            <AtSign className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-white">Mention someone:</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {mentionableUsers.map((user: any) => (
              <button
                key={user._id}
                onClick={() => handleMentionClick(user.name)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <img
                  src={user.imageUrl || "/default-avatar.png"}
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-white">{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reply/Edit Banner */}
      {(replyTo || editingMessage) && (
        <div className="bg-gray-800/50 border-t border-white/10 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {replyTo && <Reply className="w-4 h-4 text-emerald-500" />}
            {editingMessage && <Edit2 className="w-4 h-4 text-blue-500" />}
            <div>
              <p className="text-xs font-semibold text-gray-300">
                {replyTo && `Replying to ${replyTo.senderName}`}
                {editingMessage && "Editing message"}
              </p>
              <p className="text-sm text-gray-400 truncate max-w-md">
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
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* File Upload Panel */}
      {showFileUpload && (
        <div className="bg-gray-800/50 border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="flex-1 text-white"
            />
            <Button onClick={() => setShowFileUpload(false)} variant="outline" className="border-white/20 text-white">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-gray-800/50 border-t border-white/10 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setShowFileUpload(!showFileUpload)}>
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Smile className="w-5 h-5" />
          </Button>
          
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message... (use @ to mention)"
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
