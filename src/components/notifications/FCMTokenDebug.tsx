"use client";

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

/**
 * Debug component to show FCM token information
 * Add this to any page to see if your token is saved
 */
export function FCMTokenDebug() {
  const { user } = useUser();
  const [showDetails, setShowDetails] = useState(false);
  
  // Get current user's push subscription
  const subscription = useQuery(
    api.pushNotifications.getUserSubscription,
    user ? {} : "skip"
  );

  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-500 rounded-lg p-4 max-w-md shadow-lg">
        <p className="text-sm font-semibold text-red-300">❌ Not logged in</p>
        <p className="text-xs text-gray-400 mt-1">Sign in to check FCM token</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-900/90 border border-yellow-500 rounded-lg p-4 max-w-md shadow-lg">
        <p className="text-sm font-semibold text-yellow-300">⚠️ No FCM Token Found</p>
        <p className="text-xs text-gray-400 mt-1">Enable notifications to generate token</p>
        <button
          onClick={() => window.location.href = '/test-notifications'}
          className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
        >
          Go to Test Page
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-900/90 border border-green-500 rounded-lg p-4 max-w-md shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-green-300">✅ FCM Token Found!</p>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-400 hover:text-white"
        >
          {showDetails ? 'Hide' : 'Show'}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-2 text-xs">
          <div>
            <p className="text-gray-400">Token (first 50 chars):</p>
            <p className="text-green-300 font-mono break-all">
              {subscription.token.substring(0, 50)}...
            </p>
          </div>

          <div>
            <p className="text-gray-400">Saved:</p>
            <p className="text-green-300">
              {new Date(subscription.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-400">Last Updated:</p>
            <p className="text-green-300">
              {new Date(subscription.updatedAt).toLocaleString()}
            </p>
          </div>

          {subscription.deviceInfo && (
            <div>
              <p className="text-gray-400">Device:</p>
              <p className="text-green-300">
                {subscription.deviceInfo.platform || 'Unknown'}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(subscription.token);
              alert('Token copied to clipboard!');
            }}
            className="w-full mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          >
            Copy Full Token
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        FCM notifications are enabled ✅
      </p>
    </div>
  );
}
