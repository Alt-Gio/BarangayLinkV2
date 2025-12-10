"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Users,
  Building,
  Shield,
  Briefcase,
  Wrench,
  User as UserIcon,
  Search,
  ZoomIn,
  ZoomOut,
  Download,
  Menu,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminGuard } from "@/components/admin/AdminGuard";

export const dynamic = "force-dynamic";

interface OrgUser {
  _id: string;
  name: string;
  imageUrl?: string;
  userLevel: { name: string };
  department?: string;
  position?: string;
  email?: string;
}

export default function OrganizationalChartPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.adminUserManagement.getAllUsers, {});

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !allUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading organizational chart...</p>
        </div>
      </div>
    );
  }

  const admins = allUsers.filter((u: any) => 
    u.userLevel?.name === "ADMIN" || u.userLevelDetails?.name === "ADMIN"
  );
  const captains = allUsers.filter((u: any) => 
    u.userLevel?.name === "CAPTAIN" || u.userLevelDetails?.name === "CAPTAIN"
  );
  const managers = allUsers.filter((u: any) => 
    u.userLevel?.name === "MANAGER" || u.userLevelDetails?.name === "MANAGER"
  );
  const builders = allUsers.filter((u: any) => 
    u.userLevel?.name === "BUILDER" || u.userLevelDetails?.name === "BUILDER"
  );
  const workers = allUsers.filter((u: any) => 
    u.userLevel?.name === "WORKER" || u.userLevelDetails?.name === "WORKER"
  );

  const departments = [...new Set(allUsers.map((u: OrgUser) => u.department).filter(Boolean))];
  
  const usersByDepartment = departments.map(dept => ({
    name: dept,
    admins: admins.filter((u: OrgUser) => u.department === dept),
    captains: captains.filter((u: OrgUser) => u.department === dept),
    managers: managers.filter((u: OrgUser) => u.department === dept),
    builders: builders.filter((u: OrgUser) => u.department === dept),
    workers: workers.filter((u: OrgUser) => u.department === dept),
  }));

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      case "CAPTAIN":
        return <Crown className="w-4 h-4" />;
      case "MANAGER":
        return <Briefcase className="w-4 h-4" />;
      case "BUILDER":
        return <Wrench className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-600";
      case "CAPTAIN":
        return "bg-orange-600";
      case "MANAGER":
        return "bg-purple-600";
      case "BUILDER":
        return "bg-blue-600";
      default:
        return "bg-emerald-600";
    }
  };

  const UserCard = ({ user, size = "normal" }: { user: any; size?: "large" | "normal" | "small" }) => {
    const cardSizes = {
      large: "w-64 p-4",
      normal: "w-56 p-3",
      small: "w-48 p-2",
    };

    // Get role from either userLevel or userLevelDetails
    const userRole = user.userLevel?.name || user.userLevelDetails?.name || "WORKER";

    return (
      <div className={`${cardSizes[size]} bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 transition-all shadow-lg`}>
        <div className="flex items-center gap-3">
          <img
            src={user.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
            alt={user.name}
            className={`${size === "large" ? "w-12 h-12" : size === "normal" ? "w-10 h-10" : "w-8 h-8"} rounded-full border-2 border-white/30`}
          />
          <div className="flex-1 min-w-0">
            <h3 className={`${size === "large" ? "text-base" : "text-sm"} font-semibold text-white truncate`}>
              {user.name}
            </h3>
            <p className="text-xs text-gray-300 truncate">{user.position || userRole}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Badge className={`${getRoleColor(userRole)} text-white text-xs flex items-center gap-1`}>
            {getRoleIcon(userRole)}
            {userRole}
          </Badge>
          {user.department && (
            <span className="text-xs text-gray-400 truncate max-w-[100px]">{user.department}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Sidebar
          userRole={currentUser?.userLevel?.name || "ADMIN"}
          dashboardTitle="Organizational Chart"
          dashboardSubtitle="View organization hierarchy"
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
            <h1 className="text-lg font-semibold text-white">Organization Chart</h1>
            <div className="w-9" />
          </div>

          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 md:sticky md:top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                      <Users className="w-8 h-8 text-emerald-500" />
                      Organizational Chart
                    </h1>
                    <p className="text-gray-400 mt-1">Barangay workforce hierarchy - SY 2025-2026</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
                    <Button
                      onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-xs font-medium">ADMIN</p>
                    <p className="text-2xl font-bold text-white">{admins.length}</p>
                  </div>
                  <div className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-3">
                    <p className="text-orange-400 text-xs font-medium">CAPTAIN</p>
                    <p className="text-2xl font-bold text-white">{captains.length}</p>
                  </div>
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-3">
                    <p className="text-purple-400 text-xs font-medium">MANAGERS</p>
                    <p className="text-2xl font-bold text-white">{managers.length}</p>
                  </div>
                  <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-xs font-medium">BUILDERS</p>
                    <p className="text-2xl font-bold text-white">{builders.length}</p>
                  </div>
                  <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-400 text-xs font-medium">WORKERS</p>
                    <p className="text-2xl font-bold text-white">{workers.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizational Chart - Horizontal Departments */}
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              {/* Top Level: Admin & Captain */}
              <div className="mb-12">
                <div className="flex justify-center gap-8 flex-wrap">
                  {/* Admins */}
                  {admins.length > 0 && (
                    <div className="flex flex-col items-center">
                      <Badge className="bg-red-600 text-white px-4 py-2 mb-4">
                        <Shield className="w-4 h-4 mr-2" />
                        ADMIN
                      </Badge>
                      <div className="flex gap-4">
                        {admins.map((admin: OrgUser) => (
                          <UserCard key={admin._id} user={admin} size="large" />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Captains */}
                  {captains.length > 0 && (
                    <div className="flex flex-col items-center">
                      <Badge className="bg-orange-600 text-white px-4 py-2 mb-4">
                        <Crown className="w-4 h-4 mr-2" />
                        CAPTAIN
                      </Badge>
                      <div className="flex gap-4">
                        {captains.map((captain: OrgUser) => (
                          <UserCard key={captain._id} user={captain} size="large" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-0.5 h-12 bg-gradient-to-b from-white/50 to-transparent mx-auto mt-8"></div>
              </div>

              {/* Departments - Horizontal Scroll */}
              <div className="relative">
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-6 min-w-max px-4">
                    {usersByDepartment.map((dept) => (
                      <div key={dept.name} className="flex-shrink-0 w-80">
                        {/* Department Card */}
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full">
                          {/* Department Header */}
                          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                              <Building className="w-5 h-5 text-purple-400" />
                              <h2 className="text-lg font-bold text-white">{dept.name}</h2>
                            </div>
                          </div>

                          {/* Department Users */}
                          <div className="space-y-6">
                            {/* Managers */}
                            {dept.managers.length > 0 && (
                              <div>
                                <Badge className="bg-purple-600 text-white px-2 py-1 text-xs mb-3">
                                  <Briefcase className="w-3 h-3 mr-1" />
                                  MANAGER
                                </Badge>
                                <div className="space-y-2">
                                  {dept.managers.map((user: OrgUser) => (
                                    <UserCard key={user._id} user={user} size="small" />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Builders */}
                            {dept.builders.length > 0 && (
                              <div>
                                <Badge className="bg-blue-600 text-white px-2 py-1 text-xs mb-3">
                                  <Wrench className="w-3 h-3 mr-1" />
                                  BUILDER
                                </Badge>
                                <div className="space-y-2">
                                  {dept.builders.map((user: OrgUser) => (
                                    <UserCard key={user._id} user={user} size="small" />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Workers */}
                            {dept.workers.length > 0 && (
                              <div>
                                <Badge className="bg-emerald-600 text-white px-2 py-1 text-xs mb-3">
                                  <UserIcon className="w-3 h-3 mr-1" />
                                  WORKER
                                </Badge>
                                <div className="space-y-2">
                                  {dept.workers.map((user: OrgUser) => (
                                    <UserCard key={user._id} user={user} size="small" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Unassigned Users */}
                    {allUsers.filter((u: OrgUser) => !u.department).length > 0 && (
                      <div className="flex-shrink-0 w-80">
                        <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-md border border-gray-600 rounded-2xl p-6 h-full">
                          <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4 mb-6">
                            <h2 className="text-lg font-bold text-white">Unassigned</h2>
                          </div>
                          <div className="space-y-2">
                            {allUsers
                              .filter((u: OrgUser) => !u.department)
                              .map((user: OrgUser) => (
                                <UserCard key={user._id} user={user} size="small" />
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Scroll Hint */}
                <div className="text-center mt-4">
                  <p className="text-gray-400 text-sm">← Scroll horizontally to view all departments →</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                <h3 className="text-white font-semibold mb-4">Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">Administrator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">Captain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">Builder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">Worker</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
