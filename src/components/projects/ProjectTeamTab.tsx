"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search,
  Crown,
  Shield,
  Hammer,
  User,
  Mail,
  Building,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ProjectTeamTabProps {
  projectId: Id<"projects">;
  project: any;
  currentUser: any;
}

export function ProjectTeamTab({ projectId, project, currentUser }: ProjectTeamTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);

  const teamMembers = useQuery(api.projects.getProjectTeamMembers, { projectId });
  const availableUsers = useQuery(
    api.projects.searchAvailableUsers,
    searchTerm ? { department: project.department, searchTerm } : "skip"
  );
  
  const assignUser = useMutation(api.projects.assignUserToProject);
  const removeUser = useMutation(api.projects.removeUserFromProject);

  // Get user stats for team members
  const getUserStats = (userId: Id<"users">) => {
    // You can add a query to get user task stats here
    return {
      tasksCompleted: 0,
      tasksInProgress: 0,
      totalXP: 0,
    };
  };

  const handleAssignUser = async (userId: Id<"users">) => {
    try {
      await assignUser({ projectId, userId });
      setSearchTerm('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to add team member');
    }
  };

  const handleRemoveUser = async (userId: Id<"users">) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      try {
        await removeUser({ projectId, userId });
      } catch (error) {
        console.error('Error removing user:', error);
        alert('Failed to remove team member');
      }
    }
  };

  const getRoleIcon = (levelName: string) => {
    switch (levelName) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'MANAGER': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'BUILDER': return <Hammer className="w-4 h-4 text-emerald-400" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const canManageTeam = currentUser?.userLevel?.name === 'ADMIN' || 
                        currentUser?.userLevel?.name === 'MANAGER' ||
                        project.createdBy === currentUser?._id;

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {teamMembers?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {teamMembers?.filter((m: any) => 
                    getUserStats(m._id).tasksCompleted > 0
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-400">Active Contributors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {teamMembers?.reduce((acc: number, m: any) => 
                    acc + getUserStats(m._id).tasksInProgress, 0
                  ) || 0}
                </div>
                <div className="text-sm text-gray-400">Tasks in Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {teamMembers?.reduce((acc: number, m: any) => 
                    acc + getUserStats(m._id).totalXP, 0
                  ) || 0}
                </div>
                <div className="text-sm text-gray-400">Total Team XP</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Team Member */}
      {canManageTeam && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" />
              Add Team Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name or department..."
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchTerm && availableUsers && availableUsers.length > 0 && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {availableUsers.map((user: any) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <Building className="w-3 h-3" />
                          {user.department} • {user.position}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAssignUser(user._id)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Team Members ({teamMembers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map((member: any) => {
                const stats = getUserStats(member._id);
                const isProjectCreator = project.createdBy === member._id;
                
                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {member.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{member.name}</span>
                          {isProjectCreator && (
                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                              Project Lead
                            </Badge>
                          )}
                          <Badge className="bg-gray-700/50 text-gray-300 border-gray-600/20 flex items-center gap-1">
                            {getRoleIcon(member.userLevel?.name)}
                            {member.userLevel?.name}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {member.department}
                          </span>
                          <span>•</span>
                          <span>{member.position}</span>
                        </div>

                        {/* Member Stats */}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {stats.tasksCompleted} completed
                          </span>
                          <span className="flex items-center gap-1 text-blue-400">
                            <Clock className="w-3 h-3" />
                            {stats.tasksInProgress} in progress
                          </span>
                          <span className="flex items-center gap-1 text-yellow-400">
                            <TrendingUp className="w-3 h-3" />
                            Level {member.level || 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canManageTeam && !isProjectCreator && member._id !== currentUser?._id && (
                      <Button
                        onClick={() => handleRemoveUser(member._id)}
                        variant="outline"
                        size="sm"
                        className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No team members yet</p>
                <p className="text-sm text-gray-500 mt-2">Add team members to collaborate on this project</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
