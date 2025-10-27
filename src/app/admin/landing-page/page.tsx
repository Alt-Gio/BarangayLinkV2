"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Upload,
  Star,
  StarOff,
  Image as ImageIcon,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { formatCurrency } from "@/lib/formatNumber";
import { Id } from "../../../../convex/_generated/dataModel";

export default function LandingPageManagementPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<Id<"projects"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = useQuery(api.users.getCurrentUser);
  const projects = useQuery(api.landingPage.getAllProjectsForFeatured);
  
  const toggleFeatured = useMutation(api.landingPage.toggleProjectFeatured);
  const updateOrder = useMutation(api.landingPage.updateFeaturedOrder);
  const generateUploadUrl = useMutation(api.landingPage.generateProjectImageUploadUrl);
  const setProjectImage = useMutation(api.landingPage.setProjectFeaturedImage);
  const removeImage = useMutation(api.landingPage.removeProjectFeaturedImage);

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if admin
  if (currentUser.userLevel?.name !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-400">Only admins can access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggleFeatured = async (projectId: Id<"projects">, currentlyFeatured: boolean) => {
    const newStatus = !currentlyFeatured;
    const featuredCount = projects?.filter((p) => p.isFeatured).length || 0;
    const newOrder = newStatus ? featuredCount + 1 : undefined;

    await toggleFeatured({
      projectId,
      isFeatured: newStatus,
      featuredOrder: newOrder,
    });
  };

  const handleMoveUp = async (projectId: Id<"projects">, currentOrder: number) => {
    await updateOrder({
      projectId,
      newOrder: Math.max(1, currentOrder - 1),
    });
  };

  const handleMoveDown = async (projectId: Id<"projects">, currentOrder: number) => {
    await updateOrder({
      projectId,
      newOrder: currentOrder + 1,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, projectId: Id<"projects">) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFor(projectId);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Set project image (also saves to document library)
      await setProjectImage({ 
        projectId, 
        storageId,
        fileName: file.name,
        fileSize: file.size,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleRemoveImage = async (projectId: Id<"projects">) => {
    if (!confirm("Remove this image?")) return;
    await removeImage({ projectId });
  };

  const featuredProjects = projects?.filter((p) => p.isFeatured) || [];
  const nonFeaturedProjects = projects?.filter((p) => !p.isFeatured) || [];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Landing Page Management"
        dashboardSubtitle="Manage featured projects"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Landing Page Management</h1>
            <p className="text-gray-400">
              Select which projects appear on the landing page and customize their images
            </p>
          </div>

          {/* Featured Projects Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                Featured Projects ({featuredProjects.length})
              </h2>
            </div>

            {featuredProjects.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No featured projects yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Click the star icon on any project below to feature it
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {featuredProjects.map((project, index) => (
                  <Card key={project._id} className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Drag Handle & Order */}
                        <div className="flex flex-col items-center gap-2">
                          <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveUp(project._id, project.featuredOrder!)}
                              disabled={index === 0}
                              className="h-6 w-6 text-gray-400 hover:text-white"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-bold text-gray-400 text-center">
                              {project.featuredOrder}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveDown(project._id, project.featuredOrder!)}
                              disabled={index === featuredProjects.length - 1}
                              className="h-6 w-6 text-gray-400 hover:text-white"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Project Image */}
                        <div className="relative w-48 h-32 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {project.imageUrl ? (
                            <>
                              <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveImage(project._id)}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, project._id)}
                              />
                              {uploadingFor === project._id ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                  <span className="text-xs text-gray-500">Upload Image</span>
                                </>
                              )}
                            </label>
                          )}
                        </div>

                        {/* Project Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2">{project.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-500/20 text-blue-300">{project.department}</Badge>
                            <Badge className="bg-emerald-500/20 text-emerald-300">
                              {formatCurrency(project.budget)}
                            </Badge>
                            <Badge className="bg-purple-500/20 text-purple-300">
                              {project.progress}% Complete
                            </Badge>
                            <Badge className={`${
                              project.isPublic ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-300"
                            }`}>
                              {project.isPublic ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                              {project.isPublic ? "Public" : "Private"}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFeatured(project._id, true)}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            <StarOff className="w-4 h-4 mr-2" />
                            Unfeature
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* All Projects Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">All Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nonFeaturedProjects.map((project) => (
                <Card key={project._id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-1">{project.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="bg-blue-500/20 text-blue-300 text-xs">{project.department}</Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">
                        {formatCurrency(project.budget)}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFeatured(project._id, false)}
                      className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Feature on Landing Page
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
