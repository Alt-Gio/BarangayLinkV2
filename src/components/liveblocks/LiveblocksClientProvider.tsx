"use client";

import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LiveblocksErrorBoundary } from "./LiveblocksErrorBoundary";
import { LiveblocksLoading } from "./LiveblocksLoading";
import { useUser } from "@clerk/nextjs";

interface LiveblocksClientProviderProps {
  children: ReactNode;
}

export function LiveblocksClientProvider({ children }: LiveblocksClientProviderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const activeUsers = useQuery(api.liveblocks.getActiveUsers);
  const [authReady, setAuthReady] = useState(false);

  // Wait for Clerk to fully load and authenticate before allowing Liveblocks to connect
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Add a small delay to ensure session cookies are set
      const timer = setTimeout(() => {
        console.log('✅ Clerk auth ready, enabling Liveblocks connection');
        setAuthReady(true);
      }, 1000); // Increased to 1 second for better reliability
      return () => clearTimeout(timer);
    } else {
      setAuthReady(false);
    }
  }, [isLoaded, isSignedIn, user]);

  // Always render the provider, but only initialize connection when auth is ready
  // This prevents "LiveblocksProvider is missing" errors
  return (
    <LiveblocksErrorBoundary>
      {authReady ? (
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
                      level: 'WORKER',
                      experience: 0,
                      gold: 0
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
      ) : (
        // Render children without Liveblocks when auth is not ready
        <div suppressHydrationWarning>
          {children}
        </div>
      )}
    </LiveblocksErrorBoundary>
  );
}
