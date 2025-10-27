"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Upload,
  Search,
  Filter,
  Grid3x3,
  List,
  Menu,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  TrendingUp,
  Database,
  FileVideo,
  FileAudio,
  FileCode,
  Archive,
  Calendar,
  Tag,
  X,
  Download,
  Eye,
  SortAsc,
  SortDesc,
  FileCheck,
  FolderTree,
  Layers,
  Briefcase,
  Shield,
  DollarSign,
  Award,
  Presentation,
  Palette,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// Get color classes for categories (outside component to avoid hook order issues)
const getCategoryColors = (color: string, isSelected: boolean) => {
  const colorMap: Record<string, { bg: string; icon: string; badge: string; shadow: string }> = {
    blue: {
      bg: isSelected ? "bg-blue-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-blue-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-300",
      shadow: isSelected ? "shadow-lg shadow-blue-500/30" : ""
    },
    emerald: {
      bg: isSelected ? "bg-emerald-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-emerald-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-300",
      shadow: isSelected ? "shadow-lg shadow-emerald-500/30" : ""
    },
    yellow: {
      bg: isSelected ? "bg-yellow-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-yellow-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-yellow-500/20 text-yellow-300",
      shadow: isSelected ? "shadow-lg shadow-yellow-500/30" : ""
    },
    red: {
      bg: isSelected ? "bg-red-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-red-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-red-500/20 text-red-300",
      shadow: isSelected ? "shadow-lg shadow-red-500/30" : ""
    },
    purple: {
      bg: isSelected ? "bg-purple-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-purple-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-purple-500/20 text-purple-300",
      shadow: isSelected ? "shadow-lg shadow-purple-500/30" : ""
    },
    orange: {
      bg: isSelected ? "bg-orange-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-orange-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-orange-500/20 text-orange-300",
      shadow: isSelected ? "shadow-lg shadow-orange-500/30" : ""
    },
    green: {
      bg: isSelected ? "bg-green-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-green-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-green-500/20 text-green-300",
      shadow: isSelected ? "shadow-lg shadow-green-500/30" : ""
    },
    indigo: {
      bg: isSelected ? "bg-indigo-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-indigo-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-300",
      shadow: isSelected ? "shadow-lg shadow-indigo-500/30" : ""
    },
    cyan: {
      bg: isSelected ? "bg-cyan-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-cyan-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-cyan-500/20 text-cyan-300",
      shadow: isSelected ? "shadow-lg shadow-cyan-500/30" : ""
    },
    pink: {
      bg: isSelected ? "bg-pink-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-pink-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-pink-500/20 text-pink-300",
      shadow: isSelected ? "shadow-lg shadow-pink-500/30" : ""
    },
    slate: {
      bg: isSelected ? "bg-slate-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-slate-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-slate-500/20 text-slate-300",
      shadow: isSelected ? "shadow-lg shadow-slate-500/30" : ""
    },
    gray: {
      bg: isSelected ? "bg-gray-600" : "hover:bg-white/5",
      icon: isSelected ? "text-white" : "text-gray-400",
      badge: isSelected ? "bg-white/20 text-white" : "bg-gray-500/20 text-gray-300",
      shadow: isSelected ? "shadow-lg shadow-gray-500/30" : ""
    }
  };
  return colorMap[color] || colorMap.gray;
};

