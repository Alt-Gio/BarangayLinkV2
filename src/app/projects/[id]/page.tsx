"use client";

import { use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState } from 'react';
import { Id } from '../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectTaskProgress } from '@/components/projects/ProjectTaskProgress';
import { ProjectTaskManager } from '@/components/projects/ProjectTaskManager';
import { ProjectApprovalCard } from '@/components/projects/ProjectApprovalCard';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { 
  Edit, 
  Save, 
  X, 
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Flag,
  Target,
  Clock,
  Plus,
  Circle,
  Repeat,
  Zap,
  Sparkles,
  FolderOpen
} from 'lucide-react';

// Force dynamic rendering for project pages
export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  
  // ALL HOOKS MUST BE AT THE TOP (Rules of Hooks)
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editedData, setEditedData] = useState<any>({});
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  // Get current user with role
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Get project data
  const project = useQuery(api.productivity.getProjects, { limit: 100 })?.find(p => p._id === id);
  
  // Get project tasks (using the new task system)
  const tasks = useQuery(api.tasks.getProjectTasks, { projectId: id as any });
  
  // Get project events  
  const events = useQuery(api.events.getProjectEvents, { projectId: id as any });
  
  // Get project team members
  const teamMembers = useQuery(api.users.getProjectTeamMembers, { projectId: id as any });
  
  // Update mutation
  const updateProject = useMutation(api.projectsEnhanced.updateProject);
  
  // Task mutations
  const completeTask = useMutation(api.tasks.completeTask);
  const uncompleteTask = useMutation(api.tasks.uncompleteTask);

  // NOW we can do conditional logic and early returns
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  // Check user permissions
  const userRole = currentUser.userLevel.name;
  const canEdit = userRole === "ADMIN" || 
                  (userRole === "MANAGER" && project.department === (currentUser as any).department) ||
                  (userRole === "BUILDER" && project.createdBy === currentUser._id);

  // Handlers
  const handleEdit = (field: string, value: any) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleSave = async () => {
    try {
      await updateProject({
        projectId: project._id as Id<"projects">,
        updates: editedData,
      });
      setIsEditing(false);
      setEditedData({});
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  // Calculate stats
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const budgetUsed = project.spent || 0;
  const budgetTotal = project.budget || 1;
  const daysRemaining = project.endDate ? Math.ceil((project.endDate - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          
          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-gray-700 text-gray-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Project Title & Status */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedData.title ?? project.title}
                  onChange={(e) => handleEdit('title', e.target.value)}
                  className="text-3xl font-bold bg-gray-900 border-gray-700 text-white mb-4"
                  placeholder="Project Title"
                />
              ) : (
                <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
              )}
              
              {isEditing ? (
                <Textarea
                  value={editedData.description ?? project.description}
                  onChange={(e) => handleEdit('description', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  rows={3}
                  placeholder="Project Description"
                />
              ) : (
                <p className="text-gray-400">{project.description}</p>
              )}
            </div>

            {/* Progress Circle */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                  className="text-emerald-500 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Project Meta Info */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Department</div>
              <div className="text-white font-medium">{project.department}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Duration</div>
              <div className="text-white font-medium">
                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Budget</div>
              <div className="text-emerald-400 font-medium">₱{budgetTotal.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Progress</div>
              <div className="text-white font-medium">{progress}%</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Total Tasks
                  </div>
                  <div className="text-3xl font-bold text-white">{totalTasks}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {completedTasks} completed, {totalTasks - completedTasks} in progress
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Progress
                  </div>
                  <div className="text-3xl font-bold text-white">{progress}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {progress === 100 ? 'Completed!' : `${100 - progress}% remaining`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <DollarSign className="w-4 h-4" />
                    Budget Used
                  </div>
                  <div className="text-3xl font-bold text-white">₱{budgetUsed.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((budgetUsed / budgetTotal) * 100)}% of ₱{budgetTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    Days Remaining
                  </div>
                  <div className="text-3xl font-bold text-white">{daysRemaining}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Until {new Date(project.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Approval Card (if pending or has status) */}
            {project.approvalStatus && (
              <ProjectApprovalCard 
                project={project} 
                currentUser={currentUser}
                onApprovalComplete={() => window.location.reload()}
              />
            )}

            <div className="grid grid-cols-3 gap-6">
              {/* Project Details */}
              <Card className="col-span-2 bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Department</div>
                      <div className="text-white">{project.department}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Priority</div>
                      <Badge variant="outline" className="capitalize">{project.priority}</Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Start Date</div>
                      <div className="text-white">{new Date(project.startDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">End Date</div>
                      <div className="text-white">{new Date(project.endDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Description</div>
                    <div className="text-white">{project.description}</div>
                  </div>

                  {project.location && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Location</div>
                      <div className="text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {project.location}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {events && events.length > 0 ? (
                    <div className="space-y-3">
                      {events.slice(0, 3).map((event: any) => (
                        <div key={event._id} className="p-3 bg-gray-900/50 rounded-lg">
                          <div className="font-medium text-white">{event.title}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No upcoming events</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team Members */}
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-4 h-4" />
                  {teamMembers?.length || 0} members
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {/* Gamification Progress */}
            <ProjectTaskProgress projectId={id as Id<"projects">} />
            
            {/* Task Management */}
            <ProjectTaskManager projectId={id as Id<"projects">} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-emerald-500" />
                    Project Documents
                  </CardTitle>
                  <Button
                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {showDocumentUpload && (
                  <DocumentUpload
                    projectId={id as Id<"projects">}
                    onClose={() => setShowDocumentUpload(false)}
                    onUploadComplete={() => setShowDocumentUpload(false)}
                  />
                )}
                <DocumentList projectId={id as Id<"projects">} limit={50} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Event management interface will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Team management interface will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Project Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Settings interface will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
