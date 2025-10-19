"use client";

import { useState, useEffect, use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Id } from "../../../../../convex/_generated/dataModel";
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Timer,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  PlayCircle,
  StopCircle,
  ArrowLeft,
  UserPlus,
  X,
  Play,
  Pause,
  CheckCheck,
  XCircle,
  ClockIcon,
  Archive,
  FileText,
  CheckSquare,
  MapPin,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

interface Task {
  _id: Id<"eventTasks">;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedUsers: any[];
  dueDate?: number;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  creator: any;
  blockedReason?: string;
  verifiedUser?: any;
  reportTo?: Id<"users">; // Who should review/check this task
  reportToUser?: any; // Populated reviewer user object
}

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const statusColumns = [
  { id: "todo", title: "To Do", icon: "📝", color: "blue" },
  { id: "in_progress", title: "In Progress", icon: "⚡", color: "yellow" },
  { id: "in_review", title: "In Review", icon: "👀", color: "purple" },
  { id: "done", title: "Done", icon: "✅", color: "green" },
  { id: "blocked", title: "Blocked", icon: "🚫", color: "red" },
  { id: "backlog", title: "Backlog", icon: "📋", color: "gray" },
];

export default function EventControlPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Id<"eventTasks"> | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isClockInDialogOpen, setIsClockInDialogOpen] = useState(false);
  const [isClockOutDialogOpen, setIsClockOutDialogOpen] = useState(false);
  const [selectedTimeTask, setSelectedTimeTask] = useState<Id<"eventTasks"> | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDetailsTask, setSelectedDetailsTask] = useState<Id<"eventTasks"> | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [draggedTask, setDraggedTask] = useState<Id<"eventTasks"> | null>(null);
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [pendingBlockedTask, setPendingBlockedTask] = useState<Id<"eventTasks"> | null>(null);
  const [isManagePeopleOpen, setIsManagePeopleOpen] = useState(false);
  const [managingTask, setManagingTask] = useState<Id<"eventTasks"> | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [pendingApprovalTask, setPendingApprovalTask] = useState<Id<"eventTasks"> | null>(null);
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [pendingRevisionTask, setPendingRevisionTask] = useState<Id<"eventTasks"> | null>(null);

  // Queries
  const event = useQuery(api.events.getEventById, { eventId });
  const tasks = useQuery(api.eventControl.getEventTasks, { eventId });
  const dashboard = useQuery(api.eventControl.getEventDashboard, { eventId });
  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();
  const currentUserStatus = useQuery(api.users.getCurrentUserStatus);
  const allUsers = useQuery(api.users.getAllActiveUsers);
  const activeTimeEntry = useQuery(api.eventTaskTimeTracking.getActiveTimeEntry, {});
  // Get all task assignments for the event (needed for validation)
  const allTaskAssignments = useQuery(api.eventTaskAssignments.getAllEventAssignments, { eventId });
  // Get specific task assignments for the assign dialog
  const taskAssignments = useQuery(
    api.eventTaskAssignments.getTaskAssignments,
    selectedTask ? { taskId: selectedTask } : "skip"
  );

  // Mutations
  const updateTaskStatus = useMutation(api.eventControl.updateTaskStatus);
  const createTask = useMutation(api.eventControl.createEventTask);
  const assignTask = useMutation(api.eventControl.assignTask);
  const archiveTask = useMutation(api.eventControl.archiveTask);
  const clockIn = useMutation(api.eventTaskTimeTracking.clockIn);
  const clockOut = useMutation(api.eventTaskTimeTracking.clockOut);
  const verifyTask = useMutation(api.eventTaskTimeTracking.verifyTask);
  const assignUsersToTask = useMutation(api.eventTaskAssignments.assignUsersToTask);
  const completeAssignment = useMutation(api.eventTaskAssignments.completeAssignment);
  const verifyAssignment = useMutation(api.eventTaskAssignments.verifyAssignment);

  // Archive task handler
  const handleArchiveTask = async (taskId: Id<"eventTasks">) => {
    try {
      await archiveTask({ taskId });
      toast.success('Task archived successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive task');
    }
  };

  // Export comprehensive event report
  const handleExportReport = () => {
    if (!event || !tasks || !dashboard) {
      toast.error('Please wait for data to load');
      return;
    }

    // Calculate comprehensive statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
    const inReviewTasks = tasks.filter((t: any) => t.status === 'in_review').length;
    const todoTasks = tasks.filter((t: any) => t.status === 'todo').length;
    const backlogTasks = tasks.filter((t: any) => t.status === 'backlog').length;
    const blockedTasks = tasks.filter((t: any) => t.status === 'blocked').length;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';

    // Priority breakdown
    const criticalTasks = tasks.filter((t: any) => t.priority === 'critical').length;
    const highTasks = tasks.filter((t: any) => t.priority === 'high').length;
    const mediumTasks = tasks.filter((t: any) => t.priority === 'medium').length;
    const lowTasks = tasks.filter((t: any) => t.priority === 'low').length;

    // Team performance
    const assignedUsers = new Set();
    tasks.forEach((task: any) => {
      task.assignedUsers?.forEach((user: any) => assignedUsers.add(user._id));
    });
    const totalTeamMembers = assignedUsers.size;

    // Generate HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${event.title} - Progress Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #14b8a6;
            margin-bottom: 10px;
          }
          .report-date {
            color: #666;
            margin-bottom: 30px;
          }
          h2 {
            color: #333;
            border-bottom: 2px solid #14b8a6;
            padding-bottom: 10px;
            margin-top: 30px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .kpi-item {
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #14b8a6;
          }
          .kpi-label {
            color: #666;
            font-size: 14px;
          }
          .kpi-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #14b8a6;
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
          }
          tr:hover {
            background: #f5f5f5;
          }
          .progress-bar {
            width: 100%;
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #14b8a6, #0d9488);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
          }
          .badge-done { background: #10b981; color: white; }
          .badge-progress { background: #f59e0b; color: white; }
          .badge-review { background: #8b5cf6; color: white; }
          .badge-todo { background: #3b82f6; color: white; }
          .badge-blocked { background: #ef4444; color: white; }
          .badge-backlog { background: #6b7280; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Event Progress Report</h1>
          <div class="report-date">Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          
          <h2>Event Details</h2>
          <div class="kpi-grid">
            <div class="kpi-item">
              <div class="kpi-label">Event Name</div>
              <div class="kpi-value" style="font-size: 18px;">${event.title}</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">Event Date</div>
              <div class="kpi-value" style="font-size: 18px;">${new Date(event.startDate).toLocaleDateString()}</div>
            </div>
          </div>

          <h2>Key Performance Indicators</h2>
          <div class="kpi-grid">
            <div class="kpi-item">
              <div class="kpi-label">Total Tasks</div>
              <div class="kpi-value">${totalTasks}</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">Completed Tasks</div>
              <div class="kpi-value">${completedTasks} (${completionRate}%)</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">In Progress</div>
              <div class="kpi-value">${inProgressTasks}</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">Team Members</div>
              <div class="kpi-value">${totalTeamMembers}</div>
            </div>
          </div>

          <h2>Overall Progress</h2>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionRate}%">
              ${completionRate}% Complete
            </div>
          </div>

          <h2>Task Status Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="status-badge badge-done">Done</span></td>
                <td>${completedTasks}</td>
                <td>${completionRate}%</td>
              </tr>
              <tr>
                <td><span class="status-badge badge-progress">In Progress</span></td>
                <td>${inProgressTasks}</td>
                <td>${totalTasks > 0 ? ((inProgressTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              <tr>
                <td><span class="status-badge badge-review">In Review</span></td>
                <td>${inReviewTasks}</td>
                <td>${totalTasks > 0 ? ((inReviewTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              <tr>
                <td><span class="status-badge badge-todo">To Do</span></td>
                <td>${todoTasks}</td>
                <td>${totalTasks > 0 ? ((todoTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              <tr>
                <td><span class="status-badge badge-backlog">Backlog</span></td>
                <td>${backlogTasks}</td>
                <td>${totalTasks > 0 ? ((backlogTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              <tr>
                <td><span class="status-badge badge-blocked">Blocked</span></td>
                <td>${blockedTasks}</td>
                <td>${totalTasks > 0 ? ((blockedTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            </tbody>
          </table>

          <h2>Priority Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🔴 Critical</td>
                <td>${criticalTasks}</td>
                <td>${totalTasks > 0 ? ((criticalTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              <tr>
                <td>🟠 High</td>
                <td>${highTasks}</td>
                <td>${totalTasks > 0 ? ((highTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              <tr>
                <td>🟡 Medium</td>
                <td>${mediumTasks}</td>
                <td>${totalTasks > 0 ? ((mediumTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              <tr>
                <td>🟢 Low</td>
                <td>${lowTasks}</td>
                <td>${totalTasks > 0 ? ((lowTasks / totalTasks) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            </tbody>
          </table>

          <h2>Summary</h2>
          <p style="line-height: 1.6; color: #555;">
            This report provides a comprehensive overview of the <strong>${event.title}</strong> event progress.
            Out of ${totalTasks} total tasks, ${completedTasks} have been completed (${completionRate}%),
            ${inProgressTasks} are currently in progress, and ${inReviewTasks} are under review.
            The event involves ${totalTeamMembers} team members working collaboratively to achieve the event goals.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
            Generated on ${new Date().toLocaleString()} by BarangayLink Event Management System
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

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (taskId: Id<"eventTasks">, newStatus: string, reason?: string) => {
    try {
      // Get the task being changed
      const task = tasks?.find((t: Task) => t._id === taskId);
      if (!task) return;

      // Handle userLevel as string or object
      const userLevelStr = typeof currentUser?.userLevel === 'string' 
        ? currentUser.userLevel 
        : currentUser?.userLevel?.name || '';
      
      const isAdmin = userLevelStr === "ADMIN";
      const isCaptain = userLevelStr === "CAPTAIN";
      const isManager = userLevelStr === "MANAGER";
      const isBuilder = userLevelStr === "BUILDER";
      const isWorker = userLevelStr === "WORKER";
      const canManage = isAdmin || isCaptain || isManager;

      // Get task assignments to check if user is assigned
      const assignedUserIds = task.assignedUsers?.map((u: any) => u._id) || [];
      const isAssigned = currentUser && assignedUserIds.includes(currentUser._id);

      // Check if current user is the assigned reviewer (reportTo) - but NOT if they're a Worker
      const isReviewer = task.reportTo && currentUser && task.reportTo === currentUser._id && !isWorker;

      // COMPREHENSIVE VALIDATION RULES

      // Rule 1: DONE tasks cannot be moved (locked)
      if (task.status === "done") {
        toast.error("Completed tasks cannot be modified. Task is locked.");
        return;
      }

      // Rule 2: Can only move to DONE from IN_REVIEW by authorized users (NOT Workers)
      if (newStatus === "done") {
        if (task.status !== "in_review") {
          toast.error("Tasks can only be marked as DONE from IN REVIEW status");
          return;
        }
        // Check permissions: Admin, Captain, Manager, or Builder (if assigned as reviewer)
        // Workers can NEVER mark as done, even if assigned as reviewer
        const canApproveDone = isAdmin || isCaptain || isManager || (isBuilder && isReviewer);
        if (!canApproveDone) {
          toast.error("Only Admins, Captains, Managers, or assigned Builder reviewer can mark tasks as DONE");
          return;
        }
        // Show approval confirmation dialog
        setPendingApprovalTask(taskId);
        setIsApprovalDialogOpen(true);
        return;
      }

      // Rule 2b: Moving from IN REVIEW back to IN PROGRESS (needs revision)
      if (task.status === "in_review" && newStatus === "in_progress") {
        // Check if user can send back for revision
        const canRevise = isAdmin || isCaptain || isManager || (isBuilder && isReviewer) || isReviewer;
        if (!canRevise) {
          toast.error("Only authorized reviewers can send tasks back for revision");
          return;
        }
        // Show revision dialog
        setPendingRevisionTask(taskId);
        setIsRevisionDialogOpen(true);
        return;
      }

      // Reset timer when task goes back to IN PROGRESS from any status
      if (newStatus === "in_progress" && task.status !== "in_progress") {
        // Check if there's an active time entry for this task
        if (activeTimeEntry && activeTimeEntry.taskId === taskId) {
          // Clock out the current session
          await clockOut({ entryId: activeTimeEntry._id });
        }
      }

      // Rule 3: IN_PROGRESS requires assignments, and CANNOT go back to TODO
      if (newStatus === "in_progress") {
        if (assignedUserIds.length === 0) {
          toast.error("Cannot start task - No users assigned yet. Please assign users first.");
          return;
        }
      }

      // Rule 4: TODO - STRICT! Can NEVER come back once assignments exist
      if (newStatus === "todo") {
        if (assignedUserIds.length > 0) {
          toast.error("Cannot move back to TODO - Task has assigned users. Once assigned, task must stay in workflow.");
          return;
        }
        // Can only come from BACKLOG (no assignments)
        if (task.status !== "backlog") {
          toast.error("Can only move to TODO from BACKLOG");
          return;
        }
      }

      // Rule 5: BACKLOG - Can only go here from TODO with no assignments
      if (newStatus === "backlog") {
        if (task.status !== "todo") {
          toast.error("Can only move to BACKLOG from TODO status");
          return;
        }
        if (assignedUserIds.length > 0) {
          toast.error("Cannot move to BACKLOG - Task has assigned users. Remove assignments first.");
          return;
        }
      }

      // Rule 6: IN PROGRESS to IN REVIEW - ALL team members must mark complete
      if (task.status === "in_progress" && newStatus === "in_review") {
        // Get individual assignment progress from allTaskAssignments
        const assignments = allTaskAssignments?.filter((a: any) => a.taskId === taskId) || [];
        
        if (assignments.length > 0) {
          const allComplete = assignments.every((a: any) => a.status === "completed" || a.status === "verified");
          
          if (!allComplete) {
            const completedCount = assignments.filter((a: any) => a.status === "completed" || a.status === "verified").length;
            toast.error(`Cannot move to review - Not all workers finished. ${completedCount}/${assignments.length} completed.`);
            return;
          }
        }
      }

      // Rule 7: From BACKLOG, can only go to TODO
      if (task.status === "backlog" && newStatus !== "todo") {
        toast.error("Tasks in BACKLOG can only be moved to TODO. Move to TODO first, then assign users.");
        return;
      }

      // Rule 8: TODO restrictions - cannot skip to IN_REVIEW or be BLOCKED
      if (task.status === "todo") {
        if (newStatus === "in_review") {
          toast.error("Cannot move to IN REVIEW from TODO. Work must be started and completed first.");
          return;
        }
        if (newStatus === "blocked") {
          toast.error("Cannot block tasks in TODO. Assign users and start work first.");
          return;
        }
        if (newStatus === "done") {
          toast.error("Cannot mark as DONE from TODO. Follow the workflow: TODO → IN PROGRESS → IN REVIEW → DONE");
          return;
        }
      }

      // Rule 9: BACKLOG cannot be BLOCKED
      if (task.status === "backlog" && newStatus === "blocked") {
        toast.error("Cannot block tasks in BACKLOG. Move to TODO and start work first.");
        return;
      }

      // Rule 10: Only IN_PROGRESS and IN_REVIEW can be BLOCKED
      if (newStatus === "blocked") {
        if (task.status !== "in_progress" && task.status !== "in_review") {
          toast.error("Only tasks that are IN PROGRESS or IN REVIEW can be blocked.");
          return;
        }
        // Require a reason
        if (!reason) {
          setPendingBlockedTask(taskId);
          setIsBlockedDialogOpen(true);
          return;
        }
      }

      // Update status
      await updateTaskStatus({
        taskId,
        newStatus: newStatus as any,
        blockedReason: reason, // Save blocked reason
        verifiedBy: newStatus === "done" && currentUser ? currentUser._id : undefined, // Record who approved
      });
      
      // Show appropriate success message
      if (reason && newStatus === "blocked") {
        toast.success(`Task blocked: ${reason}`);
      } else if (newStatus === "backlog") {
        toast.success('Task moved to backlog (low priority)');
      } else if (newStatus === "done") {
        toast.success('Task marked as DONE!');
      } else {
        toast.success('Status updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDragStart = (taskId: Id<"eventTasks">) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask) {
      await handleStatusChange(draggedTask, newStatus);
      setDraggedTask(null);
    }
  };

  const filteredTasks = tasks?.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const getTasksByStatus = (status: string) => {
    return filteredTasks?.filter((task: Task) => task.status === status) || [];
  };

  if (!event || !tasks || !currentUser) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar 
          userRole={currentUser?.userLevel?.name || "WORKER"}
          dashboardTitle="Event Control"
          dashboardSubtitle="Loading..."
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading Event Control...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Toaster position="top-right" />
      <Sidebar 
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Event Control"
        dashboardSubtitle="Manage event tasks and assignments"
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/events')}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
              <div className="border-l border-gray-600 pl-4">
                <h1 className="text-2xl font-bold text-white">{event.title}</h1>
                <p className="text-sm text-gray-400">Event Control Board - Organize & Manage Tasks</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleExportReport()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <CreateTaskDialog
                eventId={eventId}
                isOpen={isCreateTaskOpen}
                onOpenChange={setIsCreateTaskOpen}
                onTaskCreated={() => {
                  toast.success("Task created successfully!");
                  setIsCreateTaskOpen(false);
                }}
              />
            </div>
          </div>

        {/* Dashboard Stats */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Total Tasks"
              value={dashboard.total}
              color="blue"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="In Progress"
              value={dashboard.inProgress}
              color="yellow"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Done"
              value={dashboard.done}
              color="green"
            />
            <StatCard
              icon={<AlertCircle className="w-5 h-5" />}
              label="Blocked"
              value={dashboard.blocked}
              color="red"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Overdue"
              value={dashboard.overdue}
              color="orange"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Progress"
              value={`${Math.round(dashboard.avgProgress)}%`}
              color="purple"
            />
          </div>
        )}

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-gray-800/50 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{column.icon}</span>
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {columnTasks.map((task: Task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={() => handleDragStart(task._id)}
                    className="cursor-move"
                  >
                    <TaskCard
                      task={task}
                      onStatusChange={handleStatusChange}
                      onAssign={() => {
                        setManagingTask(task._id);
                        setIsManagePeopleOpen(true);
                      }}
                      onDelete={() => handleArchiveTask(task._id)}
                      onClockIn={() => {
                        setSelectedTimeTask(task._id);
                        setIsClockInDialogOpen(true);
                      }}
                      onClockOut={() => {
                        setSelectedTimeTask(task._id);
                        setIsClockOutDialogOpen(true);
                      }}
                      onVerify={() => {
                        setSelectedTask(task._id);
                        setIsVerifyDialogOpen(true);
                      }}
                      onViewDetails={() => {
                        setSelectedDetailsTask(task._id);
                        setIsDetailsDialogOpen(true);
                      }}
                      activeTimeEntry={activeTimeEntry}
                      currentTime={currentTime}
                      currentUser={currentUser}
                    />
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
          </div>
        </div>

        {/* Assign Task Dialog */}
        {selectedTask && (
          <AssignTaskDialog
            taskId={selectedTask}
            isOpen={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
            allUsers={allUsers || []}
            currentUser={currentUser}
            onAssign={async (userIds: Id<"users">[]) => {
              try {
                await assignUsersToTask({ taskId: selectedTask, userIds });
                toast.success(`Assigned ${userIds.length} user(s) successfully!`);
                setIsAssignDialogOpen(false);
              } catch (error: any) {
                toast.error(error.message || 'Failed to assign users');
              }
            }}
          />
        )}

        {/* Clock In Dialog */}
        {selectedTimeTask && (
          <ClockInDialog
            taskId={selectedTimeTask}
            isOpen={isClockInDialogOpen}
            onOpenChange={setIsClockInDialogOpen}
            onClockIn={async (startTime?: number) => {
              try {
                await clockIn({ taskId: selectedTimeTask, startTime });
                toast.success('Clocked in successfully!');
                setIsClockInDialogOpen(false);
              } catch (error: any) {
                toast.error(error.message);
              }
            }}
          />
        )}

        {/* Clock Out Dialog */}
        {selectedTimeTask && (
          <ClockOutDialog
            taskId={selectedTimeTask}
            isOpen={isClockOutDialogOpen}
            onOpenChange={setIsClockOutDialogOpen}
            onClockOut={async (description?: string, markComplete?: boolean) => {
              try {
                await clockOut({ taskId: selectedTimeTask, description, markComplete });
                toast.success(markComplete ? 'Task completed and clocked out!' : 'Clocked out successfully!');
                setIsClockOutDialogOpen(false);
              } catch (error: any) {
                toast.error(error.message);
              }
            }}
          />
        )}

        {/* Verify Task Dialog */}
        {selectedTimeTask && (
          <VerifyTaskDialog
            taskId={selectedTimeTask}
            isOpen={isVerifyDialogOpen}
            onOpenChange={setIsVerifyDialogOpen}
            onVerify={async (approved: boolean, feedback?: string) => {
              try {
                await verifyTask({ taskId: selectedTimeTask, approved, feedback });
                toast.success(approved ? 'Task approved!' : 'Task sent back for revision');
                setIsVerifyDialogOpen(false);
              } catch (error: any) {
                toast.error(error.message);
              }
            }}
          />
        )}

        {/* Task Details Dialog */}
        {selectedDetailsTask && (
          <TaskDetailsDialog
            eventId={eventId}
            taskId={selectedDetailsTask}
            isOpen={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
          />
        )}

        {/* Manage People Dialog */}
        {managingTask && (
          <ManagePeopleDialog
            taskId={managingTask}
            eventId={eventId}
            isOpen={isManagePeopleOpen}
            onOpenChange={setIsManagePeopleOpen}
          />
        )}

        {/* Blocked Reason Dialog */}
        <Dialog open={isBlockedDialogOpen} onOpenChange={setIsBlockedDialogOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Block Task
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Please provide a reason why this task is blocked
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="blockedReason">Reason</Label>
                <Textarea
                  id="blockedReason"
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder="e.g., Waiting for materials delivery, Need approval from city hall, Missing equipment..."
                  rows={4}
                  className="bg-gray-700 border-gray-600 mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBlockedDialogOpen(false);
                    setBlockedReason("");
                    setPendingBlockedTask(null);
                  }}
                  className="flex-1 border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (pendingBlockedTask && blockedReason.trim()) {
                      await handleStatusChange(pendingBlockedTask, "blocked", blockedReason);
                      setIsBlockedDialogOpen(false);
                      setBlockedReason("");
                      setPendingBlockedTask(null);
                    }
                  }}
                  disabled={!blockedReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Block Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Approval Dialog - Confirm marking as DONE */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Approve Task Completion
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Confirm that this task has been completed satisfactorily and mark it as DONE.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-200">
                  By approving this task, you confirm that:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-green-300">
                  <li>• The work has been completed</li>
                  <li>• Quality standards have been met</li>
                  <li>• The task will be marked as DONE and locked</li>
                  <li>• Your name will be recorded as the approver</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsApprovalDialogOpen(false);
                    setPendingApprovalTask(null);
                  }}
                  className="flex-1 border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (pendingApprovalTask) {
                      await updateTaskStatus({
                        taskId: pendingApprovalTask,
                        newStatus: "done" as any,
                        verifiedBy: currentUser?._id,
                      });
                      toast.success('Task approved and marked as DONE!');
                      setIsApprovalDialogOpen(false);
                      setPendingApprovalTask(null);
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve & Mark DONE
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revision Dialog - Send back to IN PROGRESS */}
        <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Request Revision
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Please provide feedback on what needs to be revised or improved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="revisionNote">Revision Notes</Label>
                <Textarea
                  id="revisionNote"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="e.g., Please check the measurements again, Colors don't match the design, Missing final coat..."
                  rows={4}
                  className="bg-gray-700 border-gray-600 mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsRevisionDialogOpen(false);
                    setRevisionNote("");
                    setPendingRevisionTask(null);
                  }}
                  className="flex-1 border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (pendingRevisionTask && revisionNote.trim()) {
                      await updateTaskStatus({
                        taskId: pendingRevisionTask,
                        newStatus: "in_progress" as any,
                      });
                      // Add comment about revision
                      toast.success('Task sent back for revision');
                      setIsRevisionDialogOpen(false);
                      setRevisionNote("");
                      setPendingRevisionTask(null);
                    }
                  }}
                  disabled={!revisionNote.trim()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Send for Revision
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  color: 'blue' | 'yellow' | 'green' | 'red' | 'orange' | 'purple';
}) {
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    green: "bg-green-500/20 text-green-400",
    red: "bg-red-500/20 text-red-400",
    orange: "bg-orange-500/20 text-orange-400",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignedUsersSection({ task, onViewDetails }: { task: any; onViewDetails: () => void }) {
  const assignments = useQuery(
    api.eventTaskAssignments.getTaskAssignments,
    { taskId: task._id }
  );

  if (!assignments || assignments.length === 0) {
    return (
      <div className="mb-2 p-2 bg-gray-700/20 border border-dashed border-gray-600 rounded text-center">
        <p className="text-[10px] text-gray-500">No assignees yet</p>
      </div>
    );
  }

  // Calculate overall progress
  const totalProgress = assignments.reduce((sum, a) => sum + a.progress, 0);
  const avgProgress = Math.round(totalProgress / assignments.length);

  return (
    <div className="mb-3 space-y-2">
      {/* Overall Progress Bar */}
      <div className="p-2 bg-gray-700/20 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-400 font-semibold">Team Progress</span>
          <span className="text-white font-bold">{avgProgress}%</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all shadow-sm"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-gray-500 font-bold tracking-wide mb-1 flex items-center gap-1">
          <Users className="w-3 h-3" />
          ASSIGNED TO ({assignments.length})
        </div>
        {assignments.slice(0, 3).map((assignment: any) => (
          <div
            key={assignment._id}
            className="bg-gray-700/30 rounded-lg p-2 border border-gray-700/50 hover:bg-gray-700/50 transition-all"
          >
            {/* User Info Row */}
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar className="w-6 h-6 border-2 border-gray-600">
                <AvatarImage src={assignment.user?.imageUrl} />
                <AvatarFallback className="text-[9px] bg-gray-600 text-white font-bold">
                  {assignment.user?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-xs truncate">
                    {assignment.user?.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-300 font-mono font-bold text-xs">
                      {assignment.progress}%
                    </span>
                    {assignment.status === "verified" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    )}
                    {assignment.status === "completed" && (
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                </div>
                {assignment.assignedByUser && (
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    by {assignment.assignedByUser.name}
                  </div>
                )}
              </div>
            </div>
            
            {/* Individual Progress Bar */}
            <div className="w-full bg-gray-600 rounded-full h-1.5 relative overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  assignment.status === 'verified' 
                    ? 'bg-green-500' 
                    : assignment.status === 'completed' 
                    ? 'bg-purple-500' 
                    : 'bg-blue-500'
                }`}
                style={{ 
                  width: assignment.progress === 0 ? '2%' : `${assignment.progress}%`,
                  minWidth: assignment.progress > 0 ? '2%' : '0%'
                }}
              />
              {assignment.progress === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[8px] text-gray-400 font-medium">Not Started</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {assignments.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="w-full text-[10px] text-blue-400 hover:text-blue-300 text-center py-1.5 bg-gray-700/20 rounded hover:bg-gray-700/40 transition-all"
          >
            +{assignments.length - 3} more • View All Details
          </button>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onAssign, onDelete, onClockIn, onClockOut, onVerify, onViewDetails, activeTimeEntry, currentTime, currentUser }: { 
  task: Task; 
  onStatusChange: any;
  onAssign: () => void;
  onDelete: () => void;
  onClockIn: () => void;
  onClockOut: () => void;
  onVerify: () => void;
  onViewDetails: () => void;
  activeTimeEntry: any;
  currentTime: number;
  currentUser: any;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if THIS SPECIFIC user is clocked in to THIS SPECIFIC task
  const isTaskActive = activeTimeEntry && activeTimeEntry.taskId === task._id && activeTimeEntry.userId === currentUser?._id;
  
  const isAdmin = currentUser?.userLevel?.name === "ADMIN";
  
  // Check if current user is assigned to this task
  const isAssignedToMe = task.assignedUsers?.some((user: any) => user._id === currentUser?._id);
  
  // Calculate persistent elapsed time from database startTime
  const [persistentElapsed, setPersistentElapsed] = useState(0);
  
  useEffect(() => {
    if (isTaskActive && activeTimeEntry?.startTime) {
      // Calculate initial elapsed time from database
      const calculateElapsed = () => {
        const elapsed = Math.floor((Date.now() - activeTimeEntry.startTime) / 1000);
        setPersistentElapsed(elapsed);
      };
      
      // Calculate immediately
      calculateElapsed();
      
      // Update every second
      const interval = setInterval(calculateElapsed, 1000);
      
      return () => clearInterval(interval);
    } else {
      setPersistentElapsed(0);
    }
  }, [isTaskActive, activeTimeEntry?.startTime]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowActions(false);
    if (showActions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActions]);
  
  // Calculate elapsed time using persistent timer
  const getElapsedTime = () => {
    if (!isTaskActive || persistentElapsed === 0) return '';
    const hours = Math.floor(persistentElapsed / 3600);
    const minutes = Math.floor((persistentElapsed % 3600) / 60);
    const seconds = persistentElapsed % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-500";
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done";

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      backlog: { label: "Backlog", color: "text-gray-400", bg: "bg-gray-600/50" },
      todo: { label: "To Do", color: "text-blue-400", bg: "bg-blue-600/20" },
      in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-600/20" },
      in_review: { label: "In Review", color: "text-purple-400", bg: "bg-purple-600/20" },
      done: { label: "Done", color: "text-green-400", bg: "bg-green-600/20" },
      blocked: { label: "Blocked", color: "text-red-400", bg: "bg-red-600/20" },
    };
    return configs[status] || configs.todo;
  };

  const statusConfig = getStatusConfig(task.status);

  return (
    <Card className="bg-gray-800/80 border-gray-700 hover:border-gray-600 transition-all relative">
      <CardContent className="p-3">
        {/* Compact Header - Always Visible */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-1 h-full rounded-full ${getPriorityColor(task.priority)}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white text-sm line-clamp-1 flex-1">{task.title}</h4>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-700"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                {(isAdmin || currentUser?.userLevel === "CAPTAIN" || currentUser?.userLevel === "MANAGER" || currentUser?.userLevel === "BUILDER" || task.creator?._id === currentUser?._id) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(!showActions);
                    }}
                    className="h-6 w-6 p-0 hover:bg-gray-700"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge className={`text-[10px] px-1.5 py-0 ${statusConfig.bg} ${statusConfig.color} border-0`}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize border-gray-600">
                {task.priority}
              </Badge>
              {task.dueDate && (
                <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timer - Always Visible */}
        {isTaskActive && (
          <div className="mb-2 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-300 font-medium">Working</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300">{getElapsedTime()}</span>
          </div>
        )}

        {/* Blocked Reason - Always Visible */}
        {task.status === "blocked" && task.blockedReason && (
          <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/30 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-red-300 font-semibold">BLOCKED</span>
            </div>
            <p className="text-[10px] text-red-200 pl-4">{task.blockedReason}</p>
          </div>
        )}

        {/* Backlog Label - Always Visible */}
        {task.status === "backlog" && (
          <div className="mb-2 p-1.5 bg-gray-500/10 border border-gray-500/30 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-300">Low Priority - Not urgent</span>
          </div>
        )}

        {/* Checked By - Always Visible for DONE tasks */}
        {task.status === "done" && task.verifiedUser && (
          <div className="mb-2 p-1.5 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-green-300 font-semibold">Checked by {task.verifiedUser.name}</span>
          </div>
        )}

        {/* Reviewer - Always Visible for IN REVIEW tasks */}
        {task.status === "in_review" && task.reportToUser && (
          <div className="mb-2 p-1.5 bg-purple-500/10 border border-purple-500/30 rounded flex items-center gap-1">
            <UserPlus className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-300 font-semibold">Reviewing: {task.reportToUser.name}</span>
          </div>
        )}

        {/* Action Menu Dropdown */}
        {(isAdmin || currentUser?.userLevel === "CAPTAIN" || currentUser?.userLevel === "MANAGER" || currentUser?.userLevel === "BUILDER" || task.creator?._id === currentUser?._id) && showActions && (
          <div className="absolute right-3 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[140px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-700 text-blue-400 flex items-center gap-2"
            >
              <FileText className="w-3 h-3" /> View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign();
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-700 text-purple-400 flex items-center gap-2"
            >
              <Users className="w-3 h-3" /> Manage People
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-700 text-orange-400 flex items-center gap-2"
            >
              <Archive className="w-3 h-3" /> Archive
            </button>
          </div>
        )}

        {/* Expandable Content */}
        {isExpanded && (
          <div className="space-y-2 border-t border-gray-700 pt-2 mt-2">
            {task.creator && (
              <div className="flex items-center gap-1 text-[9px] text-gray-500">
                <Users className="w-2.5 h-2.5" />
                <span>By {task.creator.name}</span>
              </div>
            )}

            {/* Assigned Users with Individual Progress */}
            <AssignedUsersSection 
              task={task} 
              onViewDetails={() => {
                setShowDetails(!showDetails);
              }}
            />

            {/* Estimated Hours */}
            {task.estimatedHours && (
              <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] text-blue-300 font-medium">Estimated</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-300">{task.estimatedHours}h</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-1.5">
              {/* Time Tracking - Only for assigned users */}
              {!isTaskActive && task.status !== "done" && task.status !== "in_review" && isAssignedToMe && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClockIn();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Clock In
                </Button>
              )}
              
              {/* Not Assigned Message */}
              {!isTaskActive && task.status !== "done" && task.status !== "in_review" && !isAssignedToMe && (
                <div className="w-full bg-gray-700/30 border border-gray-600/50 rounded p-2 text-center">
                  <p className="text-[10px] text-gray-400">
                    Not assigned to this task
                  </p>
                </div>
              )}
              
              {isTaskActive && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClockOut();
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 h-7 text-xs"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Clock Out
                </Button>
              )}

              {task.status === "in_review" && isAdmin && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerify();
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 h-7 text-xs"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Verify
                </Button>
              )}

              {/* Details & Assign Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="h-7 text-xs border-gray-700 hover:bg-gray-700"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign();
                  }}
                  className="h-7 text-xs border-gray-700 hover:bg-gray-700"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Assign
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateTaskDialog({ eventId, isOpen, onOpenChange, onTaskCreated }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [timeUnit, setTimeUnit] = useState<"hours" | "minutes" | "days">("hours");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [currentChecklistItem, setCurrentChecklistItem] = useState("");
  const [location, setLocation] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");

  const createTask = useMutation(api.eventControl.createEventTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert time to hours
      let hoursValue = estimatedHours ? parseFloat(estimatedHours) : undefined;
      if (hoursValue) {
        if (timeUnit === "minutes") {
          hoursValue = hoursValue / 60; // Convert minutes to hours
        } else if (timeUnit === "days") {
          hoursValue = hoursValue * 24; // Convert days to hours (8 hours per day)
        }
      }

      await createTask({
        eventId,
        title,
        description: description || undefined,
        priority: priority as any,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        estimatedHours: hoursValue,
        checklistItems: checklistItems.length > 0 ? checklistItems : undefined,
        location: location || undefined,
        requirements: requirements.length > 0 ? requirements.join(', ') : undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setEstimatedHours("");
      setTimeUnit("hours");
      setChecklistItems([]);
      setCurrentChecklistItem("");
      setLocation("");
      setRequirements([]);
      setCurrentRequirement("");

      toast.success('Task created successfully!');
      onTaskCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new task to organize your event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1">
          {/* Task Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-semibold text-white flex items-center gap-1">
              Task Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Set up registration booth"
              required
              className="bg-gray-700 border-gray-600 focus:border-emerald-500 mt-1"
            />
          </div>

          {/* Priority Level */}
          <div>
            <Label htmlFor="priority" className="text-sm font-semibold text-white">Priority Level</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 mt-1 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="critical">🔴 Critical</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold text-white">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done, expected outcomes, and any important details..."
              rows={3}
              className="bg-gray-700 border-gray-600 focus:border-emerald-500 mt-1 resize-none"
            />
          </div>

          {/* Estimated Time & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedHours" className="text-sm font-semibold text-white flex items-center gap-1">
                ⏱️ Estimated Time
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="e.g., 8"
                  className="bg-gray-700 border-gray-600 focus:border-emerald-500 flex-1"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as "hours" | "minutes" | "days")}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-32"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">Benchmark for progress tracking</p>
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-sm font-semibold text-white flex items-center gap-1">
                📅 Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-gray-700 border-gray-600 focus:border-emerald-500 mt-1"
              />
            </div>
          </div>

          {/* Optional: Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-semibold text-white flex items-center gap-1">
              📍 Location <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Hall, Parking Area, Office 2F"
              className="bg-gray-700 border-gray-600 focus:border-emerald-500 mt-1"
            />
          </div>

          {/* Optional: Requirements */}
          <div>
            <Label htmlFor="requirements" className="text-sm font-semibold text-white flex items-center gap-1">
              📦 Requirements/Materials <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="requirements"
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentRequirement.trim()) {
                      setRequirements([...requirements, currentRequirement.trim()]);
                      setCurrentRequirement("");
                    }
                  }
                }}
                placeholder="e.g., Tables (5), Chairs (20)"
                className="bg-gray-700 border-gray-600 focus:border-emerald-500 flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  if (currentRequirement.trim()) {
                    setRequirements([...requirements, currentRequirement.trim()]);
                    setCurrentRequirement("");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 rounded px-2 py-1 text-sm"
                  >
                    <span className="text-blue-200">{req}</span>
                    <button
                      type="button"
                      onClick={() => setRequirements(requirements.filter((_, i) => i !== index))}
                      className="text-blue-300 hover:text-blue-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Press Enter or click + to add item</p>
          </div>

          {/* Optional: Checklist */}
          <div>
            <Label htmlFor="checklist" className="text-sm font-semibold text-white flex items-center gap-1">
              ✅ Checklist Items <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="checklist"
                value={currentChecklistItem}
                onChange={(e) => setCurrentChecklistItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentChecklistItem.trim()) {
                      setChecklistItems([...checklistItems, currentChecklistItem.trim()]);
                      setCurrentChecklistItem("");
                    }
                  }
                }}
                placeholder="e.g., Reserve venue, Prepare materials"
                className="bg-gray-700 border-gray-600 focus:border-emerald-500 flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  if (currentChecklistItem.trim()) {
                    setChecklistItems([...checklistItems, currentChecklistItem.trim()]);
                    setCurrentChecklistItem("");
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {checklistItems.length > 0 && (
              <div className="space-y-1 mt-2">
                {checklistItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-emerald-300 font-semibold text-xs">{index + 1}.</span>
                      <span className="text-gray-200 text-sm">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== index))}
                      className="text-emerald-300 hover:text-emerald-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Press Enter or click + to add step. Workers will check these off as they complete.</p>
          </div>

          <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-700 mt-6">
            <p className="text-xs text-gray-400">
              <span className="text-red-400">*</span> Required fields
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Task
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignTaskDialog({ taskId, isOpen, onOpenChange, allUsers, currentUser, onAssign }: any) {
  const existingAssignments = useQuery(
    api.eventTaskAssignments.getTaskAssignments,
    taskId ? { taskId } : "skip"
  );
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);

  // Get IDs of already assigned users
  const assignedUserIds = existingAssignments?.map((a: any) => a.userId) || [];

  const toggleUser = (userId: Id<"users">) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      return;
    }
    onAssign(selectedUsers);
    setSelectedUsers([]);
  };

  const isAlreadyAssigned = (userId: Id<"users">) => assignedUserIds.includes(userId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Assign Team Members to Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select users to assign. Each user will track their own progress independently.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Existing Assignments */}
          {existingAssignments && existingAssignments.length > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Currently Assigned ({existingAssignments.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {existingAssignments.map((assignment: any) => (
                  <div key={assignment._id} className="flex items-center gap-2 text-xs bg-gray-700/50 p-2 rounded">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={assignment.user?.imageUrl} />
                      <AvatarFallback className="text-xs bg-blue-600">
                        {assignment.user?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">{assignment.user?.name}</div>
                      <div className="text-gray-500 text-[10px]">{assignment.progress}% progress</div>
                    </div>
                    {assignment.status === 'verified' && (
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Add More Users
            </label>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {allUsers && allUsers.length > 0 ? (
                allUsers.map((user: any) => {
                  const alreadyAssigned = isAlreadyAssigned(user._id);
                  const isSelected = selectedUsers.includes(user._id);
                  
                  return (
                    <div
                      key={user._id}
                      onClick={() => !alreadyAssigned && toggleUser(user._id)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        alreadyAssigned
                          ? 'bg-gray-700/30 border-2 border-gray-600 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-600/20 border-2 border-emerald-500 cursor-pointer'
                          : 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700 cursor-pointer'
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback className={alreadyAssigned ? "bg-gray-600 text-white" : "bg-emerald-600 text-white"}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{user.name}</p>
                        <p className="text-sm text-gray-400 truncate">{user.position} - {user.department}</p>
                      </div>
                      {alreadyAssigned && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">
                          Already Assigned
                        </Badge>
                      )}
                      {!alreadyAssigned && isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-8">No users available</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              {selectedUsers.length} user(s) selected
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedUsers([]);
                  onOpenChange(false);
                }}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={selectedUsers.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign ({selectedUsers.length})
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Clock In Dialog - Choose start time
function ClockInDialog({ taskId, isOpen, onOpenChange, onClockIn }: any) {
  const [startNow, setStartNow] = useState(true);
  const [customTime, setCustomTime] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let startTime: number | undefined = undefined;
    if (!startNow && customTime) {
      const [hours, minutes] = customTime.split(':');
      const selectedDate = new Date();
      selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      startTime = selectedDate.getTime();
    }
    
    onClockIn(startTime);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-400" />
            Clock In to Task
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Start tracking your work time for this task
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-all">
              <input
                type="radio"
                checked={startNow}
                onChange={() => setStartNow(true)}
                className="w-4 h-4 text-emerald-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">Start Now</div>
                <div className="text-sm text-gray-400">Begin tracking from current time</div>
              </div>
              <ClockIcon className="w-5 h-5 text-emerald-400" />
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-all">
              <input
                type="radio"
                checked={!startNow}
                onChange={() => setStartNow(false)}
                className="w-4 h-4 text-emerald-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">Custom Start Time</div>
                <div className="text-sm text-gray-400">Specify when you started</div>
              </div>
            </label>

            {!startNow && (
              <div className="ml-7 mt-2">
                <Label htmlFor="customTime" className="text-sm text-gray-300">Start Time</Label>
                <Input
                  id="customTime"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  required={!startNow}
                  className="bg-gray-700 border-gray-600 mt-1"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Working
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Clock Out Dialog - Add work description
function ClockOutDialog({ taskId, isOpen, onOpenChange, onClockOut }: any) {
  const [description, setDescription] = useState('');
  const [markComplete, setMarkComplete] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClockOut(description, markComplete);
    setDescription('');
    setMarkComplete(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="w-5 h-5 text-orange-400" />
            Clock Out from Task
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Record what you accomplished during this work session
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Work Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on? Any progress made?"
              rows={4}
              className="bg-gray-700 border-gray-600 mt-1"
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-all">
            <input
              type="checkbox"
              checked={markComplete}
              onChange={(e) => setMarkComplete(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <div className="flex-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                Mark Task as Complete
              </div>
              <div className="text-sm text-gray-400">Task will be moved to "In Review" for verification</div>
            </div>
          </label>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              <Pause className="w-4 h-4 mr-2" />
              {markComplete ? 'Complete & Clock Out' : 'Clock Out'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Verify Task Dialog - Approve or request revision
function VerifyTaskDialog({ taskId, isOpen, onOpenChange, onVerify }: any) {
  const [feedback, setFeedback] = useState('');
  const [approved, setApproved] = useState(true);
  
  const handleSubmit = (e: React.FormEvent, approve: boolean) => {
    e.preventDefault();
    onVerify(approve, feedback);
    setFeedback('');
    setApproved(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-purple-400" />
            Verify Task Completion
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Review and approve the completed work, or request revisions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback or comments about the work..."
              rows={4}
              className="bg-gray-700 border-gray-600 mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => handleSubmit(e, false)}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Request Revision
            </Button>
            <Button
              onClick={(e) => handleSubmit(e, true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Task Details Dialog - Show full task information including checklist
function TaskDetailsDialog({ eventId, taskId, isOpen, onOpenChange }: any) {
  const tasks = useQuery(api.eventControl.getEventTasks, isOpen ? { eventId } : "skip");
  const task = tasks?.find((t: any) => t._id === taskId);
  const allUsers = useQuery(api.users.getAllActiveUsers);
  const currentUser = useQuery(api.users.getCurrentUserStatus);
  const updateTask = useMutation(api.eventControl.updateTask);
  const [isAssigningReviewer, setIsAssigningReviewer] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editEstimatedHours, setEditEstimatedHours] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editChecklist, setEditChecklist] = useState<any[]>([]);

  useEffect(() => {
    if (task?.reportTo) {
      setSelectedReviewer(task.reportTo);
    }
    if (task) {
      setEditTitle(task.title || "");
      setEditDescription(task.description || "");
      setEditPriority(task.priority || "medium");
      setEditEstimatedHours(task.estimatedHours?.toString() || "");
      setEditLocation(task.location || "");
      setEditRequirements(task.requirements || "");
      setEditChecklist(task.checklistItems || []);
    }
  }, [task]);

  const handleAssignReviewer = async () => {
    if (!selectedReviewer || !taskId) return;
    try {
      await updateTask({ taskId, reportTo: selectedReviewer as any });
      toast.success('Reviewer assigned successfully!');
      setIsAssigningReviewer(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign reviewer');
    }
  };

  const handleSaveEdits = async () => {
    try {
      await updateTask({
        taskId,
        title: editTitle || undefined,
        description: editDescription || undefined,
        priority: editPriority as any,
        estimatedHours: editEstimatedHours ? parseFloat(editEstimatedHours) : undefined,
        location: editLocation || undefined,
        requirements: editRequirements || undefined,
      });
      toast.success('Task updated successfully!');
      setIsEditMode(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const userLevelName = typeof currentUser?.userLevel === 'string' 
    ? currentUser.userLevel 
    : currentUser?.userLevel?.name || '';
  
  const canEdit = userLevelName === "ADMIN" || userLevelName === "CAPTAIN" || userLevelName === "MANAGER" || userLevelName === "BUILDER" || (task && task.createdBy === currentUser?._id);

  if (!task) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              {isEditMode ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-lg"
                  placeholder="Task title..."
                />
              ) : (
                task.title
              )}
            </DialogTitle>
            {canEdit && (
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false);
                        setEditTitle(task.title || "");
                        setEditDescription(task.description || "");
                        setEditPriority(task.priority || "medium");
                        setEditEstimatedHours(task.estimatedHours?.toString() || "");
                        setEditLocation(task.location || "");
                        setEditRequirements(task.requirements || "");
                      }}
                      className="border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdits}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {isEditMode ? (
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="text-xs px-2 py-1 bg-gray-700 border border-gray-600 rounded"
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
                <option value="critical">CRITICAL</option>
              </select>
            ) : (
              <Badge className={`text-xs ${
                task.priority === 'critical' ? 'bg-red-600/20 text-red-300' :
                task.priority === 'high' ? 'bg-orange-600/20 text-orange-300' :
                task.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
                'bg-green-600/20 text-green-300'
              }`}>
                {task.priority?.toUpperCase()}
              </Badge>
            )}
            {task.taskType && (
              <Badge variant="outline" className="text-xs border-gray-600">
                {task.taskType}
              </Badge>
            )}
            {task.dueDate && (
              <span className="text-xs text-gray-400">
                Due: {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Description
            </h3>
            {isEditMode ? (
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="bg-gray-700 border-gray-600"
                placeholder="Enter task description..."
              />
            ) : (
              <p className="text-sm text-gray-300 bg-gray-700/30 p-3 rounded-lg">
                {task.description || "No description"}
              </p>
            )}
          </div>

          {/* Estimated Hours */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-400" />
              Estimated Time
            </h3>
            {isEditMode ? (
              <input
                type="number"
                step="0.5"
                value={editEstimatedHours}
                onChange={(e) => setEditEstimatedHours(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g., 2.5"
              />
            ) : task.estimatedHours ? (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-300">Estimated Time</span>
                  <span className="text-lg font-bold text-blue-300">{task.estimatedHours} hours</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">This is the benchmark for progress tracking</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No estimate set</p>
            )}
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Location <span className="text-xs text-gray-500">(Optional)</span>
            </h3>
            {isEditMode ? (
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="e.g., Main Hall, Parking Area, Office 2F"
              />
            ) : (
              <p className="text-sm text-gray-300 bg-gray-700/30 p-3 rounded-lg">
                {task.location || "No location specified"}
              </p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              Requirements/Materials <span className="text-xs text-gray-500">(Optional)</span>
            </h3>
            {isEditMode ? (
              <Textarea
                value={editRequirements}
                onChange={(e) => setEditRequirements(e.target.value)}
                rows={3}
                className="bg-gray-700 border-gray-600"
                placeholder="e.g., Tables (5), Chairs (20), Sound System..."
              />
            ) : (
              <p className="text-sm text-gray-300 bg-gray-700/30 p-3 rounded-lg whitespace-pre-wrap">
                {task.requirements || "No requirements specified"}
              </p>
            )}
          </div>

          {/* Assign Reviewer/Checker */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              Reviewer/Checker
            </h3>
            {task.reportToUser ? (
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-indigo-300">
                      <span className="font-semibold">{task.reportToUser.name}</span> will review this task
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAssigningReviewer(true)}
                    className="text-xs hover:bg-indigo-600/20"
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">No reviewer assigned yet</p>
                <Button
                  size="sm"
                  onClick={() => setIsAssigningReviewer(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Assign Reviewer
                </Button>
              </div>
            )}

            {/* Reviewer Selection Dialog */}
            {isAssigningReviewer && (
              <div className="mt-3 bg-gray-700/50 p-4 rounded-lg border border-indigo-500/30">
                <Label htmlFor="reviewer" className="text-sm text-white mb-2 block">
                  Select who will check/review this task:
                </Label>
                <select
                  id="reviewer"
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm mb-3"
                >
                  <option value="">Choose a reviewer...</option>
                  {allUsers?.map((user: any) => (
                    <option key={user._id} value={user._id}>
                      {user.name} - {user.userLevel?.name || 'Worker'}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAssignReviewer}
                    disabled={!selectedReviewer}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAssigningReviewer(false)}
                    className="flex-1 border-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Checklist */}
          {task.checklistItems && task.checklistItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Task Checklist ({task.checklistItems.filter((item: any) => item.completed).length}/{task.checklistItems.length})
              </h3>
              <div className="space-y-2">
                {task.checklistItems.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-gray-700/30 border-gray-700/50'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-500'
                    }`}>
                      {item.completed && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        item.completed ? 'text-emerald-200 line-through' : 'text-gray-200'
                      }`}>
                        {item.text}
                      </p>
                      {item.completed && item.completedAt && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Completed {formatDate(item.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creator Info */}
          {task.creator && (
            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Created by <span className="text-gray-300 font-semibold">{task.creator.name}</span> on {formatDate(task.createdAt)}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gray-700 hover:bg-gray-600"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Manage People Dialog - Add/Remove assigned users
function ManagePeopleDialog({ taskId, eventId, isOpen, onOpenChange }: any) {
  const tasks = useQuery(api.eventControl.getEventTasks, isOpen ? { eventId } : "skip");
  const task = tasks?.find((t: any) => t._id === taskId);
  const allUsers = useQuery(api.users.getAllActiveUsers);
  const taskAssignments = useQuery(api.eventTaskAssignments.getTaskAssignments, isOpen && taskId ? { taskId } : "skip");
  const assignUsersToTask = useMutation(api.eventTaskAssignments.assignUsersToTask);
  const removeAssignment = useMutation(api.eventTaskAssignments.removeAssignment);
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  useEffect(() => {
    // Get currently assigned users from task assignments
    if (taskAssignments && taskAssignments.length > 0) {
      const assignedUserIds = taskAssignments.map((assignment: any) => assignment.user?._id).filter(Boolean);
      setSelectedUsers(assignedUserIds);
    } else if (task?.assignedUsers && task.assignedUsers.length > 0) {
      // Fallback to task.assignedUsers if assignments not loaded yet
      setSelectedUsers(task.assignedUsers.map((u: any) => u._id));
    }
  }, [taskAssignments, task]);
  
  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSave = async () => {
    try {
      // Always reassign with the selected users (this handles both add and remove)
      await assignUsersToTask({
        taskId,
        userIds: selectedUsers as any,
      });
      
      toast.success('Team updated successfully!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update team');
    }
  };
  
  if (!task) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Manage People
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add or remove people from this task
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto">
          {allUsers?.map((user: any) => {
            const isSelected = selectedUsers.includes(user._id);
            return (
              <div
                key={user._id}
                onClick={() => toggleUser(user._id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-gray-700/30 border-gray-700 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-500'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold border-2 border-gray-600">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.userLevel?.name || 'WORKER'} - {user.position || 'Community Member'}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} assigned
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Team
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
