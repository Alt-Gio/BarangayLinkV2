"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useClerk, UserButton } from '@clerk/nextjs';
import { 
  ChevronDown, 
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  Plus,
  CheckSquare,
  Users,
  Calendar,
  FileText,
  Upload,
  DollarSign,
  Settings,
  User,
  LogOut,
  Home,
  Briefcase,
  ClipboardList,
  UserCheck,
  CalendarDays,
  PlusCircle,
  BookOpen,
  Archive,
  CreditCard,
  Shield,
  Wrench,
  Menu,
  X,
  Mail,
  Network,
  MessageCircle
} from 'lucide-react';
import { GlobalSearch } from '@/components/search/GlobalSearch';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: string[]; // Which roles can see this item
}

interface SidebarProps {
  userRole?: string;
  dashboardTitle?: string;
  dashboardSubtitle?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function Sidebar({ 
  userRole = 'WORKER', 
  dashboardTitle, 
  dashboardSubtitle, 
  isOpen = true, 
  onToggle,
  className = ""
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'projects']);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Define menu structure based on roles
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      children: [
        {
          id: 'dashboard-main',
          label: 'Main Dashboard',
          icon: <Home className="w-4 h-4" />,
          path: '/dashboard',
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'ADMIN']
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <LayoutDashboard className="w-4 h-4" />,
          path: '/dashboard/analytics',
          roles: ['MANAGER', 'ADMIN']
        }
      ]
    },
    {
      id: 'projects',
      label: 'Project Management',
      icon: <Briefcase className="w-4 h-4" />,
      children: [
        {
          id: 'all-projects',
          label: 'All Projects',
          icon: <FolderOpen className="w-4 h-4" />,
          path: '/projects',
          roles: ['BUILDER', 'MANAGER', 'ADMIN']
        },
        {
          id: 'project-approval',
          label: 'Project Approval',
          icon: <UserCheck className="w-4 h-4" />,
          path: '/projects/approval',
          roles: ['MANAGER', 'ADMIN']
        }
      ]
    },
    {
      id: 'tasks',
      label: 'Task Management',
      icon: <ClipboardList className="w-4 h-4" />,
      children: [
        {
          id: 'my-tasks',
          label: 'My Tasks',
          icon: <CheckSquare className="w-4 h-4" />,
          path: '/tasks/my-tasks',
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'ADMIN']
        },
        {
          id: 'team-tasks',
          label: 'Team Tasks',
          icon: <Users className="w-4 h-4" />,
          path: '/tasks/team',
          roles: ['BUILDER', 'MANAGER', 'ADMIN']
        }
      ]
    },
    {
      id: 'events',
      label: 'Event Management',
      icon: <Calendar className="w-4 h-4" />,
      children: [
        {
          id: 'event-calendar',
          label: 'Event Calendar',
          icon: <CalendarDays className="w-4 h-4" />,
          path: '/events',
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'ADMIN']
        },
        {
          id: 'create-event',
          label: 'Create Event',
          icon: <Plus className="w-4 h-4" />,
          path: '/events/create',
          roles: ['MANAGER', 'ADMIN']
        }
      ]
    },
    {
      id: 'documents',
      label: 'Document Library',
      icon: <FolderOpen className="w-4 h-4" />,
      path: '/documents',
      roles: ['WORKER', 'BUILDER', 'MANAGER', 'ADMIN']
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageCircle className="w-4 h-4" />,
      path: '/messages',
      roles: ['WORKER', 'BUILDER', 'MANAGER', 'ADMIN']
    },
    {
      id: 'system',
      label: 'System Administrator',
      icon: <Shield className="w-4 h-4" />,
      children: [
        {
          id: 'user-management',
          label: 'User Management',
          icon: <Users className="w-4 h-4" />,
          path: '/admin/users',
          roles: ['ADMIN']
        },
        {
          id: 'invitations',
          label: 'Invitations',
          icon: <Mail className="w-4 h-4" />,
          path: '/admin/invitations',
          roles: ['ADMIN']
        },
        {
          id: 'org-chart',
          label: 'Organizational Chart',
          icon: <Network className="w-4 h-4" />,
          path: '/admin/org-chart',
          roles: ['ADMIN']
        },
        {
          id: 'system-settings',
          label: 'System Settings',
          icon: <Settings className="w-4 h-4" />,
          path: '/admin/settings',
          roles: ['ADMIN']
        }
      ],
      roles: ['ADMIN']
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isItemVisible = (item: MenuItem): boolean => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  const isActive = (path: string): boolean => {
    return pathname === path;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-red-400';
      case 'MANAGER': return 'text-blue-400';
      case 'BUILDER': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-3 h-3" />;
      case 'MANAGER': return <Briefcase className="w-3 h-3" />;
      case 'BUILDER': return <Wrench className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'z-50' : 'z-10'}
        h-screen w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300 ease-in-out
        ${className}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BL</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg">BarangayLink</h1>
                <p className="text-xs text-green-400">v2.0.0</p>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            {isMobile && onToggle && (
              <button
                onClick={onToggle}
                className="p-1 rounded-lg hover:bg-gray-800 transition-colors md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Global Search */}
        <div className="px-4 pt-4">
          <GlobalSearch className="w-full" />
        </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            if (!isItemVisible(item)) return null;

            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections.includes(item.id);
            const visibleChildren = item.children?.filter(isItemVisible) || [];

            return (
              <div key={item.id}>
                {/* Parent Item */}
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    item.path && isActive(item.path)
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  onClick={() => {
                    if (hasChildren && visibleChildren.length > 0) {
                      toggleSection(item.id);
                    } else if (item.path) {
                      handleNavigation(item.path);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {hasChildren && visibleChildren.length > 0 && (
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>

                {/* Children Items */}
                {hasChildren && isExpanded && visibleChildren.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {visibleChildren.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          child.path && isActive(child.path)
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                        onClick={() => child.path && handleNavigation(child.path)}
                      >
                        {child.icon}
                        <span className="text-sm">{child.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Info */}
      {(dashboardTitle || dashboardSubtitle) && (
        <div className="border-t border-gray-700 px-4 py-3">
          <div className="space-y-1">
            {dashboardTitle && (
              <h3 className="text-sm font-semibold text-white">{dashboardTitle}</h3>
            )}
            {dashboardSubtitle && (
              <p className="text-xs text-gray-400">{dashboardSubtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* User Info & Actions */}
      <div className="border-t border-gray-700 p-4">
        {user && (
          <div className="space-y-3">
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <img
                src={user.imageUrl}
                alt={user.fullName || 'User'}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.fullName || user.firstName}
                </p>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(userRole)}
                  <p className={`text-xs ${getRoleColor(userRole)}`}>
                    {userRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Clerk Profile Button - Opens Clerk Settings Modal */}
              <div className="flex-1 flex items-center justify-center">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "bg-gray-800 border border-gray-700",
                      userButtonPopoverActions: "bg-gray-800",
                      userButtonPopoverActionButton: "text-white hover:bg-gray-700",
                      userButtonPopoverActionButtonText: "text-white",
                      userButtonPopoverFooter: "hidden"
                    }
                  }}
                  showName={false}
                />
              </div>
              <button
                onClick={handleSignOut}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
