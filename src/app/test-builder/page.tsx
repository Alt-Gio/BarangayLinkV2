"use client";

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Force dynamic rendering since this page is wrapped by ClerkProvider
export const dynamic = 'force-dynamic';

export default function TestBuilderPage() {
  const dashboardData = useQuery(api.dashboards.getBuilderDashboard);

  if (!dashboardData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Testing Builder Dashboard Query</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Builder Dashboard Test - SUCCESS!</h1>
      <div className="bg-gray-800 p-4 rounded-lg">
        <pre className="text-green-400 text-sm overflow-auto">
          {JSON.stringify(dashboardData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
