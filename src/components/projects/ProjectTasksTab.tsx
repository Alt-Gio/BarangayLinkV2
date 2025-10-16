"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  Plus, 
  Circle, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  User,
  Calendar,
  Flag,
  Zap,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProjectTasksTabProps {
  projectId: Id<"projects">;
  project: any;
  currentUser: any;
}

export function ProjectTasksTab({ projectId, project, currentUser }: ProjectTasksTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    difficulty: "medium" as "trivial" | "easy" | "medium" | "hard",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
    assignedTo: [] as Id<"users">[],
  });

  // Queries
  const tasks = useQuery(api.gamifiedTasks.getProjectTasks, { projectId });
  const teamMembers = useQuery(api.users.getProjectTeamMembers, { projectId });

  // Mutations
  const createTask = useMutation(api.gamifiedTasks.createTask);
  const updateTaskStatus = useMutation(api.gamifiedTasks.updateTaskStatus);
  const assignTask = useMutation(api.gamifiedTasks.assignUsersToTask);

  // Status columns configuration
  const statusColumns = [
    { 
      id: "todo", 
      label: "To Do", 
      icon: Circle, 
      color: "text-gray-400",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-500/30"
    },
    { 
      id: "in_progress", 
      label: "In Progress", 
      icon: Clock, 
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30"
    },
    { 
      id: "review", 
      label: "Review", 
      icon: AlertCircle, 
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30"
    },
    { 
      id: "completed", 
      label: "Completed", 
      icon: CheckCircle2, 
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-500/30"
    },
  ];

  // Group tasks by status
  const tasksByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = tasks?.filter(t => t.status === column.id) || [];
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate stats
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasksByStatus.completed.length;
  const inProgressTasks = tasksByStatus.in_progress.length;
  const todoTasks = tasksByStatus.todo.length;
  const reviewTasks = tasksByStatus.review.length;

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const assignees = newTask.assignedTo.length > 0 
        ? newTask.assignedTo 
        : [currentUser._id]; // Default to creator if no one selected

      await createTask({
        title: newTask.title,
        description: newTask.description,
        type: "todo",
        difficulty: newTask.difficulty,
        priority: newTask.priority,
        projectId,
        assignedTo: assignees,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined,
        tags: [project.title, project.department],
      });

      // Reset form
      setNewTask({
        title: "",
        description: "",
        difficulty: "medium",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
      });
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task");
    }
  };

  const toggleAssignee = (userId: Id<"users">) => {
    setNewTask(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  const handleStatusChange = async (taskId: Id<"tasks">, newStatus: string) => {
    try {
      await updateTaskStatus({ 
        taskId, 
        status: newStatus as "todo" | "in_progress" | "review" | "completed" | "cancelled"
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "trivial": return "bg-gray-500/20 text-gray-300";
      case "easy": return "bg-green-500/20 text-green-300";
      case "medium": return "bg-yellow-500/20 text-yellow-300";
      case "hard": return "bg-red-500/20 text-red-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "text-gray-400";
      case "medium": return "text-blue-400";
      case "high": return "text-orange-400";
      case "urgent": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalTasks}</div>
              <div className="text-xs text-gray-400 mt-1">Total Tasks</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-300">{todoTasks}</div>
              <div className="text-xs text-gray-400 mt-1">To Do</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{inProgressTasks}</div>
              <div className="text-xs text-blue-400 mt-1">In Progress</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">{reviewTasks}</div>
              <div className="text-xs text-yellow-400 mt-1">Review</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{completedTasks}</div>
              <div className="text-xs text-emerald-400 mt-1">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Task Button */}
      {!isCreating && (
        <Button
          onClick={() => setIsCreating(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Task
        </Button>
      )}

      {/* Create Task Form */}
      {isCreating && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Create New Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="What needs to be done?"
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Add more details..."
                rows={3}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  value={newTask.difficulty}
                  onChange={(e) => setNewTask({ ...newTask, difficulty: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white"
                >
                  <option value="trivial" className="bg-gray-900">Trivial</option>
                  <option value="easy" className="bg-gray-900">Easy</option>
                  <option value="medium" className="bg-gray-900">Medium</option>
                  <option value="hard" className="bg-gray-900">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white"
                >
                  <option value="low" className="bg-gray-900">Low</option>
                  <option value="medium" className="bg-gray-900">Medium</option>
                  <option value="high" className="bg-gray-900">High</option>
                  <option value="urgent" className="bg-gray-900">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Team Member Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assign to Team Members
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                {teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map((member: any) => (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => toggleAssignee(member._id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                        newTask.assignedTo.includes(member._id)
                          ? 'border-emerald-500 bg-emerald-500/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback className="bg-emerald-600 text-white text-xs">
                          {member.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {member.position}
                        </div>
                      </div>
                      {newTask.assignedTo.includes(member._id) && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="col-span-3 text-center text-gray-500 py-4">
                    No team members available
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {newTask.assignedTo.length === 0 
                  ? "Task will be assigned to you by default" 
                  : `${newTask.assignedTo.length} member(s) selected`}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={!newTask.title.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => {
          const Icon = column.icon;
          const columnTasks = tasksByStatus[column.id];

          return (
            <div key={column.id} className="space-y-3">
              {/* Column Header */}
              <div className={`${column.bgColor} ${column.borderColor} border rounded-lg p-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${column.color}`} />
                    <span className={`font-semibold ${column.color}`}>{column.label}</span>
                  </div>
                  <Badge className="bg-gray-700/50 text-white">{columnTasks.length}</Badge>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-2 min-h-[200px]">
                {columnTasks.map((task) => (
                  <Card 
                    key={task._id} 
                    className="bg-gray-800/70 border-gray-700/50 hover:border-emerald-500/30 transition-all cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Task Title */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-white text-sm line-clamp-2">{task.title}</h4>
                          <button className="text-gray-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Task Meta */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getDifficultyColor(task.difficulty)}>
                            <Trophy className="w-3 h-3 mr-1" />
                            {task.difficulty}
                          </Badge>

                          <Badge className={`${getPriorityColor(task.priority)} bg-gray-700/30`}>
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority}
                          </Badge>

                          {task.experienceReward && (
                            <Badge className="bg-purple-500/20 text-purple-300">
                              <Zap className="w-3 h-3 mr-1" />
                              {task.experienceReward} XP
                            </Badge>
                          )}
                        </div>

                        {/* Assignees */}
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex items-center gap-1">
                            {task.assignees.slice(0, 3).map((assignee: any) => (
                              <Avatar key={assignee._id} className="w-6 h-6">
                                <AvatarImage src={assignee.imageUrl} />
                                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                                  {assignee.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {task.assignees.length > 3 && (
                              <span className="text-xs text-gray-400 ml-1">
                                +{task.assignees.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Due Date */}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}

                        {/* Status Actions */}
                        <div className="flex gap-1">
                          {statusColumns
                            .filter(s => s.id !== column.id)
                            .map((targetStatus) => (
                              <button
                                key={targetStatus.id}
                                onClick={() => handleStatusChange(task._id, targetStatus.id)}
                                className={`text-xs px-2 py-1 rounded ${targetStatus.bgColor} ${targetStatus.color} hover:opacity-80 transition-opacity`}
                                title={`Move to ${targetStatus.label}`}
                              >
                                {targetStatus.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No tasks in {column.label.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
