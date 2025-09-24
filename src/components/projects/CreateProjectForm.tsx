"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateProjectFormProps {
  onClose: () => void;
  userRole: string;
  userDepartment: string;
}

export function CreateProjectForm({ onClose, userRole, userDepartment }: CreateProjectFormProps) {
  const createProject = useMutation(api.productivity.createProject);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: userRole === "BUILDER" ? userDepartment : '',
    startDate: '',
    endDate: '',
    budget: ''
  });

  const departments = [
    "Health Services",
    "Infrastructure", 
    "Education",
    "Social Services",
    "Environment",
    "Governance",
    "Disaster Management"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.department || 
        !formData.startDate || !formData.endDate) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) {
      alert("End date must be after start date");
      return;
    }

    setIsLoading(true);
    try {
      await createProject({
        title: formData.title,
        description: formData.description,
        department: formData.department,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        budget: parseFloat(formData.budget) || undefined
      });
      
      alert(userRole === "BUILDER" ? 
        "Project created! Waiting for manager approval." : 
        "Project created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Project</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Community Health Program"
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the project objectives and expected outcomes..."
              rows={4}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Department * {userRole === "BUILDER" && "(Your Department)"}
            </label>
            <Select 
              value={formData.department} 
              onValueChange={(value) => setFormData({...formData, department: value})}
              disabled={userRole === "BUILDER"}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept} className="text-white hover:bg-gray-700">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                required
                min={formData.startDate}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget (Optional)
            </label>
            <Input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              placeholder="Enter budget amount in pesos"
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              min="0"
              step="0.01"
            />
          </div>

          {/* Role-based warning */}
          {userRole === "BUILDER" && (
            <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-yellow-400 text-sm">
                  Your project will be created with "Planning" status and requires manager approval.
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
