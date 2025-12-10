"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth, SignUp } from "@clerk/nextjs";
import { Mail, User, Building, Briefcase, Shield, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, userId: clerkId } = useAuth();
  const token = params.token as string;

  const invitation = useQuery(api.invitations.getInvitationByToken, { token });
  const acceptInvitation = useMutation(api.invitations.acceptInvitation);

  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isSignedIn && clerkId && invitation && !invitation.isExpired && !invitation.isAccepted && !success && !isAccepting) {
      handleAcceptInvitation();
    }
  }, [isSignedIn, clerkId, invitation]);

  const handleAcceptInvitation = async () => {
    if (!clerkId || !invitation) return;

    setIsAccepting(true);
    setError("");

    try {
      await acceptInvitation({
        token: token,
        clerkId: clerkId,
        email: invitation.email,
      });

      setSuccess(true);
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  if (invitation === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-red-500/30 p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-gray-300 mb-6">
            This invitation link is invalid or has been removed.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (invitation.isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-yellow-500/30 p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invitation Expired</h1>
          <p className="text-gray-300 mb-6">
            This invitation link has expired. Please contact your administrator for a new invitation.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (invitation.isAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-blue-500/30 p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Already Accepted</h1>
          <p className="text-gray-300 mb-6">
            This invitation has already been accepted. Please sign in to continue.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-emerald-500/30 p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h1>
          <p className="text-gray-300 mb-2">
            Your account has been created successfully.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Redirecting to dashboard...
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8">
          {/* Invitation Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <Mail className="w-8 h-8 text-emerald-500" />
                You're Invited!
              </h1>
              <p className="text-gray-300">Join BarangayLink V2</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Your Name</p>
                    <p className="text-white font-medium">
                      {invitation.firstName} {invitation.lastName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Email Address</p>
                    <p className="text-white font-medium">{invitation.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Department</p>
                    <p className="text-white font-medium">{invitation.department}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Position</p>
                    <p className="text-white font-medium">{invitation.position}</p>
                  </div>
                </div>
              </div>

              {invitation.userLevel && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-gray-400 text-sm">Access Level</p>
                      <p className="text-white font-medium">{invitation.userLevel.name}</p>
                      <p className="text-gray-400 text-xs mt-1">{invitation.userLevel.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {invitation.invitedByUser && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm mb-2">Invited by:</p>
                <div className="flex items-center gap-3">
                  {invitation.invitedByUser.imageUrl && (
                    <img
                      src={invitation.invitedByUser.imageUrl}
                      alt={invitation.invitedByUser.name}
                      className="w-10 h-10 rounded-full border-2 border-emerald-500"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{invitation.invitedByUser.name}</p>
                    <p className="text-gray-400 text-sm">{invitation.invitedByUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Please use the email address <strong>{invitation.email}</strong> to create your account.
                </span>
              </p>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="flex items-center justify-center">
            <div className="w-full">
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "bg-white/10 backdrop-blur-lg border-white/20",
                  },
                }}
                routing="path"
                path="/accept-invitation/signup"
                signInUrl="/login"
                afterSignUpUrl={`/accept-invitation/${token}`}
                redirectUrl={`/accept-invitation/${token}`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium"
            >
              Go to Dashboard
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Setting Up Your Account</h1>
            <p className="text-gray-300">
              Please wait while we create your account...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
