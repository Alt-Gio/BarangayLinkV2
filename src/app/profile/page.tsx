"use client";

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useState, useRef, useEffect } from 'react';
import { Camera, Save, X, User, Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Sidebar } from '@/components/layout/Sidebar';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.updateUserProfile);
  const uploadImage = useMutation(api.users.uploadProfileImage);
  const { userRole } = useDashboardData();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
  });

  useState(() => {
    if (convexUser) {
      setFormData({
        name: convexUser.name || '',
        email: convexUser.email || '',
        phone: convexUser.phone || '',
        address: convexUser.address || '',
        bio: convexUser.bio || '',
      });
    }
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      await clerkUser?.setProfileImage({ file });
      toast.success('Profile picture updated!');
      setImagePreview(null);
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!convexUser) return;

    try {
      await clerkUser?.update({
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' ') || undefined,
      });

      await updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    }
  };

  if (!isLoaded || !convexUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        userRole={userRole || 'WORKER'}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 overflow-y-auto bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-400 mt-2">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-teal-500 to-emerald-600"></div>

          <div className="px-6 pb-6">
            {/* Profile Picture */}
            <div className="relative -mt-16 mb-6">
              <div className="relative inline-block">
                <img
                  src={imagePreview || clerkUser?.imageUrl}
                  alt={formData.name}
                  className="w-32 h-32 rounded-full border-4 border-gray-800 object-cover"
                />
                <button
                  onClick={handleImageClick}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-teal-600 hover:bg-teal-700 p-3 rounded-full shadow-lg transition-colors disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              {/* Role Badge */}
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full text-sm">
                  <Briefcase className="w-4 h-4" />
                  {convexUser.userLevel?.name || 'WORKER'}
                </span>
              </div>
            </div>

            {/* Edit Toggle */}
            <div className="flex justify-end mb-6">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      if (convexUser) {
                        setFormData({
                          name: convexUser.name || '',
                          email: convexUser.email || '',
                          phone: convexUser.phone || '',
                          address: convexUser.address || '',
                          bio: convexUser.bio || '',
                        });
                      }
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-lg">{formData.name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <p className="text-lg">{formData.email || 'Not set'}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-lg">{formData.phone || 'Not set'}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="Your address"
                  />
                ) : (
                  <p className="text-lg">{formData.address || 'Not set'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                  <User className="w-4 h-4" />
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500 transition-colors resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-lg">{formData.bio || 'No bio yet'}</p>
                )}
              </div>

              {/* Account Info */}
              <div className="pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <span className="text-white">{convexUser.department || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Level:</span>
                    <span className="text-white">{convexUser.userLevel?.name || 'WORKER'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Member since:</span>
                    <span className="text-white flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {convexUser._creationTime ? new Date(convexUser._creationTime).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
