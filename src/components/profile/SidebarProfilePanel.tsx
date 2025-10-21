"use client";

import { useUser, UserButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { User, Settings, LogOut, Users, Briefcase, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { OnlineUsersModal } from './OnlineUsersModal';
import { useOfflineData } from '@/contexts/OfflineDataContext';

// Presence status colors and meanings
const PRESENCE_STATES = {
  online: {
    color: 'bg-green-500',
    label: 'Online',
    ring: 'ring-green-500/30',
    description: 'Active and available'
  },
  working: {
    color: 'bg-blue-500',
    label: 'Working',
    ring: 'ring-blue-500/30',
    description: 'Busy working on tasks'
  },
  idle: {
    color: 'bg-yellow-500',
    label: 'Idle',
    ring: 'ring-yellow-500/30',
    description: 'Away from keyboard'
  },
  dnd: {
    color: 'bg-red-500',
    label: 'Do Not Disturb',
    ring: 'ring-red-500/30',
    description: 'Please do not disturb'
  },
  offline: {
    color: 'bg-gray-500',
    label: 'Offline',
    ring: 'ring-gray-500/30',
    description: 'Not available'
  }
};

// Role-based colors (matching org chart)
const ROLE_COLORS = {
  ADMIN: 'text-red-400',
  CAPTAIN: 'text-orange-400',
  MANAGER: 'text-purple-400',
  BUILDER: 'text-blue-400',
  WORKER: 'text-emerald-400',
};

type PresenceStatus = keyof typeof PRESENCE_STATES;

export function SidebarProfilePanel() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const currentActivity = useQuery(api.activity.getCurrentActivity);
  const recentAchievements = useQuery(api.activity.getRecentAchievements, { limit: 3 });
  const { signOut } = useClerk();
  const { isOnline, isSyncing, pendingSyncCount } = useOfflineData();

  // Debug: Log current activity
  useEffect(() => {
    console.log('🔍 Current Activity:', currentActivity);
  }, [currentActivity]);
  
  // Simulate presence status - you can replace this with actual tracking
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('online');
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  // Auto-detect idle status (simple example)
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      if (presenceStatus === 'idle') {
        setPresenceStatus('online');
      }
      
      // Set to idle after 5 minutes of inactivity
      idleTimer = setTimeout(() => {
        if (presenceStatus === 'online' || presenceStatus === 'working') {
          setPresenceStatus('idle');
        }
      }, 5 * 60 * 1000);
    };

    // Listen for user activity
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
    };
  }, [presenceStatus]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!clerkUser || !convexUser) {
    return null;
  }

  const currentPresence = PRESENCE_STATES[presenceStatus];
  const roleColor = ROLE_COLORS[convexUser.userLevel?.name as keyof typeof ROLE_COLORS] || ROLE_COLORS.WORKER;

  return (
    <div className="border-t border-gray-700 bg-gray-900/50">
      {/* User Info */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar with Clerk UserButton */}
          <div className="relative">
            <div className={`absolute -inset-0.5 rounded-full ${
              isSyncing ? 'ring-2 ring-blue-500/50 animate-pulse' :
              !isOnline ? 'ring-2 ring-orange-500/50 animate-pulse' :
              pendingSyncCount > 0 ? 'ring-2 ring-yellow-500/50 animate-pulse' :
              'ring-2 ring-emerald-500/30'
            }`}></div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 cursor-pointer",
                  userButtonPopoverCard: "bg-white border-2 border-gray-300 shadow-xl",
                  userButtonPopoverActions: "bg-white",
                  userButtonPopoverActionButton: "text-gray-800 hover:bg-teal-50 hover:text-teal-600",
                  userButtonPopoverActionButtonText: "text-gray-800 font-medium",
                  userButtonPopoverActionButtonIcon: "text-gray-600",
                  userButtonPopoverFooter: "bg-gray-50 border-t border-gray-200",
                  userPreviewMainIdentifier: "text-gray-900 font-semibold",
                  userPreviewSecondaryIdentifier: "text-gray-600",
                  userButtonPopoverMain: "bg-white",
                }
              }}
            />
            {/* Online Status Indicator */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${currentPresence.color} rounded-full border-2 border-gray-900`}></div>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Name with presence indicator */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">
                {convexUser.name || clerkUser.firstName}
              </p>
              <div 
                className={`relative w-2 h-2 ${currentPresence.color} rounded-full cursor-pointer ${
                  isSyncing ? 'ring-2 ring-blue-500 animate-pulse' :
                  !isOnline ? 'ring-2 ring-orange-500 animate-pulse' :
                  pendingSyncCount > 0 ? 'ring-2 ring-yellow-500 animate-pulse' :
                  'ring-2 ring-emerald-500/50'
                }`}
                title={`${currentPresence.label} - ${currentPresence.description}${
                  isSyncing ? ' | Syncing...' :
                  !isOnline ? ' | Offline' :
                  pendingSyncCount > 0 ? ` | ${pendingSyncCount} pending` :
                  ' | Synced'
                }`}
                onClick={() => setShowPresenceMenu(!showPresenceMenu)}
              ></div>
              {/* Online Users Button */}
              <button
                onClick={() => setShowOnlineUsers(true)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="View online users"
              >
                <Users className="w-3.5 h-3.5 text-gray-400 hover:text-teal-400 transition-colors" />
              </button>
            </div>
            
            {/* Role with color coding */}
            <div className="flex items-center gap-1.5">
              <User className={`w-3 h-3 ${roleColor}`} />
              <p className={`text-xs font-medium ${roleColor}`}>
                {convexUser.userLevel?.name || 'WORKER'}
              </p>
            </div>

          </div>
        </div>

        {/* Current Activity Indicator - Compact & Professional */}
        {currentActivity && currentActivity.type !== 'none' && (
          <div className="mt-2 mx-3 p-2 bg-gray-800/60 border border-teal-500/30 rounded-md">
            {/* Event Info - If Available */}
            {currentActivity.eventInfo && (
              <div className="flex items-center gap-1 mb-1 pb-1 border-b border-gray-700/50">
                <span className="text-[10px] text-orange-400">📅</span>
                <span className="text-[10px] text-gray-400 truncate font-medium">
                  {currentActivity.eventInfo.title}
                </span>
              </div>
            )}
            
            {/* Task Info - Compact */}
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-teal-400 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] text-teal-400 font-medium">
                    {currentActivity.type === 'task' ? '📋' : '📊'}
                  </span>
                  <span className="text-xs text-white font-semibold truncate">
                    {currentActivity.name || 'Untitled'}
                  </span>
                  {currentActivity.priority && (
                    <span className={`text-[9px] px-1 py-0.5 rounded uppercase font-bold ${
                      currentActivity.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                      currentActivity.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      currentActivity.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {currentActivity.priority}
                    </span>
                  )}
                </div>
                {currentActivity.description && (
                  <p className="text-[10px] text-gray-400 truncate leading-tight">
                    {currentActivity.description}
                  </p>
                )}
              </div>
              <Briefcase className="w-3 h-3 text-teal-500/40 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Mini Achievement Badges */}
        {recentAchievements && recentAchievements.length > 0 && (
          <div className="mt-2 px-3">
            <div className="flex items-center gap-2">
              <Award className="w-3 h-3 text-yellow-400" />
              <div className="flex gap-1.5 flex-1">
                {recentAchievements.slice(0, 3).map((achievement, idx) => (
                  <div
                    key={idx}
                    className="relative group cursor-pointer"
                    title={achievement.title}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs shadow-lg border border-gray-700">
                      {achievement.icon || '🏆'}
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                      {achievement.title}
                    </div>
                  </div>
                ))}
                {recentAchievements.length > 3 && (
                  <div 
                    className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 cursor-pointer hover:bg-gray-600"
                    title="View all achievements"
                    onClick={() => router.push('/profile')}
                  >
                    +{recentAchievements.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Presence Status Menu */}
      {showPresenceMenu && (
        <div className="mt-3 bg-gray-800 rounded-lg p-2 space-y-1 border border-gray-700 mx-4">
          {Object.entries(PRESENCE_STATES).map(([key, state]) => (
            <button
              key={key}
              onClick={() => {
                setPresenceStatus(key as PresenceStatus);
                setShowPresenceMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
                presenceStatus === key ? 'bg-gray-700' : ''
              }`}
            >
              <div className={`w-3 h-3 ${state.color} rounded-full`}></div>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium text-white">{state.label}</p>
                <p className="text-xs text-gray-400">{state.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={() => router.push('/profile')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-gray-700 hover:bg-teal-600 text-gray-300 hover:text-white rounded-lg transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
      
      {/* Online Users Modal */}
      <OnlineUsersModal 
        isOpen={showOnlineUsers}
        onClose={() => setShowOnlineUsers(false)}
      />
    </div>
  );
}
