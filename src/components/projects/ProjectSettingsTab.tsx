"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell,
  Lock,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  Globe,
  Users,
  CheckCircle2,
  XCircle,
  Shield
} from 'lucide-react';

interface ProjectSettingsTabProps {
  projectId: Id<"projects">;
  project: any;
  currentUser: any;
}

export function ProjectSettingsTab({ projectId, project, currentUser }: ProjectSettingsTabProps) {
  const [activeSection, setActiveSection] = useState('general');
  const [formData, setFormData] = useState({
    // General Settings
    title: project.title,
    description: project.description,
    department: project.department,
    location: project.location || '',
    tags: project.tags?.join(', ') || '',
    
    // Budget Settings
    budget: project.budget,
    
    // Visibility Settings
    isPublic: project.isPublic,
    publicVisibility: project.publicVisibility || 'internal',
    
    // Notifications
    notifyOnTaskComplete: true,
    notifyOnMilestone: true,
    notifyOnBudgetAlert: true,
    notifyOnTeamChange: true,
  });

  const updateProject = useMutation(api.projects.updateProject);
  const archiveProject = useMutation(api.projects.archiveProject);
  const deleteProject = useMutation(api.projects.deleteProject);

  const handleSaveGeneral = async () => {
    try {
      await updateProject({
        projectId,
        updates: {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }
      });
      alert('General settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleSaveBudget = async () => {
    try {
      await updateProject({
        projectId,
        updates: {
          budget: formData.budget,
        }
      });
      alert('Budget settings saved successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget settings');
    }
  };

  const handleSaveVisibility = async () => {
    try {
      await updateProject({
        projectId,
        updates: {
          publicVisibility: formData.publicVisibility as any,
        }
      });
      alert('Visibility settings saved successfully!');
    } catch (error) {
      console.error('Error saving visibility:', error);
      alert('Failed to save visibility settings');
    }
  };

  const handleArchiveProject = async () => {
    if (confirm('Are you sure you want to archive this project? It can be restored later.')) {
      try {
        await archiveProject({ projectId });
        window.location.href = '/projects';
      } catch (error) {
        console.error('Error archiving project:', error);
        alert('Failed to archive project');
      }
    }
  };

  const handleDeleteProject = async () => {
    const confirmText = prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmText === 'DELETE') {
      try {
        await deleteProject({ projectId });
        window.location.href = '/projects';
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  const canManageSettings = currentUser?.userLevel?.name === 'ADMIN' || 
                           currentUser?.userLevel?.name === 'MANAGER' ||
                           project.createdBy === currentUser?._id;

  if (!canManageSettings) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-12 text-center">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">You don't have permission to access project settings</p>
          <p className="text-sm text-gray-500 mt-2">Only project managers and admins can modify settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Settings Navigation */}
      <div className="space-y-2">
        <Button
          onClick={() => setActiveSection('general')}
          variant={activeSection === 'general' ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Settings className="w-4 h-4 mr-2" />
          General
        </Button>
        <Button
          onClick={() => setActiveSection('budget')}
          variant={activeSection === 'budget' ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Budget
        </Button>
        <Button
          onClick={() => setActiveSection('visibility')}
          variant={activeSection === 'visibility' ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Globe className="w-4 h-4 mr-2" />
          Visibility
        </Button>
        <Button
          onClick={() => setActiveSection('notifications')}
          variant={activeSection === 'notifications' ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </Button>
        <Button
          onClick={() => setActiveSection('permissions')}
          variant={activeSection === 'permissions' ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Shield className="w-4 h-4 mr-2" />
          Permissions
        </Button>
        <Button
          onClick={() => setActiveSection('danger')}
          variant={activeSection === 'danger' ? 'default' : 'ghost'}
          className="w-full justify-start text-red-400"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Danger Zone
        </Button>
      </div>

      {/* Settings Content */}
      <div className="col-span-3 space-y-6">
        {/* General Settings */}
        {activeSection === 'general' && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Project location"
                    className="bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="infrastructure, community, health"
                    className="bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget Settings */}
        {activeSection === 'budget' && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Budget Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Budget (₱)
                </label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Budget Used</span>
                  <span className="text-white font-medium">
                    ₱{project.spent?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Remaining</span>
                  <span className="text-emerald-400 font-medium">
                    ₱{((formData.budget || 0) - (project.spent || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((project.spent / formData.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBudget}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visibility Settings */}
        {activeSection === 'visibility' && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Visibility & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Project Visibility
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900/70">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.publicVisibility === 'public'}
                      onChange={(e) => setFormData({ ...formData, publicVisibility: e.target.value as any })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        Public
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Visible to everyone, including the community
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900/70">
                    <input
                      type="radio"
                      name="visibility"
                      value="internal"
                      checked={formData.publicVisibility === 'internal'}
                      onChange={(e) => setFormData({ ...formData, publicVisibility: e.target.value as any })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Users className="w-4 h-4 text-blue-400" />
                        Internal
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Visible only to barangay staff and team members
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900/70">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={formData.publicVisibility === 'private'}
                      onChange={(e) => setFormData({ ...formData, publicVisibility: e.target.value as any })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Lock className="w-4 h-4 text-yellow-400" />
                        Private
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Visible only to assigned team members
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveVisibility}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Visibility
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900/70">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-white font-medium">Task Completions</div>
                    <div className="text-sm text-gray-400">Get notified when tasks are completed</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifyOnTaskComplete}
                  onChange={(e) => setFormData({ ...formData, notifyOnTaskComplete: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900/70">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Milestone Achievements</div>
                    <div className="text-sm text-gray-400">Get notified when milestones are reached</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifyOnMilestone}
                  onChange={(e) => setFormData({ ...formData, notifyOnMilestone: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900/70">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <div>
                    <div className="text-white font-medium">Budget Alerts</div>
                    <div className="text-sm text-gray-400">Get notified when budget thresholds are reached</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifyOnBudgetAlert}
                  onChange={(e) => setFormData({ ...formData, notifyOnBudgetAlert: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900/70">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">Team Changes</div>
                    <div className="text-sm text-gray-400">Get notified when team members are added or removed</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifyOnTeamChange}
                  onChange={(e) => setFormData({ ...formData, notifyOnTeamChange: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>
            </CardContent>
          </Card>
        )}

        {/* Permissions */}
        {activeSection === 'permissions' && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Project Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Project Lead</div>
                    <div className="text-sm text-gray-400">Full access to all project features</div>
                  </div>
                  <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                    You
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Managers & Admins</div>
                    <div className="text-sm text-gray-400">Can edit settings and manage team</div>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Full Access
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Builders</div>
                    <div className="text-sm text-gray-400">Can create and manage tasks</div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Edit Access
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">Workers</div>
                    <div className="text-sm text-gray-400">Can view and update assigned tasks</div>
                  </div>
                  <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                    View Only
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        {activeSection === 'danger' && (
          <Card className="bg-gray-800/50 border-red-700/50">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    These actions are permanent and cannot be undone. Please proceed with caution.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium mb-1">Archive Project</div>
                    <div className="text-sm text-gray-400">
                      Archive this project. It can be restored later if needed.
                    </div>
                  </div>
                  <Button
                    onClick={handleArchiveProject}
                    variant="outline"
                    className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-900/50 rounded-lg border border-red-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium mb-1">Delete Project</div>
                    <div className="text-sm text-gray-400">
                      Permanently delete this project and all its data. This action cannot be undone.
                    </div>
                  </div>
                  <Button
                    onClick={handleDeleteProject}
                    variant="outline"
                    className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
