"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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

  const currentUser = useQuery(api.users.getCurrentUser);

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
          <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">Invitations</h1>
            <div className="w-9" />
          </div>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {filteredInvitations.map((invitation) => {
            const config = statusConfig[invitation.status];
            const StatusIcon = config.icon;
            const isExpiringSoon = invitation.status === "pending" && invitation.expiresAt - Date.now() < 24 * 60 * 60 * 1000;

            return (
              <div
                key={invitation._id}
                className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white">
                          {invitation.firstName} {invitation.lastName}
                        </h3>
                        <p className="text-gray-400 text-sm">{invitation.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={`${config.color} text-white px-3 py-1 flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.text}
                          </Badge>
                          {isExpiringSoon && (
                            <Badge className="bg-orange-600 text-white px-3 py-1">
                              Expires Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Building className="w-4 h-4" />
                        <span>{invitation.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Shield className="w-4 h-4" />
                        <span>{invitation.userLevel?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Sent {formatDate(invitation.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Expires {formatDate(invitation.expiresAt)}</span>
                      </div>
                    </div>

                    {/* Invited By */}
                    {invitation.invitedByUser && (
                      <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
                        Invited by <span className="text-white font-medium">{invitation.invitedByUser.name}</span>
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
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleResendInvitation(invitation._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Resend
                      </Button>
                      <Button
                        onClick={() => handleCancelInvitation(invitation._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredInvitations.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/10">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No invitations found</p>
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
