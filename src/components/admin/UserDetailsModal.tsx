"use client";

import { X, Mail, Phone, Building, Briefcase, Shield, Calendar, Award, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  const userLevelColors: Record<string, string> = {
    ADMIN: "bg-red-600",
    MANAGER: "bg-purple-600",
    BUILDER: "bg-blue-600",
    WORKER: "bg-emerald-600",
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt={user.name} className="w-24 h-24 rounded-full border-4 border-white/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/20 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">{user.name[0]}</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
              <p className="text-emerald-100">{user.position || "No position set"}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${userLevelColors[user.userLevelDetails?.name || "WORKER"]} text-white px-3 py-1`}>
                  {user.userLevelDetails?.name || "WORKER"}
                </Badge>
                {user.department && (
                  <Badge className="bg-white/20 text-white px-3 py-1">
                    {user.department}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              Contact Information
            </h3>
            <div className="space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Email</span>
                <a href={`mailto:${user.email}`} className="text-white hover:text-emerald-400 transition-colors">
                  {user.email}
                </a>
              </div>
              {user.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Phone</span>
                  <a href={`tel:${user.phone}`} className="text-white hover:text-emerald-400 transition-colors flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-500" />
              Work Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Department</span>
                </div>
                <p className="text-white font-medium">{user.department || "Not assigned"}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Position</span>
                </div>
                <p className="text-white font-medium">{user.position || "Not set"}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">User Level</span>
                </div>
                <p className="text-white font-medium">{user.userLevelDetails?.name || "WORKER"}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Joined</span>
                </div>
                <p className="text-white font-medium">
                  {user.createdAt ? formatDate(user.createdAt) : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Gamification Stats */}
          {(user.experience !== undefined || user.gold !== undefined || user.level !== undefined) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                Gamification Stats
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {user.level !== undefined && (
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-lg p-4 border border-purple-500/30">
                    <div className="text-purple-400 text-sm mb-1">Level</div>
                    <div className="text-2xl font-bold text-white">{user.level}</div>
                  </div>
                )}
                {user.experience !== undefined && (
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg p-4 border border-blue-500/30">
                    <div className="text-blue-400 text-sm mb-1">Experience</div>
                    <div className="text-2xl font-bold text-white">{user.experience} XP</div>
                  </div>
                )}
                {user.gold !== undefined && (
                  <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-lg p-4 border border-yellow-500/30">
                    <div className="text-yellow-400 text-sm mb-1">Gold</div>
                    <div className="text-2xl font-bold text-white">{user.gold} 🪙</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Bio</h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-300 leading-relaxed">{user.bio}</p>
              </div>
            </div>
          )}

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* User Level Details */}
          {user.userLevelDetails && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Role Permissions</h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-300 mb-3">{user.userLevelDetails.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {user.userLevelDetails.canCreateProjects && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Can create projects
                    </div>
                  )}
                  {user.userLevelDetails.canManageUsers && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Can manage users
                    </div>
                  )}
                  {user.userLevelDetails.canAssignTasks && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Can assign tasks
                    </div>
                  )}
                  {user.userLevelDetails.canViewReports && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Can view reports
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
