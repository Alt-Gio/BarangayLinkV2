"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Mail,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Ban,
  User,
  Calendar,
  Shield,
  Building,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { SendInvitationModal } from "@/components/admin/SendInvitationModal";
import { AdminGuard } from "@/components/admin/AdminGuard";

export const dynamic = "force-dynamic";

export default function AdminInvitationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "expired" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();

  // Only fetch data when authenticated
  const invitations = useQuery(
    api.adminUserManagement.getAllInvitations,
    isLoaded && user ? { status: statusFilter } : "skip"
  );

  const cancelInvitation = useMutation(api.adminUserManagement.cancelInvitation);
  const resendInvitation = useMutation(api.adminUserManagement.resendInvitation);
  
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

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Cancel this invitation?")) return;

    try {
      await cancelInvitation({ invitationId: invitationId as any });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to cancel invitation");
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation({ invitationId: invitationId as any });
      alert("Invitation resent successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to resend invitation");
    }
  };

  const filteredInvitations = invitations?.filter(inv =>
    inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-600", text: "Pending" },
    accepted: { icon: CheckCircle, color: "bg-green-600", text: "Accepted" },
    expired: { icon: XCircle, color: "bg-red-600", text: "Expired" },
    cancelled: { icon: Ban, color: "bg-gray-600", text: "Cancelled" },
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const stats = {
    total: invitations?.length || 0,
    pending: invitations?.filter(i => i.status === "pending").length || 0,
    accepted: invitations?.filter(i => i.status === "accepted").length || 0,
    expired: invitations?.filter(i => i.status === "expired").length || 0,
  };

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Sidebar 
          userRole={currentUser?.userLevel?.name || "ADMIN"}
          dashboardTitle="Invitations"
          dashboardSubtitle="Manage user invitations"
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
            <h1 className="text-lg font-semibold text-white">Invitations</h1>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Mail className="w-8 h-8 text-emerald-500" />
                Invitations
              </h1>
              <p className="text-gray-400 mt-1">Manage user invitations and track acceptance</p>
            </div>
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              Send Invitation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Invites</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Accepted</p>
                  <p className="text-2xl font-bold text-white">{stats.accepted}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Expired</p>
                  <p className="text-2xl font-bold text-white">{stats.expired}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search invitations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {(["all", "pending", "accepted", "expired", "cancelled"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? "bg-emerald-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invitations List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-3 sm:space-y-4">
          {filteredInvitations.map((invitation) => {
            const config = statusConfig[invitation.status];
            const StatusIcon = config.icon;
            const isExpiringSoon = invitation.status === "pending" && invitation.expiresAt - Date.now() < 24 * 60 * 60 * 1000;

            return (
              <div
                key={invitation._id}
                className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-700/50 p-4 sm:p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">
                          {invitation.firstName} {invitation.lastName}
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">{invitation.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={`${config.color} text-white text-xs px-2 sm:px-3 py-1 flex items-center gap-1 shadow-md`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.text}
                          </Badge>
                          {isExpiringSoon && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 sm:px-3 py-1 shadow-md animate-pulse">
                              Expires Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mt-3">
                      <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                        <Building className="w-4 h-4 text-emerald-400" />
                        <span className="truncate">{invitation.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="truncate">{invitation.userLevel?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="truncate">Sent {formatDate(invitation.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="truncate">Expires {formatDate(invitation.expiresAt)}</span>
                      </div>
                    </div>

                    {/* Invited By */}
                    {invitation.invitedByUser && (
                      <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs sm:text-sm text-gray-400">
                        Invited by <span className="text-emerald-400 font-semibold">{invitation.invitedByUser.name}</span>
                      </div>
                    )}

                    {/* Accepted User */}
                    {invitation.acceptedUser && (
                      <div className="mt-3 pt-3 border-t border-white/10 text-sm text-emerald-400">
                        ✓ Accepted by {invitation.acceptedUser.name} on {formatDate(invitation.acceptedAt!)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {invitation.status === "pending" && (
                    <div className="flex sm:flex-col gap-2 mt-3 sm:mt-0">
                      <Button
                        onClick={() => handleResendInvitation(invitation._id)}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Resend</span>
                      </Button>
                      <Button
                        onClick={() => handleCancelInvitation(invitation._id)}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredInvitations.length === 0 && (
            <div className="text-center py-12 sm:py-16 text-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
              <div className="bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-gray-300">No invitations found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isInviteModalOpen && (
        <SendInvitationModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
      </div>
        </div>
      </div>
    </AdminGuard>
  );
}
