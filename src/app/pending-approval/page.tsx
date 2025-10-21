"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  AlertCircle,
  LogOut,
  Loader2,
  User,
  Calendar,
  Shield,
  Building2,
  Briefcase,
  Phone,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUserStatus);
  const [activeTab, setActiveTab] = useState<"status" | "details" | "history">("status");

  // Check user status and redirect if approved
  useEffect(() => {
    if (currentUser?.status === "active") {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isPending = currentUser?.status === "pending";
  const isRejected = currentUser?.status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isPending && <Clock className="w-10 h-10 text-yellow-400" />}
                {isRejected && <XCircle className="w-10 h-10 text-red-400" />}
                {currentUser?.status === "active" && <CheckCircle className="w-10 h-10 text-emerald-400" />}
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {isPending && "Registration Pending"}
                    {isRejected && "Registration Denied"}
                    {currentUser?.status === "active" && "Account Active"}
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {isPending && "Awaiting administrator review"}
                    {isRejected && "Your registration was not approved"}
                    {currentUser?.status === "active" && "Your account is fully active"}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => signOut()}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="border-b border-white/10 bg-white/5">
            <div className="flex">
              <button
                onClick={() => setActiveTab("status")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === "status"
                    ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Current Status
                </div>
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === "details"
                    ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  My Information
                </div>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Activity History
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Status Tab */}
            {activeTab === "status" && (
              <div className="space-y-6">
                {isPending && (
            <>
              <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-12 h-12 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">
                      Registration Submitted Successfully
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Thank you for registering with BarangayLink! Your account has been
                      created and is currently pending approval from our administrators.
                    </p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Account created
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Email verified
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        Awaiting admin approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Next Section */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                  What happens next?
                </h3>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-emerald-400 font-semibold">1.</span>
                    <span>
                      An administrator will review your registration details within{" "}
                      <strong className="text-white">1-2 business days</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-400 font-semibold">2.</span>
                    <span>
                      You'll receive a notification via email once your account is approved.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-400 font-semibold">3.</span>
                    <span>
                      After approval, you'll have full access to all BarangayLink features.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Account Information */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Your Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{currentUser?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{currentUser?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Department:</span>
                    <span className="text-white">{currentUser?.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white">{currentUser?.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-yellow-400 font-semibold">PENDING APPROVAL</span>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200">
                    <p className="font-semibold mb-1">Need help or have questions?</p>
                    <p>
                      Contact your barangay administrator at{" "}
                      <a
                        href="mailto:admin@barangay.gov.ph"
                        className="text-blue-300 hover:underline"
                      >
                        admin@barangay.gov.ph
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </>
                )}

                {/* Rejected Status */}
                {isRejected && (
                  <div className="space-y-6">
              <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <XCircle className="w-12 h-12 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">
                      Registration Denied
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Unfortunately, your registration has been denied by our administrators.
                    </p>
                    {currentUser?.rejectionReason && (
                      <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                        <p className="text-sm text-red-200">
                          <strong>Reason:</strong> {currentUser.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">What you can do:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      Contact your barangay administrator to understand the reason for denial
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Address the issues mentioned in the rejection reason</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      Register again with correct information or proper documentation
                    </span>
                  </li>
                </ul>
              </div>
                  </div>
                )}

                {/* Contact Section */}
                <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-semibold mb-2">Need Assistance?</p>
                      <p className="text-gray-300 text-sm mb-3">
                        Contact your barangay administrator for questions or concerns about your registration.
                      </p>
                      <a
                        href="mailto:admin@barangay.gov.ph"
                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <Mail className="w-4 h-4" />
                        admin@barangay.gov.ph
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-400" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Full Name</label>
                        <p className="text-white font-medium mt-1">{currentUser?.name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Email Address</label>
                        <p className="text-white font-medium mt-1 text-sm">{currentUser?.email}</p>
                      </div>
                      {currentUser?.phone && (
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider">Phone Number</label>
                          <p className="text-white font-medium mt-1">{currentUser.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                      Work Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Department</label>
                        <p className="text-white font-medium mt-1">{currentUser?.department}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Position</label>
                        <p className="text-white font-medium mt-1">{currentUser?.position}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Account Status</label>
                        <div className="mt-1">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Approval
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                          )}
                          {currentUser?.status === "active" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info Card */}
                <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-3">Registration Method</h3>
                  <div className="flex items-center gap-3">
                    {currentUser?.registeredViaInvitation ? (
                      <>
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Invited User</p>
                          <p className="text-gray-400 text-sm">Registered via email invitation</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                          <User className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Self Registration</p>
                          <p className="text-gray-400 text-sm">Registered independently</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="grid gap-6">
                  {/* Registration Timeline */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      Registration Timeline
                    </h3>
                    <div className="space-y-4">
                      {/* Account Created */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 w-0.5 bg-white/10 min-h-[60px] mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-white font-medium">Account Created</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {currentUser?._creationTime &&
                              new Date(currentUser._creationTime).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </p>
                        </div>
                      </div>

                      {/* Approval/Rejection */}
                      {currentUser?.approvedAt && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">Account Approved</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {new Date(currentUser.approvedAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {currentUser?.rejectedAt && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                              <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">Account Rejected</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {new Date(currentUser.rejectedAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {currentUser.rejectionReason && (
                              <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                <p className="text-xs text-red-300 font-medium uppercase mb-1">Rejection Reason</p>
                                <p className="text-red-200 text-sm">{currentUser.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pending */}
                      {isPending && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center animate-pulse">
                              <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">Awaiting Review</p>
                            <p className="text-gray-400 text-sm mt-1">
                              Administrator will review your registration within 1-2 business days
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Tracking */}
                  {(currentUser?.approvedBy || currentUser?.rejectedBy) && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        Review Details
                      </h3>
                      <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-500/20 rounded-lg">
                            <User className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                              {currentUser.approvedBy ? "Approved By" : "Rejected By"}
                            </p>
                            <p className="text-white font-medium">Administrator</p>
                            <p className="text-gray-400 text-sm mt-2">
                              Action taken on{" "}
                              {currentUser.approvedAt &&
                                new Date(currentUser.approvedAt).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              {currentUser.rejectedAt &&
                                new Date(currentUser.rejectedAt).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
