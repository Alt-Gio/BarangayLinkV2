"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Check, X, Save, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ProjectHeaderProps {
  project: any;
  currentUser: any;
  canEdit: boolean;
}

export function ProjectHeader({ project, currentUser, canEdit }: ProjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: project.title,
    description: project.description,
    budget: project.budget?.toString() || '',
    startDate: new Date(project.startDate).toISOString().split('T')[0],
    endDate: new Date(project.endDate).toISOString().split('T')[0],
  });
  
  const updateProject = useMutation(api.projects.updateProjectDetails);
  const approveProject = useMutation(api.projects.approveProject);
  
  // Currency formatting function
  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    const formatted = parseInt(numericValue).toLocaleString('en-PH');
    return `₱${formatted}`;
  };
  
  const handleBudgetChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setEditForm({
      ...editForm,
      budget: numericValue
    });
  };
  
  const handleSaveProject = async () => {
    try {
      await updateProject({
        projectId: project._id,
        title: editForm.title,
        description: editForm.description,
        budget: parseFloat(editForm.budget) || undefined,
        startDate: new Date(editForm.startDate).getTime(),
        endDate: new Date(editForm.endDate).getTime(),
      });
      setIsEditing(false);
    } catch (error) {
      alert("Error updating project: " + error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-900/20 text-yellow-400 border-yellow-700';
      case 'active': return 'bg-blue-900/20 text-blue-400 border-blue-700';
      case 'completed': return 'bg-green-900/20 text-green-400 border-green-700';
      case 'cancelled': return 'bg-red-900/20 text-red-400 border-red-700';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!canEdit) return;
    setIsApproving(true);
    try {
      await approveProject({
        projectId: project._id,
        approved,
        comments: approved ? "Project approved" : "Project needs revision"
      });
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/projects" 
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Projects
        </Link>
        
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSaveProject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Project
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white text-xl font-bold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Budget</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">₱</span>
                    <Input
                      value={editForm.budget ? parseInt(editForm.budget).toLocaleString('en-PH') : ''}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                  <Input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-white">{project.title}</h1>
                <Badge className={getStatusColor(project.status)} variant="outline">
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
                
                {/* Approval Actions for MANAGER/ADMIN when project is in planning */}
                {project.status === 'planning' && ["MANAGER", "ADMIN"].includes(currentUser.userLevel.name) && (
                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproval(true)}
                      disabled={isApproving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleApproval(false)}
                      disabled={isApproving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-gray-300 text-lg mb-4">{project.description}</p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Department:</span>
                  <p className="text-white font-medium">{project.department}</p>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <p className="text-white font-medium">
                    {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Budget:</span>
                  <p className="text-green-400 font-medium">
                    {project.budget ? `₱${project.budget.toLocaleString('en-PH')}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Progress:</span>
                  <p className="text-white font-medium">{project.progress}%</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress Circle */}
        {!isEditing && (
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-700"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-green-500"
                  strokeWidth="3"
                  strokeDasharray={`${project.progress}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{project.progress}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
