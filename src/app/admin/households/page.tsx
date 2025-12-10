"use client";

import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddHouseholdModal from "@/components/households/AddHouseholdModal";
import {
  Home,
  Search,
  Filter,
  Plus,
  MapPin,
  Users,
  DollarSign,
  Zap,
  Droplet,
  Wifi,
  ChevronDown,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { exportHouseholds } from "@/lib/export/exportUtils";

export default function HouseholdsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPurok, setFilterPurok] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const households = useQuery(api.households.getAllHouseholds, { limit: 100 });
  const stats = useQuery(api.households.getHouseholdStats);

  const filteredHouseholds = households?.filter((household) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        household.householdNumber.toLowerCase().includes(term) ||
        household.street.toLowerCase().includes(term) ||
        household.houseNumber.toLowerCase().includes(term) ||
        household.purok.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    if (filterPurok && household.purok !== filterPurok) {
      return false;
    }

    return true;
  });

  const puroks = Array.from(new Set(households?.map((h) => h.purok) || []));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Home className="w-8 h-8 text-emerald-500" />
              Household Management
            </h1>
            <p className="text-gray-400 mt-1">Manage household records and family units</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Household
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Households</p>
                <p className="text-3xl font-bold text-white">{stats?.totalHouseholds || 0}</p>
              </div>
              <Home className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Indigent Families</p>
                <p className="text-3xl font-bold text-white">{stats?.indigentHouseholds || 0}</p>
              </div>
              <Users className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">4Ps Beneficiaries</p>
                <p className="text-3xl font-bold text-white">{stats?.fourPsBeneficiaries || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Puroks</p>
                <p className="text-3xl font-bold text-white">{puroks.length || 0}</p>
              </div>
              <MapPin className="w-10 h-10 text-purple-500" />
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
                placeholder="Search by household number, street, or purok..."
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

          {/* Export */}
          <Button
            onClick={() => {
              if (filteredHouseholds && filteredHouseholds.length > 0) {
                exportHouseholds(filteredHouseholds);
              } else {
                alert("No households to export");
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
              <label className="block text-sm text-gray-400 mb-2">Purok Filter</label>
              <select
                value={filterPurok}
                onChange={(e) => setFilterPurok(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white"
              >
                <option value="">All Puroks</option>
                {puroks.map((purok) => (
                  <option key={purok} value={purok}>
                    {purok}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Households Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Household #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Purok
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Members
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
              {filteredHouseholds?.map((household) => (
                <tr key={household._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-mono">
                    {household.householdNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {household.houseNumber} {household.street}
                      </p>
                      <p className="text-xs text-gray-400">
                        {household.city}, {household.province}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{household.purok}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>{household.totalMembers}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {household.isIndigent && (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Indigent
                        </span>
                      )}
                      {household.is4PsBeneficiary && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          4Ps
                        </span>
                      )}
                      {household.hasElectricity && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          ⚡
                        </span>
                      )}
                      {household.hasWater && (
                        <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          💧
                        </span>
                      )}
                      {household.hasInternet && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          📡
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
                        onClick={() => setSelectedHousehold(household)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
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
        {filteredHouseholds?.length === 0 && (
          <div className="text-center py-16">
            <Home className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No households found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {filteredHouseholds?.length || 0} of {households?.length || 0} households
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
      <AddHouseholdModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Data will auto-refresh via Convex
          setShowAddModal(false);
        }}
      />

      {/* TODO: View Household Members Modal */}
      {/* TODO: Edit Household Modal */}
    </div>
  );
}
