"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';

export const dynamic = 'force-dynamic';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Edit, 
  Search, 
  Filter,
  Shield,
  Briefcase,
  Wrench,
  User,
  Menu,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function RegistrationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUserLevel, setSelectedUserLevel] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.users.getAllUsersWithLevels);
  const userLevels = useQuery(api.userLevels.getAllUserLevels);

  const assignUserLevel = useMutation(api.users.assignUserLevel);
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const updateUserStatus = useMutation(api.users.updateUserStatus);

  const isAuthorized = currentUser?.userLevel?.name === 'ADMIN' || currentUser?.userLevel?.name === 'MANAGER';

  const filteredUsers = allUsers?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
    const matchesUserLevel = selectedUserLevel === 'all' || user.userLevel?._id === selectedUserLevel;
    
    return matchesSearch && matchesDepartment && matchesUserLevel;
  }) || [];

  const departments = [...new Set(allUsers?.map(user => user.department).filter(Boolean) || [])];

  const handleEditUser = (user: any) => {
    setEditingUser({
      ...user,
      newDepartment: user.department,
      newPosition: user.position,
      newPhone: user.phone,
      newUserLevel: user.userLevel?._id
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await updateUserProfile({
        userId: editingUser._id,
        department: editingUser.newDepartment,
        position: editingUser.newPosition,
        phone: editingUser.newPhone,
      });

      if (editingUser.newUserLevel !== editingUser.userLevel._id) {
        await assignUserLevel({
          userId: editingUser._id,
          newUserLevelId: editingUser.newUserLevel,
          reason: "Admin update via registration page"
        });
      }

      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + (error as Error).message);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUserStatus({
        userId: userId as any,
        isActive: !currentStatus
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status: ' + (error as Error).message);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN': return <Shield className="w-4 h-4 text-red-400" />;
      case 'MANAGER': return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'BUILDER': return <Wrench className="w-4 h-4 text-green-400" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN': return 'bg-red-900/20 text-red-400 border-red-700';
      case 'MANAGER': return 'bg-blue-900/20 text-blue-400 border-blue-700';
      case 'BUILDER': return 'bg-green-900/20 text-green-400 border-green-700';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400">You need Admin or Manager privileges to access this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar 
        userRole={currentUser?.userLevel?.name || 'WORKER'}
        dashboardTitle="User Registration"
        dashboardSubtitle="Manage user accounts and permissions"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">User Registration</h1>
          <div className="w-9" />
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">User Registration Management</h1>
              <p className="text-gray-400">Manage user accounts, roles, and permissions</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 rounded-lg border border-green-700">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">{filteredUsers.length} Users</span>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* Department Filter */}
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* User Level Filter */}
                <Select value={selectedUserLevel} onValueChange={setSelectedUserLevel}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Roles</SelectItem>
                    {userLevels?.map(level => (
                      <SelectItem key={level._id} value={level._id}>{level.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDepartment('all');
                    setSelectedUserLevel('all');
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user._id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        {getRoleIcon(user.userLevel?.name || 'USER')}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{user.name}</h3>
                        <span className="text-sm text-gray-500">{user.userLevel?.description || 'No description'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Badge className={getRoleBadgeColor(user.userLevel?.name || 'USER')}>
                      <span className="font-medium">{user.userLevel?.name || 'USER'}</span>
                    </Badge>
                    <p className="text-sm text-gray-400">
                      <strong>Department:</strong> {user.department}
                    </p>
                    <p className="text-sm text-gray-400">
                      <strong>Position:</strong> {user.position || 'Not set'}
                    </p>
                    {user.phone && (
                      <p className="text-sm text-gray-400">
                        <strong>Phone:</strong> {user.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={user.isActive ? "destructive" : "default"}
                      onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                      className={user.isActive ? "" : "bg-green-600 hover:bg-green-700"}
                    >
                      {user.isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
                <p className="text-gray-400">Try adjusting your search criteria or filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User: {editingUser?.name}</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Department</label>
                <Input
                  value={editingUser.newDepartment}
                  onChange={(e) => setEditingUser({...editingUser, newDepartment: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Position</label>
                <Input
                  value={editingUser.newPosition || ''}
                  onChange={(e) => setEditingUser({...editingUser, newPosition: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Phone</label>
                <Input
                  value={editingUser.newPhone || ''}
                  onChange={(e) => setEditingUser({...editingUser, newPhone: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">User Role</label>
                <Select 
                  value={editingUser.newUserLevel} 
                  onValueChange={(value) => setEditingUser({...editingUser, newUserLevel: value})}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {userLevels?.map(level => (
                      <SelectItem key={level._id} value={level._id}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(level.name)}
                          {level.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveUser} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
