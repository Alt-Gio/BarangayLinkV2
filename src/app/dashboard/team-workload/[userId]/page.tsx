"use client";

import { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { MobilePage } from '@/components/layout/MobilePage';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Flame,
  Package,
  ArrowLeft,
  User,
} from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useRouter } from 'next/navigation';

export default function UserWorkloadDetailPage({
  params,
}: {
  params: Promise<{ userId: Id<"users"> }>;
}) {
  const router = useRouter();
  const { currentUser } = useOfflineData();
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const userTasks = useQuery(api.teamWorkload.getUserTasks, { userId });
  const workloadData = useQuery(api.teamWorkload.getTeamWorkload);
  const user = workloadData?.users.find((u) => u.userId === userId);

  if (!userTasks || !user) {
    return (
      <MobilePage
        title="Loading..."
        subtitle="Fetching user details"
        userRole={currentUser?.userLevel?.name || "WORKER"}
        showBack={true}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </MobilePage>
    );
  }

  const { standaloneTasks, eventTasks } = userTasks;

  const allTasks = [
    ...standaloneTasks.map((t) => ({
      ...t,
      type: "standalone" as const,
    })),
    ...eventTasks.map((t) => ({
      ...t,
      type: "event" as const,
    })),
  ];

  const activeTasks = allTasks.filter(
    (t) => t.status !== "done" && !t.isArchived
  );
  const completedTasks = allTasks.filter((t) => t.status === "done");
  const overdueTasks = activeTasks.filter(
    (t) => t.dueDate && t.dueDate < Date.now()
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500/20 text-green-400";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400";
      case "in_review":
        return "bg-purple-500/20 text-purple-400";
      case "blocked":
        return "bg-red-500/20 text-red-400";
      case "todo":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = timestamp - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = task.dueDate && task.dueDate < Date.now();

    return (
      <Card
        className={`bg-gray-800 border-2 hover:bg-gray-750 transition-all ${
          isOverdue ? "border-red-500/50" : "border-gray-700"
        }`}
      >
        <CardContent className="p-4">
          {/* Task Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1 line-clamp-2">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
            </div>
            
            {task.priority && (
              <Badge
                className={`${getPriorityColor(task.priority)} border text-xs flex-shrink-0`}
              >
                {task.priority}
              </Badge>
            )}
          </div>

          {/* Task Meta */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <Badge className={`${getStatusColor(task.status)} text-xs`}>
              {task.status.replace("_", " ")}
            </Badge>

            {task.type === "event" && task.eventTitle && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Package className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{task.eventTitle}</span>
              </div>
            )}

            {task.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "text-red-400" : "text-gray-400"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar (if available) */}
          {task.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Progress</span>
                <span className="font-semibold text-white">{task.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-green-500 transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MobilePage
      title={user.name}
      subtitle={`${user.role} • ${user.email}`}
      userRole={currentUser?.userLevel?.name || "WORKER"}
      showBack={true}
      onBack={() => router.push("/dashboard/team-workload")}
      collapsibleHeader={
        <div className="space-y-4">
          {/* User Info Card */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-gray-700">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="bg-gray-700 text-white text-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white mb-1">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">{user.email}</p>
                  <Badge
                    className={`${
                      user.workloadStatus === "overloaded"
                        ? "bg-red-500/20 text-red-400 border-red-500/50"
                        : user.workloadStatus === "heavy"
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                        : user.workloadStatus === "optimal"
                        ? "bg-green-500/20 text-green-400 border-green-500/50"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/50"
                    } border text-xs`}
                  >
                    {user.workloadStatus === "overloaded"
                      ? "Overloaded"
                      : user.workloadStatus === "heavy"
                      ? "Heavy Load"
                      : user.workloadStatus === "optimal"
                      ? "Optimal Load"
                      : "Light Load"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Active</p>
                    <p className="text-xl font-bold text-white">
                      {user.activeTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Done</p>
                    <p className="text-xl font-bold text-white">
                      {user.completedTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Overdue</p>
                    <p className="text-xl font-bold text-white">
                      {user.overdueTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Urgent</p>
                    <p className="text-xl font-bold text-white">
                      {user.highPriorityTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completion Rate */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Completion Rate</span>
                  <span className="text-lg font-bold text-white">
                    {user.completionRate}%
                  </span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-green-500 transition-all"
                    style={{ width: `${user.completionRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {/* Task Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-gray-800">
          <TabsTrigger value="active" className="data-[state=active]:bg-teal-600">
            Active ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-teal-600">
            Completed ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-teal-600">
            Overdue ({overdueTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {activeTasks.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active tasks</p>
              </CardContent>
            </Card>
          ) : (
            activeTasks.map((task) => <TaskCard key={task._id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-3">
          {completedTasks.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No completed tasks yet</p>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => <TaskCard key={task._id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4 space-y-3">
          {overdueTasks.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-gray-400">No overdue tasks! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            overdueTasks.map((task) => <TaskCard key={task._id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </MobilePage>
  );
}
