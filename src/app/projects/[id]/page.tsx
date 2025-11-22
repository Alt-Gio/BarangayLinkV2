"use client";

import { useState, use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Id } from '../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectTaskProgress } from '@/components/projects/ProjectTaskProgress';
import { ProjectTasksTab } from '@/components/projects/ProjectTasksTab';
import { MilestoneManager } from '@/components/projects/MilestoneManager';
import { ProjectApprovalCard } from '@/components/projects/ProjectApprovalCard';
import { ProjectEventsTab } from '@/components/projects/ProjectEventsTab';
import { ProjectTeamTab } from '@/components/projects/ProjectTeamTab';
import { ProjectSettingsTab } from '@/components/projects/ProjectSettingsTab';
import { ProjectBudgetTab } from '@/components/projects/ProjectBudgetTab';
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
  FolderOpen,
  LayoutDashboard,
  Settings,
  CalendarDays,
  FileText,
  Download,
  BarChart3,
  Award,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Force dynamic rendering for project pages
export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  
  // Check if this is a special route (not a project ID)
  if (id === 'approval' || id === 'create') {
    return null; // Let Next.js handle the proper route
  }
  
  // ALL HOOKS MUST BE AT THE TOP (Rules of Hooks)
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editedData, setEditedData] = useState<any>({});
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();
  
  // Get project data
  const project = useQuery(api.productivity.getProjects, { limit: 100 })?.find(p => p._id === id);
  
  // Get project tasks (using the new task system)
  const tasks = useQuery(api.gamifiedTasks.getProjectTasks, { projectId: id as any });
  
  // Get project events  
  const events = useQuery(api.events.getProjectEvents, { projectId: id as any });
  
  // Get project team members
  const teamMembers = useQuery(api.users.getProjectTeamMembers, { projectId: id as any });
  
  // Update mutation
  const updateProject = useMutation(api.projects.updateProject);
  
  // Task mutations
  const completeTask = useMutation(api.tasks.completeTask);
  const uncompleteTask = useMutation(api.tasks.uncompleteTask);

  // Export comprehensive project report
  const handleExportReport = () => {
    if (!project || !tasks) {
      toast.error('Please wait for data to load');
      return;
    }

    // Calculate comprehensive statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress' || t.status === 'active').length;
    const todoTasks = tasks.filter((t: any) => t.status === 'todo' || t.status === 'pending').length;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';

    // Budget analysis
    const budgetUsedRate = project.budget > 0 ? ((budgetUsed / project.budget) * 100).toFixed(1) : '0.0';
    const budgetRemaining = project.budget - budgetUsed;

    // Timeline analysis
    const daysElapsed = Math.ceil((Date.now() - project.startDate) / (1000 * 60 * 60 * 24));
    const totalProjectDays = Math.ceil((project.endDate - project.startDate) / (1000 * 60 * 60 * 24));
    const timeProgress = totalProjectDays > 0 ? ((daysElapsed / totalProjectDays) * 100).toFixed(1) : '0.0';

    // Team members
    const totalMembers = teamMembers?.length || 0;

    // Priority stats
    const highPriority = tasks.filter((t: any) => t.priority === 'high' || t.priority === 'critical').length;

    // Generate HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project.title} - Project Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 50px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border-radius: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #10b981;
          }
          h1 {
            color: #10b981;
            margin-bottom: 10px;
            font-size: 36px;
            font-weight: 700;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .report-date {
            color: #9ca3af;
            font-size: 14px;
          }
          h2 {
            color: #1f2937;
            border-left: 5px solid #10b981;
            padding-left: 15px;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 24px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .kpi-card {
            padding: 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            color: white;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            transition: transform 0.3s ease;
          }
          .kpi-card:hover {
            transform: translateY(-5px);
          }
          .kpi-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .kpi-value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .kpi-subtitle {
            font-size: 12px;
            opacity: 0.8;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            background: #f9fafb;
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            color: #1f2937;
            font-size: 16px;
            font-weight: 600;
          }
          .progress-bar-container {
            background: #e5e7eb;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
            position: relative;
          }
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            transition: width 0.3s ease;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-success { background: #d1fae5; color: #065f46; }
          .badge-warning { background: #fef3c7; color: #92400e; }
          .badge-danger { background: #fee2e2; color: #991b1b; }
          .badge-info { background: #dbeafe; color: #1e40af; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
          }
          tbody tr:hover {
            background: #f9fafb;
          }
          .summary-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 5px solid #f59e0b;
          }
          .summary-box h3 {
            color: #92400e;
            margin-top: 0;
            margin-bottom: 15px;
          }
          .summary-box p {
            color: #78350f;
            line-height: 1.6;
            margin: 0;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; padding: 20px; }
            .kpi-card:hover { transform: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${project.title}</h1>
            <div class="subtitle">${project.department} Department</div>
            <div class="report-date">Report Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <h2>📈 Project Overview</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Overall Progress</div>
              <div class="kpi-value">${progress}%</div>
              <div class="kpi-subtitle">${completedTasks} of ${totalTasks} tasks</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Budget Used</div>
              <div class="kpi-value">₱${budgetUsed.toLocaleString()}</div>
              <div class="kpi-subtitle">${budgetUsedRate}% of ₱${project.budget.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Time Progress</div>
              <div class="kpi-value">${timeProgress}%</div>
              <div class="kpi-subtitle">${daysElapsed} of ${totalProjectDays} days</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Team Members</div>
              <div class="kpi-value">${totalMembers}</div>
              <div class="kpi-subtitle">Active collaborators</div>
            </div>
          </div>

          <h2>📋 Project Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Department</div>
              <div class="info-value">${project.department}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Priority</div>
              <div class="info-value">${project.priority?.toUpperCase() || 'MEDIUM'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Start Date</div>
              <div class="info-value">${new Date(project.startDate).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">End Date</div>
              <div class="info-value">${new Date(project.endDate).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Days Remaining</div>
              <div class="info-value">${daysRemaining} days</div>
            </div>
            <div class="info-item">
              <div class="info-label">Budget Remaining</div>
              <div class="info-value">₱${budgetRemaining.toLocaleString()}</div>
            </div>
          </div>

          <h2>✅ Task Status Breakdown</h2>
          <div class="kpi-grid">
            <div class="info-item" style="padding: 15px; background: #f9fafb; border-radius: 8px;">
              <div class="info-label">Completed</div>
              <div class="info-value" style="color: #10b981;">${completedTasks}</div>
            </div>
            <div class="info-item" style="padding: 15px; background: #f9fafb; border-radius: 8px;">
              <div class="info-label">In Progress</div>
              <div class="info-value" style="color: #f59e0b;">${inProgressTasks}</div>
            </div>
            <div class="info-item" style="padding: 15px; background: #f9fafb; border-radius: 8px;">
              <div class="info-label">To Do</div>
              <div class="info-value" style="color: #6b7280;">${todoTasks}</div>
            </div>
            <div class="info-item" style="padding: 15px; background: #f9fafb; border-radius: 8px;">
              <div class="info-label">High Priority</div>
              <div class="info-value" style="color: #ef4444;">${highPriority}</div>
            </div>
          </div>

          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${completionRate}%">
              ${completionRate}% Complete
            </div>
          </div>

          ${project.location ? `
          <h2>📍 Location</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Project Location</div>
              <div class="info-value">${project.location}</div>
            </div>
          </div>
          ` : ''}

          <h2>📝 Description</h2>
          <p style="line-height: 1.8; color: #4b5563; padding: 20px; background: #f9fafb; border-radius: 8px;">
            ${project.description}
          </p>

          <div class="summary-box">
            <h3>📊 Project Summary</h3>
            <p>
              The <strong>${project.title}</strong> project is currently at <strong>${progress}% completion</strong> with 
              <strong>${completedTasks}</strong> out of <strong>${totalTasks}</strong> tasks completed. 
              The project has <strong>${daysRemaining} days remaining</strong> until the target completion date of 
              <strong>${new Date(project.endDate).toLocaleDateString()}</strong>. 
              Budget utilization stands at <strong>₱${budgetUsed.toLocaleString()}</strong> (<strong>${budgetUsedRate}%</strong> of total budget), 
              with <strong>₱${budgetRemaining.toLocaleString()}</strong> remaining. 
              The project involves <strong>${totalMembers} team members</strong> working collaboratively under the 
              <strong>${project.department}</strong> department.
            </p>
          </div>

          <div class="footer">
            <p><strong>Barangay Management System</strong></p>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>This is an official project report</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open report in new window and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      toast.success('Report generated! Print dialog opening...');
    } else {
      toast.error('Please allow popups to generate report');
    }
  };

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
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-800/95 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-700/50 shadow-xl">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-semibold text-white truncate flex-1 mx-3">{project.title}</h1>
          <Button
            onClick={handleExportReport}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        
        {/* Enhanced Header - Desktop Only */}
        <div className="hidden md:block bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            
            <div className="flex gap-3">
              {/* Export Report Button - Always visible */}
              <Button
                onClick={handleExportReport}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>

              {canEdit && (
                <>
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="border-gray-700 text-gray-300 hover:bg-gray-700/50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Project
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
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

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <Card className="bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border-emerald-700/50 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm mb-3 font-medium">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span>Total Tasks</span>
                  </div>
                  <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">{totalTasks}</div>
                  <div className="text-xs text-gray-400 hidden md:block">
                    {completedTasks} completed • {totalTasks - completedTasks} in progress
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-700/50 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-3 font-medium">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span>Progress</span>
                  </div>
                  <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">{progress}%</div>
                  <div className="text-xs text-gray-400 hidden md:block">
                    {progress === 100 ? '✅ Completed!' : `${100 - progress}% remaining`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border-yellow-700/50 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm mb-3 font-medium">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span>Budget Used</span>
                  </div>
                  <div className="text-xl md:text-4xl font-bold text-white mb-1 md:mb-2">₱{budgetUsed.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 hidden md:block">
                    {Math.round((budgetUsed / budgetTotal) * 100)}% of ₱{budgetTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-700/50 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-purple-400 text-sm mb-3 font-medium">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span>Days Remaining</span>
                  </div>
                  <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">{daysRemaining}</div>
                  <div className="text-xs text-gray-400 hidden md:block">
                    Until {new Date(project.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          {/* Mobile Tabs - Horizontal Scroll */}
          <div className="md:hidden">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <TabsList className="inline-flex min-w-full bg-gray-800/50 border border-gray-700/50 p-2 rounded-xl gap-2">
                <TabsTrigger 
                  value="overview"
                  className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 transition-all duration-200 rounded-lg font-medium text-sm px-4 py-2"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="milestones"
                  className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 transition-all duration-200 rounded-lg font-medium text-sm px-4 py-2"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Milestones
                </TabsTrigger>
                <TabsTrigger 
                  value="documents"
                  className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 transition-all duration-200 rounded-lg font-medium text-sm px-4 py-2"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="events"
                  className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 transition-all duration-200 rounded-lg font-medium text-sm px-4 py-2"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Events
                </TabsTrigger>
                <TabsTrigger 
                  value="team"
                  className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 transition-all duration-200 rounded-lg font-medium text-sm px-4 py-2"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team
                </TabsTrigger>
                <TabsTrigger 
                  value="budget"
                  className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 transition-all duration-200 rounded-lg font-medium text-sm px-4 py-2"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Budget
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="flex-shrink-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 transition-all duration-200 rounded-lg font-medium text-sm px-4 py-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Desktop Tabs - Grid Layout */}
          <TabsList className="hidden md:grid w-full grid-cols-7 bg-gray-800/50 border border-gray-700/50 p-2 rounded-xl gap-2">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 hover:scale-105 transition-all duration-200 cursor-pointer rounded-lg font-medium"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="milestones"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 hover:scale-105 transition-all duration-200 cursor-pointer rounded-lg font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              Milestones
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 hover:scale-105 transition-all duration-200 cursor-pointer rounded-lg font-medium"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="events"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 hover:scale-105 transition-all duration-200 cursor-pointer rounded-lg font-medium"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger 
              value="team"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 hover:scale-105 transition-all duration-200 cursor-pointer rounded-lg font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger 
              value="budget"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 hover:scale-105 transition-all duration-200 cursor-pointer rounded-lg font-medium"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Budget
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 hover:scale-105 transition-all duration-200 cursor-pointer rounded-lg font-medium"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
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
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    Upcoming Project Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const now = Date.now();
                    const upcomingEvents = events?.filter((event: any) => event.startDate > now)
                      .sort((a: any, b: any) => a.startDate - b.startDate)
                      .slice(0, 3) || [];
                    
                    return upcomingEvents.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingEvents.map((event: any) => (
                          <div key={event._id} className="p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors border border-gray-700/50">
                            <div className="font-medium text-white">{event.title}</div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No upcoming events</p>
                        <p className="text-gray-600 text-xs mt-1">Create events in the Events tab</p>
                      </div>
                    );
                  })()}
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

          <TabsContent value="milestones" className="space-y-6">
            <MilestoneManager projectId={id as Id<"projects">} />
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
            <ProjectEventsTab projectId={id as Id<"projects">} project={project} />
          </TabsContent>

          <TabsContent value="team">
            <ProjectTeamTab 
              projectId={id as Id<"projects">} 
              project={project}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="budget">
            <ProjectBudgetTab 
              projectId={id as Id<"projects">} 
              projectBudget={project.budget || 0}
              project={project}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="settings">
            <ProjectSettingsTab 
              projectId={id as Id<"projects">} 
              project={project}
              currentUser={currentUser}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
