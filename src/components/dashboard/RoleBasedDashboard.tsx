"use client";

import { useUser, UserButton } from '@clerk/nextjs';
import { AdminDashboard } from './AdminDashboard';
import { CaptainDashboard } from './CaptainDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { BuilderDashboard } from './BuilderDashboard';
import { WorkerDashboard } from './WorkerDashboard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardLoading, ConnectionStatus } from '../common/DashboardErrorBoundary';
import { 
  Building2, 
  Bell,
  Settings,
  LogOut,
  Crown,
  Shield,
  Briefcase,
  User
} from 'lucide-react';
import { useState, useEffect } from 'react';

const HIERARCHY_CONFIG = {
  ADMIN: {
    level: 4,
    name: 'Administrator',
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-500',
    description: 'Full system access and management',
    greeting: 'Welcome back, Administrator! You have full control over the system.'
  },
  CAPTAIN: {
    level: 3.5,
    name: 'Captain',
    icon: Shield,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/20',
    borderColor: 'border-cyan-500',
    description: 'Senior leadership and strategic oversight',
    greeting: 'Welcome, Captain! Lead the team to success with strategic decisions.'
  },
  MANAGER: {
    level: 3,
    name: 'Manager',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500',
    description: 'Department and team oversight',
    greeting: 'Good to see you, Manager! Your teams are counting on your leadership.'
  },
  BUILDER: {
    level: 2,
    name: 'Builder',
    icon: Briefcase,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500',
    description: 'Project and task management',
    greeting: 'Ready to build something amazing today? Your projects await!'
  },
  WORKER: {
    level: 1,
    name: 'Worker',
    icon: User,
    color: 'text-gray-400',
    bgColor: 'bg-gray-900/20',
    borderColor: 'border-gray-500',
    description: 'Basic community member access',
    greeting: 'Welcome to the community! Let\'s make a difference together.'
  }
};

interface RoleBasedDashboardProps {
  className?: string;
}

export function RoleBasedDashboard({ className = "" }: RoleBasedDashboardProps) {
  const { user, isLoaded } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(3); // Mock notification count

  // Get comprehensive dashboard data
  const {
    currentUser,
    userPermissions,
    userRole,
    dashboardStats,
    userProfile,
    isLoading: dataLoading,
    hasError
  } = useDashboardData();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle data loading states
  if (dataLoading || !currentUser) {
    return <DashboardLoading />;
  }

  // Handle errors
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-400">Failed to load dashboard data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const hierarchyInfo = HIERARCHY_CONFIG[userRole as keyof typeof HIERARCHY_CONFIG] || HIERARCHY_CONFIG.WORKER;
  const HierarchyIcon = hierarchyInfo.icon;

  const renderRoleSpecificDashboard = () => {
    switch (userRole) {
      case 'ADMIN':
        return <AdminDashboard user={currentUser} permissions={userPermissions} />;
      case 'CAPTAIN':
        return <CaptainDashboard user={currentUser} permissions={userPermissions} />;
      case 'MANAGER':
        return <ManagerDashboard user={currentUser} permissions={userPermissions} />;
      case 'BUILDER':
        return <BuilderDashboard user={currentUser} permissions={userPermissions} />;
      default:
        return <WorkerDashboard user={currentUser} permissions={userPermissions} />;
    }
  };

  return renderRoleSpecificDashboard();
}
