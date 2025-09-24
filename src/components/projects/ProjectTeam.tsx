"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Mail, Phone, MapPin, Award, Star, Trash2, Search, User, Building2, Briefcase } from 'lucide-react';

interface ProjectTeamProps {
  project: any;
  teamMembers: any[];
  currentUser: any;
  canEdit: boolean;
}

export function ProjectTeam({ project, teamMembers, currentUser, canEdit }: ProjectTeamProps) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Search available users with the new enhanced search function
  const availableUsers = useQuery(api.projects.searchAvailableUsers, 
    searchTerm ? {
      department: project.department,
      searchTerm: searchTerm,
      limit: 10
    } : "skip"
  );

  // Get project team members with full details
  const detailedTeamMembers = useQuery(api.projects.getProjectTeamMembers, {
    projectId: project._id
  });

  const assignUserToProject = useMutation(api.projects.assignUserToProject);
  const removeUserFromProject = useMutation(api.projects.removeUserFromProject);

  const handleAssignUser = async (userId: string) => {
    try {
      await assignUserToProject({
        projectId: project._id,
        userId: userId as any
      });
      setSearchTerm('');
      setIsAddingMember(false);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert("Error assigning user: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      try {
        await removeUserFromProject({
          projectId: project._id,
          userId: userId as any
        });
      } catch (error) {
        console.error('Error removing team member:', error);
        alert("Error removing team member: " + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN': return 'text-red-400 border-red-700 bg-red-900/20';
      case 'MANAGER': return 'text-blue-400 border-blue-700 bg-blue-900/20';
      case 'BUILDER': return 'text-green-400 border-green-700 bg-green-900/20';
      case 'WORKER': return 'text-gray-400 border-gray-700 bg-gray-900/20';
      default: return 'text-gray-400 border-gray-700 bg-gray-900/20';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Members</h2>
          <p className="text-gray-400">
            {detailedTeamMembers?.length || project.assignedTo?.length || 0} members assigned to this project
          </p>
        </div>
        {canEdit && (
          <Button 
            onClick={() => setIsAddingMember(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* Add Member Section */}
      {isAddingMember && (
        <Card className="bg-gray-700/50 border-gray-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-white">Add Team Member</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingMember(false)}
                className="border-gray-600 text-gray-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by name, position, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              {searchTerm && availableUsers && availableUsers.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableUsers
                    .filter(user => !detailedTeamMembers?.some(member => member._id === user._id))
                    .map((user) => (
                      <div 
                        key={user._id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imageUrl} alt={user.name} />
                            <AvatarFallback className="bg-gray-600 text-white">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <div className="flex items-center space-x-2">
                              <Badge className={getRoleColor(user.userLevel?.name || 'WORKER')} variant="outline">
                                {user.userLevel?.name || 'WORKER'}
                              </Badge>
                              <span className="text-sm text-gray-400">•</span>
                              <span className="text-sm text-gray-400">{user.position}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAssignUser(user._id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                </div>
              )}
              
              {searchTerm && availableUsers && availableUsers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Grid */}
      {detailedTeamMembers && detailedTeamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailedTeamMembers.map((member) => (
            <Card key={member._id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.imageUrl} alt={member.name} />
                      <AvatarFallback className="bg-green-600 text-white">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-400">{member.position}</p>
                    </div>
                  </div>
                  
                  {canEdit && member._id !== currentUser._id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getRoleColor(member.userLevel?.name || 'WORKER')} variant="outline">
                      {member.userLevel?.name || 'WORKER'}
                    </Badge>
                    {member._id === project.createdBy && (
                      <Badge variant="outline" className="text-yellow-400 border-yellow-600 bg-yellow-900/20">
                        Project Owner
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-400">
                    <Briefcase className="w-4 h-4 mr-2" />
                    <span>{member.position}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span>{member.department}</span>
                  </div>

                  {member.email && (
                    <div className="flex items-center text-sm text-gray-400">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}

                  {member.phone && (
                    <div className="flex items-center text-sm text-gray-400">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* Gamification Stats */}
                  <div className="pt-3 border-t border-gray-700">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-400">{member.level || 1}</div>
                        <div className="text-xs text-gray-400">Level</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-400">{member.gold || 0}</div>
                        <div className="text-xs text-gray-400">Gold</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-400">{member.totalTasksCompleted || 0}</div>
                        <div className="text-xs text-gray-400">Tasks</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicator */}
                  <div className="flex items-center gap-2 pt-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">
                      {member.projectSuccessRate || 0}% success rate
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Team Members</h3>
            <p className="text-gray-500 mb-4">
              {canEdit ? "Add team members to start collaborating on this project." : "No team members have been assigned to this project yet."}
            </p>
            {canEdit && (
              <Button 
                onClick={() => setIsAddingMember(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Statistics */}
      {detailedTeamMembers && detailedTeamMembers.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Team Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {detailedTeamMembers.filter(m => m.userLevel?.name === 'ADMIN').length}
                </div>
                <div className="text-sm text-gray-400">Admins</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {detailedTeamMembers.filter(m => m.userLevel?.name === 'MANAGER').length}
                </div>
                <div className="text-sm text-gray-400">Managers</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {detailedTeamMembers.filter(m => m.userLevel?.name === 'BUILDER').length}
                </div>
                <div className="text-sm text-gray-400">Builders</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-400">
                  {detailedTeamMembers.filter(m => m.userLevel?.name === 'WORKER').length}
                </div>
                <div className="text-sm text-gray-400">Workers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
