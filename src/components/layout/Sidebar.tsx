"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useClerk, UserButton } from '@clerk/nextjs';
import { useSidebar } from '@/contexts/SidebarContext';
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
  MessageCircle,
  MessageSquare,
  Target,
  TrendingUp,
  Bell
} from 'lucide-react';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { SidebarNotificationPanel } from '@/components/notifications/SidebarNotificationPanel';
import { SidebarProfilePanel } from '@/components/profile/SidebarProfilePanel';

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
  const { setSidebarOpen } = useSidebar();
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'projects']);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Sync sidebar state with global context
  useEffect(() => {
    setSidebarOpen(isOpen && isMobile);
  }, [isOpen, isMobile, setSidebarOpen]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, ensure sidebar starts closed
      if (mobile && !isMounted && onToggle && isOpen) {
        onToggle();
      }
    };
    
    checkMobile();
    setIsMounted(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close sidebar on mobile when route changes - immediate close
  useEffect(() => {
    if (isMobile && isOpen && onToggle && isMounted) {
      // Close immediately on route change
      onToggle();
    }
  }, [pathname]); // Only depend on pathname to trigger on route change

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
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <LayoutDashboard className="w-4 h-4" />,
          path: '/dashboard/analytics',
          roles: ['MANAGER', 'CAPTAIN', 'ADMIN']
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
          roles: ['BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
        },
        {
          id: 'project-approval',
          label: 'Project Approval',
          icon: <UserCheck className="w-4 h-4" />,
          path: '/projects/approval',
          roles: ['MANAGER', 'CAPTAIN', 'ADMIN']
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
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
        },
        {
          id: 'my-duties',
          label: 'My Duties',
          icon: <Briefcase className="w-4 h-4" />,
          path: '/tasks/my-duties',
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
        },
        {
          id: 'habits',
          label: 'Habits',
          icon: <Target className="w-4 h-4" />,
          path: '/tasks/habits',
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
        },
        {
          id: 'team-tasks',
          label: 'Team Tasks',
          icon: <Users className="w-4 h-4" />,
          path: '/tasks/team',
          roles: ['BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
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
          roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
        },
        {
          id: 'sprint-board',
          label: 'Sprint Board',
          icon: <TrendingUp className="w-4 h-4" />,
          path: '/events/sprints',
          roles: ['BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
        }
      ]
    },
    {
      id: 'documents',
      label: 'Document Library',
      icon: <FolderOpen className="w-4 h-4" />,
      path: '/documents',
      roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageCircle className="w-4 h-4" />,
      path: '/messages',
      roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      path: '/notifications',
      roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
    },
    {
      id: 'collaboration',
      label: 'Collaboration',
      icon: <MessageSquare className="w-4 h-4" />,
      path: '/collaboration',
      roles: ['WORKER', 'BUILDER', 'MANAGER', 'CAPTAIN', 'ADMIN']
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
          id: 'pending-approvals',
          label: 'Pending Approvals',
          icon: <UserCheck className="w-4 h-4" />,
          path: '/admin/pending-approvals',
          roles: ['CAPTAIN', 'ADMIN']
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
      roles: ['CAPTAIN', 'ADMIN']
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
    setIsAnimating(true);
    // Close sidebar on mobile before navigation
    if (isMobile && onToggle) {
      onToggle();
    }
    // Navigate immediately for snappier feel
    setTimeout(() => {
      router.push(path);
      setIsAnimating(false);
    }, isMobile ? 100 : 0); // Reduced from 300ms to 100ms
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
      {/* Mobile Overlay with smooth fade */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={onToggle}
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        />
      )}
      
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        
        /* Prevent sidebar flash on mobile during initial load */
        @media (max-width: 767px) {
          [class*="fixed"][class*="z-50"] {
            transform: translateX(-100%);
          }
        }
      `}</style>
      
      {/* Sidebar with enhanced animations */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'z-50' : 'z-10'}
        h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col
        transition-all duration-300 ease-out
        ${isMobile ? 'shadow-2xl shadow-emerald-500/20' : ''}
        ${!isMounted && isMobile ? 'invisible' : 'visible'}
        ${className}
      `}
      style={{
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: isMounted ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        visibility: !isMounted && isMobile ? 'hidden' : 'visible'
      }}>
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
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    item.path && isActive(item.path)
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md hover:scale-[1.02]'
                  } ${isAnimating ? 'opacity-50 pointer-events-none' : ''}`}
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
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          child.path && isActive(child.path)
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-500/20'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 hover:translate-x-1'
                        } ${isAnimating ? 'opacity-50 pointer-events-none' : ''}`}
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

      {/* Notifications Panel */}
      <SidebarNotificationPanel />
      
      {/* User Profile Panel */}
      <SidebarProfilePanel />
    </div>
    </>
  );
}
