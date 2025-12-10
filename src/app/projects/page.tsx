"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectWizard } from '@/components/projects/ProjectWizard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/layout/Sidebar';
import { ExportButton } from '@/components/common/ExportButton';
import { Plus, Clock, CheckCircle2, AlertCircle, Menu } from 'lucide-react';
import { exportProjectsReport } from '@/lib/exportUtils';

function ProjectsContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWizard, setShowWizard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [filters, setFilters] = useState({
    status: "all",
    department: "all"
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowWizard(true);
      router.replace('/projects', { scroll: false });
    }
  }, [searchParams, router]);

  const { currentUser, isOnline } = useOfflineData();
  
  const projects = useQuery(api.productivity.getProjects, {
    status: filters.status === "all" ? undefined : filters.status,
    department: filters.department === "all" ? undefined : filters.department,
    limit: 50
  });

  const filteredProjects = projects?.filter((p: any) => {
    if (activeView === 'all') return true;
    if (activeView === 'pending') return p.status === 'pending_approval' || p.status === 'planning';
    if (activeView === 'active') return p.status === 'active';
    if (activeView === 'completed') return p.status === 'completed';
    return true;
  }) || [];

  const pendingApprovals = currentUser?.userLevel?.name && ["MANAGER", "CAPTAIN", "ADMIN"].includes(currentUser.userLevel.name)
    ? projects?.filter((p: any) => p.status === 'pending_approval' || p.status === 'planning') || []
    : [];

  const canCreateProjects = currentUser?.userLevel?.name && 
    ["ADMIN", "CAPTAIN", "MANAGER", "BUILDER"].includes(currentUser.userLevel.name);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleExport = (format: 'pdf' | 'excel') => {
    if (!filteredProjects || filteredProjects.length === 0) return;
    exportProjectsReport(filteredProjects, format);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="h-20 bg-white/10 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If wizard is shown, display it full screen
  if (showWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <ProjectWizard
          onComplete={(projectId) => {
            setShowWizard(false);
            router.push(`/projects/${projectId}`);
          }}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Sidebar 
        userRole={currentUser.userLevel.name}
        dashboardTitle="Projects"
        dashboardSubtitle="Manage your projects"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Projects</h1>
          <div className="w-9" />
        </div>

        <div className="p-3 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-white truncate">Projects</h1>
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {currentUser.userLevel.name} · {(currentUser as any).department || 'Unassigned'}
              </p>
            </div>
            {canCreateProjects && (
              <button
                onClick={() => setShowWizard(true)}
                className="md:hidden p-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-95 text-white rounded-xl shadow-lg transition-all duration-150"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full">
            {/* Pending Approvals Badge for Managers/Admins */}
            {pendingApprovals && pendingApprovals.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setActiveView('pending')}
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 active:scale-95 text-xs sm:text-sm flex-1 sm:flex-none transition-all duration-150"
              >
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{pendingApprovals.length} Pending Approval</span>
                <span className="sm:hidden">{pendingApprovals.length} Pending</span>
              </Button>
            )}

            <ExportButton 
              onExport={handleExport}
              label="Export"
              disabled={!filteredProjects || filteredProjects.length === 0}
              className="text-xs sm:text-sm flex-1 sm:flex-none min-w-0"
            />
            {canCreateProjects && (
              <Button
                onClick={() => setShowWizard(true)}
                className="hidden md:flex bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 active:scale-95 text-white text-xs sm:text-sm transition-all duration-150"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span>Create Project</span>
              </Button>
            )}
          </div>
        </div>

        {/* Pull to Refresh Indicator */}
        {isRefreshing && (
          <div className="flex justify-center py-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Quick View Tabs */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={activeView === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveView('all')}
            className={`text-xs sm:text-sm whitespace-nowrap active:scale-95 transition-all duration-150 ${activeView === 'all' ? 'bg-blue-600' : ''}`}
          >
            All Projects
          </Button>
          <Button
            variant={activeView === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveView('pending')}
            className={`text-xs sm:text-sm whitespace-nowrap active:scale-95 transition-all duration-150 ${activeView === 'pending' ? 'bg-yellow-600' : ''}`}
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Pending Approval</span>
            <span className="sm:hidden ml-1">Pending</span>
          </Button>
          <Button
            variant={activeView === 'active' ? 'default' : 'outline'}
            onClick={() => setActiveView('active')}
            className={`text-xs sm:text-sm whitespace-nowrap active:scale-95 transition-all duration-150 ${activeView === 'active' ? 'bg-emerald-600' : ''}`}
          >
            Active
          </Button>
          <Button
            variant={activeView === 'completed' ? 'default' : 'outline'}
            onClick={() => setActiveView('completed')}
            className={`text-xs sm:text-sm whitespace-nowrap active:scale-95 transition-all duration-150 ${activeView === 'completed' ? 'bg-green-600' : ''}`}
          >
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden ml-1">Done</span>
          </Button>
        </div>

        {/* Filters */}
        <ProjectFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          userRole={currentUser.userLevel.name}
          userDepartment={(currentUser as any).department || ''}
        />

        {/* Projects List */}
        {!projects ? (
          <LoadingSkeleton />
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No projects found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or create a new project</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProjectsList 
              projects={filteredProjects as any}
              userRole={currentUser.userLevel.name}
              currentUserId={currentUser._id}
            />
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
