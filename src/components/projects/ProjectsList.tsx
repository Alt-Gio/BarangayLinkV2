"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Id } from '../../../convex/_generated/dataModel';

interface Project {
  _id: Id<"projects">;
  title: string;
  description: string;
  status: string;
  department: string;
  startDate: number;
  endDate: number;
  budget?: number;
  progress: number;
  createdBy: Id<"users">;
  creator?: {
    _id: Id<"users">;
    name: string;
    imageUrl?: string;
  };
}

interface ProjectsListProps {
  projects: Project[];
  userRole: string;
  currentUserId: Id<"users">;
}

export function ProjectsList({ projects, userRole, currentUserId }: ProjectsListProps) {
  const [approvingProject, setApprovingProject] = useState<string | null>(null);
  
  // We'll need to add this function to the roleBasedAccess.ts file
  const approveProject = useMutation(api.roleBasedAccess.approveProject);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'active':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const canApproveProjects = userRole === "MANAGER" || userRole === "ADMIN";

  const handleApproval = async (projectId: Id<"projects">, approved: boolean) => {
    setApprovingProject(projectId);
    try {
      await approveProject({
        projectId,
        approved,
        comments: approved ? "Project approved" : "Project needs revision"
      });
    } catch (error) {
      console.error("Error approving project:", error);
      alert("Error processing approval: " + (error as Error).message);
    } finally {
      setApprovingProject(null);
    }
  };

  const isOverdue = (endDate: number) => {
    return Date.now() > endDate;
  };

  const getDaysRemaining = (endDate: number) => {
    const diff = endDate - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!projects.length) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 sm:p-12 text-center border border-gray-700/50">
        <div className="bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-2">No Projects Found</h3>
        <p className="text-sm text-gray-500">
          {userRole === "WORKER" 
            ? "You haven't been assigned to any projects yet." 
            : "Create your first project to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {projects.map((project) => {
        const daysRemaining = getDaysRemaining(project.endDate);
        const isProjectOverdue = isOverdue(project.endDate) && project.status !== 'completed';
        
        return (
          <div key={project._id} className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
            {/* Project Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2">{project.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`${getStatusColor(project.status)} text-xs shadow-md`} variant="outline">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                      <span className="hidden sm:inline">{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                    </div>
                  </Badge>
                  {isProjectOverdue && (
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 text-xs shadow-md animate-pulse">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Project Details */}
            <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2">{project.description}</p>
            
            <div className="grid grid-cols-1 gap-2 mb-4">
              <div className="flex justify-between text-xs sm:text-sm bg-gray-800/50 rounded-lg p-2">
                <span className="text-gray-400">Department:</span>
                <span className="text-white font-medium truncate ml-2">{project.department}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm bg-gray-800/50 rounded-lg p-2">
                <span className="text-gray-400">Progress:</span>
                <span className="text-emerald-400 font-semibold">{project.progress}%</span>
              </div>
              {project.budget && (
                <div className="flex justify-between text-xs sm:text-sm bg-gray-800/50 rounded-lg p-2">
                  <span className="text-gray-400">Budget:</span>
                  <span className="text-green-400 font-semibold">₱{project.budget.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs sm:text-sm bg-gray-800/50 rounded-lg p-2">
                <span className="text-gray-400">Timeline:</span>
                <span className={`font-medium ${isProjectOverdue ? 'text-red-400' : 'text-white'}`}>
                  {daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days overdue`}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-2.5 mb-4 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  project.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  project.status === 'active' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  project.status === 'planning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                  'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
              <Link 
                href={`/projects/${project._id}`}
                className="text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1 group"
              >
                View Details
                <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              {/* Approval Actions for MANAGER role */}
              {canApproveProjects && project.status === "planning" && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-xs shadow-md"
                    onClick={() => handleApproval(project._id, true)}
                    disabled={approvingProject === project._id}
                  >
                    {approvingProject === project._id ? "..." : "Approve"}
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-xs shadow-md"
                    onClick={() => handleApproval(project._id, false)}
                    disabled={approvingProject === project._id}
                  >
                    {approvingProject === project._id ? "..." : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
