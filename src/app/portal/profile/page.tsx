"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Briefcase, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get resident data
  const myResident = useQuery(
    api.residents.getResidentByClerkId,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    phoneNumber: "",
    email: "",
    occupation: "",
    employer: "",
    monthlyIncome: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
  });

  // Update profile mutation
  const updateProfile = useMutation(api.residents.updateResidentProfile);

  // Initialize form with resident data
  useEffect(() => {
    if (myResident) {
      setProfileForm({
        phoneNumber: myResident.phoneNumber || "",
        email: myResident.email || "",
        occupation: myResident.occupation || "",
        employer: myResident.employer || "",
        monthlyIncome: myResident.monthlyIncome || "",
        emergencyContactName: myResident.emergencyContactName || "",
        emergencyContactRelationship: myResident.emergencyContactRelationship || "",
        emergencyContactPhone: myResident.emergencyContactPhone || "",
      });
    }
  }, [myResident]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSuccessMessage("");

    try {
      await updateProfile({
        residentId: myResident!._id,
        ...profileForm,
      });

      setSuccessMessage("✅ Profile updated successfully!");
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      alert(`❌ Error updating profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (myResident) {
      setProfileForm({
        phoneNumber: myResident.phoneNumber || "",
        email: myResident.email || "",
        occupation: myResident.occupation || "",
        employer: myResident.employer || "",
        monthlyIncome: myResident.monthlyIncome || "",
        emergencyContactName: myResident.emergencyContactName || "",
        emergencyContactRelationship: myResident.emergencyContactRelationship || "",
        emergencyContactPhone: myResident.emergencyContactPhone || "",
      });
    }
    setIsEditing(false);
  };

  if (!isLoaded || !myResident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/portal")}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal
          </Button>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-blue-100 mt-1">Manage your personal information</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-200">{successMessage}</p>
          </div>
        )}

        {/* Basic Info Card (Read-only) */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Basic Information (Read-only)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <p className="text-white">{myResident.firstName} {myResident.middleName} {myResident.lastName}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Barangay ID</label>
              <p className="text-white font-mono">{myResident.barangayIdNumber}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Age</label>
              <p className="text-white">{myResident.age} years old</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Civil Status</label>
              <p className="text-white">{myResident.civilStatus}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Gender</label>
              <p className="text-white">{myResident.gender}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Relation to Head</label>
              <p className="text-white">{myResident.relationToHead}</p>
            </div>
          </div>
        </div>

        {/* Editable Contact Information */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-500" />
              Contact Information
            </h2>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit Profile
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number *</label>
              <Input
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-900 border-gray-600 text-white disabled:opacity-60"
                placeholder="+63 912 345 6789"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <Input
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-900 border-gray-600 text-white disabled:opacity-60"
                placeholder="juan@email.com"
              />
              {isEditing && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Changing email requires re-verification
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Editable Employment Information */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-500" />
            Employment Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Occupation</label>
              <Input
                value={profileForm.occupation}
                onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-900 border-gray-600 text-white disabled:opacity-60"
                placeholder="e.g., Teacher, Farmer"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Employer</label>
              <Input
                value={profileForm.employer}
                onChange={(e) => setProfileForm({ ...profileForm, employer: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-900 border-gray-600 text-white disabled:opacity-60"
                placeholder="Company/Organization name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Monthly Income</label>
              <select
                value={profileForm.monthlyIncome}
                onChange={(e) => setProfileForm({ ...profileForm, monthlyIncome: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white disabled:opacity-60"
              >
                <option value="">Select range...</option>
                <option value="Below 5,000">Below ₱5,000</option>
                <option value="5,000 - 10,000">₱5,000 - ₱10,000</option>
                <option value="10,000 - 20,000">₱10,000 - ₱20,000</option>
                <option value="20,000 - 30,000">₱20,000 - ₱30,000</option>
                <option value="30,000 - 50,000">₱30,000 - ₱50,000</option>
                <option value="Above 50,000">Above ₱50,000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Editable Emergency Contact */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Emergency Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Contact Name</label>
              <Input
                value={profileForm.emergencyContactName}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-900 border-gray-600 text-white disabled:opacity-60"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Relationship</label>
              <Input
                value={profileForm.emergencyContactRelationship}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContactRelationship: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-900 border-gray-600 text-white disabled:opacity-60"
                placeholder="e.g., Spouse, Parent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
              <Input
                value={profileForm.emergencyContactPhone}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-900 border-gray-600 text-white disabled:opacity-60"
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
