import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send, Paperclip, MoreVertical, Image as ImageIcon,
  ArrowLeft, Check, CheckCheck, Reply, Edit2, Trash2, File, X, Upload, AtSign,
  Info, BellOff, Bell, Trash, FileText, Download, Search, Pin, PinOff, BarChart3, Smile
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface EnhancedChatRoomProps {
  roomId: Id<"chatRooms">;
  onBack?: () => void;
}

interface FileAttachmentProps {
  attachmentId: Id<"documents">;
  isOwn: boolean;
}

// Poll Creator Component
function PollCreator({ roomId, onClose }: { roomId: Id<"chatRooms">, onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>(24);
  
  const createPoll = useMutation(api.messagingExtended.createPoll);
  
  const handleCreate = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast.error("Please add at least 2 options");
      return;
    }
    
    await createPoll({
      roomId,
      question,
      options: validOptions,
      allowMultiple,
      expiresInHours,
    });
    
    toast.success("Poll created!");
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">Create Poll</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Options</label>
            {options.map((option, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[i] = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                    className="p-2 hover:bg-gray-700 rounded text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setOptions([...options, ""])}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + Add option
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-300">Allow multiple votes</label>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Expires in (hours)</label>
            <Input
              type="number"
              value={expiresInHours || ""}
              onChange={(e) => setExpiresInHours(Number(e.target.value) || undefined)}
              placeholder="24"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Poll
          </Button>
        </div>
      </div>
    </div>
  );
}

// Poll Display Component
function PollDisplay({ message }: { message: any }) {
  const voteOnPoll = useMutation(api.messagingExtended.voteOnPoll);
  const currentUser = useQuery(api.users.getCurrentUser);
  
  if (!message.pollData) return null;
  
  const { question, options, allowMultiple, expiresAt } = message.pollData;
  const totalVotes = options.reduce((sum: number, opt: any) => sum + opt.votes.length, 0);
  const hasExpired = expiresAt && Date.now() > expiresAt;
  
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4 mt-2">
      <div className="flex items-start gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-white">{question}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            {allowMultiple && ' • Multiple choice'}
            {hasExpired && ' • Ended'}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {options.map((option: any, index: number) => {
          const percentage = totalVotes > 0 
            ? Math.round((option.votes.length / totalVotes) * 100) 
            : 0;
          const userVoted = currentUser && option.votes.includes(currentUser._id);
          
          return (
            <button
              key={index}
              onClick={() => !hasExpired && voteOnPoll({ 
                messageId: message._id, 
                optionIndex: index 
              })}
              disabled={hasExpired}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                userVoted
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:bg-gray-600/50'
              } ${hasExpired ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white flex items-center gap-2">
                  {userVoted && <Check className="w-4 h-4 text-purple-400" />}
                  {option.text}
                </span>
                <span className="text-xs text-gray-400">{option.votes.length}</span>
              </div>
              
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-400 mt-1">{percentage}%</p>
            </button>
          );
        })}
      </div>
      
      {expiresAt && !hasExpired && (
        <p className="text-xs text-gray-400 mt-3">
          Ends {new Date(expiresAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// File Attachment Component with Download
function FileAttachment({ attachmentId, isOwn }: FileAttachmentProps) {
  const document = useQuery(api.documents.getDocumentById, { documentId: attachmentId });
  const fileUrl = useQuery(api.documents.getFileUrl, 
    document?.storageId ? { storageId: document.storageId } : "skip"
  );

  if (!document) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs opacity-50">
        <File className="w-4 h-4" />
        <span>Loading attachment...</span>
      </div>
    );
  }

  const isImage = document.mimeType?.startsWith('image/');
  const fileSize = (document.fileSize / 1024).toFixed(1); // KB

  const handleDownload = () => {
    if (fileUrl) {
      // Create a temporary anchor element to trigger download
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.download = document.fileName || 'download';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success(`Downloading ${document.fileName}...`);
    }
  };

  return (
    <div className={`mt-3 ${isOwn ? 'bg-emerald-700/30' : 'bg-gray-600/30'} rounded-lg p-3 border ${isOwn ? 'border-emerald-500/30' : 'border-gray-500/30'}`}>
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className={`p-2 rounded-lg ${isOwn ? 'bg-emerald-500/20' : 'bg-gray-500/20'}`}>
          {isImage ? (
            <ImageIcon className="w-6 h-6" />
          ) : (
            <FileText className="w-6 h-6" />
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{document.fileName}</p>
          <p className="text-xs opacity-70">{fileSize} KB</p>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={!fileUrl}
          className={`p-2 rounded-lg transition-all ${
            fileUrl 
              ? `${isOwn ? 'hover:bg-emerald-500/30' : 'hover:bg-gray-500/30'} cursor-pointer` 
              : 'opacity-50 cursor-not-allowed'
          }`}
          title="Download file"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Image Preview */}
      {isImage && fileUrl && (
        <div className="mt-3">
          <img 
            src={fileUrl} 
            alt={document.fileName}
            className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer"
            onClick={() => window.open(fileUrl, '_blank')}
          />
        </div>
      )}
    </div>
  );
}

export function EnhancedChatRoom({ roomId, onBack }: EnhancedChatRoomProps) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPinnedMessages, setShowPinnedMessages] = useState(true);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
  
  // New feature mutations
  const addReactionMutation = useMutation(api.messagingExtended.addReaction);
  const pinMessageMutation = useMutation(api.messagingExtended.pinMessage);
  const unpinMessageMutation = useMutation(api.messagingExtended.unpinMessage);
  
  // New feature queries
  const pinnedMessages = useQuery(api.messagingExtended.getPinnedMessages, { roomId });
  const searchResults = useQuery(
    api.messagingExtended.searchMessages,
    showSearch && searchQuery ? { roomId, query: searchQuery, limit: 50 } : "skip"
  );

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

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

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
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      toast.info(`Uploading ${file.name}...`);
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error('Upload failed');
      }

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

      // Determine file type for better message
      const isImage = file.type.startsWith('image/');
      const fileIcon = isImage ? '🖼️' : '📎';

      await sendMessageMutation({
        roomId,
        content: `${fileIcon} ${file.name}`,
        messageType: 'file',
        attachments: [documentId],
      });

      toast.success(`${file.name} uploaded successfully!`);
      setShowFileUpload(false);
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
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

        <div className="flex items-center gap-2 relative" ref={menuRef}>
          {/* Search Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Search messages"
          >
            <Search className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
          
          {/* Poll Button */}
          <button
            onClick={() => setShowPollCreator(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Create poll"
          >
            <BarChart3 className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-5 h-5" />
          </Button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-12 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1">
                <button
                  onClick={() => {
                    toast.info('Room information');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Room Info</span>
                </button>
                
                <button
                  onClick={() => {
                    toast.success('Notifications muted');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <BellOff className="w-4 h-4 text-yellow-400" />
                  <span>Mute Notifications</span>
                </button>

                <button
                  onClick={() => {
                    toast.info('Export chat feature coming soon');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export Chat</span>
                </button>

                <div className="border-t border-gray-700 my-1"></div>

                <button
                  onClick={() => {
                    if (confirm('Clear all messages in this chat?')) {
                      toast.success('Chat cleared');
                      setShowMenu(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  <span>Clear Chat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Interface */}
      {showSearch && (
        <div className="bg-gray-800/50 border-b border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-gray-700 border-gray-600 text-white"
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">
                {searchResults.length} results found
              </p>
              {searchResults.map((result) => (
                <div
                  key={result._id}
                  className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-600/50 cursor-pointer"
                  onClick={() => {
                    document.getElementById(`message-${result._id}`)?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                    setShowSearch(false);
                  }}
                >
                  <p className="text-sm text-white">{result.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {result.senderName} • {new Date(result._creationTime).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 mt-4">No messages found</p>
          )}
        </div>
      )}

      {/* Pinned Messages Section */}
      {pinnedMessages && pinnedMessages.length > 0 && showPinnedMessages && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-blue-500/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Pin className="w-4 h-4 text-blue-400" />
              Pinned Messages ({pinnedMessages.length})
            </h3>
            <button
              onClick={() => setShowPinnedMessages(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {pinnedMessages.map((msg) => (
              <div
                key={msg._id}
                className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => {
                  document.getElementById(`message-${msg._id}`)?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                <p className="text-sm text-white">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {msg.senderName} • {new Date(msg._creationTime).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
              id={`message-${msg._id}`}
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
                      <FileAttachment 
                        attachmentId={msg.attachments[0]} 
                        isOwn={isOwn}
                      />
                    )}
                    
                    {/* Poll Display */}
                    {msg.messageType === "poll" && (
                      <PollDisplay message={msg} />
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
                      <button
                        onClick={() => {
                          const isPinned = pinnedMessages?.some(p => p._id === msg._id);
                          if (isPinned) {
                            unpinMessageMutation({ roomId, messageId: msg._id });
                            toast.success('Message unpinned');
                          } else {
                            pinMessageMutation({ roomId, messageId: msg._id });
                            toast.success('Message pinned');
                          }
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                        title={pinnedMessages?.some(p => p._id === msg._id) ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-3.5 h-3.5 text-gray-400" />
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
                  
                  {/* Message Reactions */}
                  <div className="mt-2">
                    {/* Quick Reaction Buttons */}
                    <div className="flex gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {["👍", "❤️", "😂", "😮", "😢", "🔥"].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addReactionMutation({ messageId: msg._id, emoji })}
                          className="hover:scale-125 transition-transform text-sm"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    
                    {/* Display Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(
                          msg.reactions.reduce((acc: Record<string, number>, r: any) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => addReactionMutation({ messageId: msg._id, emoji })}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs flex items-center gap-1 transition-colors"
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-400">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
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

      {/* Enhanced File Upload Panel */}
      {showFileUpload && (
        <div className="bg-gray-800/50 border-t border-white/10 p-4">
          <div className="bg-gray-700/50 rounded-lg p-6 border-2 border-dashed border-gray-600">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Upload File</h3>
              <p className="text-sm text-gray-400 mb-4">
                Share images, documents, or any file (max 10MB)
              </p>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                accept="*/*"
              />
              
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
                <Button 
                  onClick={() => setShowFileUpload(false)} 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Uploading file...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-gray-800/50 border-t border-white/10 p-4">
        <div className="flex items-center gap-2">
          {/* Attach Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={uploading}
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          {/* Message Input */}
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message... (use @ to mention)"
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-emerald-500 transition-all"
            disabled={uploading}
          />
          
          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || uploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Poll Creator Modal */}
      {showPollCreator && (
        <PollCreator roomId={roomId} onClose={() => setShowPollCreator(false)} />
      )}
    </div>
  );
}
