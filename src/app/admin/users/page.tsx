"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Shield,
  MoreVertical,
  CheckSquare,
  X,
  Eye,
  RefreshCw,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { ExportButton } from "@/components/common/ExportButton";
import { SendInvitationModal } from "@/components/admin/SendInvitationModal";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { exportUserPerformanceReport } from "@/lib/exportUtils";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [userLevelFilter, setUserLevelFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();

  // Only fetch data when authenticated
  const users = useQuery(
    api.adminUserManagement.getAllUsers,
    isLoaded && user
      ? {
          search: searchQuery || undefined,
          department: departmentFilter || undefined,
          userLevel: userLevelFilter || undefined,
        }
      : "skip"
  );

  const stats = useQuery(api.adminUserManagement.getUserStats, isLoaded && user ? {} : "skip");
  const deleteUser = useMutation(api.adminUserManagement.deleteUser);
  const bulkUpdate = useMutation(api.adminUserManagement.bulkUpdateUsers);

  const userLevels = useQuery(api.userLevels.getAllUserLevels);
  const departments = useQuery(api.departments.getAllDepartments);

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteUser({ userId: userId as any });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const handleBulkAction = async (action: "delete" | "assign_level" | "assign_department", value?: string) => {
    if (selectedUsers.length === 0) {
      alert("Please select users first");
      return;
    }

    if (action === "delete" && !confirm(`Delete ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      await bulkUpdate({
        userIds: selectedUsers as any,
        action,
        value,
      });
      setSelectedUsers([]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bulk action failed");
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const userLevelColors: Record<string, string> = {
    ADMIN: "bg-red-600",
    CAPTAIN: "bg-orange-600",
    MANAGER: "bg-purple-600",
    BUILDER: "bg-blue-600",
    WORKER: "bg-emerald-600",
  };

  // Export handler
  const handleExport = (format: 'pdf' | 'excel') => {
    if (!users) return;
    exportUserPerformanceReport(users, format);
  };

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Sidebar 
          userRole={currentUser?.userLevel?.name || "ADMIN"}
          dashboardTitle="User Management"
          dashboardSubtitle="Manage users and invitations"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-50">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">User Management</h1>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 md:sticky md:top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                User Management
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">Manage users and send invitations</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <ExportButton 
                onExport={handleExport} 
                label="Export"
                disabled={!users || users.length === 0}
                className="flex-1 sm:flex-none"
              />
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-105 text-sm sm:text-base"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Send Invitation</span>
                <span className="sm:hidden">Invite</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending Invites</p>
                    <p className="text-2xl font-bold text-white">{stats.pendingInvitations}</p>
                  </div>
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Accepted</p>
                    <p className="text-2xl font-bold text-white">{stats.acceptedInvitations}</p>
                  </div>
                  <CheckSquare className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Departments</p>
                    <p className="text-2xl font-bold text-white">{stats.usersByDepartment.length}</p>
                  </div>
                  <Building className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Departments</option>
                {departments?.map(dept => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              <select
                value={userLevelFilter}
                onChange={(e) => setUserLevelFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Levels</option>
                {userLevels?.map((level: any) => (
                  <option key={level._id} value={level.name}>{level.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 sm:p-4 bg-emerald-600/20 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-white font-medium text-sm sm:text-base">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleBulkAction("delete")}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete Selected</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
                <Button
                  onClick={() => setSelectedUsers([])}
                  className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users?.length && users?.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users?.map(u => u._id) || []);
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-white/20 bg-white/5"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Contact</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users?.map((user) => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.imageUrl ? (
                          <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                            <span className="text-white font-semibold">{user.name[0]}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.department || "—"}</td>
                    <td className="px-6 py-4 text-gray-300">{user.position || "—"}</td>
                    <td className="px-6 py-4">
                      <Badge className={`${userLevelColors[user.userLevelDetails?.name || "WORKER"]} text-white px-3 py-1`}>
                        {user.userLevelDetails?.name || "WORKER"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!users || users.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {users?.map((user) => (
            <div key={user._id} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 mt-1"
                  />
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">{user.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.name}</p>
                    <p className="text-gray-400 text-sm truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Department:</span>
                  <span className="text-white">{user.department || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Position:</span>
                  <span className="text-white">{user.position || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Level:</span>
                  <Badge className={`${userLevelColors[user.userLevel?.name || 'WORKER']} text-white`}>
                    {user.userLevel?.name || "WORKER"}
                  </Badge>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-3 h-3" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                <Button
                  onClick={() => setViewingUser(user)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button
                  onClick={() => setEditingUser(user)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteUser(user._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {(!users || users.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isInviteModalOpen && (
        <SendInvitationModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {viewingUser && (
        <UserDetailsModal
          user={viewingUser}
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}
      </div>
        </div>
      </div>
    </AdminGuard>
  );
}
