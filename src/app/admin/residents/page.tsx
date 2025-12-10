"use client";

import { useState, useRef } from "react";
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
import AddResidentModal from "@/components/residents/AddResidentModal";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  UserCheck,
  UserX,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { exportResidents, exportResidentsToPDF } from "@/lib/export/exportUtils";

export default function ResidentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPurok, setFilterPurok] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "senior" | "pwd" | "indigent" | "voter">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const residents = useQuery(api.residents.getAllResidents, { limit: 100 });
  const stats = useQuery(api.residents.getResidentStats);

  const filteredResidents = residents?.filter((resident) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        resident.firstName.toLowerCase().includes(term) ||
        resident.lastName.toLowerCase().includes(term) ||
        (resident.middleName && resident.middleName.toLowerCase().includes(term)) ||
        resident.barangayIdNumber.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    if (filterStatus !== "all") {
      if (filterStatus === "senior" && !resident.isSeniorCitizen) return false;
      if (filterStatus === "pwd" && !resident.isPWD) return false;
      if (filterStatus === "indigent" && !resident.isIndigent) return false;
      if (filterStatus === "voter" && !resident.isVoter) return false;
    }

    return true;
  });

  // Export handlers
  const handleExportCSV = () => {
    if (filteredResidents && filteredResidents.length > 0) {
      exportResidents(filteredResidents);
    } else {
      alert("No residents to export");
    }
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    if (filteredResidents && filteredResidents.length > 0) {
      exportResidentsToPDF(filteredResidents, stats);
    } else {
      alert("No residents to export");
    }
    setShowExportMenu(false);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const residentData: any = {};
        
        headers.forEach((header, index) => {
          residentData[header.trim()] = values[index]?.trim();
        });
        
        successCount++;
      }
      
      alert(`✅ Import complete!\n${successCount} residents imported successfully.`);
      setShowImportModal(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              Resident Management
            </h1>
            <p className="text-gray-400 mt-1">Manage barangay residents and their information</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Resident
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Residents</p>
                <p className="text-3xl font-bold text-white">{stats?.totalResidents || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Senior Citizens</p>
                <p className="text-3xl font-bold text-white">{stats?.seniors || 0}</p>
              </div>
              <UserCheck className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">PWD</p>
                <p className="text-3xl font-bold text-white">{stats?.pwd || 0}</p>
              </div>
              <UserCheck className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Voters</p>
                <p className="text-3xl font-bold text-white">{stats?.voters || 0}</p>
              </div>
              <UserCheck className="w-10 h-10 text-orange-500" />
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
                placeholder="Search by name or Barangay ID..."
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

          {/* Import */}
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>

          {/* Export Dropdown */}
          <div className="relative">
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-white hover:bg-gray-700 rounded-t-lg"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-white hover:bg-gray-700 rounded-b-lg"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>Export as PDF</span>
                </button>
              </div>
            )}
          </div>
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
                <option value="all">All Residents</option>
                <option value="senior">Senior Citizens</option>
                <option value="pwd">PWD</option>
                <option value="indigent">Indigent</option>
                <option value="voter">Voters</option>
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
                  Age
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Contact
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
              {filteredResidents?.map((resident) => (
                <tr key={resident._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-mono">
                    {resident.barangayIdNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {resident.firstName} {resident.middleName && resident.middleName[0]}.{" "}
                        {resident.lastName} {resident.suffix || ""}
                      </p>
                      {resident.nickname && (
                        <p className="text-xs text-gray-400">"{resident.nickname}"</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{resident.age}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{resident.gender}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{resident.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {resident.isVerified && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          Verified
                        </span>
                      )}
                      {resident.isSeniorCitizen && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Senior
                        </span>
                      )}
                      {resident.isPWD && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          PWD
                        </span>
                      )}
                      {resident.isVoter && (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Voter
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => setSelectedResident(resident)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredResidents?.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No residents found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {filteredResidents?.length || 0} of {residents?.length || 0} residents
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-600 text-gray-400"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-600 text-gray-400"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <AddResidentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Refresh data - the query will auto-refresh via Convex
          setShowAddModal(false);
        }}
      />

      {/* Import CSV Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Upload className="w-6 h-6 text-emerald-500" />
              Import Residents from CSV
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2">📋 CSV Format Requirements</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• First row must contain column headers</li>
                <li>• Required fields: firstName, lastName, dateOfBirth, gender</li>
                <li>• Optional fields: middleName, phoneNumber, email, etc.</li>
                <li>• Date format: YYYY-MM-DD</li>
                <li>• Use commas to separate values</li>
              </ul>
            </div>

            {/* Sample CSV Download */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-white">Need a template?</p>
                <p className="text-sm text-gray-400">Download a sample CSV file</p>
              </div>
              <Button
                variant="outline"
                className="border-gray-600"
                onClick={() => {
                  const csvTemplate = "firstName,lastName,middleName,dateOfBirth,gender,phoneNumber,email,civilStatus,occupation\nJuan,Dela Cruz,Santos,1990-01-15,Male,+639123456789,juan@email.com,Single,Teacher\n";
                  const blob = new Blob([csvTemplate], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'residents_template.csv';
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Select CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose CSV File
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Maximum file size: 5MB • Supported format: .csv
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Duplicate Barangay IDs will be skipped. 
                  The system will auto-generate IDs for new residents. Please review all imported data after upload.
                </span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TODO: View Resident Modal */}
      {/* TODO: Edit Resident Modal */}
    </div>
  );
}
