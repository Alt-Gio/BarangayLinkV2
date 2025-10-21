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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminGuard } from "@/components/admin/AdminGuard";
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
  const pendingUsers = useQuery(api.userApproval.getPendingUsers);
  const rejectedUsers = useQuery(api.userApproval.getRejectedUsers);
  const approvedUsers = useQuery(api.userApproval.getApprovedUsers);
  const approvalStats = useQuery(api.userApproval.getApprovalStats);
  const invitations = useQuery(api.userApproval.getAllInvitations, { status: 'pending' });

  const approveUser = useMutation(api.userApproval.approveUser);
  const rejectUser = useMutation(api.userApproval.rejectUser);
  const revertToPending = useMutation(api.userApproval.revertToPending);

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !pendingUsers || !approvalStats || !rejectedUsers || !approvedUsers) {
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

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
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

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
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

                            {/* Action Buttons */}
                            <div className="flex gap-2 ml-4">
                              {activeFilter === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => handleApprove(userItem._id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    size="sm"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setSelectedUser(userItem);
                                      setShowRejectModal(true);
                                    }}
                                    variant="outline"
                                    className="border-red-500 text-red-400 hover:bg-red-600/20"
                                    size="sm"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {/* Only show for ADMIN */}
                              {activeFilter === 'approved' && currentUser?.userLevel?.name === 'ADMIN' && (
                                <button
                                  onClick={() => {
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
                                  onClick={() => {
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-semibold text-white">Reject User Registration</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Please provide a reason for rejecting <strong>{selectedUser?.name}</strong>'s registration:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Invalid credentials, not from this barangay, etc."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject User
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedUser(null);
                  setRejectionReason("");
                }}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Status Change Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">
                {activeFilter === 'approved' ? 'Request Account Re-review' : 'Reconsider Application'}
              </h3>
            </div>
            
            {/* User Info */}
            <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
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

            <p className="text-gray-400 mb-2 text-sm">
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
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
              rows={3}
            />

            <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-300">
                <strong>Note:</strong> The user will be notified of this status change and their account will be moved to pending status.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRevertToPending}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                {activeFilter === 'approved' ? 'Request Re-review' : 'Reconsider'}
              </Button>
              <Button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedUser(null);
                  setReviewReason("");
                }}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
