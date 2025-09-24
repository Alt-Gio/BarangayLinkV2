"use client";

import { ReactNode } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { ClientSideSuspense } from "@liveblocks/react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CollaborativeRoom } from "./CollaborativeRoom";

interface LiveblocksRoomProviderProps {
  children: ReactNode;
  roomId: string;
}

export function LiveblocksRoomProvider({ children, roomId }: LiveblocksRoomProviderProps) {
  const { user } = useUser();
  const currentUser = useQuery(api.users_fixed.getCurrentUser);

  // Don't render if user is not authenticated
  if (!user || !currentUser) {
    return <div>{children}</div>;
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        selection: null,
        user: {
          id: user.id,
          name: user.fullName || "Anonymous",
          avatar: user.imageUrl || "",
          role: currentUser.userLevel?.name || "WORKER",
          level: currentUser.level || 1,
        },
      }}
      initialStorage={{
        // Initialize with empty collaborative objects
        comments: {},
        cursors: {},
      }}
    >
      <ClientSideSuspense fallback={<div>Loading collaborative features...</div>}>
        <CollaborativeRoom roomId={roomId} showPresence={true}>
          {children}
        </CollaborativeRoom>
      </ClientSideSuspense>
    </RoomProvider>
  );
}

// Hook to get current user's Liveblocks presence
export function useUserPresence() {
  const { user } = useUser();
  const currentUser = useQuery(api.users_fixed.getCurrentUser);

  if (!user || !currentUser) return null;

  return {
    id: user.id,
    name: user.fullName || "Anonymous",
    avatar: user.imageUrl || "",
    role: currentUser.userLevel?.name || "WORKER",
    level: currentUser.level || 1,
    color: getRoleColor(currentUser.userLevel?.name || "WORKER"),
  };
}

function getRoleColor(role: string): string {
  const colors = {
    ADMIN: "#a855f7", // purple
    MANAGER: "#3b82f6", // blue
    BUILDER: "#10b981", // green
    WORKER: "#6b7280", // gray
  };
  return colors[role as keyof typeof colors] || colors.WORKER;
}
