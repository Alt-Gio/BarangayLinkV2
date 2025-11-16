"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Printer,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import CertificatePreviewModal from "@/components/certificates/CertificatePreviewModal";
import { exportCertificateRequests } from "@/lib/export/exportUtils";

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Pending" | "Approved" | "Released" | "Rejected">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [previewCertificateId, setPreviewCertificateId] = useState<Id<"certificates"> | null>(null);

  // Fetch certificate requests
  const allRequests = useQuery(api.certificateRequests.getAllRequests, { limit: 100 });
  const stats = useQuery(api.certificateRequests.getRequestStats);

  // Mutations
  const updateStatus = useMutation(api.certificateRequests.updateRequestStatus);
  const generateCertificate = useMutation(api.certificates.generateCertificate);

  // Filter requests
  const filteredRequests = allRequests?.filter((request) => {
    // Status filter
    if (filterStatus !== "all" && request.status !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        request.controlNumber.toLowerCase().includes(term) ||
        request.requestedBy.toLowerCase().includes(term) ||
        request.certificateType.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const handleApprove = async (requestId: Id<"certificateRequests">, request: any) => {
    if (!confirm("Approve this certificate request?")) return;

    try {
      // Generate certificate
      const certId = await generateCertificate({
        residentId: request.residentId,
        certificateType: request.certificateType,
        purpose: request.purpose,
        issuedByPosition: "Barangay Captain", // You can make this dynamic
        amount: 50, // Default fee
        orNumber: `OR-${Date.now()}`,
        requestId,
      });

      alert("✅ Certificate approved and generated!");
      
      // Open preview
      if (certId) {
        setPreviewCertificateId(certId);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleReject = async (requestId: Id<"certificateRequests">) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    try {
      await updateStatus({
        requestId,
        status: "Rejected",
        rejectionReason: reason,
      });
      alert("✅ Request rejected");
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-500" />
              Certificate Management
            </h1>
            <p className="text-gray-400 mt-1">Manage certificate requests and issuance</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Requests</p>
                <p className="text-3xl font-bold text-white">{stats?.totalRequests || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-white">{stats?.pending || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">For Review</p>
                <p className="text-3xl font-bold text-white">{stats?.forReview || 0}</p>
              </div>
              <Eye className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-3xl font-bold text-white">{stats?.approved || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-white">{stats?.rejected || 0}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by control number, name, or certificate type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          {/* Export */}
          <Button
            onClick={() => {
              if (filteredRequests && filteredRequests.length > 0) {
                exportCertificateRequests(filteredRequests);
              } else {
                alert("No certificate requests to export");
              }
            }}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Released">Released</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Control #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Requestor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Certificate Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredRequests?.map((request) => (
                <tr key={request._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-mono">
                    {request.controlNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{request.requestedBy}</p>
                      {request.resident && (
                        <p className="text-xs text-gray-400">
                          {request.resident.barangayIdNumber}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{request.certificateType}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <p className="truncate max-w-xs">{request.purpose}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        request.status === "Pending"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : request.status === "Approved"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : request.status === "Released"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : request.status === "Rejected"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {request.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request._id, request)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request._id)}
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === "Approved" && request.certificateId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                          onClick={() => setPreviewCertificateId(request.certificateId as Id<"certificates">)}
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          Print
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredRequests?.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No certificate requests found</p>
            <p className="text-sm text-gray-500">Requests will appear here when residents submit them</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {filteredRequests?.length || 0} of {allRequests?.length || 0} requests
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="border-gray-600 text-gray-400">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled className="border-gray-600 text-gray-400">
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {previewCertificateId && (
        <CertificatePreviewModal
          open={!!previewCertificateId}
          onClose={() => setPreviewCertificateId(null)}
          certificateId={previewCertificateId}
        />
      )}

      {/* TODO: View Request Details Modal */}
    </div>
  );
}
