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
  const [positionFilter, setPositionFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);

  const teamMembers = useQuery(api.users.getProjectTeamMembers, { projectId });
  const teamStats = useQuery(api.teamStats.getAllTeamStats, { projectId });
  
  // Get team member IDs to exclude from search
  const teamMemberIds = teamMembers?.map(m => m._id) || [];
  
  const availableUsers = useQuery(
    api.users.searchUsers,
    searchTerm ? { 
      searchTerm,
      excludeUserIds: teamMemberIds 
    } : "skip"
  );
  
  const assignUser = useMutation(api.projects.assignUserToProject);
  const removeUser = useMutation(api.projects.removeUserFromProject);

  // Get user stats from the query result
  const getUserStats = (userId: Id<"users">) => {
    const memberStats = teamStats?.find(s => s.userId === userId);
    return memberStats?.stats || {
      total: 0,
      completed: 0,
      inProgress: 0,
      completionRate: 0,
      totalXP: 0,
      totalGold: 0,
      hoursLogged: 0,
    };
  };

  const handleAssignUser = async (userId: Id<"users">) => {
    try {
      await assignUser({ projectId, userId });
      setSearchTerm('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to add team member');
    }
  };

  const handleBulkAssignUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to add');
      return;
    }

    try {
      // Add all selected users
      await Promise.all(
        selectedUsers.map(userId => assignUser({ projectId, userId }))
      );
      setSelectedUsers([]);
      setSearchTerm('');
      setPositionFilter('');
    } catch (error) {
      console.error('Error adding team members:', error);
      alert('Failed to add some team members');
    }
  };

  const toggleUserSelection = (userId: Id<"users">) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllVisible = () => {
    if (!availableUsers) return;
    const visibleUserIds = availableUsers.map((u: any) => u._id);
    setSelectedUsers(visibleUserIds);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
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
                  {teamStats?.filter((s: any) => 
                    s.stats.completed > 0
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
                  {teamStats?.reduce((acc: number, s: any) => 
                    acc + s.stats.inProgress, 0
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
                  {teamStats?.reduce((acc: number, s: any) => 
                    acc + s.stats.totalXP, 0
                  ).toLocaleString() || 0}
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
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Add Team Members
              </div>
              {selectedUsers.length > 0 && (
                <Badge className="bg-emerald-600 text-white">
                  {selectedUsers.length} selected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                />
              </div>
              <Input
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                placeholder="Filter by position (e.g., Engineer, Manager)..."
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>

            {/* Bulk Actions */}
            {searchTerm && availableUsers && availableUsers.length > 0 && (
              <div className="flex items-center justify-between mb-3 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                <div className="flex gap-2">
                  <Button
                    onClick={selectAllVisible}
                    size="sm"
                    variant="outline"
                    className="bg-emerald-600/10 border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/20"
                  >
                    Select All ({availableUsers.length})
                  </Button>
                  {selectedUsers.length > 0 && (
                    <Button
                      onClick={clearSelection}
                      size="sm"
                      variant="outline"
                      className="bg-gray-600/10 border-gray-600/50 text-gray-400 hover:bg-gray-600/20"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {selectedUsers.length > 0 && (
                  <Button
                    onClick={handleBulkAssignUsers}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add {selectedUsers.length} Member{selectedUsers.length > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            )}

            {/* Search Results */}
            {searchTerm && availableUsers && availableUsers.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableUsers
                  .filter((user: any) => 
                    !positionFilter || 
                    user.position?.toLowerCase().includes(positionFilter.toLowerCase())
                  )
                  .map((user: any) => {
                    const isSelected = selectedUsers.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-900/30 border-2 border-emerald-500/50'
                            : 'bg-gray-900/50 border-2 border-transparent hover:bg-gray-900/70 hover:border-gray-700'
                        }`}
                        onClick={() => toggleUserSelection(user._id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(user._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded border-gray-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-gray-900 cursor-pointer"
                          />
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback className="bg-emerald-600 text-white">
                              {user.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <Building className="w-3 h-3" />
                              {user.department} • {user.position}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignUser(user._id);
                          }}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* No Results Message */}
            {searchTerm && availableUsers && availableUsers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No users found matching your search</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}

            {/* Helper Text */}
            {!searchTerm && (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Search for users to add to your team</p>
                <p className="text-sm mt-2">💡 Tip: Type any name, email, or position to search</p>
                <p className="text-xs mt-2 text-gray-500">Try searching: "admin", "manager", or your own name</p>
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
          <div className="space-y-4">
            {teamStats && teamStats.length > 0 ? (
              teamStats
                .sort((a, b) => {
                  // Project lead first
                  if (a.isLead) return -1;
                  if (b.isLead) return 1;
                  // Then by completion rate
                  return b.stats.completionRate - a.stats.completionRate;
                })
                .map((memberData: any) => {
                const member = memberData.user;
                const stats = memberData.stats;
                const isProjectCreator = memberData.isLead;
                
                return (
                  <div
                    key={member._id}
                    className={`p-5 rounded-xl border-2 transition-all ${
                      isProjectCreator
                        ? 'bg-gradient-to-br from-yellow-900/20 to-gray-900/50 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                        : 'bg-gray-900/50 border-gray-700/50 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {member.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-white text-lg">{member.name}</span>
                          {isProjectCreator && (
                            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-semibold">
                              <Crown className="w-3 h-3 mr-1" />
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

                        {/* Member Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mt-3 mb-3">
                          <div className="bg-gray-800/50 rounded-lg p-2">
                            <div className="text-xs text-gray-400 mb-1">Assigned</div>
                            <div className="text-lg font-bold text-white">{stats.total}</div>
                          </div>
                          <div className="bg-emerald-900/20 rounded-lg p-2 border border-emerald-500/20">
                            <div className="text-xs text-emerald-400 mb-1">Completed</div>
                            <div className="text-lg font-bold text-emerald-300">{stats.completed}</div>
                          </div>
                          <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                            <div className="text-xs text-blue-400 mb-1">In Progress</div>
                            <div className="text-lg font-bold text-blue-300">{stats.inProgress}</div>
                          </div>
                          <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                            <div className="text-xs text-purple-400 mb-1">XP Earned</div>
                            <div className="text-lg font-bold text-purple-300">{stats.totalXP}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-medium text-gray-400">Completion Rate</span>
                            <span className="text-sm font-bold ${
                              stats.completionRate >= 80 ? 'text-emerald-400' :
                              stats.completionRate >= 50 ? 'text-yellow-400' :
                              'text-gray-400'
                            }">
                              {stats.completionRate.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                            <div
                              className={`h-full transition-all duration-500 ${
                                stats.completionRate >= 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                stats.completionRate >= 50 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                                'bg-gradient-to-r from-gray-600 to-gray-500'
                              }`}
                              style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {stats.hoursLogged.toFixed(1)}h logged
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Level {member.level || 1}
                          </span>
                          {stats.lastActivity && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Last active: {new Date(stats.lastActivity).toLocaleDateString()}
                            </span>
                          )}
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
