"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserSync, useSyncStatus } from '@/lib/clerkSync';

// Force dynamic rendering for this admin page
export const dynamic = 'force-dynamic';

export default function AdminSyncPage() {
  const { user } = useUser();
  const { syncCurrentUser } = useUserSync();
  const syncStatus = useSyncStatus();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSyncCurrentUser = async () => {
    setSyncing(true);
    setMessage('');
    
    try {
      await syncCurrentUser();
      setMessage('✅ Current user synced successfully!');
    } catch (error) {
      setMessage(`❌ Failed to sync user: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Please sign in to access admin panel.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">User Sync Administration</h1>
        
        {/* Current User Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current User</h2>
          <div className="text-gray-300">
            <p><strong>Name:</strong> {user.fullName}</p>
            <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
            <p><strong>Clerk ID:</strong> {user.id}</p>
          </div>
          
          <button
            onClick={handleSyncCurrentUser}
            disabled={syncing}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync Current User to Convex'}
          </button>
          
          {message && (
            <div className="mt-4 p-3 bg-gray-700 rounded text-white">
              {message}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Sync Status</h2>
          
          {syncStatus ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">Sync &quot;real&quot; users from Clerk to Convex database for better data management.</p>
              <p><strong>Users in Convex:</strong> {syncStatus.convexUserCount}</p>
              <p><strong>User Levels:</strong> {syncStatus.userLevelsCount}</p>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium text-white mb-2">Available User Levels:</h3>
                <ul className="list-disc list-inside">
                  {syncStatus.userLevels.map((level, index) => (
                    <li key={index}>
                      <strong>{level.name}</strong> - {level.permissions.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium text-white mb-2">Recent Users:</h3>
                <ul className="list-disc list-inside">
                  {syncStatus.recentUsers.map((user, index) => (
                    <li key={index}>
                      {user.name} ({user.email}) - {new Date(user.createdAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Loading sync status...</div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Setup Instructions</h2>
          <div className="text-gray-300 space-y-2">
            <p><strong>1. Automatic Sync (Recommended):</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Set up Clerk webhook at: <code className="bg-gray-700 px-2 py-1 rounded">your-domain.com/api/clerk-webhook</code></li>
              <li>Add webhook secret to environment variables: <code className="bg-gray-700 px-2 py-1 rounded">CLERK_WEBHOOK_SECRET</code></li>
              <li>Configure webhook events: user.created, user.updated, user.deleted</li>
            </ul>
            
            <p className="mt-4"><strong>2. Manual Sync:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Use the &quot;Sync Current User&quot; button above</li>
              <li>Each user can sync themselves when they first log in</li>
              <li>Admin can sync users individually as needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
