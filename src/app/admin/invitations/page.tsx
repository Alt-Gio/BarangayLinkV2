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
  Ticket,
  Plus,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Infinity,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { SendInvitationModal } from "@/components/admin/SendInvitationModal";
import { CreateInvitationCodeModal } from "@/components/admin/CreateInvitationCodeModal";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default function AdminInvitationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "expired" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("invitations");
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
  const [codeStatusFilter, setCodeStatusFilter] = useState<"all" | "active" | "inactive" | "expired">("all");

  const { currentUser, isOnline } = useOfflineData();

  const invitations = useQuery(
    api.adminUserManagement.getAllInvitations,
    isLoaded && user ? { status: statusFilter } : "skip"
  );

  const cancelInvitation = useMutation(api.adminUserManagement.cancelInvitation);
  const resendInvitation = useMutation(api.adminUserManagement.resendInvitation);
  
  const userLevels = useQuery(api.userLevels.getAllUserLevels);
  const departments = useQuery(api.departments.getAllDepartments);
  
  const invitationCodes = useQuery(
    api.invitationCodes.getAllInvitationCodes,
    isLoaded && user ? { status: codeStatusFilter } : "skip"
  );
  const codeStats = useQuery(api.invitationCodes.getInvitationCodeStats);
  const createInvitationCode = useMutation(api.invitationCodes.createInvitationCode);
  const toggleCodeStatus = useMutation(api.invitationCodes.toggleInvitationCodeStatus);
  const deleteCode = useMutation(api.invitationCodes.deleteInvitationCode);

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

  const handleToggleCodeStatus = async (codeId: string) => {
    try {
      const result = await toggleCodeStatus({ codeId: codeId as any });
      alert(result.message);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to toggle status");
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm("Delete this invitation code? Users who have already used it will not be affected.")) return;
    try {
      await deleteCode({ codeId: codeId as any });
      alert("Invitation code deleted successfully");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete code");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Code "${code}" copied to clipboard!`);
  };

  const handleCopyRegistrationLink = (code: string) => {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link);
    alert("Registration link copied to clipboard!");
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

          {/* Mobile Tabs */}
          <div className="md:hidden px-4 py-4 bg-gray-800/50">
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
              <button
                onClick={() => setActiveTab('invitations')}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'invitations'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Invitations</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">{stats.total}</Badge>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('codes')}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'codes'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  <span>Codes</span>
                  <Badge className="bg-purple-500/20 text-purple-400 text-xs">{codeStats?.total || 0}</Badge>
                </div>
              </button>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Send Invitation button clicked!');
                  setIsInviteModalOpen(true);
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <UserPlus className="w-5 h-5" />
                <span>Send Invitation</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Create Code button clicked!');
                  setShowCreateCodeModal(true);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Ticket className="w-5 h-5" />
                <span>Create Code</span>
              </button>
            </div>
          </div>

      {/* Header - Desktop */}
      <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Invitations
                  </h1>
                  <p className="text-emerald-400 text-sm font-medium">Invite & onboard your team</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Send email invitations or create reusable invitation codes</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateCodeModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
              >
                <Ticket className="w-5 h-5" />
                <span className="font-semibold">Create Code</span>
              </Button>
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
              >
                <UserPlus className="w-5 h-5" />
                <span className="font-semibold">Send Invitation</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} defaultValue="invitations" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="hidden md:flex bg-white/5 backdrop-blur-sm border border-white/10 p-1 rounded-xl mb-6 shadow-lg">
              <TabsTrigger 
                value="invitations" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 rounded-lg transition-all px-6 py-2.5"
              >
                <Mail className="w-4 h-4 mr-2" />
                <span className="font-semibold">Email Invitations</span>
              </TabsTrigger>
              <TabsTrigger 
                value="codes"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 rounded-lg transition-all px-6 py-2.5"
              >
                <Ticket className="w-4 h-4 mr-2" />
                <span className="font-semibold">Invitation Codes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invitations"  className="mt-0">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="group bg-gradient-to-br from-blue-600/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">Total Invites</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="group bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">Pending</p>
                  <p className="text-3xl font-bold text-white">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="group bg-gradient-to-br from-green-600/10 to-green-600/5 rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">Accepted</p>
                  <p className="text-3xl font-bold text-white">{stats.accepted}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>
            <div className="group bg-gradient-to-br from-red-600/10 to-red-600/5 rounded-xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">Expired</p>
                  <p className="text-3xl font-bold text-white">{stats.expired}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {(["all", "pending", "accepted", "expired", "cancelled"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition-all font-medium text-sm ${
                    statusFilter === status
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
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
      </TabsContent>

            {/* Invitation Codes Tab */}
            <TabsContent value="codes" className="mt-0">
              {/* Code Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Codes</p>
                      <p className="text-2xl font-bold text-white">{codeStats?.total || 0}</p>
                    </div>
                    <Ticket className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active</p>
                      <p className="text-2xl font-bold text-white">{codeStats?.active || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Uses</p>
                      <p className="text-2xl font-bold text-white">{codeStats?.totalUses || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Unlimited</p>
                      <p className="text-2xl font-bold text-white">{codeStats?.unlimited || 0}</p>
                    </div>
                    <Infinity className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Code Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 mb-6">
                {(["all", "active", "inactive", "expired"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setCodeStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      codeStatusFilter === status
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Codes List */}
              <div className="space-y-3 sm:space-y-4">
                {invitationCodes?.map((code) => (
                  <div
                    key={code._id}
                    className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-700/50 p-4 sm:p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Code Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Ticket className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-white font-mono">{code.code}</h3>
                              <button
                                onClick={() => handleCopyCode(code.code)}
                                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                title="Copy code"
                              >
                                <Copy className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                            <p className="text-gray-400 text-sm">{code.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge className={`${
                                code.status === "active" ? "bg-green-600" : 
                                code.status === "inactive" ? "bg-gray-600" : 
                                "bg-red-600"
                              } text-white text-xs px-2 sm:px-3 py-1`}>
                                {code.status}
                              </Badge>
                              {code.isExpired && (
                                <Badge className="bg-red-600 text-white text-xs px-2 py-1">Expired</Badge>
                              )}
                              {code.isMaxedOut && (
                                <Badge className="bg-orange-600 text-white text-xs px-2 py-1">Max Uses Reached</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Code Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-3">
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span>{code.userLevel?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                            <Building className="w-4 h-4 text-emerald-400" />
                            <span>{code.department}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            <span>
                              {code.usedCount} / {code.maxUses === -1 ? "∞" : code.maxUses} uses
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg p-2">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            <span>
                              {code.expiresAt ? `Expires ${formatDate(code.expiresAt)}` : "Never expires"}
                            </span>
                          </div>
                        </div>

                        {/* Usage Progress */}
                        {code.maxUses !== -1 && (
                          <div className="mt-3">
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                                style={{ width: `${code.usagePercentage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Created By */}
                        {code.creator && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs sm:text-sm text-gray-400">
                            Created by <span className="text-purple-400 font-semibold">{code.creator.name}</span> on {formatDate(code.createdAt)}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          onClick={() => handleCopyRegistrationLink(code.code)}
                          className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs shadow-md"
                          title="Copy registration link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleToggleCodeStatus(code._id)}
                          className="flex-1 sm:flex-none bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs shadow-md"
                          title={code.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {code.status === "active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={() => handleDeleteCode(code._id)}
                          className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs shadow-md"
                          title="Delete code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {invitationCodes?.length === 0 && (
                  <div className="text-center py-12 sm:py-16 text-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
                    <div className="bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ticket className="w-10 h-10 text-gray-600" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-gray-300">No invitation codes found</p>
                    <p className="text-sm text-gray-500 mt-2">Create your first invitation code to get started</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

        {/* Modals */}
        <SendInvitationModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            console.log('Closing Send Invitation modal');
            setIsInviteModalOpen(false);
          }}
        />
        
        <CreateInvitationCodeModal
          isOpen={showCreateCodeModal}
          onClose={() => {
            console.log('Closing Create Code modal');
            setShowCreateCodeModal(false);
          }}
        />
        </div>
      </div>
    </AdminGuard>
  );
}
