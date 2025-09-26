"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Calendar,
  Users,
  Target,
  Clock,
  BarChart3,
  Search,
  FolderOpen,
  ListTodo,
  TrendingUp,
  Menu,
  X,
  Bell,
  LayoutDashboard,
  CheckSquare,
  ArrowRight,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignInButton } from '@clerk/nextjs';

interface ProjectFormData {
  title: string;
  description: string;
  department: string;
  startDate: string;
  endDate: string;
  budget: string;
}

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  priority: string;
  dueDate: string;
  estimatedHours: string;
  assignedTo: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Overview',
    icon: LayoutDashboard,
    href: '#dashboard',
  },
  {
    id: 'projects',
    label: 'All Projects',
    icon: FolderOpen,
    href: '#projects',
  },
  {
    id: 'tasks',
    label: 'Task Management',
    icon: CheckSquare,
    href: '#tasks',
  },
  {
    id: 'calendar',
    label: 'Calendar View',
    icon: Calendar,
    href: '#calendar',
  },
  {
    id: 'analytics',
    label: 'Reports & Analytics',
    icon: BarChart3,
    href: '#analytics',
  },
  {
    id: 'team',
    label: 'Team Management',
    icon: Users,
    href: '#team',
  },
];

export default function ProductivityPage() {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Project form state
  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    title: '',
    description: '',
    department: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  // Task form state
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    assignedTo: '',
  });

  // Convex queries and mutations
  const currentUser = useQuery(
    api.liveblocks.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const projects = useQuery(api.productivity.getProjects, {
    department: departmentFilter === "all" ? undefined : departmentFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const analytics = useQuery(api.productivity.getDashboardAnalytics, {
    department: departmentFilter === "all" ? undefined : departmentFilter,
    userId: currentUser?._id,
  });

  const activeUsers = useQuery(api.liveblocks.getActiveUsers);

  const createProject = useMutation(api.productivity.createProject);
  const createTask = useMutation(api.productivity.createTask);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading productivity dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">BarangayLink Productivity</CardTitle>
            <CardDescription className="text-lg text-gray-400">
              Sign in to access project management and task tracking tools
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <SignInButton mode="modal">
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                <Users className="w-5 h-5 mr-2" />
                Sign In to Continue
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle project creation
  const handleCreateProject = async () => {
    if (!currentUser?._id) return;
    
    try {
      await createProject({
        title: projectForm.title,
        description: projectForm.description,
        department: projectForm.department,
        startDate: new Date(projectForm.startDate).getTime(),
        endDate: new Date(projectForm.endDate).getTime(),
        budget: parseFloat(projectForm.budget) || undefined,
      });
      
      // Reset form and close dialog
      setProjectForm({
        title: '',
        description: '',
        department: '',
        startDate: '',
        endDate: '',
        budget: '',
      });
      setIsProjectDialogOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  // Handle task creation
  const handleCreateTask = async () => {
    if (!currentUser?._id || !taskForm.assignedTo) return;
    
    try {
      await createTask({
        projectId: taskForm.projectId ? taskForm.projectId as any : undefined,
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority === 'critical' ? 'urgent' : taskForm.priority as 'low' | 'medium' | 'high' | 'urgent',
        assignedTo: taskForm.assignedTo as any,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : undefined,
        estimatedHours: parseFloat(taskForm.estimatedHours) || undefined,
      });
      
      // Reset form and close dialog
      setTaskForm({
        title: '',
        description: '',
        projectId: '',
        priority: 'medium',
        dueDate: '',
        estimatedHours: '',
        assignedTo: '',
      });
      setIsTaskDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Navigation component
  const NavigationItem = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;

    return (
      <button
        onClick={() => setActiveSection(item.id)}
        className={cn(
          "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors w-full text-left",
          isActive 
            ? "bg-green-900/20 text-green-300 border-r-2 border-green-500" 
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        )}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="ml-3 inline-block py-0.5 px-2 text-xs bg-green-600 text-white rounded-full">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-gray-800 shadow-lg transform transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Dashboard Info */}
          <div className="flex-shrink-0 px-4 py-6 border-b border-gray-700">
            <div className="flex items-center mb-4">
              <Building2 className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <span className="text-xl font-bold text-white">BarangayLink</span>
                <p className="text-sm text-green-400 font-medium">Productivity Hub</p>
              </div>
            </div>

            {/* Quick Stats */}
            {analytics && (
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{analytics.projectStats.total}</div>
                  <div className="text-xs text-gray-400">Projects</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{analytics.taskStats.total}</div>
                  <div className="text-xs text-gray-400">Tasks</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map(item => (
              <NavigationItem key={item.id} item={item} />
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 border-t border-gray-700 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-400">Productivity Manager</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-gray-800 border-b border-gray-700 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-400 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-white">Productivity Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white">
                <Search className="h-5 w-5" />
              </button>
              <button className="text-gray-400 hover:text-white">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-900">
          <div className="p-6">{renderActiveSection()}</div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed top-4 right-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function renderActiveSection() {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardSection();
      case 'projects':
        return renderProjectsSection();
      case 'tasks':
        return renderTasksSection();
      case 'calendar':
        return renderCalendarSection();
      case 'analytics':
        return renderAnalyticsSection();
      case 'team':
        return renderTeamSection();
      default:
        return renderDashboardSection();
    }
  }

  function renderDashboardSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <div className="flex gap-2">
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">Create New Project</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Set up a new barangay project or community event with detailed planning
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Project Title *</label>
                    <Input
                      placeholder="e.g., Community Health Program, Infrastructure Development"
                      value={projectForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectForm({ ...projectForm, title: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Description *</label>
                    <Textarea
                      placeholder="Describe the project objectives, scope, and expected outcomes..."
                      value={projectForm.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectForm({ ...projectForm, description: e.target.value })}
                      rows={4}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Department *</label>
                      <Select value={projectForm.department} onValueChange={(value: string) => setProjectForm({ ...projectForm, department: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="health">Health Services</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="social_services">Social Services</SelectItem>
                          <SelectItem value="environment">Environment</SelectItem>
                          <SelectItem value="governance">Governance</SelectItem>
                          <SelectItem value="disaster_management">Disaster Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Budget (Optional)</label>
                      <Input
                        type="number"
                        placeholder="Enter budget amount"
                        value={projectForm.budget}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectForm({ ...projectForm, budget: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Start Date *</label>
                      <Input
                        type="date"
                        value={projectForm.startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Target End Date *</label>
                      <Input
                        type="date"
                        value={projectForm.endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Cancel
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleCreateProject}
                      disabled={!projectForm.title || !projectForm.description || !projectForm.department || !projectForm.startDate || !projectForm.endDate}
                    >
                      Create Project
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <ListTodo className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">Create New Task</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Assign a new task to a team member with detailed specifications
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Task Title *</label>
                    <Input
                      placeholder="e.g., Conduct community survey, Review project proposal"
                      value={taskForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Description *</label>
                    <Textarea
                      placeholder="Provide detailed task instructions and requirements..."
                      value={taskForm.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTaskForm({ ...taskForm, description: e.target.value })}
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Project (Optional)</label>
                      <Select value={taskForm.projectId} onValueChange={(value: string) => setTaskForm({ ...taskForm, projectId: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="">No Project (Standalone Task)</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Priority *</label>
                      <Select value={taskForm.priority} onValueChange={(value: string) => setTaskForm({ ...taskForm, priority: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Assign To *</label>
                      <Select value={taskForm.assignedTo} onValueChange={(value: string) => setTaskForm({ ...taskForm, assignedTo: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {activeUsers?.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name} - {user.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Due Date (Optional)</label>
                      <Input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Estimated Hours (Optional)</label>
                    <Input
                      type="number"
                      placeholder="Estimated time to complete"
                      value={taskForm.estimatedHours}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Cancel
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleCreateTask}
                      disabled={!taskForm.title || !taskForm.description || !taskForm.assignedTo}
                    >
                      Create Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Projects</p>
                    <p className="text-3xl font-bold text-white">{analytics.projectStats.total}</p>
                  </div>
                  <FolderOpen className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  {analytics.projectStats.active} active, {analytics.projectStats.planning} planning
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                    <p className="text-3xl font-bold text-white">{analytics.taskStats.total}</p>
                  </div>
                  <ListTodo className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  {analytics.taskStats.completed} completed, {analytics.taskStats.inProgress} in progress
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Budget</p>
                    <p className="text-3xl font-bold text-white">₱{analytics.totalBudget.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Across all active projects
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Overdue Tasks</p>
                    <p className="text-3xl font-bold text-white">{analytics.taskStats.overdue}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  function renderProjectsSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">All Projects</h2>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsProjectDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={departmentFilter} onValueChange={(value: string) => setDepartmentFilter(value)}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="health">Health Services</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="social_services">Social Services</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="governance">Governance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects?.filter(project => 
            searchQuery === "" || 
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((project) => (
            <Card key={project._id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-white leading-tight">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-2 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Badge className={getStatusColor(project.status)} variant="outline">
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                  <div className="text-sm text-gray-400 font-medium">
                    {project.department}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      Start: {new Date(project.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      End: {new Date(project.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {project.budget && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Budget:</span>
                      <span className="font-semibold text-green-400">₱{project.budget.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-700">
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => {
                        window.location.href = `/productivity/project/${project._id}`;
                      }}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Details & Tasks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {projects?.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Projects Found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first barangay project or community event.</p>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsProjectDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderTasksSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Task Management</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Task management interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderCalendarSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Calendar View</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Calendar view coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAnalyticsSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Advanced analytics coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderTeamSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Team Management</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Team management interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
