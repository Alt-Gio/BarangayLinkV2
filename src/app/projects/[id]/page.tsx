"use client";

import { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { ProjectTabs } from '@/components/projects/ProjectTabs';
import { ProjectOverview } from '@/components/projects/ProjectOverview';
import { ProjectTasks } from '@/components/projects/ProjectTasks';
import { ProjectEvents } from '@/components/projects/ProjectEvents';
import { ProjectTeam } from '@/components/projects/ProjectTeam';
import { ProjectSettings } from '@/components/projects/ProjectSettings';
import { useState } from 'react';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('overview');

  // Get current user with role
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Get project details
  const project = useQuery(api.productivity.getProjects, { limit: 100 })?.find(p => p._id === id);
  
  // Get project tasks
  const tasks = useQuery(api.productivity.getProjectTasks, { projectId: id as any });
  
  // Get project events (we'll need to create this)
  const events = useQuery(api.events.getProjectEvents, { projectId: id as any });
  
  // Get project team members
  const teamMembers = useQuery(api.users.getProjectTeamMembers, { projectId: id as any });

  if (!currentUser || !project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Check user permissions for this project
  const userRole = currentUser.userLevel.name;
  const canEdit = userRole === "ADMIN" || 
                  (userRole === "MANAGER" && project.department === currentUser.department) ||
                  (userRole === "BUILDER" && project.createdBy === currentUser._id);

  const canManageTasks = ["ADMIN", "MANAGER", "BUILDER"].includes(userRole);
  const canManageEvents = ["ADMIN", "MANAGER"].includes(userRole);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Project Header */}
        <ProjectHeader 
          project={project}
          currentUser={currentUser}
          canEdit={canEdit}
        />

        {/* Navigation Tabs */}
        <ProjectTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={userRole}
        />

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg">
          {activeTab === 'overview' && (
            <ProjectOverview 
              project={project}
              tasks={tasks || []}
              events={events || []}
              teamMembers={teamMembers || []}
            />
          )}
          
          {activeTab === 'tasks' && (
            <ProjectTasks 
              project={project}
              tasks={tasks || []}
              currentUser={currentUser}
              canManageTasks={canManageTasks}
            />
          )}
          
          {activeTab === 'events' && (
            <ProjectEvents 
              projectId={id as any}
              events={events || []}
              currentUser={currentUser}
              canManageEvents={canManageEvents}
            />
          )}
          
          {activeTab === 'team' && (
            <ProjectTeam 
              project={project}
              teamMembers={teamMembers || []}
              currentUser={currentUser}
              canEdit={canEdit}
            />
          )}
          
          {activeTab === 'settings' && canEdit && (
            <ProjectSettings 
              project={project}
              currentUser={currentUser}
              userRole={userRole}
            />
          )}
        </div>
      </div>
    </div>
  );
}
