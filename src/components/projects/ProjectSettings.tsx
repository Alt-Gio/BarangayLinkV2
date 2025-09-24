"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Save, Trash2, Archive, Settings, Shield, Eye, EyeOff } from 'lucide-react';

interface ProjectSettingsProps {
  project: any;
  currentUser: any;
  userRole: string;
}

export function ProjectSettings({ project, currentUser, userRole }: ProjectSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description,
    department: project.department,
    priority: project.priority,
    budget: project.budget,
    startDate: new Date(project.startDate).toISOString().split('T')[0],
    endDate: new Date(project.endDate).toISOString().split('T')[0],
    isPublic: project.isPublic || false,
    location: project.location || ''
  });

  const updateProject = useMutation(api.projects.updateProject);
  const deleteProject = useMutation(api.projects.deleteProject);
  const archiveProject = useMutation(api.projects.archiveProject);

  const departments = [
    'General', 'Health Services', 'Infrastructure', 'Education', 'Social Services',
    'Environment', 'Public Safety', 'Finance', 'Human Resources', 'IT'
  ];

  const handleSave = async () => {
    try {
      await updateProject({
        projectId: project._id,
        title: formData.title,
        description: formData.description,
        department: formData.department,
        priority: formData.priority as any,
        budget: formData.budget,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
        isPublic: formData.isPublic,
        location: formData.location
      });
      setIsEditing(false);
      alert("Project updated successfully!");
    } catch (error) {
      alert("Error updating project: " + error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        await deleteProject({ projectId: project._id });
        window.location.href = '/projects';
      } catch (error) {
        alert("Error deleting project: " + error);
      }
    }
  };

  const handleArchive = async () => {
    if (confirm("Are you sure you want to archive this project?")) {
      try {
        await archiveProject({ projectId: project._id });
        alert("Project archived successfully!");
      } catch (error) {
        alert("Error archiving project: " + error);
      }
    }
  };

  const canDelete = userRole === "ADMIN" || 
                   (userRole === "MANAGER" && project.department === currentUser.department) ||
                   (project.createdBy === currentUser._id);

  const canModifySettings = userRole === "ADMIN" || 
                           (userRole === "MANAGER" && project.department === currentUser.department);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Settings</h2>
          <p className="text-gray-400">Manage project configuration and permissions</p>
        </div>
        <Badge variant="outline" className="text-white border-gray-600">
          {userRole}
        </Badge>
      </div>

      {/* Basic Information */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-gray-300">Project Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="department" className="text-gray-300">Department</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({...formData, department: value})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({...formData, priority: value})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget" className="text-gray-300">Budget (₱)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate" className="text-gray-300">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" className="text-gray-300">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-gray-300">Location (Optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Project location or address"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Department</h4>
                  <p className="text-white">{project.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Priority</h4>
                  <Badge variant="outline" className={
                    project.priority === 'critical' ? 'text-red-400 border-red-600' :
                    project.priority === 'high' ? 'text-orange-400 border-orange-600' :
                    project.priority === 'medium' ? 'text-yellow-400 border-yellow-600' :
                    'text-green-400 border-green-600'
                  }>
                    {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1)}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Budget</h4>
                  <p className="text-white">₱{project.budget?.toLocaleString() || 'Not set'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Status</h4>
                  <Badge variant="outline" className="text-blue-400 border-blue-600">
                    {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Visibility */}
      {canModifySettings && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Visibility
            </CardTitle>
            <CardDescription className="text-gray-400">
              Control who can see and access this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.isPublic ? <Eye className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                <div>
                  <Label htmlFor="isPublic" className="text-white">Public Project</Label>
                  <p className="text-sm text-gray-400">Allow all barangay members to view this project</p>
                </div>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({...formData, isPublic: checked})}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Project Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Advanced actions for project management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.status !== 'completed' && project.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={handleArchive}
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Project
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </Button>
            )}
          </div>

          {!canDelete && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-700/50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>You don't have permission to delete this project. Contact an admin or the project owner.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Metadata */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="text-gray-300 font-medium">Created</h4>
              <p className="text-white">{new Date(project.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="text-gray-300 font-medium">Project ID</h4>
              <p className="text-white font-mono text-xs">{project._id}</p>
            </div>
            <div>
              <h4 className="text-gray-300 font-medium">Team Size</h4>
              <p className="text-white">{project.assignedTo?.length || 0} members</p>
            </div>
            <div>
              <h4 className="text-gray-300 font-medium">Progress</h4>
              <p className="text-white">{project.progress}% complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
