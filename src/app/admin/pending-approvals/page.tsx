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

  const currentUser = useQuery(api.users.getCurrentUser);
  const pendingUsers = useQuery(api.userApproval.getPendingUsers);
  const approvalStats = useQuery(api.userApproval.getApprovalStats);

  const approveUser = useMutation(api.userApproval.approveUser);
  const rejectUser = useMutation(api.userApproval.rejectUser);

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !pendingUsers || !approvalStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (userId: string) => {
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
                  <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <p className="text-yellow-400 text-sm font-medium">PENDING</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.pendingUsers}</p>
                  </div>
                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-400 text-sm font-medium">APPROVED</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.activeUsers}</p>
                  </div>
                  <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 text-sm font-medium">REJECTED</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.rejectedUsers}</p>
                  </div>
                  <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <p className="text-blue-400 text-sm font-medium">INVITATIONS</p>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{approvalStats.pendingInvitations}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {pendingUsers.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
                  <p className="text-gray-400">No pending user approvals at this time.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {pendingUsers.map((pendingUser: any) => (
                    <div
                      key={pendingUser._id}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            src={pendingUser.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${pendingUser.name}`}
                            alt={pendingUser.name}
                            className="w-16 h-16 rounded-full border-2 border-white/30"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-white">{pendingUser.name}</h3>
                              <Badge className={`${getRoleColor(pendingUser.userLevelDetails?.name || "WORKER")} text-white`}>
                                {pendingUser.userLevelDetails?.name || "WORKER"}
                              </Badge>
                              {pendingUser.registeredViaInvitation && (
                                <Badge className="bg-blue-600 text-white">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Invited
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              <div className="flex items-center gap-2 text-gray-300">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{pendingUser.email}</span>
                              </div>
                              {pendingUser.phone && (
                                <div className="flex items-center gap-2 text-gray-300">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{pendingUser.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-gray-300">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{pendingUser.department}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-300">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{pendingUser.position}</span>
                              </div>
                            </div>

                            {pendingUser.invitationDetails && (
                              <div className="mt-4 bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-xs text-blue-300">
                                  Registered using invitation code
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleApprove(pendingUser._id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedUser(pendingUser);
                              setShowRejectModal(true);
                            }}
                            variant="outline"
                            className="border-red-500 text-red-400 hover:bg-red-600/20"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
    </AdminGuard>
  );
}
