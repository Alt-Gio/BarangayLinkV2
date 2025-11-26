"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { VoiceAssistant } from "./VoiceAssistant";
import { Id } from "../../../convex/_generated/dataModel";

interface VoiceAssistantContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType>({
  isEnabled: true,
  setIsEnabled: () => {},
});

export function useVoiceAssistantContext() {
  return useContext(VoiceAssistantContext);
}

interface VoiceAssistantProviderProps {
  children: React.ReactNode;
}

export function VoiceAssistantProvider({ children }: VoiceAssistantProviderProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const { user: clerkUser, isSignedIn } = useUser();

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Don't render voice assistant if not signed in or user not found
  const shouldRender = isSignedIn && convexUser && isEnabled;

  return (
    <VoiceAssistantContext.Provider value={{ isEnabled, setIsEnabled }}>
      {children}
      {shouldRender && (
        <VoiceAssistant
          userId={convexUser._id as Id<"users">}
          userName={convexUser.name || clerkUser?.firstName || undefined}
        />
      )}
    </VoiceAssistantContext.Provider>
  );
}
