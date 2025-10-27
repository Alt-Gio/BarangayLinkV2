"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Loader2, CheckCircle2, User, Briefcase, Building2, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function OAuthSetupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [formData, setFormData] = useState({
    department: '',
    position: '',
    phone: '',
  });

  const departments = useQuery(api.departments.getAllDepartments);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // Pre-fill name from OAuth
  useEffect(() => {
    if (user && isLoaded) {
      console.log("✅ OAuth user loaded:", user.firstName, user.lastName);
    }
  }, [user, isLoaded]);

  // Redirect if not authenticated - but wait a bit for Clerk to sync
  useEffect(() => {
    if (!isLoaded) return;

    // If user exists, we're good!
    if (user) {
      console.log("✅ User session found");
      return;
    }

    // If no user, wait and retry (Clerk might still be syncing)
    if (!user && retryCount < 5) {
      console.log(`⏳ Waiting for user session... (attempt ${retryCount + 1}/5)`);
      const retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }

    // After 5 retries, redirect to login
    if (!user && retryCount >= 5) {
      console.log("❌ No user after 5 attempts, redirecting to login");
      router.push('/login');
    }
  }, [isLoaded, user, router, retryCount]);

  // Fallback departments
  const fallbackDepartments = [
    "Health Services",
    "Education",
    "Public Works",
    "Social Welfare",
    "Agriculture",
    "Youth Development",
    "Senior Citizens Affairs",
    "General Services",
  ];

  const availableDepartments = departments?.length
    ? departments.map(d => d.name)
    : fallbackDepartments;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.department || !formData.position) {
      toast.error("Please fill in Department and Position");
      return;
    }

    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("📝 Step 1: Updating Clerk metadata...");
      
      // Step 1: Update Clerk
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          department: formData.department,
          position: formData.position,
          jobTitle: formData.position,
          phone: formData.phone,
          profileCompleted: true,
        },
      });
      
      console.log("✅ Clerk updated");

      // Wait a moment for Clerk to sync
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("📝 Step 2: Creating/Updating user in Convex...");

      // Step 2: Create/Update in Convex directly
      await createOrUpdateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        department: formData.department,
        jobTitle: formData.position,
        phone: formData.phone || undefined,
        imageUrl: user.imageUrl,
      });

      console.log("✅ User created/updated in Convex");

      toast.success("Registration complete! Redirecting...");

      // Wait a moment then redirect
      await new Promise(resolve => setTimeout(resolve, 2000));

      router.push('/pending-approval');

    } catch (error: any) {
      console.error("❌ Error:", error);
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while Clerk loads or if waiting for user
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">
            {!isLoaded ? "Loading..." : 
             retryCount < 5 ? `Syncing your session... (${retryCount + 1}/5)` :
             "Redirecting..."}
          </p>
          {retryCount > 2 && retryCount < 5 && (
            <p className="text-yellow-400 text-sm mt-2">
              Taking longer than usual, please wait...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-gray-400">
              Just a few more details to complete your registration
            </p>
          </div>

          {/* OAuth Info */}
          <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-emerald-300 font-medium">
                  Signed in via {user.externalAccounts?.[0]?.provider || 'OAuth'}
                </p>
                <p className="text-xs text-gray-400">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              >
                <option value="" className="bg-gray-800">Select department</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept} className="bg-gray-800">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Position / Job Title *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Health Worker, Community Organizer"
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-gray-500"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+63 912 345 6789"
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-gray-500"
              />
            </div>

            {/* Info Box */}
            <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-200">
                <span className="font-semibold">Note:</span> Your registration will be reviewed by an administrator before you can access the system.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 rounded-lg transition-all shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Setup
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
