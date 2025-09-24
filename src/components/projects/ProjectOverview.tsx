"use client";

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, DollarSign, Users, TrendingUp, CheckCircle } from 'lucide-react';

interface ProjectOverviewProps {
  project: any;
  tasks: any[];
  events: any[];
  teamMembers: any[];
}

export function ProjectOverview({ project, tasks, events, teamMembers }: ProjectOverviewProps) {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const budgetUsed = project.spent || 0;
  const budgetTotal = project.budget || 0;
  const budgetPercentage = budgetTotal > 0 ? Math.round((budgetUsed / budgetTotal) * 100) : 0;

  // Calculate days remaining
  const today = new Date();
  const endDate = new Date(project.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Upcoming events
  const upcomingEvents = events.filter(e => e.startDate > Date.now()).slice(0, 3);
  
  // Recent activity (mock data for now)
  const recentActivity = [
    { id: 1, action: "Project created", timestamp: project.startDate, type: "create" },
    ...tasks.slice(0, 3).map((task, index) => ({
      id: index + 2,
      action: `Task "${task.title}" ${task.status}`,
      timestamp: task.updatedAt || Date.now(),
      type: "task"
    }))
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTasks}</div>
            <p className="text-xs text-gray-400">
              {completedTasks} completed, {inProgressTasks} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{project.progress}%</div>
            <Progress value={project.progress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Budget Used</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₱{budgetUsed.toLocaleString()}</div>
            <p className="text-xs text-gray-400">
              {budgetPercentage}% of ₱{budgetTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Days Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {daysRemaining > 0 ? daysRemaining : 'Overdue'}
            </div>
            <p className="text-xs text-gray-400">
              Until {new Date(project.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Department</h4>
                  <p className="text-white">{project.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Priority</h4>
                  <Badge variant="outline" className={
                    project.priority === 'critical' ? 'text-red-400 border-red-600' :
                    project.priority === 'high' ? 'text-orange-400 border-orange-600' :
                    project.priority === 'medium' ? 'text-yellow-400 border-yellow-600' :
                    'text-green-400 border-green-600'
                  }>
                    {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1)}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Start Date</h4>
                  <p className="text-white">{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">End Date</h4>
                  <p className="text-white">{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                <p className="text-gray-300 leading-relaxed">{project.description}</p>
              </div>

              {project.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Location</h4>
                  <p className="text-white">{project.location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Progress Breakdown */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Task Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Overall Completion</span>
                  <span className="text-white font-medium">{taskCompletionRate}%</span>
                </div>
                <Progress value={taskCompletionRate} className="h-3" />
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-xl font-bold text-green-400">{completedTasks}</div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-xl font-bold text-blue-400">{inProgressTasks}</div>
                    <div className="text-sm text-gray-400">In Progress</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="p-3 bg-gray-700/50 rounded-lg">
                      <h4 className="font-medium text-white text-sm">{event.title}</h4>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(event.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          {/* Team Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{project.assignedTo?.length || 0} members</span>
              </div>
              <div className="space-y-2">
                {project.assignedTo?.slice(0, 3).map((memberId: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {memberId.substring(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-300">Team Member {index + 1}</span>
                  </div>
                ))}
                {project.assignedTo?.length > 3 && (
                  <p className="text-xs text-gray-400">+{project.assignedTo.length - 3} more</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
