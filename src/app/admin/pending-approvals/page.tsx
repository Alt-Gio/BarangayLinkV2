"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  Menu,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { MobileModalCompact } from "@/components/ui/MobileModal";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function PendingApprovalsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected' | 'invitations'>('pending');

  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Only fetch data after currentUser is loaded to avoid authentication errors
  const pendingUsers = useQuery(
    api.userApproval.getPendingUsers,
    currentUser ? {} : "skip"
  );
  const rejectedUsers = useQuery(
    api.userApproval.getRejectedUsers,
    currentUser ? {} : "skip"
  );
  const approvedUsers = useQuery(
    api.userApproval.getApprovedUsers,
    currentUser ? {} : "skip"
  );
  const approvalStats = useQuery(
    api.userApproval.getApprovalStats,
    currentUser ? {} : "skip"
  );
  const invitations = useQuery(
    api.userApproval.getAllInvitations,
    currentUser ? { status: 'pending' as const } : "skip"
  );

  const approveUser = useMutation(api.userApproval.approveUser);
  const rejectUser = useMutation(api.userApproval.rejectUser);
  const revertToPending = useMutation(api.userApproval.revertToPending);

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !currentUser || !pendingUsers || !approvalStats || !rejectedUsers || !approvedUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (userId: any) => {
    try {
      await approveUser({ userId });
      toast.success("User approved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve user");
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await rejectUser({
        userId: selectedUser._id,
        reason: rejectionReason,
      });
      toast.success("User rejected");
      setShowRejectModal(false);
      setSelectedUser(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject user");
    }
  };

  const handleRevertToPending = async () => {
    if (!selectedUser || !reviewReason.trim()) {
      toast.error("Please provide a reason for status change");
      return;
    }

    try {
      await revertToPending({
        userId: selectedUser._id,
        reason: reviewReason,
      });
      toast.success("User status updated");
      setShowReviewModal(false);
      setSelectedUser(null);
      setReviewReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change user status");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-600";
      case "CAPTAIN":
        return "bg-orange-600";
      case "MANAGER":
        return "bg-purple-600";
      case "BUILDER":
        return "bg-blue-600";
      default:
        return "bg-emerald-600";
    }
  };

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Sidebar
          userRole={currentUser?.userLevel?.name || "ADMIN"}
          dashboardTitle="Pending Approvals"
          dashboardSubtitle="Review user registrations"
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
            <h1 className="text-lg font-semibold text-white">Pending Approvals</h1>
            <div className="w-9" />
          </div>

          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                      <UserCheck className="w-8 h-8 text-emerald-500" />
                      Pending User Approvals
                    </h1>
                    <p className="text-gray-400 mt-1">Review and approve new registrations</p>
                  </div>
                </div>

                {/* Desktop Stats */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <button
                    onClick={() => setActiveFilter('pending')}
                    className={`bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 text-left transition-all hover:bg-yellow-600/30 hover:scale-105 ${
                      activeFilter === 'pending' ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <p className="text-yellow-400 text-sm font-medium">PENDING</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.pendingUsers}</p>
                  </button>
                  <button
                    onClick={() => setActiveFilter('approved')}
                    className={`bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-left transition-all hover:bg-green-600/30 hover:scale-105 ${
                      activeFilter === 'approved' ? 'ring-2 ring-green-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-400 text-sm font-medium">APPROVED</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.activeUsers}</p>
                  </button>
                  <button
                    onClick={() => setActiveFilter('rejected')}
                    className={`bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-left transition-all hover:bg-red-600/30 hover:scale-105 ${
                      activeFilter === 'rejected' ? 'ring-2 ring-red-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 text-sm font-medium">REJECTED</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.rejectedUsers}</p>
                  </button>
                  <button
                    onClick={() => setActiveFilter('invitations')}
                    className={`bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 text-left transition-all hover:bg-blue-600/30 hover:scale-105 ${
                      activeFilter === 'invitations' ? 'ring-2 ring-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <p className="text-blue-400 text-sm font-medium">INVITATIONS</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.pendingInvitations}</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile-Friendly Tabs */}
            <div className="md:hidden max-w-7xl mx-auto px-4 py-4">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveFilter('pending')}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      activeFilter === 'pending' 
                        ? 'bg-yellow-600 text-white shadow-lg' 
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Pending</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                        {approvalStats?.pendingUsers || 0}
                      </Badge>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveFilter('approved')}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      activeFilter === 'approved' 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Approved</span>
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        {approvalStats?.activeUsers || 0}
                      </Badge>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveFilter('rejected')}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      activeFilter === 'rejected' 
                        ? 'bg-red-600 text-white shadow-lg' 
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      <span>Rejected</span>
                      <Badge className="bg-red-500/20 text-red-400 text-xs">
                        {approvalStats?.rejectedUsers || 0}
                      </Badge>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveFilter('invitations')}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      activeFilter === 'invitations' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Invites</span>
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                        {approvalStats?.pendingInvitations || 0}
                      </Badge>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
              {/* Determine which list to show */}
              {(() => {
                let displayUsers: any[] = [];
                let emptyMessage = "";
                
                if (activeFilter === 'pending') {
                  displayUsers = pendingUsers;
                  emptyMessage = "No pending user approvals at this time.";
                } else if (activeFilter === 'approved') {
                  displayUsers = approvedUsers;
                  emptyMessage = "No approved users yet.";
                } else if (activeFilter === 'rejected') {
                  displayUsers = rejectedUsers;
                  emptyMessage = "No rejected users.";
                } else if (activeFilter === 'invitations') {
                  displayUsers = invitations || [];
                  emptyMessage = "No pending invitations.";
                }

                if (displayUsers.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                      <p className="text-gray-400">{emptyMessage}</p>
                    </div>
                  );
                }

                return (
                  <div className="grid gap-6">
                    {displayUsers.map((userItem: any) => {
                      // For invitations, render different card
                      if (activeFilter === 'invitations') {
                        return (
                          <div
                            key={userItem._id}
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-semibold text-white">{userItem.firstName} {userItem.lastName}</h3>
                                <p className="text-gray-400 mt-1">{userItem.email}</p>
                                <div className="flex gap-3 mt-3">
                                  <Badge className="bg-blue-600 text-white">{userItem.userLevelName}</Badge>
                                  <span className="text-sm text-gray-400">{userItem.department}</span>
                                </div>
                              </div>
                              <Badge className="bg-blue-600 text-white">
                                <Mail className="w-3 h-3 mr-1" />
                                Invitation Pending
                              </Badge>
                            </div>
                          </div>
                        );
                      }

                      // For regular users
                      return (
                        <div
                          key={userItem._id}
                          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <img
                                src={userItem.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.name}`}
                                alt={userItem.name}
                                className="w-16 h-16 rounded-full border-2 border-white/30"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-semibold text-white">{userItem.name}</h3>
                                  <Badge className={`${getRoleColor(userItem.userLevelDetails?.name || "WORKER")} text-white`}>
                                    {userItem.userLevelDetails?.name || "WORKER"}
                                  </Badge>
                                  {activeFilter === 'approved' && (
                                    <Badge className="bg-green-600 text-white">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Approved
                                    </Badge>
                                  )}
                                  {activeFilter === 'rejected' && (
                                    <Badge className="bg-red-600 text-white">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Rejected
                                    </Badge>
                                  )}
                                  {userItem.registeredViaInvitation && (
                                    <Badge className="bg-blue-600 text-white">
                                      <Mail className="w-3 h-3 mr-1" />
                                      Invited
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{userItem.email}</span>
                                  </div>
                                  {userItem.phone && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm">{userItem.phone}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{userItem.department}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{userItem.position}</span>
                                  </div>
                                </div>

                                {/* Rejection Info */}
                                {activeFilter === 'rejected' && (
                                  <div className="mt-4 bg-red-600/10 border border-red-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <XCircle className="w-4 h-4 text-red-400" />
                                      <p className="text-xs text-red-400 font-medium">Application Denied</p>
                                    </div>
                                    {userItem.rejectionReason && (
                                      <div className="mb-3">
                                        <p className="text-xs text-red-400 font-medium mb-1">Reason:</p>
                                        <p className="text-sm text-red-300">{userItem.rejectionReason}</p>
                                      </div>
                                    )}
                                    {userItem.rejectedByDetails && (
                                      <div className="flex items-center gap-3 pt-2 border-t border-red-500/20">
                                        <img
                                          src={userItem.rejectedByDetails.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.rejectedByDetails.name}`}
                                          alt={userItem.rejectedByDetails.name}
                                          className="w-8 h-8 rounded-full border border-red-400/30"
                                        />
                                        <div>
                                          <p className="text-sm text-red-300 font-medium">
                                            Denied by {userItem.rejectedByDetails.name}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {new Date(userItem.rejectedAt).toLocaleDateString('en-US', { 
                                              year: 'numeric', 
                                              month: 'long', 
                                              day: 'numeric' 
                                            })} at {new Date(userItem.rejectedAt).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Approval Info */}
                                {activeFilter === 'approved' && (
                                  <div className="mt-4 bg-green-600/10 border border-green-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <p className="text-xs text-green-400 font-medium">Account Verified</p>
                                    </div>
                                    {userItem.approvedByDetails ? (
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={userItem.approvedByDetails.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.approvedByDetails.name}`}
                                          alt={userItem.approvedByDetails.name}
                                          className="w-8 h-8 rounded-full border border-green-400/30"
                                        />
                                        <div>
                                          <p className="text-sm text-green-300 font-medium">
                                            Verified by {userItem.approvedByDetails.name}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {new Date(userItem.approvedAt).toLocaleDateString('en-US', { 
                                              year: 'numeric', 
                                              month: 'long', 
                                              day: 'numeric' 
                                            })} at {new Date(userItem.approvedAt).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-green-300">
                                        Approved on {new Date(userItem.approvedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {userItem.invitationDetails && (
                                  <div className="mt-4 bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
                                    <p className="text-xs text-blue-300">
                                      Registered using invitation code
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons - Elegant Design */}
                            <div className="flex flex-col sm:flex-row gap-3 ml-0 sm:ml-4 mt-4 sm:mt-0">
                              {activeFilter === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => handleApprove(userItem._id)}
                                    className="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300 py-3 px-6 font-semibold"
                                  >
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                      <span>Approve</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      console.log('Reject button clicked', userItem);
                                      setSelectedUser(userItem);
                                      setShowRejectModal(true);
                                    }}
                                    type="button"
                                    className="group relative bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 transition-all duration-300 py-3 px-6 font-semibold"
                                  >
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                      <span>Reject</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  </Button>
                                </>
                              )}

                              {/* Only show for ADMIN */}
                              {activeFilter === 'approved' && currentUser?.userLevel?.name === 'ADMIN' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    console.log('Shield button clicked (Re-review)', userItem);
                                    setSelectedUser(userItem);
                                    setShowReviewModal(true);
                                  }}
                                  className="text-xs text-gray-500 hover:text-yellow-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                                  title="Request Re-review"
                                >
                                  <Shield className="w-3 h-3" />
                                </button>
                              )}

                              {/* Only show for ADMIN */}
                              {activeFilter === 'rejected' && currentUser?.userLevel?.name === 'ADMIN' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    console.log('Reconsider button clicked', userItem);
                                    setSelectedUser(userItem);
                                    setShowReviewModal(true);
                                  }}
                                  className="text-xs text-gray-500 hover:text-yellow-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                                  title="Reconsider Application"
                                >
                                  <Shield className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal - Elegant Mobile-Friendly */}
      <MobileModalCompact
        isOpen={showRejectModal}
        onClose={() => {
          console.log('Closing reject modal');
          setShowRejectModal(false);
          setSelectedUser(null);
          setRejectionReason("");
        }}
        title="Reject User Registration"
      >
        <div className="space-y-4">
          {/* User Info Card */}
          <div className="bg-red-600/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedUser?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser?.name}`}
                alt={selectedUser?.name}
                className="w-12 h-12 rounded-full border-2 border-red-400/30"
              />
              <div>
                <p className="text-white font-semibold">{selectedUser?.name}</p>
                <p className="text-sm text-gray-400">{selectedUser?.email}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-gray-300 mb-3">
              Please provide a reason for rejection:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Invalid credentials, not from this barangay, incomplete information..."
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              rows={4}
            />
          </div>

          <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-300">
              <strong>Note:</strong> The user will be notified via email about this decision.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleReject}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-3 shadow-lg shadow-red-600/30 font-semibold"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Confirm Rejection
            </Button>
            <Button
              onClick={() => {
                setShowRejectModal(false);
                setSelectedUser(null);
                setRejectionReason("");
              }}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 py-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      </MobileModalCompact>

      {/* Review Status Change Modal - Elegant Mobile-Friendly */}
      <MobileModalCompact
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedUser(null);
          setReviewReason("");
        }}
        title={activeFilter === 'approved' ? 'Request Account Re-review' : 'Reconsider Application'}
      >
        <div className="space-y-4">
          <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-xl p-1">
            {/* User Info */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser?.name}`}
                  alt={selectedUser?.name}
                  className="w-12 h-12 rounded-full border-2 border-white/30"
                />
                <div>
                  <p className="text-white font-semibold">{selectedUser?.name}</p>
                  <p className="text-sm text-gray-400">{selectedUser?.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className="text-xs bg-blue-600 text-white">
                      {selectedUser?.userLevelDetails?.name || 'WORKER'}
                    </Badge>
                    <span className="text-xs text-gray-400">{selectedUser?.department}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-gray-300 mb-3 text-sm">
              {activeFilter === 'approved' 
                ? 'This will move the approved user back to pending status for re-verification. Please provide a reason:'
                : 'This will give the rejected user another chance. Their application will be moved to pending for re-review. Please provide a reason:'
              }
            </p>
            
            <textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder={activeFilter === 'approved' 
                ? 'e.g., Additional verification required, documents need review...'
                : 'e.g., New information provided, reconsidering decision...'
              }
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              rows={3}
            />
          </div>

          <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-300">
              <strong>Note:</strong> The user will be notified of this status change and their account will be moved to pending status.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRevertToPending}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white py-3 shadow-lg shadow-yellow-600/30 font-semibold"
            >
              <Shield className="w-5 h-5 mr-2" />
              {activeFilter === 'approved' ? 'Request Re-review' : 'Reconsider'}
            </Button>
            <Button
              onClick={() => {
                setShowReviewModal(false);
                setSelectedUser(null);
                setReviewReason("");
              }}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 py-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      </MobileModalCompact>
    </AdminGuard>
  );
}
