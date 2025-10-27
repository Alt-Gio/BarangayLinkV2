"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Target, Calendar, FileText, Briefcase, CheckCircle2 } from 'lucide-react';

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  onSuccess?: () => void;
}

export function CreateMilestoneModal({ isOpen, onClose, projects, onSuccess }: CreateMilestoneModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    targetDate: '',
    isRequired: true,
  });

  const createMilestone = useMutation(api.milestones.createMilestone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.projectId) {
      alert('Please fill in title and select a project');
      return;
    }

    try {
      await createMilestone({
        projectId: formData.projectId as any,
        title: formData.title,
        description: formData.description,
        targetDate: formData.targetDate ? new Date(formData.targetDate).getTime() : undefined,
        isRequired: formData.isRequired,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        projectId: '',
        targetDate: '',
        isRequired: true,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create milestone:', error);
      alert('Failed to create milestone. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              Create New Milestone
            </CardTitle>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Create a milestone to track important project goals and deliverables
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                Select Project *
              </Label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a project...</option>
                {projects && projects.map((project: any) => (
                  <option key={project._id} value={project._id}>
                    📁 {project.title} - {project.department}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Milestone will appear in this project's milestone tab</p>
            </div>

            {/* Milestone Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                Milestone Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Complete User Authentication, Launch MVP, etc."
                className="bg-gray-900 border-gray-700 text-white"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-400" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what needs to be achieved in this milestone..."
                rows={4}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="targetDate" className="text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                Target Completion Date
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">Optional: Set a deadline for this milestone</p>
            </div>

            {/* Is Required Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-gray-900/50 rounded-lg">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <Label htmlFor="isRequired" className="text-white flex items-center gap-2 cursor-pointer">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Critical Milestone
                </Label>
                <p className="text-xs text-gray-400 mt-1">
                  Mark as critical if this milestone is required for project completion
                </p>
              </div>
            </div>

            {/* Preview */}
            {formData.projectId && formData.title && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Milestone Preview
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300">
                      {projects?.find((p: any) => p._id === formData.projectId)?.title || 'Project'}
                    </Badge>
                    {formData.isRequired && (
                      <Badge className="bg-red-500/20 text-red-300">Critical</Badge>
                    )}
                  </div>
                  <p className="text-white font-medium">{formData.title}</p>
                  {formData.targetDate && (
                    <p className="text-sm text-gray-400">
                      Target: {new Date(formData.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Create Milestone
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
