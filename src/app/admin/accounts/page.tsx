"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Link as LinkIcon,
  Unlink,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
  User,
  AlertCircle,
  Filter,
  Download,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function AccountsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "linked" | "unlinked">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkClerkId, setLinkClerkId] = useState("");

  const residents = useQuery(api.residents.getAllResidents, { limit: 500 });
  const stats = useQuery(api.residents.getResidentStats);

  const updateClerkId = useMutation(api.residents.updateResidentClerkId);

  const filteredResidents = residents?.filter((resident) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        resident.firstName.toLowerCase().includes(term) ||
        resident.lastName.toLowerCase().includes(term) ||
        resident.email?.toLowerCase().includes(term) ||
        resident.barangayIdNumber.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    if (filterStatus === "linked" && !resident.clerkUserId) return false;
    if (filterStatus === "unlinked" && resident.clerkUserId) return false;

    return true;
  });

  const linkedCount = residents?.filter(r => r.clerkUserId).length || 0;
  const unlinkedCount = (residents?.length || 0) - linkedCount;

  const handleUnlink = async (residentId: Id<"residents">) => {
    if (!confirm("Unlink this account? The resident will need to re-authenticate.")) return;

    try {
      await updateClerkId({
        residentId,
        clerkUserId: undefined,
      });
      alert("✅ Account unlinked successfully!");
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleManualLink = async () => {
    if (!linkClerkId || !selectedResident) {
      alert("Please provide Clerk User ID");
      return;
    }

    try {
      await updateClerkId({
        residentId: selectedResident._id,
        clerkUserId: linkClerkId,
      });
      alert("✅ Account linked successfully!");
      setShowLinkModal(false);
      setLinkClerkId("");
      setSelectedResident(null);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const exportAccountsData = () => {
    if (!residents) return;

    const csv = [
      "Barangay ID,Name,Email,Phone,Clerk User ID,Link Status",
      ...residents.map(r => 
        `${r.barangayIdNumber},"${r.firstName} ${r.lastName}",${r.email || "N/A"},${r.phoneNumber},${r.clerkUserId || "N/A"},${r.clerkUserId ? "Linked" : "Not Linked"}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `account_links_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              Account Management
            </h1>
            <p className="text-gray-400 mt-1">Manage resident account links and authentication</p>
          </div>
          <Button
            onClick={exportAccountsData}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Residents</p>
                <p className="text-3xl font-bold text-white">{residents?.length || 0}</p>
              </div>
              <User className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Linked Accounts</p>
                <p className="text-3xl font-bold text-white">{linkedCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Not Linked</p>
                <p className="text-3xl font-bold text-white">{unlinkedCount}</p>
              </div>
              <XCircle className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Link Rate</p>
                <p className="text-3xl font-bold text-white">
                  {residents?.length ? Math.round((linkedCount / residents.length) * 100) : 0}%
                </p>
              </div>
              <Shield className="w-10 h-10 text-purple-500" />
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
                placeholder="Search by name, email, or Barangay ID..."
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
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Link Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">All Residents</option>
                <option value="linked">Linked Only</option>
                <option value="unlinked">Not Linked Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Residents Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Barangay ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Link Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredResidents?.map((resident) => (
                <tr key={resident._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-mono">
                    {resident.barangayIdNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {resident.firstName} {resident.lastName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{resident.email || "No email"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{resident.phoneNumber}</td>
                  <td className="px-4 py-3">
                    {resident.clerkUserId ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Linked
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {resident.clerkUserId.substring(0, 12)}...
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" />
                        Not Linked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {resident.clerkUserId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnlink(resident._id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          <Unlink className="w-3 h-3 mr-1" />
                          Unlink
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedResident(resident);
                            setLinkEmail(resident.email || "");
                            setShowLinkModal(true);
                          }}
                          className="border-green-600 text-green-400 hover:bg-green-600/20"
                        >
                          <LinkIcon className="w-3 h-3 mr-1" />
                          Link Account
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredResidents?.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No residents found</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Link Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <LinkIcon className="w-6 h-6 text-green-500" />
              Manually Link Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Resident Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2">Resident Information</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-300">
                  <strong>Name:</strong> {selectedResident?.firstName} {selectedResident?.lastName}
                </p>
                <p className="text-gray-300">
                  <strong>Barangay ID:</strong> {selectedResident?.barangayIdNumber}
                </p>
                <p className="text-gray-300">
                  <strong>Email:</strong> {selectedResident?.email || "No email on file"}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-300 mb-2">How to Find Clerk User ID:</h3>
              <ol className="text-sm text-yellow-200 space-y-1 list-decimal list-inside">
                <li>Ask the resident to log in to the portal</li>
                <li>Have them check their browser console</li>
                <li>User ID starts with "user_" followed by random characters</li>
                <li>Copy and paste the full ID here</li>
              </ol>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Clerk User ID *</label>
              <Input
                value={linkClerkId}
                onChange={(e) => setLinkClerkId(e.target.value)}
                placeholder="user_2abc123xyz456..."
                className="bg-gray-800 border-gray-700 text-white font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: user_2abc123xyz456def789
              </p>
            </div>

            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> Manual linking should only be used when auto-linking fails. 
                  Ensure the Clerk User ID belongs to this resident to prevent unauthorized access.
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkClerkId("");
                  setSelectedResident(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualLink}
                className="bg-green-600 hover:bg-green-700"
                disabled={!linkClerkId}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Link Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
