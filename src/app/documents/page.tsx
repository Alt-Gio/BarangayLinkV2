"use client";

import { useState } from "react";
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
  Database
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

export default function DocumentsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const currentUser = useQuery(api.users.getCurrentUser);
  const documents = useQuery(api.documents.getAllDocuments, {
    category: selectedCategory,
    limit: 100
  });
  const stats = useQuery(api.documents.getDocumentStats);

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

  const categories = [
    { name: "All Documents", value: undefined, icon: FolderOpen },
    { name: "Project Documents", value: "Project Documents", icon: FileText },
    { name: "Reports", value: "Reports", icon: FileSpreadsheet },
    { name: "Images", value: "Images", icon: ImageIcon },
    { name: "General", value: "General", icon: File }
  ];

  const filteredDocuments = documents?.filter((doc: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(search) ||
      doc.description?.toLowerCase().includes(search) ||
      doc.tags.some((tag: string) => tag.toLowerCase().includes(search))
    );
  });

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

            {/* Search and Filters */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="pl-10 bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                    className={`${viewMode === "list" ? "bg-emerald-600" : "border-white/20 text-white"} active:scale-95 transition-transform`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    onClick={() => setViewMode("grid")}
                    className={`${viewMode === "grid" ? "bg-emerald-600" : "border-white/20 text-white"} active:scale-95 transition-transform`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const count = category.value
                        ? stats?.byCategory[category.value] || 0
                        : stats?.totalDocuments || 0;
                      
                      return (
                        <button
                          key={category.name}
                          onClick={() => setSelectedCategory(category.value)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg active:scale-95 transition-all ${
                            selectedCategory === category.value
                              ? "bg-emerald-600 text-white"
                              : "hover:bg-white/10 text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{category.name}</span>
                          </div>
                          <Badge className={selectedCategory === category.value ? "bg-white/20" : "bg-white/10"}>
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="lg:col-span-3">
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">
                      {selectedCategory || "All Documents"} ({filteredDocuments?.length || 0})
                    </h3>
                  </div>
                  
                  <DocumentList
                    category={selectedCategory}
                    limit={100}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
