"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { X, Users as UsersIcon, User, MessageCircle, Bell, Briefcase, Award } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Role colors matching the org chart
const ROLE_COLORS = {
  ADMIN: 'text-red-400 bg-red-600/10 border-red-500/30',
  CAPTAIN: 'text-orange-400 bg-orange-600/10 border-orange-500/30',
  MANAGER: 'text-purple-400 bg-purple-600/10 border-purple-500/30',
  BUILDER: 'text-blue-400 bg-blue-600/10 border-blue-500/30',
  WORKER: 'text-emerald-400 bg-emerald-600/10 border-emerald-500/30',
};

// Presence status colors
const STATUS_COLORS = {
  online: 'bg-green-500',
  working: 'bg-blue-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
};

export function OnlineUsersModal({ isOpen, onClose }: OnlineUsersModalProps) {
  const router = useRouter();
  // Get actual online users from presence tracking
  const onlineUsers = useQuery(api.presence.getOnlineUsers) || [];
  const sendPing = useMutation(api.quickActions.sendPing);
  const currentUser = useQuery(api.users.getCurrentUser);
  
  if (!isOpen) return null;

  const handleMessage = async (userId: string, userName: string) => {
    // Navigate to messages - you can enhance this to open a specific DM
    router.push('/messages');
    toast.success(`Opening chat with ${userName}`);
    onClose();
  };

  const handlePing = async (userId: string, userName: string) => {
    try {
      await sendPing({ 
        targetUserId: userId as any,
        message: `${currentUser?.name || 'Someone'} wants to connect!`
      });
      toast.success(`📡 Ping sent to ${userName}!`);
    } catch (error) {
      toast.error('Failed to send ping');
    }
  };
  
  // Group users by role
  const usersByRole = onlineUsers.reduce((acc, user) => {
    const role = user.userLevel?.name || 'WORKER';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, typeof onlineUsers>);

  // Sort roles by hierarchy
  const roleOrder = ['ADMIN', 'CAPTAIN', 'MANAGER', 'BUILDER', 'WORKER'];
  const sortedRoles = roleOrder.filter(role => usersByRole[role]?.length > 0);

  return (
    <div className="fixed inset-0 z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal Container - Centered */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div 
          className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-teal-900/20 to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <UsersIcon className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Online Users</h2>
                <p className="text-sm text-gray-400">
                  {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} currently active
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-6">
            {onlineUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users online right now</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedRoles.map(role => (
                  <div key={role}>
                    {/* Role Header */}
                    <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]?.split(' ')[0]} border-current/20`}>
                      <User className="w-4 h-4" />
                      <h3 className="font-semibold text-sm uppercase tracking-wide">
                        {role}
                      </h3>
                      <span className="ml-auto text-xs">
                        {usersByRole[role].length}
                      </span>
                    </div>

                    {/* Users List */}
                    <div className="grid grid-cols-1 gap-3">
                      {usersByRole[role].map(user => {
                        const isCurrentUser = user._id === currentUser?._id;
                        
                        return (
                          <div
                            key={user._id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}
                          >
                            {/* Avatar with status */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700"
                              />
                              {/* Online indicator */}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${STATUS_COLORS.online} rounded-full border-2 border-gray-800`}></div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">
                                  {user.name} {isCurrentUser && '(You)'}
                                </p>
                                {/* Mini achievements */}
                                {user.achievements && user.achievements.length > 0 && (
                                  <div className="flex gap-0.5">
                                    {user.achievements.slice(0, 2).map((ach: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs border border-gray-700"
                                        title={ach.title}
                                      >
                                        {ach.icon || '🏆'}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                {user.position || 'Community Member'}
                              </p>
                              
                              {/* Current Activity - Enhanced */}
                              {user.currentActivity && user.currentActivity.type !== 'none' && (
                                <div className="mt-1.5 p-1.5 bg-gray-900/50 border border-teal-500/20 rounded">
                                  {/* Event Name */}
                                  {user.currentActivity.eventInfo && (
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-[9px] text-orange-400">📅</span>
                                      <span className="text-[9px] text-gray-400 truncate">
                                        {user.currentActivity.eventInfo.title}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Task Details */}
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-teal-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-teal-400">
                                      {user.currentActivity.type === 'task' ? '📋' : '📊'}
                                    </span>
                                    <span className="text-xs text-white font-medium truncate flex-1">
                                      {user.currentActivity.name}
                                    </span>
                                    {user.currentActivity.priority && (
                                      <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold ${
                                        user.currentActivity.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                        user.currentActivity.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                        user.currentActivity.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-blue-500/20 text-blue-400'
                                      }`}>
                                        {user.currentActivity.priority}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Description */}
                                  {user.currentActivity.description && (
                                    <p className="text-[9px] text-gray-500 truncate mt-0.5 ml-3">
                                      {user.currentActivity.description}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            {!isCurrentUser && (
                              <div className="flex gap-2 flex-shrink-0">
                                {/* Message Button */}
                                <button
                                  onClick={() => handleMessage(user._id, user.name)}
                                  className="p-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                                  title="Send message"
                                >
                                  <MessageCircle className="w-4 h-4 text-white" />
                                </button>
                                
                                {/* Ping Button */}
                                <button
                                  onClick={() => handlePing(user._id, user.name)}
                                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                  title="Send quick ping"
                                >
                                  <Bell className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-900/50">
            <p className="text-xs text-gray-500 text-center">
              Showing active users in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
