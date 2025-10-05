"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectWizard } from '@/components/projects/ProjectWizard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/layout/Sidebar';
import { Plus, Clock, CheckCircle2, AlertCircle, Menu } from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [filters, setFilters] = useState({
    status: "all",
    department: "all"
  });

  // Get current user with role
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Use existing API (enhanced API will be available after running: npx convex dev)
  const projects = useQuery(api.productivity.getProjects, {
    status: filters.status === "all" ? undefined : filters.status,
    department: filters.department === "all" ? undefined : filters.department,
    limit: 50
  });

  // Filter projects by activeView locally for now
  const filteredProjects = projects?.filter((p: any) => {
    if (activeView === 'all') return true;
    if (activeView === 'pending') return p.status === 'pending_approval' || p.status === 'planning';
    if (activeView === 'active') return p.status === 'active';
    if (activeView === 'completed') return p.status === 'completed';
    return true;
  }) || [];

  // Calculate pending approvals from filtered data (for managers/admins)
  const pendingApprovals = currentUser?.userLevel?.name && ["MANAGER", "ADMIN"].includes(currentUser.userLevel.name)
    ? projects?.filter((p: any) => p.status === 'pending_approval' || p.status === 'planning') || []
    : [];

  // Check if user can create projects
  const canCreateProjects = currentUser?.userLevel?.name && 
    ["ADMIN", "MANAGER", "BUILDER"].includes(currentUser.userLevel.name);

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

        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-gray-400">
              {currentUser.userLevel.name} - {(currentUser as any).department || 'Unassigned'} Department
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Pending Approvals Badge for Managers/Admins */}
            {pendingApprovals && pendingApprovals.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setActiveView('pending')}
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {pendingApprovals.length} Pending Approval
              </Button>
            )}

            {canCreateProjects && (
              <Button
                onClick={() => setShowWizard(true)}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        </div>

        {/* Quick View Tabs */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveView('all')}
            className={activeView === 'all' ? 'bg-blue-600' : ''}
          >
            All Projects
          </Button>
          <Button
            variant={activeView === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveView('pending')}
            className={activeView === 'pending' ? 'bg-yellow-600' : ''}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending Approval
          </Button>
          <Button
            variant={activeView === 'active' ? 'default' : 'outline'}
            onClick={() => setActiveView('active')}
            className={activeView === 'active' ? 'bg-emerald-600' : ''}
          >
            Active
          </Button>
          <Button
            variant={activeView === 'completed' ? 'default' : 'outline'}
            onClick={() => setActiveView('completed')}
            className={activeView === 'completed' ? 'bg-green-600' : ''}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Completed
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
        <ProjectsList 
          projects={filteredProjects as any}
          userRole={currentUser.userLevel.name}
          currentUserId={currentUser._id}
        />
          </div>
        </div>
      </div>
    </div>
  );
}
