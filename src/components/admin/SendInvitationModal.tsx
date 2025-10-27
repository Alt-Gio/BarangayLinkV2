"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Mail, User, Building, Briefcase, Phone, Shield, Send, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SendInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendInvitationModal({ isOpen, onClose }: SendInvitationModalProps) {
  const sendInvitation = useMutation(api.adminUserManagement.sendInvitation);
  const userLevels = useQuery(api.userLevels.getAllUserLevels);
  const departments = useQuery(api.departments.getAllDepartments);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    department: "",
    position: "",
    phone: "",
    userLevelId: "",
    assignInitialTasks: true,
    sendWelcomeMessage: true,
    customMessage: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invitationLink, setInvitationLink] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.userLevelId) {
        throw new Error("Please fill in all required fields");
      }

      const invitationId = await sendInvitation({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        position: formData.position,
        phone: formData.phone || undefined,
        userLevelId: formData.userLevelId as any,
        assignInitialTasks: formData.assignInitialTasks,
        sendWelcomeMessage: formData.sendWelcomeMessage,
        customMessage: formData.customMessage || undefined,
      });

      setSuccess(true);
      toast.success("Invitation sent successfully!", {
        description: `An invitation email has been sent to ${formData.email}`,
      });
      
      // Note: We don't have direct access to the token from the mutation return
      // The link will be sent via email
      setTimeout(() => {
        onClose();
        // Reset form
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          department: "",
          position: "",
          phone: "",
          userLevelId: "",
          assignInitialTasks: true,
          sendWelcomeMessage: true,
          customMessage: "",
        });
        setSuccess(false);
        setError("");
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
      toast.error("Failed to send invitation", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (invitationLink) {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[101]">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-emerald-500" />
              Send Invitation
            </h2>
            <p className="text-gray-400 text-sm mt-1">Invite a new user to join your organization</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Check className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-emerald-400 font-semibold mb-1">Invitation Sent Successfully!</p>
                  <p className="text-emerald-300/80 text-sm">
                    An invitation email has been sent to <strong>{formData.email}</strong>
                  </p>
                  <p className="text-emerald-300/60 text-xs mt-2">
                    The invitation link is valid for 7 days. They'll receive an email with instructions to join.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="John"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Doe"
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
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white">Work Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Department *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" className="bg-gray-900 text-gray-400">Select Department</option>
                  {departments?.map((dept) => (
                    <option key={dept._id} value={dept.name} className="bg-gray-900 text-white">
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Project Manager"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User Level *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.userLevelId}
                  onChange={(e) => setFormData({ ...formData, userLevelId: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" className="bg-gray-900 text-gray-400">Select Level</option>
                  {userLevels?.map((level) => (
                    <option key={level._id} value={level._id} className="bg-gray-900 text-white">
                      {level.name} - {level.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white">Options</h3>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.assignInitialTasks}
                onChange={(e) => setFormData({ ...formData, assignInitialTasks: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
              <div>
                <span className="text-white font-medium">Assign Initial Tasks</span>
                <p className="text-gray-400 text-xs">Give user onboarding tasks to get started</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.sendWelcomeMessage}
                onChange={(e) => setFormData({ ...formData, sendWelcomeMessage: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
              <div>
                <span className="text-white font-medium">Send Welcome Message</span>
                <p className="text-gray-400 text-xs">Send automated welcome email with login instructions</p>
              </div>
            </label>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={formData.customMessage}
              onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Add a personal message to the invitation email..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
