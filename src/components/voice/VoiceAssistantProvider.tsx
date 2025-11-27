"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { VoiceAssistant } from "./VoiceAssistant";
import { Id } from "../../../convex/_generated/dataModel";

// Context type for linking voice-created items to events/milestones/projects
interface VoiceContext {
  eventId?: Id<"events">;
  milestoneId?: Id<"milestones">;
  projectId?: Id<"projects">;
}

interface VoiceAssistantContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  // Context for linking created items
  voiceContext: VoiceContext;
  setVoiceContext: (context: VoiceContext) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType>({
  isEnabled: true,
  setIsEnabled: () => {},
  voiceContext: {},
  setVoiceContext: () => {},
});

export function useVoiceAssistantContext() {
  return useContext(VoiceAssistantContext);
}

interface VoiceAssistantProviderProps {
  children: React.ReactNode;
}

export function VoiceAssistantProvider({ children }: VoiceAssistantProviderProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [voiceContext, setVoiceContextInternal] = useState<VoiceContext>({});
  const { user: clerkUser, isSignedIn } = useUser();

  // Wrapper to log when context is set
  const setVoiceContext = useCallback((ctx: VoiceContext) => {
    console.log("VoiceAssistantProvider: setVoiceContext called with:", ctx);
    setVoiceContextInternal(ctx);
  }, []);

  // Log context changes for debugging
  useEffect(() => {
    console.log("VoiceAssistantProvider: voiceContext state is now:", voiceContext);
  }, [voiceContext]);

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Don't render voice assistant if not signed in or user not found
  const shouldRender = isSignedIn && convexUser && isEnabled;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isEnabled,
    setIsEnabled,
    voiceContext,
    setVoiceContext,
  }), [isEnabled, voiceContext, setVoiceContext]);

  return (
    <VoiceAssistantContext.Provider value={contextValue}>
      {children}
      {shouldRender && (
        <VoiceAssistant
          userId={convexUser._id as Id<"users">}
          userName={convexUser.name || clerkUser?.firstName || undefined}
          context={voiceContext}
        />
      )}
    </VoiceAssistantContext.Provider>
  );
}
