"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { ProjectFilters } from '@/components/projects/ProjectFilters';

export default function ProjectsPage() {
  const { user } = useUser();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    department: "all"
  });

  // Get current user with role
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Get projects based on user role (uses your existing function)
  const projects = useQuery(api.productivity.getProjects, {
    status: filters.status === "all" ? undefined : filters.status,
    department: filters.department === "all" ? undefined : filters.department,
    limit: 50
  });

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

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-gray-400">
              {currentUser.userLevel.name} - {currentUser.department || 'Unassigned'} Department
            </p>
          </div>
          
          {canCreateProjects && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
            </button>
          )}
        </div>

        {/* Filters */}
        <ProjectFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          userRole={currentUser.userLevel.name}
          userDepartment={currentUser.department || ''}
        />

        {/* Create Project Form Modal */}
        {showCreateForm && (
          <CreateProjectForm
            onClose={() => setShowCreateForm(false)}
            userRole={currentUser.userLevel.name}
            userDepartment={currentUser.department || ''}
          />
        )}

        {/* Projects List */}
        <ProjectsList 
          projects={projects || []}
          userRole={currentUser.userLevel.name}
          currentUserId={currentUser._id}
        />
      </div>
    </div>
  );
}
