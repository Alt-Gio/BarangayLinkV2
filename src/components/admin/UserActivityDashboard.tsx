'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDistanceToNow, format } from 'date-fns';

interface SessionFilter {
  startDate?: Date;
  endDate?: Date;
  activityType?: string;
}

export default function UserActivityDashboard() {
  const [filter, setFilter] = useState<SessionFilter>({});
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'activity' | 'stats'>('sessions');

  // Queries
  const activeSessions = useQuery(api.userSessions.getActiveSessions);
  const sessionStats = useQuery(api.userSessions.getSessionStats, {
    startDate: filter.startDate?.getTime(),
    endDate: filter.endDate?.getTime(),
  });
  const userActivityLogs = useQuery(api.userSessions.getUserActivityLogs, {
    userId: selectedUserId as string,
    activityType: filter.activityType,
    startDate: filter.startDate?.getTime(),
    endDate: filter.endDate?.getTime(),
    limit: 100,
  });

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'page_view': return '👁️';
      case 'action': return '⚡';
      case 'error': return '❌';
      case 'session_timeout': return '⏰';
      default: return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'text-green-600 bg-green-50';
      case 'logout': return 'text-blue-600 bg-blue-50';
      case 'page_view': return 'text-gray-600 bg-gray-50';
      case 'action': return 'text-purple-600 bg-purple-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'session_timeout': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Activity Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'sessions'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active Sessions
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'activity'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'stats'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filter.startDate ? format(filter.startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setFilter(prev => ({
                ...prev,
                startDate: e.target.value ? new Date(e.target.value) : undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filter.endDate ? format(filter.endDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setFilter(prev => ({
                ...prev,
                endDate: e.target.value ? new Date(e.target.value) : undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type
            </label>
            <select
              value={filter.activityType || ''}
              onChange={(e) => setFilter(prev => ({
                ...prev,
                activityType: e.target.value || undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Activities</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="page_view">Page View</option>
              <option value="action">Action</option>
              <option value="error">Error</option>
              <option value="session_timeout">Session Timeout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID (for activity logs)
            </label>
            <input
              type="text"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Leave empty for all users"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Active Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Currently Active Sessions</h2>
            <p className="text-gray-600">Users currently logged in to the system</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeSessions?.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(session.loginTime), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDistanceToNow(new Date(session.loginTime), { addSuffix: false })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {session.deviceInfo?.browser} on {session.deviceInfo?.os}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.deviceInfo?.device}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.location?.city && session.location?.country
                        ? `${session.location.city}, ${session.location.country}`
                        : 'Unknown'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!activeSessions || activeSessions.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No active sessions found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">User Activity Logs</h2>
            <p className="text-gray-600">Detailed log of user actions and events</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {userActivityLogs?.map((log) => (
                <div key={log._id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(log.activityType)}`}>
                    {getActivityIcon(log.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {log.activityType.replace('_', ' ')}
                        {log.action && ` - ${log.action}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </p>
                    </div>
                    {log.page && (
                      <p className="text-sm text-gray-600">Page: {log.page}</p>
                    )}
                    {log.duration && (
                      <p className="text-sm text-gray-600">
                        Duration: {formatDuration(log.duration)}
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">
                          View Details
                        </summary>
                        <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {(!userActivityLogs || userActivityLogs.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No activity logs found for the selected criteria
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sessionStats?.activeSessionsCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sessionStats?.totalSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">👤</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unique Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sessionStats?.uniqueUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">⏱️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Session</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sessionStats?.avgSessionDuration 
                    ? formatDuration(sessionStats.avgSessionDuration)
                    : '0h 0m'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
