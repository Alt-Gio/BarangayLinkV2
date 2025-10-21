"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { MobilePage } from '@/components/layout/MobilePage';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Flame,
  Shield,
  Briefcase,
  User,
  Crown,
  Activity,
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';
import { useRouter } from 'next/navigation';

export default function TeamWorkloadPage() {
  const router = useRouter();
  const { currentUser } = useOfflineData();
  const workloadData = useQuery(api.teamWorkload.getTeamWorkload);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"tasks" | "name" | "completion">("tasks");

  if (!workloadData) {
    return (
      <MobilePage
        title="Team Workload"
        subtitle="Loading workload data..."
        userRole={currentUser?.userLevel?.name || "WORKER"}
        showBack={true}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </MobilePage>
    );
  }

  const { users, teamStats } = workloadData;

  // Filter and sort users
  let filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    
    const matchesStatus =
      filterStatus === "all" || user.workloadStatus === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort users
  filteredUsers.sort((a, b) => {
    switch (sortBy) {
      case "tasks":
        return b.activeTasks - a.activeTasks;
      case "name":
        return a.name.localeCompare(b.name);
      case "completion":
        return b.completionRate - a.completionRate;
      default:
        return 0;
    }
  });

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case "overloaded":
        return "text-red-500 bg-red-500/10 border-red-500/50";
      case "heavy":
        return "text-orange-500 bg-orange-500/10 border-orange-500/50";
      case "optimal":
        return "text-green-500 bg-green-500/10 border-green-500/50";
      case "light":
        return "text-blue-500 bg-blue-500/10 border-blue-500/50";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/50";
    }
  };

  const getWorkloadLabel = (status: string) => {
    switch (status) {
      case "overloaded":
        return "Overloaded";
      case "heavy":
        return "Heavy Load";
      case "optimal":
        return "Optimal";
      case "light":
        return "Light Load";
      default:
        return "Unknown";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="w-4 h-4" />;
      case "CAPTAIN":
        return <Shield className="w-4 h-4" />;
      case "MANAGER":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "text-purple-400";
      case "CAPTAIN":
        return "text-blue-400";
      case "MANAGER":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <MobilePage
      title="Team Workload"
      subtitle="Track team capacity and task distribution"
      userRole={currentUser?.userLevel?.name || "WORKER"}
      showBack={true}
      collapsibleHeader={
        <div className="space-y-4">
          {/* Team Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Team</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {teamStats.totalMembers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Active</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {teamStats.totalActiveTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Overloaded</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {teamStats.overloadedMembers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Avg/Person</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {teamStats.averageTasksPerPerson}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[140px] bg-gray-700 border-gray-600">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CAPTAIN">Captain</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="BUILDER">Builder</SelectItem>
                <SelectItem value="WORKER">Worker</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px] bg-gray-700 border-gray-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="overloaded">Overloaded</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
                <SelectItem value="optimal">Optimal</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-[140px] bg-gray-700 border-gray-600">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tasks">By Tasks</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
                <SelectItem value="completion">By Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No team members found</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user.userId}
              className={`bg-gray-800 border-2 hover:bg-gray-750 transition-all cursor-pointer ${
                user.workloadStatus === "overloaded"
                  ? "border-red-500/50 hover:border-red-500"
                  : "border-gray-700 hover:border-gray-600"
              }`}
              onClick={() => {
                // Navigate to user's task details
                router.push(`/dashboard/team-workload/${user.userId}`);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-gray-700">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name and Role */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold text-base sm:text-lg truncate ${
                          user.workloadStatus === "overloaded"
                            ? "text-red-400"
                            : "text-white"
                        }`}
                      >
                        {user.name}
                      </h3>
                      <div className={`flex items-center gap-1 ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="text-xs font-medium hidden sm:inline">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-400 truncate mb-3">
                      {user.email}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap mb-3">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-white">
                          {user.activeTasks}
                        </span>
                        <span className="text-xs text-gray-400">active</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-white">
                          {user.completedTasks}
                        </span>
                        <span className="text-xs text-gray-400">done</span>
                      </div>

                      {user.overdueTasks > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-semibold text-red-400">
                            {user.overdueTasks}
                          </span>
                          <span className="text-xs text-gray-400">overdue</span>
                        </div>
                      )}

                      {user.highPriorityTasks > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-semibold text-orange-400">
                            {user.highPriorityTasks}
                          </span>
                          <span className="text-xs text-gray-400">urgent</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Completion Rate</span>
                        <span className="font-semibold text-white">
                          {user.completionRate}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-green-500 transition-all duration-300"
                          style={{ width: `${user.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Arrow */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge
                      className={`${getWorkloadColor(
                        user.workloadStatus
                      )} border text-xs font-semibold px-2 py-1`}
                    >
                      {getWorkloadLabel(user.workloadStatus)}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Legend */}
      <Card className="bg-gray-800/50 border-gray-700 mt-6">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-white mb-3">
            Workload Status Legend
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-300">Light (0-4 tasks)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-300">Optimal (5-9 tasks)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-300">Heavy (10-14 tasks)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-300">Overloaded (15+ tasks)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </MobilePage>
  );
}
