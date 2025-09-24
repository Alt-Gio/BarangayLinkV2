"use client";

import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { ReactNode, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LiveblocksErrorBoundary } from "./LiveblocksErrorBoundary";
import { LiveblocksLoading } from "./LiveblocksLoading";

interface LiveblocksClientProviderProps {
  children: ReactNode;
}

export function LiveblocksClientProvider({ children }: LiveblocksClientProviderProps) {
  const activeUsers = useQuery(api.liveblocks.getActiveUsers);

  return (
    <LiveblocksErrorBoundary>
      <LiveblocksProvider
        authEndpoint="/api/liveblocks-auth"
        resolveUsers={async ({ userIds }) => {
          try {
            // Resolve user information using real Convex data
            if (!activeUsers) {
              return userIds.map(userId => ({
                name: `Loading...`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
              }));
            }

            return userIds.map(userId => {
              // Find user in Convex data by Clerk ID
              const user = activeUsers.find(u => u.clerkId === userId);
              
              if (user) {
                return {
                  name: user.name,
                  avatar: user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
                  info: {
                    department: user.department,
                    position: user.position,
                    level: user.userLevel?.name || 'WORKER',
                    experience: user.experience,
                    gold: user.gold
                  }
                };
              }
              
              // Fallback for users not found in Convex
              return {
                name: `User ${userId.slice(0, 8)}`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
              };
            });
          } catch (error) {
            console.error('Error resolving users:', error);
            return userIds.map(userId => ({
              name: `User ${userId.slice(0, 8)}`,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            }));
          }
        }}
        resolveMentionSuggestions={async ({ text }) => {
          try {
            // Resolve mention suggestions using Convex user data
            if (!activeUsers || !text) return [];
            
            const filteredUsers = activeUsers
              .filter(user => 
                user.name.toLowerCase().includes(text.toLowerCase()) ||
                user.email.toLowerCase().includes(text.toLowerCase())
              )
              .slice(0, 5)
              .map(user => user.name); // Return just the names as strings
            
            return filteredUsers;
          } catch (error) {
            console.error('Error resolving mentions:', error);
            return [];
          }
        }}
      >
        <Suspense fallback={<LiveblocksLoading type="full" />}>
          {children}
        </Suspense>
      </LiveblocksProvider>
    </LiveblocksErrorBoundary>
  );
}
