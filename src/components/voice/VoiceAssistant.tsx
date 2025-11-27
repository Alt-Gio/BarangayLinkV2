"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  X,
  MessageCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ListTodo,
  Calendar,
  Bell,
  FolderKanban,
  Navigation,
  StopCircle,
  Timer,
} from "lucide-react";
import { useVoiceAssistant, ConversationMessage } from "@/hooks/useVoiceAssistant";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface VoiceAssistantProps {
  userId: Id<"users"> | null;
  userName?: string;
  className?: string;
  // Context for linking created items to events/milestones/projects
  context?: {
    eventId?: Id<"events">;
    milestoneId?: Id<"milestones">;
    projectId?: Id<"projects">;
  };
}

export function VoiceAssistant({ userId, userName, className, context }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Log context changes for debugging
  useEffect(() => {
    console.log("VoiceAssistant received context:", context);
  }, [context]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    state,
    isSupported,
    transcription,
    response,
    conversation,
    error,
    volume,
    startRecording,
    stopRecording,
    toggleRecording,
    speak,
    stopSpeaking,
    clearConversation,
    isListening,
    isProcessing,
    isSpeaking,
  } = useVoiceAssistant({
    userId,
    autoSpeak: !isMuted,
    onNavigate: (route) => console.log("Navigating to:", route),
    onError: (err) => console.error("Voice error:", err),
    context, // Pass context for linking tasks to events/milestones
  });

  // Get action icon based on action type
  const getActionIcon = (action?: string) => {
    switch (action) {
      case "clock_in":
      case "clock_out":
      case "check_work_status":
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case "stop_task_timer":
      case "check_current_task":
        return <Timer className="w-4 h-4 text-orange-400" />;
      case "create_task":
      case "complete_task":
      case "list_tasks":
      case "check_due_today":
        return <ListTodo className="w-4 h-4 text-blue-400" />;
      case "create_event":
      case "check_schedule":
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case "check_notifications":
        return <Bell className="w-4 h-4 text-yellow-400" />;
      case "list_projects":
        return <FolderKanban className="w-4 h-4 text-orange-400" />;
      case "navigate":
        return <Navigation className="w-4 h-4 text-cyan-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isSupported) {
    return null; // Don't render if browser doesn't support
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center",
          "bg-gradient-to-br from-emerald-500 to-emerald-600",
          "hover:from-emerald-400 hover:to-emerald-500",
          "transition-all duration-300",
          isOpen && "scale-0 opacity-0",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
      >
        <Sparkles className="w-6 h-6 text-white" />
        {/* Notification dot for new features */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </motion.button>

      {/* Voice Assistant Panel - Mobile optimized */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50",
              // Mobile: full screen with safe areas
              isMobile 
                ? "inset-0 rounded-none" 
                : "bottom-6 right-6 w-[380px] max-h-[600px] rounded-2xl",
              "bg-gray-900/95 backdrop-blur-xl",
              "shadow-2xl border border-gray-700/50",
              "flex flex-col overflow-hidden",
              // Safe area padding for mobile notches
              isMobile && "pb-safe"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Aling Assistant</h3>
                  <p className="text-xs text-gray-400">
                    {state === "idle" && "Ready to help"}
                    {state === "listening" && "Listening..."}
                    {state === "processing" && "Thinking..."}
                    {state === "speaking" && "Speaking..."}
                    {state === "error" && "Error occurred"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Conversation History - Flexible on mobile */}
            <div
              className={cn(
                "flex-1 overflow-y-auto p-4 space-y-4",
                isMobile 
                  ? "max-h-none" // Full height on mobile
                  : isExpanded ? "max-h-[350px]" : "max-h-[200px]"
              )}
            >
              {conversation.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                    <Mic className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-sm">
                    Kumusta{userName ? `, ${userName}` : ""}! 👋
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Press the mic button and speak
                  </p>
                  <div className="mt-4 space-y-3 text-xs text-gray-500">
                    <p className="font-medium text-gray-400">Navigate:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-3 py-1.5 bg-gray-800 rounded-full hover:bg-gray-700 cursor-default">"Go to Dashboard"</span>
                      <span className="px-3 py-1.5 bg-gray-800 rounded-full hover:bg-gray-700 cursor-default">"Go to Events"</span>
                      <span className="px-3 py-1.5 bg-gray-800 rounded-full hover:bg-gray-700 cursor-default">"Go to Projects"</span>
                    </div>
                    <p className="font-medium text-gray-400 mt-2">Create:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-3 py-1.5 bg-emerald-900/50 rounded-full hover:bg-emerald-800/50 cursor-default text-emerald-300">"Create a project"</span>
                      <span className="px-3 py-1.5 bg-emerald-900/50 rounded-full hover:bg-emerald-800/50 cursor-default text-emerald-300">"Create an event"</span>
                      <span className="px-3 py-1.5 bg-emerald-900/50 rounded-full hover:bg-emerald-800/50 cursor-default text-emerald-300">"Create milestone"</span>
                    </div>
                    <p className="font-medium text-gray-400 mt-2">Actions:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-3 py-1.5 bg-gray-800 rounded-full hover:bg-gray-700 cursor-default">"Clock in"</span>
                      <span className="px-3 py-1.5 bg-gray-800 rounded-full hover:bg-gray-700 cursor-default">"Stop my timer"</span>
                      <span className="px-3 py-1.5 bg-gray-800 rounded-full hover:bg-gray-700 cursor-default">"My tasks"</span>
                    </div>
                  </div>
                </div>
              ) : (
                conversation.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2",
                        msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-gray-800 text-gray-100 rounded-bl-sm"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.action && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/50">
                          {getActionIcon(msg.action)}
                          <span className="text-xs text-gray-400">
                            {msg.action.replace(/_/g, " ")}
                          </span>
                          {msg.actionResult?.success && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{formatTime(msg.timestamp)}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white">
                          {userName?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-4 mb-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Current Transcription */}
            {(isListening || isProcessing) && transcription && (
              <div className="mx-4 mb-2 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">You said:</p>
                <p className="text-sm text-white">{transcription}</p>
              </div>
            )}

            {/* Controls */}
            <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
              {/* Volume Visualizer */}
              {isListening && (
                <div className="mb-3 flex items-center justify-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-emerald-500 rounded-full"
                      animate={{
                        height: Math.random() * volume * 30 + 4,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Main Mic Button - Larger on mobile for easy touch */}
                <motion.button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={cn(
                    "rounded-full flex items-center justify-center",
                    "transition-all duration-300",
                    // Larger button on mobile
                    isMobile ? "w-20 h-20" : "w-16 h-16",
                    isListening
                      ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30"
                      : isProcessing
                      ? "bg-yellow-500 cursor-not-allowed"
                      : isSpeaking
                      ? "bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/30"
                      : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                  )}
                  whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.9 }}
                >
                  {isProcessing ? (
                    <Loader2 className={cn("text-white animate-spin", isMobile ? "w-9 h-9" : "w-7 h-7")} />
                  ) : isListening ? (
                    <StopCircle className={cn("text-white", isMobile ? "w-9 h-9" : "w-7 h-7")} />
                  ) : isSpeaking ? (
                    <Volume2 className={cn("text-white", isMobile ? "w-9 h-9" : "w-7 h-7")} />
                  ) : (
                    <Mic className={cn("text-white", isMobile ? "w-9 h-9" : "w-7 h-7")} />
                  )}
                </motion.button>

                {/* Clear History Button */}
                <button
                  onClick={clearConversation}
                  disabled={conversation.length === 0}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    conversation.length > 0
                      ? "hover:bg-gray-700/50 text-gray-400"
                      : "text-gray-600 cursor-not-allowed"
                  )}
                  title="Clear conversation"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Status Text */}
              <p className="text-center text-xs text-gray-500 mt-3">
                {isListening && "Tap to stop recording"}
                {isProcessing && "Processing your request..."}
                {isSpeaking && "Tap to stop speaking"}
                {state === "idle" && "Tap the mic to speak"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Mini version for embedding in other pages
export function VoiceAssistantMini({ userId, className }: { userId: Id<"users"> | null; className?: string }) {
  const {
    state,
    isSupported,
    toggleRecording,
    isListening,
    isProcessing,
    isSpeaking,
  } = useVoiceAssistant({ userId, autoSpeak: true });

  if (!isSupported || !userId) return null;

  return (
    <motion.button
      onClick={toggleRecording}
      disabled={isProcessing}
      className={cn(
        "p-3 rounded-full transition-all duration-300",
        isListening
          ? "bg-red-500/20 text-red-400 animate-pulse"
          : isProcessing
          ? "bg-yellow-500/20 text-yellow-400"
          : isSpeaking
          ? "bg-purple-500/20 text-purple-400"
          : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Voice Assistant"
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </motion.button>
  );
}
