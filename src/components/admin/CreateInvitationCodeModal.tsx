"use client";

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, ChevronDown } from "lucide-react";

interface CreateInvitationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInvitationCodeModal({ isOpen, onClose }: CreateInvitationCodeModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    userLevelId: '',
    department: '',
    maxUses: '10',
    expiresInDays: '30',
  });
  const [isCreating, setIsCreating] = useState(false);

  const userLevels = useQuery(api.userLevels.getAllUserLevels);
  const departments = useQuery(api.departments.getAllDepartments);
  const createCode = useMutation(api.invitationCodes.createInvitationCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userLevelId || !formData.department) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const expiresAt = formData.expiresInDays === '-1' 
        ? undefined 
        : Date.now() + (parseInt(formData.expiresInDays) * 24 * 60 * 60 * 1000);

      const result = await createCode({
        code: formData.code || undefined,
        description: formData.description,
        userLevelId: formData.userLevelId as any,
        department: formData.department,
        maxUses: parseInt(formData.maxUses),
        expiresAt,
      });

      alert(`✅ Invitation code created: ${result.code}\n\nShare this code with users for registration!`);
      onClose();
      
      // Reset form
      setFormData({
        code: '',
        description: '',
        userLevelId: '',
        department: '',
        maxUses: '10',
        expiresInDays: '30',
      });
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-emerald-500" />
            Create Invitation Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Code (Optional)
            </label>
            <Input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
              placeholder="Leave empty to auto-generate"
              className="bg-white/10 border-white/20 text-white"
              maxLength={12}
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to auto-generate. Only letters and numbers allowed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., 'New Builders - January 2025'"
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User Level <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.userLevelId}
                  onChange={(e) => setFormData({ ...formData, userLevelId: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 pr-10 appearance-none cursor-pointer hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select level</option>
                  {userLevels?.map((level) => (
                    <option key={level._id} value={level._id} className="bg-gray-800 text-white">
                      {level.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Department <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 pr-10 appearance-none cursor-pointer hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" className="bg-gray-800 text-gray-400">Select department</option>
                  {departments?.map((dept) => (
                    <option key={dept._id} value={dept.name} className="bg-gray-800 text-white">
                      {dept.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Uses
              </label>
              <div className="relative">
                <select
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 pr-10 appearance-none cursor-pointer hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1" className="bg-gray-800 text-white">1 use</option>
                  <option value="5" className="bg-gray-800 text-white">5 uses</option>
                  <option value="10" className="bg-gray-800 text-white">10 uses</option>
                  <option value="25" className="bg-gray-800 text-white">25 uses</option>
                  <option value="50" className="bg-gray-800 text-white">50 uses</option>
                  <option value="100" className="bg-gray-800 text-white">100 uses</option>
                  <option value="-1" className="bg-gray-800 text-white">Unlimited ∞</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expires In
              </label>
              <div className="relative">
                <select
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 pr-10 appearance-none cursor-pointer hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="7" className="bg-gray-800 text-white">7 days</option>
                  <option value="14" className="bg-gray-800 text-white">14 days</option>
                  <option value="30" className="bg-gray-800 text-white">30 days</option>
                  <option value="60" className="bg-gray-800 text-white">60 days</option>
                  <option value="90" className="bg-gray-800 text-white">90 days</option>
                  <option value="-1" className="bg-gray-800 text-white">Never</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Code'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
