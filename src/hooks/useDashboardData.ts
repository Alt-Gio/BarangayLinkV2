"use client";

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useOfflineData } from '@/contexts/OfflineDataContext';

export function useDashboardData() {
  const { user: clerkUser } = useUser();
  
  // Core user data - NOW FROM OFFLINE CONTEXT (saves bandwidth!)
  const { currentUser, userPermissions, isOnline } = useOfflineData();
  
  // Admin-specific data
  const allUsers = useQuery(
    api.users.getAllUsersWithLevels,
    currentUser?.userLevel?.name === 'ADMIN' ? {} : "skip"
  );
  
  const userLevels = useQuery(
    api.userLevels.getAll,
    currentUser?.userLevel?.name === 'ADMIN' ? {} : "skip"
  );
  
  // Manager-specific data
  const departmentUsers = useQuery(
    api.users.getUsersByDepartment,
    currentUser?.userLevel?.name === 'MANAGER' && currentUser?.department 
      ? { department: currentUser.department } 
      : "skip"
  );
  
  // Real-time data for all roles
  const activeSessions = useQuery(
    api.userSessions.getActiveSessions,
    userPermissions?.includes('users:view') ? {} : "skip"
  );
  
  // Gamified tasks for workers and builders
  const userStats = useQuery(
    api.gamifiedTasks.getUserStats,
    currentUser ? { userId: undefined } : "skip"
  );
  
  const gamifiedTasks = useQuery(
    api.gamifiedTasks.getGamifiedTasks,
    currentUser ? { userId: undefined, type: undefined, status: undefined, projectId: undefined } : "skip"
  );
  
  const leaderboard = useQuery(
    api.gamifiedTasks.getLeaderboard,
    currentUser ? { type: "experience", limit: 10 } : "skip"
  );

  // Productivity data based on role and permissions
  const productivity = {
    // Projects data for builders, managers, and admins
    projects: useQuery(
      api.productivity.getProjects,
      userPermissions?.includes('projects:view') ? {
        department: currentUser?.userLevel?.name === 'MANAGER' ? currentUser?.department : undefined,
        limit: 50
      } : "skip"
    ),
    
    // Tasks assigned to current user (all roles)
    myTasks: useQuery(
      api.gamifiedTasks.getGamifiedTasks,
      currentUser ? { userId: currentUser._id, status: undefined, type: undefined, projectId: undefined } : "skip"
    ),
    
    // Analytics for managers and admins
    analytics: useQuery(
      api.productivity.getDashboardAnalytics,
      userPermissions?.includes('analytics:view') ? {
        department: currentUser?.userLevel?.name === 'MANAGER' ? currentUser?.department : undefined,
        userId: currentUser?._id
      } : "skip"
    ),

    // All users for task assignment (builders, managers, admins)
    allUsers: useQuery(
      api.users.getAllUsersWithLevels,
      userPermissions?.includes('users:view') ? {} : "skip"
    )
  };

  // Computed dashboard stats based on role
  const getDashboardStats = () => {
    const role = currentUser?.userLevel?.name || 'WORKER';
    
    switch (role) {
      case 'ADMIN':
        return {
          totalUsers: allUsers?.length || 0,
          activeProjects: 24, // This would come from a projects query
          systemHealth: '98.5%',
          eventsThisMonth: 15,
          activeSessions: activeSessions?.length || 0
        };
        
      case 'MANAGER':
        return {
          teamMembers: departmentUsers?.length || 0,
          activeProjects: 12,
          completionRate: '87%',
          upcomingEvents: 8,
          departmentPerformance: '92%'
        };
        
      case 'BUILDER':
        return {
          activeProjects: 8,
          tasksCompleted: currentUser?.totalTasksCompleted || 0,
          experiencePoints: currentUser?.experience || 0,
          teamCollaborations: 15
        };
        
      default: // WORKER
        return {
          tasksCompleted: currentUser?.totalTasksCompleted || 0,
          experiencePoints: currentUser?.experience || 0,
          goldEarned: currentUser?.gold || 50,
          communityEvents: 3,
          level: currentUser?.level || 1,
          health: currentUser?.health || 100,
          mana: currentUser?.mana || 50
        };
    }
  };

  // Loading states
  const isLoading = !currentUser && clerkUser;
  const hasError = false; // You can add error handling here
  
  // User role and permissions
  const userRole = currentUser?.userLevel?.name || 'WORKER';
  const hasPermission = (permission: string) => {
    return userPermissions?.includes(permission) || false;
  };

  return {
    // Core data
    currentUser,
    userPermissions,
    userRole,
    clerkUser,
    
    // Role-specific data
    allUsers,
    userLevels,
    departmentUsers,
    activeSessions,
    
    // Gamification data
    userStats,
    gamifiedTasks,
    leaderboard,
    
    // Productivity data
    productivity,
    
    // Computed stats
    dashboardStats: getDashboardStats(),
    
    // Utility functions
    hasPermission,
    isLoading,
    hasError,
    
    // User profile data
    userProfile: {
      name: currentUser?.name || clerkUser?.fullName || 'User',
      email: currentUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
      department: currentUser?.department || 'General',
      position: currentUser?.position || 'Community Member',
      level: currentUser?.level || 1,
      experience: currentUser?.experience || 0,
      gold: currentUser?.gold || 50,
      health: currentUser?.health || 100,
      mana: currentUser?.mana || 50,
      totalTasksCompleted: currentUser?.totalTasksCompleted || 0,
      totalHoursLogged: currentUser?.totalHoursLogged || 0,
      projectSuccessRate: currentUser?.projectSuccessRate || 0
    }
  };
}
