"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  Flag,
  Milestone as MilestoneIcon,
  Plus,
  BarChart3,
  ListTodo,
  CalendarDays,
  MessageSquare,
  Settings,
  Award,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileEdit,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";

interface ProjectDashboardProps {
  projectId: Id<"projects">;
  userRole?: "ADMIN" | "MANAGER" | "BUILDER" | "WORKER";
}

export function ProjectDashboard({ projectId, userRole }: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const projectDetails = useQuery(api.projects.getProjectDetails, { projectId });
  const tasks = useQuery(api.productivity.getProjectTasks, projectId ? { projectId } : "skip");
  const events = useQuery(api.events.getProjectEvents, projectId ? { projectId } : "skip");
  
  const startProject = useMutation(api.projects.startProject);
  const completeMilestone = useMutation(api.projects.completeMilestone);
  const completeProject = useMutation(api.projects.completeProject);
  const reviewProject = useMutation(api.projects.reviewProject);

  if (!projectDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  const handleStartProject = async () => {
    try {
      await startProject({ projectId });
    } catch (error) {
      console.error("Failed to start project:", error);
    }
  };

  const handleApprove = async () => {
    try {
      await reviewProject({ projectId, action: "approve" });
    } catch (error) {
      console.error("Failed to approve project:", error);
    }
  };

  const handleReject = async () => {
    const feedback = prompt("Please provide feedback for rejection:");
    if (feedback) {
      try {
        await reviewProject({ projectId, action: "reject", feedback });
      } catch (error) {
        console.error("Failed to reject project:", error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-500",
      pending_approval: "bg-yellow-500",
      approved: "bg-green-500",
      active: "bg-blue-500",
      on_hold: "bg-orange-500",
      completed: "bg-emerald-500",
      cancelled: "bg-red-500",
      archived: "bg-gray-600",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "text-green-400 border-green-500",
      medium: "text-yellow-400 border-yellow-500",
      high: "text-orange-400 border-orange-500",
      critical: "text-red-400 border-red-500",
    };
    return colors[priority as keyof typeof colors] || "text-gray-400 border-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{projectDetails.title}</h1>
              <Badge className={`${getStatusColor(projectDetails.status)} text-white`}>
                {projectDetails.status.replace("_", " ")}
              </Badge>
              {projectDetails.urgency !== "normal" && (
                <Badge variant="destructive" className="animate-pulse">
                  {projectDetails.urgency}
                </Badge>
              )}
            </div>
            <p className="text-gray-400 mb-4">{projectDetails.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-blue-400" />
                {format(projectDetails.startDate, "MMM d, yyyy")} - {format(projectDetails.endDate, "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="w-4 h-4 text-emerald-400" />
                {projectDetails.teamMembers?.length || 0} members
              </div>
              {projectDetails.location && (
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-red-400" />
                  {projectDetails.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Flag className={`w-4 h-4 ${getPriorityColor(projectDetails.priority).split(" ")[0]}`} />
                <span className={getPriorityColor(projectDetails.priority).split(" ")[0]}>
                  {projectDetails.priority} priority
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {projectDetails.status === "pending_approval" && (userRole === "MANAGER" || userRole === "ADMIN") && (
              <>
                <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button onClick={handleReject} variant="destructive">
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            
            {projectDetails.status === "approved" && (
              <Button onClick={handleStartProject} className="bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                Start Project
              </Button>
            )}
            
            {projectDetails.status === "active" && projectDetails.progress === 100 && (
              <Button onClick={() => completeProject({ projectId })} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Project
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Progress</p>
                  <p className="text-3xl font-bold text-white">{projectDetails.progress}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
              <Progress value={projectDetails.progress} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Tasks</p>
                  <p className="text-3xl font-bold text-white">
                    {projectDetails.stats?.completedTasks}/{projectDetails.stats?.totalTasks}
                  </p>
                </div>
                <ListTodo className="w-8 h-8 text-emerald-200" />
              </div>
              <p className="text-xs text-emerald-100 mt-2">
                {projectDetails.stats?.inProgressTasks} in progress
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Budget</p>
                  <p className="text-3xl font-bold text-white">
                    {projectDetails.stats?.budgetUsed.toFixed(0)}%
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-200" />
              </div>
              <p className="text-xs text-purple-100 mt-2">
                ₱{projectDetails.spent.toLocaleString()} / ₱{projectDetails.budget.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Time Left</p>
                  <p className="text-3xl font-bold text-white">
                    {projectDetails.stats?.daysRemaining}d
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
              <p className="text-xs text-orange-100 mt-2">
                {projectDetails.stats?.daysRemaining < 0 ? "Overdue" : "Days remaining"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* XP Reward Banner */}
        {projectDetails.totalExperienceReward > 0 && (
          <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-white font-semibold">Project Reward</p>
                    <p className="text-sm text-gray-300">
                      Complete this project to earn {projectDetails.totalExperienceReward} XP!
                    </p>
                  </div>
                </div>
                <Badge className="bg-yellow-600 text-white text-lg px-4 py-2">
                  Level {projectDetails.projectLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600">
              <ListTodo className="w-4 h-4 mr-2" />
              Tasks ({projectDetails.stats?.totalTasks})
            </TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-blue-600">
              <MilestoneIcon className="w-4 h-4 mr-2" />
              Milestones ({projectDetails.milestones.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-blue-600">
              <Users className="w-4 h-4 mr-2" />
              Team ({projectDetails.teamMembers?.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-blue-600">
              <CalendarDays className="w-4 h-4 mr-2" />
              Events ({events?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Success Criteria */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-emerald-400" />
                    Success Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectDetails.successCriteria.map((criterion, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        criterion.achieved
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {criterion.achieved ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{criterion.criterion}</p>
                          {criterion.targetValue && (
                            <p className="text-sm text-gray-400">Target: {criterion.targetValue}</p>
                          )}
                          {criterion.achieved && criterion.achievedAt && (
                            <p className="text-xs text-emerald-400 mt-1">
                              Achieved {formatDistanceToNow(criterion.achievedAt, { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Impact & Benefits */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Impact & Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projectDetails.estimatedBeneficiaries && projectDetails.estimatedBeneficiaries > 0 && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Estimated Beneficiaries</p>
                      <p className="text-2xl font-bold text-white">
                        {projectDetails.estimatedBeneficiaries?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">People who will benefit</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Impact Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {projectDetails.impactArea.map((area) => (
                        <Badge key={area} variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {projectDetails.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Visibility</span>
                      <Badge className="bg-gray-700">
                        <Eye className="w-3 h-3 mr-1" />
                        {projectDetails.publicVisibility}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectDetails.statusHistory.map((history, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(history.status)}`} />
                        {index < projectDetails.statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-white font-medium">{history.status.replace("_", " ")}</p>
                        <p className="text-sm text-gray-400">{history.notes}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(history.changedAt, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Project Tasks</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task: any) => (
                      <div
                        key={task._id}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{task.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {task.difficulty}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                +{task.experienceReward} XP
                              </span>
                            </div>
                          </div>
                          <Badge className={task.status === "completed" ? "bg-emerald-600" : "bg-gray-700"}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tasks yet</p>
                    <p className="text-sm">Create tasks to track project progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Project Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectDetails.milestones
                    .sort((a, b) => a.order - b.order)
                    .map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          milestone.completed
                            ? "bg-emerald-500/10 border-emerald-500"
                            : "bg-gray-800 border-blue-500"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {milestone.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-500" />
                              )}
                              <h4 className="text-white font-semibold">{milestone.title}</h4>
                            </div>
                            <p className="text-sm text-gray-400 ml-8">{milestone.description}</p>
                            <div className="flex items-center gap-4 ml-8 mt-2">
                              <span className="text-xs text-gray-500">
                                Due: {format(milestone.dueDate, "MMM d, yyyy")}
                              </span>
                              {milestone.completed && milestone.completedAt && (
                                <span className="text-xs text-emerald-400">
                                  Completed {formatDistanceToNow(milestone.completedAt, { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                          {!milestone.completed && (
                            <Button
                              size="sm"
                              onClick={() => completeMilestone({ projectId, milestoneId: milestone.id })}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Project Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectDetails.teamMembers?.map((member: any) => (
                    <div key={member._id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.imageUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{member.name}</p>
                          <p className="text-sm text-gray-400 truncate">{member.position}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {member.userLevel?.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Project Events</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Event
                </Button>
              </CardHeader>
              <CardContent>
                {events && events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event: any) => (
                      <div key={event._id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{event.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{event.description.split('\n')[0]}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <span className="flex items-center gap-1 text-gray-400">
                                <Calendar className="w-4 h-4" />
                                {format(event.startDate, "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1 text-gray-400">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                              <Badge variant="outline">{event.attendeeCount} attending</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No events scheduled</p>
                    <p className="text-sm">Schedule events to keep your team aligned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
