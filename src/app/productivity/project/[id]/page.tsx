"use client";

import { useState, use } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  User,
  Menu,
  X,
  Bell,
  LayoutDashboard,
  CheckSquare,
  FileText,
  Plus,
  Search,
  Target,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Project Overview',
    icon: LayoutDashboard,
    href: '#overview',
  },
  {
    id: 'tasks',
    label: 'Tasks & Progress',
    icon: CheckSquare,
    href: '#tasks',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Calendar,
    href: '#timeline',
  },
  {
    id: 'budget',
    label: 'Budget & Resources',
    icon: DollarSign,
    href: '#budget',
  },
  {
    id: 'team',
    label: 'Team Members',
    icon: Users,
    href: '#team',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    href: '#documents',
  },
];

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Get current user from Convex
  const currentUser = useQuery(
    api.liveblocks.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get project tasks
  const tasks = useQuery(api.productivity.getProjectTasks, { projectId: id });
  
  // Get project details (we'll create this query)
  const project = useQuery(api.productivity.getProjects, { limit: 1 })?.find(p => p._id === id);

  const updateTaskStatus = useMutation(api.productivity.updateTaskStatus);

  const handleStatusChange = async (taskId: string, status: string) => {
    if (!currentUser?._id) return;
    
    try {
      await updateTaskStatus({
        taskId: taskId,
        status: status as 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled',
        userId: currentUser._id,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Calculate project progress
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
          {/* Logo & Project Info */}
          <div className="flex-shrink-0 px-4 py-6 border-b border-gray-700">
            <Link href="/productivity" className="flex items-center mb-4 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-300">Back to Projects</span>
            </Link>
            
            <div className="mb-4">
              <h1 className="text-xl font-bold text-white truncate">{project.title}</h1>
              <p className="text-sm text-green-400 font-medium">{project.department} Department</p>
              <Badge className={cn("mt-2", getStatusColor(project.status))} variant="outline">
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">{completedTasks}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">{progressPercentage}%</div>
                <div className="text-xs text-gray-400">Progress</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map(item => (
              <NavigationItem key={item.id} item={item} />
            ))}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 border-t border-gray-700 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-400">Project Manager</p>
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
              <h1 className="text-lg font-semibold text-white truncate">{project.title}</h1>
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
      case 'overview':
        return renderOverviewSection();
      case 'tasks':
        return renderTasksSection();
      case 'timeline':
        return renderTimelineSection();
      case 'budget':
        return renderBudgetSection();
      case 'team':
        return renderTeamSection();
      case 'documents':
        return renderDocumentsSection();
      default:
        return renderOverviewSection();
    }
  }

  function renderOverviewSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Project Overview</h2>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Tasks Completed</p>
                  <p className="text-2xl font-bold text-white">{completedTasks}/{totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Progress</p>
                  <p className="text-2xl font-bold text-white">{progressPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Budget</p>
                  <p className="text-2xl font-bold text-white">₱{project?.budget?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Days Left</p>
                  <p className="text-2xl font-bold text-white">
                    {project?.endDate ? Math.max(0, Math.ceil((project.endDate - Date.now()) / (1000 * 60 * 60 * 24))) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-6">{project?.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center text-gray-400">
                    <Calendar className="w-5 h-5 mr-3" />
                    <span>Start Date</span>
                  </div>
                  <span className="text-white font-medium">
                    {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center text-gray-400">
                    <Target className="w-5 h-5 mr-3" />
                    <span>End Date</span>
                  </div>
                  <span className="text-white font-medium">
                    {project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderTasksSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Tasks & Progress</h2>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {tasks && tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task._id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                      <p className="text-gray-400 mb-4">{task.description}</p>
                      
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <User className="w-4 h-4 mr-2" />
                          <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {task.estimatedHours && (
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{task.estimatedHours}h estimated</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getPriorityColor(task.priority)} variant="outline">
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </Badge>
                        
                        <Badge className={getStatusColor(task.status)} variant="outline">
                          {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <Select
                        value={task.status}
                        onValueChange={(value: string) => handleStatusChange(task._id, value)}
                      >
                        <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Tasks Yet</h3>
              <p className="text-gray-500 mb-6">This project doesn&apos;t have any tasks assigned yet.</p>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderTimelineSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Project Timeline</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Timeline view coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderBudgetSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Budget & Resources</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Budget management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderTeamSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Team Members</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Team management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderDocumentsSection() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Project Documents</h2>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <p className="text-gray-400">Document management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
