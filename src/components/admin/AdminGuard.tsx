"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield, AlertTriangle } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Get current user's role from Convex
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && user ? {} : "skip"
  );

  useEffect(() => {
    if (isLoaded && !user) {
      // Not logged in - redirect to login
      router.push("/login");
    }
  }, [isLoaded, user, router]);

  // Still loading authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Still loading user data from Convex
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // User data loaded but user is not an admin
  if (currentUser && currentUser.userLevel && currentUser.userLevel.name !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-6">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <Shield className="w-5 h-5" />
                <span className="text-sm">
                  Your role: <span className="font-semibold text-white">{currentUser.userLevel?.name || "Unknown"}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is an admin - render children
  return <>{children}</>;
}