export default function DocumentsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS!
  const currentUser = useQuery(api.users.getCurrentUser);
  const documents = useQuery(api.documents.getAllDocuments, {
    category: selectedCategory,
    limit: 200
  });
  const stats = useQuery(api.documents.getDocumentStats);
  const allTags = useQuery(api.documentTagging.getAllTags);

  // SMART FILTERING & SORTING (useMemo is a hook, must be before returns!)
  const filteredAndSortedDocuments = useMemo(() => {
    if (!documents) return [];

    let filtered = documents.filter((doc: any) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch = 
          doc.fileName.toLowerCase().includes(search) ||
          doc.description?.toLowerCase().includes(search) ||
          doc.tags.some((tag: string) => tag.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(selectedTag =>
          doc.tags.some((docTag: string) => docTag.toLowerCase() === selectedTag.toLowerCase())
        );
        if (!hasAllTags) return false;
      }

      // File type filter
      if (filterType) {
        const mimeType = doc.mimeType.toLowerCase();
        if (filterType === "pdf" && !mimeType.includes("pdf")) return false;
        if (filterType === "image" && !mimeType.includes("image")) return false;
        if (filterType === "spreadsheet" && !(mimeType.includes("spreadsheet") || mimeType.includes("excel"))) return false;
        if (filterType === "document" && !(mimeType.includes("word") || mimeType.includes("document"))) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a: any, b: any) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.fileName.localeCompare(b.fileName);
      } else if (sortBy === "size") {
        comparison = a.fileSize - b.fileSize;
      } else { // date
        comparison = (a._creationTime || 0) - (b._creationTime || 0);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [documents, searchQuery, selectedTags, filterType, sortBy, sortOrder]);

  // ✅ NOW WE CAN HAVE EARLY RETURNS (all hooks already called)
  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  // EXPANDED SMART CATEGORIES
  const categories = [
    { name: "All Documents", value: undefined, icon: FolderOpen, color: "blue" },
    { name: "Reports", value: "Reports", icon: FileCheck, color: "emerald" },
    { name: "Financial", value: "Financial", icon: DollarSign, color: "yellow" },
    { name: "Legal", value: "Legal", icon: Shield, color: "red" },
    { name: "Images", value: "Images", icon: ImageIcon, color: "purple" },
    { name: "Presentations", value: "Presentations", icon: Presentation, color: "orange" },
    { name: "Spreadsheets", value: "Spreadsheets", icon: FileSpreadsheet, color: "green" },
    { name: "Certificates", value: "Certificates", icon: Award, color: "indigo" },
    { name: "Meetings", value: "Meetings", icon: Calendar, color: "cyan" },
    { name: "Design", value: "Design", icon: Palette, color: "pink" },
    { name: "Technical", value: "Technical", icon: Cpu, color: "slate" },
    { name: "General", value: "General", icon: File, color: "gray" }
  ];

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Document Library"
        dashboardSubtitle="Manage and organize files"
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
          <h1 className="text-lg font-semibold text-white">Documents</h1>
          <button
            onClick={() => setShowUpload(true)}
            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Header */}
          <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 md:sticky md:top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                    Document Library
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 mt-1">Upload, organize and manage your files</p>
                </div>
                <Button
                  onClick={() => setShowUpload(!showUpload)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm sm:text-base transition-transform"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">Upload Document</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-400 text-xs sm:text-sm">Total Documents</p>
                          <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalDocuments}</p>
                        </div>
                        <File className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border-emerald-500/30">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-400 text-xs sm:text-sm">Storage Used</p>
                          <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalSizeMB} MB</p>
                        </div>
                        <Database className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-400 text-xs sm:text-sm">Public</p>
                          <p className="text-xl sm:text-2xl font-bold text-white">{stats.publicDocuments}</p>
                        </div>
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-400 text-xs sm:text-sm">Private</p>
                          <p className="text-xl sm:text-2xl font-bold text-white">{stats.privateDocuments}</p>
                        </div>
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Upload Section */}
            {showUpload && (
              <div className="mb-6">
                <DocumentUpload onClose={() => setShowUpload(false)} />
              </div>
            )}

            {/* ADVANCED SEARCH AND FILTERS */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 mb-6">
              {/* Search Bar */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, description, or tags..."
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-11"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                    size="icon"
                    className={`${viewMode === "list" ? "bg-emerald-600 hover:bg-emerald-700" : "border-white/20 text-white hover:bg-white/10"}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    onClick={() => setViewMode("grid")}
                    size="icon"
                    className={`${viewMode === "grid" ? "bg-emerald-600 hover:bg-emerald-700" : "border-white/20 text-white hover:bg-white/10"}`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-400 font-medium">Filters:</span>
                
                {/* File Type Filter */}
                <div className="flex gap-2">
                  {["pdf", "image", "spreadsheet", "document"].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterType(filterType === type ? undefined : type)}
                      className={`${filterType === type ? "bg-emerald-600 text-white border-emerald-600" : "border-white/20 text-gray-300 hover:bg-white/10"}`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="h-5 w-px bg-white/20" />

                {/* Sort Controls */}
                <span className="text-sm text-gray-400 font-medium">Sort:</span>
                <div className="flex gap-2">
                  {["date", "name", "size"].map((sort) => (
                    <Button
                      key={sort}
                      variant="outline"
                      size="sm"
                      onClick={() => setSortBy(sort as any)}
                      className={`${sortBy === sort ? "bg-blue-600 text-white border-blue-600" : "border-white/20 text-gray-300 hover:bg-white/10"}`}
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-400">Active Tags:</span>
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-emerald-600 text-white flex items-center gap-1 cursor-pointer hover:bg-emerald-700"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTags([])}
                      className="text-gray-400 hover:text-white text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Categories and Documents */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 sm:p-4">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Categories
                  </h3>
                  <div className="space-y-1.5">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const count = category.value
                        ? stats?.byCategory[category.value] || 0
                        : stats?.totalDocuments || 0;
                      
                      const isSelected = selectedCategory === category.value;
                      const colors = getCategoryColors(category.color, isSelected);
                      
                      return (
                        <button
                          key={category.name}
                          onClick={() => setSelectedCategory(category.value)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${colors.bg} ${colors.shadow} ${isSelected ? "text-white" : "text-gray-300"}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${colors.icon}`} />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <Badge className={`${colors.badge} text-xs`}>
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TAG CLOUD */}
                {allTags && allTags.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 mt-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Popular Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allTags.slice(0, 15).map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            selectedTags.includes(tag)
                              ? "bg-emerald-600 text-white shadow-md"
                              : "bg-white/10 text-gray-300 hover:bg-white/20"
                          }`}
                        >
                          {tag}
                          <span className="ml-1.5 text-[10px] opacity-75">({count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents List */}
              <div className="lg:col-span-3">
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg">
                      {selectedCategory || "All Documents"}
                      <span className="ml-2 text-sm text-gray-400">({filteredAndSortedDocuments?.length || 0} documents)</span>
                    </h3>
                  </div>
                  
                  {/* Show filtered results */}
                  {filteredAndSortedDocuments.length === 0 ? (
                    <div className="text-center py-16">
                      <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No documents found</p>
                      <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or upload a new document</p>
                    </div>
                  ) : (
                    <DocumentList
                      category={selectedCategory}
                      limit={200}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
