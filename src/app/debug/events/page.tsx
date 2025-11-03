"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu } from 'lucide-react';

export default function DebugEventsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useOfflineData();
  const userRole = currentUser?.userLevel?.name || 'WORKER';
  
  const allEvents = useQuery(api.events.debugGetAllEvents);
  const upcomingEvents = useQuery(api.events.getUpcomingEvents, { limit: 10 });

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        userRole={userRole}
        dashboardTitle="Debug Events"
        dashboardSubtitle="Troubleshoot event display issues"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-30 p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="max-w-7xl mx-auto mt-16 md:mt-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">🔍 Event Debug Dashboard</h1>

        {/* Upcoming Events Query Result */}
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-emerald-400 mb-4">
            📅 Events Showing on Landing Page ({upcomingEvents?.length || 0})
          </h2>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event: any) => (
                <div key={event._id} className="bg-gray-700 p-3 md:p-4 rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <span className="text-white font-bold text-sm md:text-base">{event.title}</span>
                    <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded w-fit">
                      {event.type}
                    </span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-300">
                    Status: <span className="text-emerald-400">{event.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm md:text-base">No events showing on landing page</p>
          )}
        </div>

        {/* All Events Debug Info */}
        <div className="bg-gray-800 rounded-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-blue-400 mb-4">
            🗂️ All Events in Database ({allEvents?.length || 0})
          </h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full text-xs md:text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Title</th>
                  <th className="text-left p-2 text-gray-400">Type</th>
                  <th className="text-left p-2 text-gray-400">Status</th>
                  <th className="text-left p-2 text-gray-400">Public?</th>
                  <th className="text-left p-2 text-gray-400">Future?</th>
                  <th className="text-left p-2 text-gray-400">Start Date</th>
                  <th className="text-left p-2 text-gray-400">Should Show?</th>
                </tr>
              </thead>
              <tbody>
                {allEvents?.map((event: any) => {
                  const shouldShow = event.isPublic && event.status === 'published' && event.isFuture;
                  return (
                    <tr key={event._id} className={`border-b border-gray-700 ${shouldShow ? 'bg-emerald-900/20' : ''}`}>
                      <td className="p-2 text-white">{event.title}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded">
                          {event.type}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          event.status === 'published' ? 'bg-emerald-600 text-white' :
                          event.status === 'pending' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="p-2">
                        {event.isPublic ? (
                          <span className="text-emerald-400">✓ Yes</span>
                        ) : (
                          <span className="text-red-400">✗ No</span>
                        )}
                      </td>
                      <td className="p-2">
                        {event.isFuture ? (
                          <span className="text-emerald-400">✓ Yes</span>
                        ) : (
                          <span className="text-red-400">✗ No (Past)</span>
                        )}
                      </td>
                      <td className="p-2 text-gray-300 text-xs">{event.startDateFormatted}</td>
                      <td className="p-2">
                        {shouldShow ? (
                          <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded font-bold">
                            ✓ SHOULD SHOW
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                            ✗ Won't show
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Requirements Checklist */}
          <div className="mt-6 p-3 md:p-4 bg-gray-700 rounded">
            <h3 className="text-white font-bold mb-3 text-sm md:text-base">📋 Requirements for Landing Page:</h3>
            <ul className="text-xs md:text-sm text-gray-300 space-y-1">
              <li>✅ <strong>isPublic</strong> = true (Public Event checkbox)</li>
              <li>✅ <strong>status</strong> = "published" (Not pending/cancelled)</li>
              <li>✅ <strong>startDate</strong> &gt;= now (Future date)</li>
            </ul>
            <p className="text-yellow-400 text-xs mt-3">
              ⚠️ Events highlighted in green should appear on the landing page
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
