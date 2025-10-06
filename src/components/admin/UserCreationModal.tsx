"use client";

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react';

interface UserCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (userId: string) => void;
}

export function UserCreationModal({ isOpen, onClose, onUserCreated }: UserCreationModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    department: 'General',
    position: '',
    phone: '',
    userLevelId: '',
    assignTasks: true,
    welcomeMessage: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user levels for selection
  const userLevels = useQuery(api.userLevels.getAll);
  
  // Mutation for creating user invitation
  const createUserInvitation = useMutation(api.users.createUserInvitation);

  const departments = [
    'General',
    'Infrastructure',
    'Community Services',
    'Events',
    'Education',
    'Health',
    'Security'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.email || !formData.firstName || !formData.lastName) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.userLevelId) {
        throw new Error('Please select a user level');
      }

      // Create user invitation (since we're using Clerk, we'll create an invitation)
      const userId = await createUserInvitation({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        position: formData.position || 'Community Member',
        phone: formData.phone || undefined,
        userLevelId: formData.userLevelId as any,
        assignInitialTasks: formData.assignTasks,
        sendWelcomeMessage: formData.welcomeMessage
      });

      setSuccess('User invitation sent successfully! They will receive an email to join.');
      
      // Auto-assign initial tasks based on role
      if (formData.assignTasks) {
        await assignInitialTasks(userId, formData.userLevelId);
      }

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        department: 'General',
        position: '',
        phone: '',
        userLevelId: '',
        assignTasks: true,
        welcomeMessage: true
      });

      if (onUserCreated) {
        onUserCreated(userId);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);

    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create user invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignInitialTasks = async (userId: string, userLevelId: string) => {
    // This would be implemented to assign role-appropriate initial tasks
    // For now, we'll just log it
    console.log(`Assigning initial tasks for user ${userId} with level ${userLevelId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-400" />
            Create New User
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-green-300">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                    placeholder="Enter first name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Role & Department */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Role & Department</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                  placeholder="Enter position/title"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User Level *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.userLevelId}
                  onChange={(e) => setFormData(prev => ({ ...prev, userLevelId: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  required
                >
                  <option value="">Select user level</option>
                  {userLevels?.map(level => (
                    <option key={level._id} value={level._id}>
                      {level.name} (Level {level.level}) - {level.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Options</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.assignTasks}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignTasks: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-300">Assign initial tasks based on role</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.welcomeMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-300">Send welcome message</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
