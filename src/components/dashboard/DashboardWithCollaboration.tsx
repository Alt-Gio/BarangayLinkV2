"use client";

import { LiveblocksClientProvider } from '@/components/liveblocks/LiveblocksClientProvider';
import { CollaborationHub } from '@/components/liveblocks/CollaborationHub';
import { OnlinePresence, CompactOnlinePresence } from '@/components/liveblocks/OnlinePresence';
import { RoleBasedDashboard } from './RoleBasedDashboard';
import { useUser } from '@clerk/nextjs';

interface DashboardWithCollaborationProps {
  children?: React.ReactNode;
}

export function DashboardWithCollaboration({ children }: DashboardWithCollaborationProps) {
  const { user } = useUser();

  return (
    <LiveblocksClientProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Header with Online Presence */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  BarangayLink Dashboard
                </h1>
              </div>
              
              {/* Online Presence in Header */}
              <div className="flex items-center space-x-4">
                <CompactOnlinePresence />
                
                {user && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {user.firstName || user.fullName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <RoleBasedDashboard />}
        </main>

        {/* Floating Collaboration Hub */}
        <CollaborationHub 
          roomId={`dashboard-${user?.id || 'general'}`}
          defaultOpen={false}
        />
      </div>
    </LiveblocksClientProvider>
  );
}

// Enhanced version with more presence features
export function DashboardWithFullCollaboration({ children }: DashboardWithCollaborationProps) {
  const { user } = useUser();

  return (
    <LiveblocksClientProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  BarangayLink Dashboard
                </h1>
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Detailed Online Presence */}
                <OnlinePresence maxVisible={4} showSelf={true} />
                
                {user && (
                  <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        {user.firstName || user.fullName}
                      </span>
                      <span className="text-xs text-green-600">Online</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Collaboration Status Bar */}
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-800">
                    Real-time collaboration active
                  </span>
                </div>
                
                <OnlinePresence maxVisible={6} showSelf={false} />
              </div>
              
              <div className="text-xs text-blue-600">
                Click the chat icon in the bottom-right to start collaborating
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <RoleBasedDashboard />}
        </main>

        {/* Advanced Collaboration Hub */}
        <CollaborationHub 
          roomId={`dashboard-${user?.id || 'general'}`}
          defaultOpen={false}
        />
      </div>
    </LiveblocksClientProvider>
  );
}
