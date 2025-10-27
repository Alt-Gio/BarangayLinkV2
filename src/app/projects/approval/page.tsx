"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Target,
  TrendingUp,
  Clock,
  FileText,
  MessageSquare,
  Shield,
  Menu
} from 'lucide-react';

export default function ProjectApprovalPage() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();
  
  // Get pending projects
  const pendingProjects = useQuery(api.projects.getPendingApprovals as any);
  
  // Review mutation
  const reviewProject = useMutation(api.projects.reviewProject);

  const handleReview = async (action: 'approve' | 'reject' | 'request_revision') => {
    if (!selectedProject) return;
    
    if (action !== 'approve' && !feedback.trim()) {
      alert('Please provide feedback for rejection or revision request');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewProject({
        projectId: selectedProject._id,
        action,
        feedback: feedback.trim() || undefined,
      });

      alert(`Project ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back for revision'} successfully!`);
      setSelectedProject(null);
      setFeedback('');
    } catch (error) {
      console.error('Error reviewing project:', error);
      alert('Failed to review project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser.userLevel?.name !== 'ADMIN' && currentUser.userLevel?.name !== 'MANAGER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800/50 border-gray-700/50 max-w-md">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">Only Managers and Admins can access project approvals</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        userRole={currentUser?.userLevel?.name || 'WORKER'}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Project Approval</h1>
          <div className="w-9" />
        </div>

        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  Project Approval
                </h1>
                <p className="text-gray-400 mt-2">Review and approve pending project proposals</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-2">
                {pendingProjects?.length || 0} Pending
              </Badge>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Projects List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Pending Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {pendingProjects && pendingProjects.length > 0 ? (
                  pendingProjects.map((project: any) => (
                    <button
                      key={project._id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedProject?._id === project._id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white line-clamp-1">{project.title}</h3>
                        <Badge className={getPriorityColor(project.priority)} variant="outline">
                          {project.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{project.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(project._creationTime).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No pending projects</p>
                    <p className="text-sm text-gray-500 mt-2">All projects have been reviewed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Details & Review */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProject ? (
              <>
                {/* Project Information */}
                <Card className="bg-gray-800/50 border-gray-700/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-2xl mb-2">{selectedProject.title}</CardTitle>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={getPriorityColor(selectedProject.priority)}>
                            {selectedProject.priority} Priority
                          </Badge>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {selectedProject.department}
                          </Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                            Level {selectedProject.projectLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Project Description
                      </h4>
                      <p className="text-white">{selectedProject.description}</p>
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                          <DollarSign className="w-4 h-4" />
                          Budget
                        </div>
                        <div className="text-white font-semibold">
                          ₱{selectedProject.budget?.toLocaleString()}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                          <Calendar className="w-4 h-4" />
                          Start Date
                        </div>
                        <div className="text-white font-semibold">
                          {new Date(selectedProject.startDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                          <Clock className="w-4 h-4" />
                          End Date
                        </div>
                        <div className="text-white font-semibold">
                          {new Date(selectedProject.endDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                          <TrendingUp className="w-4 h-4" />
                          Duration
                        </div>
                        <div className="text-white font-semibold">
                          {Math.ceil((selectedProject.endDate - selectedProject.startDate) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {selectedProject.location && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </h4>
                        <p className="text-white">{selectedProject.location}</p>
                      </div>
                    )}

                    {/* Success Criteria */}
                    {selectedProject.successCriteria && selectedProject.successCriteria.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Success Criteria
                        </h4>
                        <div className="space-y-2">
                          {selectedProject.successCriteria.map((criteria: any, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-gray-900/50 rounded-lg">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-white">{criteria.criterion}</p>
                                {criteria.targetValue && (
                                  <p className="text-sm text-gray-400 mt-1">Target: {criteria.targetValue}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Project Milestones
                        </h4>
                        <div className="space-y-2">
                          {selectedProject.milestones.map((milestone: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-900/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-white font-medium">{milestone.title}</h5>
                                <span className="text-sm text-gray-400">
                                  {new Date(milestone.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">{milestone.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedProject.tags && selectedProject.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.tags.map((tag: string, index: number) => (
                            <Badge key={index} className="bg-gray-700/50 text-gray-300 border-gray-600/20">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Review Section */}
                <Card className="bg-gray-800/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-500" />
                      Review Decision
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Feedback / Comments (Required for rejection or revision)
                      </label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide feedback, suggestions, or reasons for your decision..."
                        rows={4}
                        className="bg-gray-900/50 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleReview('approve')}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Project
                      </Button>
                      
                      <Button
                        onClick={() => handleReview('request_revision')}
                        disabled={isSubmitting || !feedback.trim()}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Request Revision
                      </Button>
                      
                      <Button
                        onClick={() => handleReview('reject')}
                        disabled={isSubmitting || !feedback.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Project
                      </Button>
                    </div>

                    <p className="text-sm text-gray-400 text-center">
                      Your decision will be recorded and the project creator will be notified
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Project</h3>
                  <p className="text-gray-400">Choose a pending project from the list to review</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
