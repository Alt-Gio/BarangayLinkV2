"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  FileText,
  Home,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import NotificationBell from "@/components/portal/NotificationBell";

export default function ResidentPortalPage() {
  const { user, isLoaded } = useUser();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [linkingAttempted, setLinkingAttempted] = useState(false);
  const [requestForm, setRequestForm] = useState({
    certificateType: "Barangay Clearance",
    purpose: "",
    notes: "",
    requestFor: "self" as "self" | string, // "self" or resident ID
  });

  const myResident = useQuery(
    api.residents.getResidentByClerkId,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const linkUser = useMutation(api.residents.linkClerkUserToResident);

  useEffect(() => {
    if (isLoaded && user && myResident === null && !linkingAttempted) {
      setLinkingAttempted(true);
      handleAutoLink();
    }
  }, [isLoaded, user, myResident, linkingAttempted]);

  const handleAutoLink = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setShowLinkingModal(true);
      return;
    }

    const emailVerified = user.primaryEmailAddress.verification?.status === "verified";
    if (!emailVerified) {
      alert("⚠️ Please verify your email address before accessing the portal. Check your inbox for the verification link.");
      return;
    }

    try {
      await linkUser({
        clerkUserId: user.id,
        email: user.primaryEmailAddress.emailAddress,
      });
    } catch (error: any) {
      console.error("Auto-link failed:", error);
      setShowLinkingModal(true);
    }
  };

  if (!isLoaded || myResident === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!myResident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-lg p-8">
          <div className="text-center mb-6">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Account Not Linked</h2>
            <p className="text-gray-400">
              Your account is not linked to a resident record in our system.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-200">
                <strong>What to do:</strong>
              </p>
              <ol className="text-sm text-yellow-200 mt-2 space-y-1 list-decimal list-inside">
                <li>Visit the Barangay Office</li>
                <li>Register as a resident</li>
                <li>Provide this email address</li>
                <li>Admin will link your account</li>
              </ol>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = "/"}
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const residentData = {
    _id: myResident._id,
    firstName: myResident.firstName,
    lastName: myResident.lastName,
    barangayIdNumber: myResident.barangayIdNumber,
    email: myResident.email,
    phoneNumber: myResident.phoneNumber,
    age: myResident.age,
    civilStatus: myResident.civilStatus,
    occupation: myResident.occupation,
    isVerified: myResident.isVerified,
    household: myResident.household,
  };

  const myRequests = useQuery(
    api.certificateRequests.getRequestsByResident,
    { residentId: myResident._id }
  );

  const myCertificates = useQuery(
    api.certificates.getCertificatesByResident,
    { residentId: myResident._id }
  );

  const householdMembers = useQuery(
    api.residents.getHouseholdMembers,
    myResident?.household?._id ? { householdId: myResident.household._id } : "skip"
  );

  const createRequest = useMutation(api.certificateRequests.createRequest);

  const canRequestForFamily = myResident?.relationToHead === "Head" || 
                               myResident?.relationToHead === "Spouse";

  const handleSubmitRequest = async () => {
    if (!requestForm.purpose) {
      alert("Please specify the purpose");
      return;
    }

    try {
      // ✅ Submit REAL certificate request
      const result = await createRequest({
        residentId: residentData._id,
        certificateType: requestForm.certificateType as any,
        purpose: requestForm.purpose,
        notes: requestForm.notes || undefined,
        requestedForId: requestForm.requestFor === "self" ? undefined : requestForm.requestFor as any,
      });

      alert("✅ Certificate request submitted! You will be notified once approved.");
      setShowRequestModal(false);
      setRequestForm({ certificateType: "Barangay Clearance", purpose: "", notes: "", requestFor: "self" });
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resident Portal</h1>
            <p className="text-blue-100">Welcome back, {residentData.firstName}!</p>
          </div>
          {/* Notification Bell */}
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Profile Overview Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                {residentData.firstName[0]}{residentData.lastName[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {residentData.firstName} {residentData.lastName}
                </h2>
                <p className="text-gray-400 font-mono">{residentData.barangayIdNumber}</p>
                {residentData.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs mt-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified Resident
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/portal/profile"}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                onClick={() => setShowRequestModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Certificate
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2 text-gray-300">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-sm">{residentData.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Phone className="w-4 h-4 text-green-400" />
              <span className="text-sm">{residentData.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-sm">{residentData.age} yrs, {residentData.civilStatus}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Requests</p>
                <p className="text-3xl font-bold text-white">{myRequests?.length || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-3xl font-bold text-white">
                  {myRequests?.filter(r => r.status === "Approved").length || 0}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-white">
                  {myRequests?.filter(r => r.status === "Pending").length || 0}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* My Requests */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            My Certificate Requests
          </h3>

          <div className="space-y-4">
            {/* Loading State */}
            {myRequests === undefined && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your requests...</p>
              </div>
            )}

            {/* Requests List */}
            {myRequests && myRequests.length > 0 && myRequests.map((request) => (
              <div
                key={request._id}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-gray-400">{request.controlNumber}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          request.status === "Approved"
                            ? "bg-green-500/20 text-green-400"
                            : request.status === "Pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : request.status === "Rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">{request.certificateType}</h4>
                    <p className="text-sm text-gray-400 mb-2">Purpose: {request.purpose}</p>
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                    {request.rejectionReason && (
                      <p className="text-xs text-red-400 mt-2">
                        Rejection reason: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  {request.status === "Approved" && request.certificateId && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(`/certificates/${request.certificateId}`, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View Certificate
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {myRequests && myRequests.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No certificate requests yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Click "Request Certificate" above to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Certificate Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500" />
              Request Certificate
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Family Member Selector - Only show if can request for family */}
            {canRequestForFamily && householdMembers && householdMembers.length > 1 && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Request For *</label>
                <select
                  value={requestForm.requestFor}
                  onChange={(e) => setRequestForm({ ...requestForm, requestFor: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="self">For myself ({residentData.firstName} {residentData.lastName})</option>
                  {householdMembers
                    .filter(m => m._id !== residentData._id)
                    .map(member => (
                      <option key={member._id} value={member._id}>
                        For {member.firstName} {member.lastName} ({member.relationToHead})
                      </option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  As {myResident?.relationToHead}, you can request certificates for household members
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Certificate Type *</label>
              <select
                value={requestForm.certificateType}
                onChange={(e) => setRequestForm({ ...requestForm, certificateType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="Barangay Clearance">Barangay Clearance</option>
                <option value="Certificate of Indigency">Certificate of Indigency</option>
                <option value="Certificate of Residency">Certificate of Residency</option>
                <option value="Certificate of Good Moral">Certificate of Good Moral</option>
                <option value="Business Permit">Business Permit</option>
                <option value="COMELEC Certification">COMELEC Certification</option>
                <option value="First Time Job Seeker">First Time Job Seeker</option>
                <option value="Certificate of No Income">Certificate of No Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Purpose *</label>
              <Input
                value={requestForm.purpose}
                onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                placeholder="e.g., Employment requirement, School enrollment"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Additional Notes (Optional)</label>
              <Textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                placeholder="Any additional information..."
                className="bg-gray-800 border-gray-700 text-white resize-none"
                rows={3}
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                📋 <strong>Note:</strong> Your request will be reviewed by the barangay staff. 
                You will be notified once your certificate is ready for pickup or download.
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} className="bg-indigo-600 hover:bg-indigo-700">
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
