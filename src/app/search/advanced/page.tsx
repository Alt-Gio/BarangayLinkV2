"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, Calendar, User, Briefcase, CheckSquare, FileText, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdvancedSearchPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search filters
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("");

  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Build search args
  const searchArgs = {
    query: query || undefined,
    type: type || undefined,
    status: status || undefined,
    priority: priority || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
    dateTo: dateTo ? new Date(dateTo).getTime() : undefined,
    department: department || undefined,
    limit: 100,
  };

  const results = useQuery(
    api.search.advancedSearch,
    query || type || status || priority || dateFrom || dateTo || department
      ? searchArgs
      : "skip"
  );

  const departments = useQuery(api.departments.getAllDepartments);
  const users = useQuery(api.users.getAllUsers);

  const handleClearFilters = () => {
    setQuery("");
    setType("");
    setStatus("");
    setPriority("");
    setDateFrom("");
    setDateTo("");
    setDepartment("");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'task': return <CheckSquare className="w-5 h-5 text-blue-400" />;
      case 'user': return <User className="w-5 h-5 text-emerald-400" />;
      case 'event': return <Calendar className="w-5 h-5 text-yellow-400" />;
      case 'document': return <FileText className="w-5 h-5 text-pink-400" />;
      default: return <Search className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Advanced Search"
        dashboardSubtitle="Find anything"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Advanced Search</h1>
          <div className="w-9" />
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Search className="w-8 h-8 text-emerald-500" />
              Advanced Search
            </h1>
            <p className="text-gray-400 mt-2">
              Use filters to find exactly what you're looking for
            </p>
          </div>

          {/* Search Filters */}
          <div className="bg-gray-800/50 border border-white/10 rounded-lg p-6 space-y-6">
            {/* Search Query */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Query
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter search keywords..."
                  className="w-full bg-gray-700 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-gray-700 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="project">Projects</option>
                  <option value="task">Tasks</option>
                  <option value="user">Users</option>
                  <option value="event">Events</option>
                  <option value="document">Documents</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-700 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-gray-700 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-gray-700 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-gray-700 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-gray-700 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Departments</option>
                  {departments?.map((dept: any) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-800/50 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Search Results
              </h2>
              {results && (
                <span className="text-sm text-gray-400">
                  {results.length} results found
                </span>
              )}
            </div>

            {results && results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result: any) => (
                  <button
                    key={result._id}
                    onClick={() => router.push(result.url)}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left flex items-start gap-4"
                  >
                    <div className="mt-1">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">
                          {result.title || result.name}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                          {result.type}
                        </span>
                        {result.status && (
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                            {result.status}
                          </span>
                        )}
                        {result.priority && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            result.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                            result.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            result.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {result.priority}
                          </span>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      {result.email && (
                        <p className="text-sm text-gray-400">{result.email}</p>
                      )}
                      {result.department && (
                        <p className="text-sm text-gray-400">{result.department}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  {query || type || status ? "No results found" : "Start searching"}
                </p>
                <p className="text-gray-500 text-sm">
                  {query || type || status 
                    ? "Try adjusting your filters" 
                    : "Enter keywords or select filters to begin"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
