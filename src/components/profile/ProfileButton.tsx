"use client";

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { User, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProfileButton() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);

  if (!clerkUser || !convexUser) {
    return null;
  }

  return (
    <button
      onClick={() => router.push('/profile')}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors group border-t border-gray-700"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <User className="w-5 h-5 text-gray-400 group-hover:text-teal-400 transition-colors" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-white">Profile</p>
          <p className="text-xs text-gray-400">
            View and edit your profile
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition-colors" />
    </button>
  );
}
