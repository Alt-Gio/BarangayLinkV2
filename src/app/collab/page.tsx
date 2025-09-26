"use client";

import { Suspense } from 'react';
import { useUser } from '@clerk/nextjs';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { LiveblocksClientProvider } from '@/components/liveblocks/LiveblocksClientProvider';
import { CollaborationHub } from '@/components/liveblocks/CollaborationHub';
import { OnlinePresence } from '@/components/liveblocks/OnlinePresence';
import { LiveblocksLoading } from '@/components/liveblocks/LiveblocksLoading';
import { EnhancedMessengerChat } from '@/components/liveblocks/EnhancedMessengerChat';
import { EnhancedTeamPanel } from '@/components/liveblocks/EnhancedTeamPanel';
import { NotificationsDashboard } from '@/components/liveblocks/NotificationsDashboard';
import { RoomProvider } from '@liveblocks/react/suspense';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus,
  Bell,
  Crown,
  Shield,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

export default function CollabPage() {
  const { user, isLoaded } = useUser();
  
  const currentUser = useQuery(
    api.liveblocks.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const activeUsers = useQuery(api.liveblocks.getActiveUsers);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Sign In Section */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white mb-2">Join Your Community</CardTitle>
              <CardDescription className="text-gray-300">
                Let's collaborate and build something amazing together!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignInButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  <Users className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </SignUpButton>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-400">
            <p>Powered by Liveblocks • Real-time collaboration made simple</p>
          </div>
        </div>
      </div>
    );
  }

  // Main collaboration interface for authenticated users
  const getRoleInfo = (userLevel: any) => {
    if (!userLevel) return { role: 'WORKER', color: 'text-gray-400', icon: UserIcon };
    
    switch (userLevel.name) {
      case 'ADMIN': return { role: 'ADMIN', color: 'text-red-400', icon: Crown };
      case 'MANAGER': return { role: 'MANAGER', color: 'text-blue-400', icon: Shield };
      case 'BUILDER': return { role: 'BUILDER', color: 'text-emerald-400', icon: Briefcase };
      default: return { role: 'WORKER', color: 'text-gray-400', icon: UserIcon };
    }
  };

  const roleInfo = getRoleInfo(currentUser?.userLevel);
  const RoleIcon = roleInfo.icon;

  return (
    <LiveblocksClientProvider>
      <RoomProvider id="main-collaboration-room">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          {/* Header */}
          <header className="bg-gray-800/90 backdrop-blur-sm shadow-lg border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xl">BL</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">BarangayLink Collaboration</h1>
                    <p className="text-base text-emerald-400 font-semibold">Real-time team workspace</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <Suspense fallback={<LiveblocksLoading type="presence" />}>
                    <OnlinePresence maxVisible={5} showSelf={true} />
                  </Suspense>
                  
                  <div className="flex items-center space-x-4 pl-6 border-l-2 border-emerald-200">
                    <img
                      src={currentUser?.imageUrl || user.imageUrl}
                      alt={currentUser?.name || user.fullName || 'User'}
                      className="w-12 h-12 rounded-full border-2 border-emerald-300 shadow-md"
                    />
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-white">
                        {currentUser?.name || user.firstName || user.fullName || user.emailAddresses?.[0]?.emailAddress}
                      </span>
                      <div className="flex items-center space-x-2">
                        <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
                        <span className={`text-sm font-semibold ${roleInfo.color}`}>
                          {roleInfo.role}
                        </span>
                        {currentUser?.department && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-300 font-medium">
                              {currentUser.department}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">

              {/* Notifications Dashboard */}
              <div className="lg:col-span-1">
                <Card className="h-full shadow-xl border-gray-600 bg-gray-800/95 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-600 bg-gradient-to-r from-red-700 to-orange-600">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-black text-white">Live Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-full overflow-hidden">
                    <Suspense fallback={<LiveblocksLoading type="full" />}>
                      <NotificationsDashboard />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Messenger Chat */}
              <div className="lg:col-span-2">
                <Card className="h-full shadow-xl border-gray-600 bg-gray-800/95 backdrop-blur-sm">
                  <CardContent className="h-full p-0">
                    <Suspense fallback={<LiveblocksLoading type="chat" />}>
                      <EnhancedMessengerChat roomId="main-collaboration-room" className="h-full" />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Team Panel */}
              <div className="lg:col-span-1">
                <Card className="h-full shadow-xl border-gray-600 bg-gray-800/95 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-600 bg-gradient-to-r from-blue-700 to-purple-600">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-black text-white">Team ({activeUsers?.length || 0})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-full overflow-hidden">
                    <Suspense fallback={<LiveblocksLoading type="users" />}>
                      <EnhancedTeamPanel 
                        className="h-full"
                        onStartChat={(userId: string, userName: string) => {
                          console.log(`Starting chat with ${userName}`);
                        }}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

            </div>
          </main>

          {/* Floating Collaboration Hub */}
          <Suspense fallback={null}>
            <CollaborationHub 
              roomId="main-collaboration-room" 
              defaultOpen={false}
            />
          </Suspense>
        </div>
      </RoomProvider>
    </LiveblocksClientProvider>
  );
}
