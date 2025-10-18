"use client";

import { useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  AlertCircle,
  LogOut,
  Loader2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUserStatus);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-800/50 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
            {isPending && <Clock className="w-7 h-7 text-yellow-500" />}
            {isRejected && <XCircle className="w-7 h-7 text-red-500" />}
            {isPending ? "Registration Pending" : "Registration Status"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isPending
              ? "Your account is awaiting administrator approval"
              : "Account status information"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Pending Status */}
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
            <>
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
            </>
          )}

          {/* Logout Button */}
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
