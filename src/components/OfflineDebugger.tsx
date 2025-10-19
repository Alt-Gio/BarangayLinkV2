"use client";

import { useState, useEffect } from 'react';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { offlineDB, getOfflineStats } from '@/lib/offlineDB';

export function OfflineDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const { currentUser, isOnline, pendingSyncCount } = useOfflineData();

  useEffect(() => {
    const updateStats = async () => {
      const offlineStats = await getOfflineStats();
      setStats(offlineStats);

      // Get sample data
      try {
        const users = await offlineDB.users.toArray();
        const tasks = await offlineDB.tasks.limit(5).toArray();
        setDbData({ users: users.length, tasks: tasks.length, sampleTask: tasks[0] });
      } catch (error) {
        console.error('Error reading DB:', error);
      }
    };

    if (isOpen) {
      updateStats();
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg"
        title="Open Offline Debugger"
      >
        🔍
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          🔍 Offline Debugger
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Network Status */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="text-sm font-semibold text-gray-400 mb-2">Network Status</div>
        <div className={`flex items-center gap-2 ${isOnline ? 'text-green-400' : 'text-orange-400'}`}>
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}></div>
          <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Current User */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="text-sm font-semibold text-gray-400 mb-2">Current User</div>
        {currentUser ? (
          <div className="text-xs text-green-400">
            ✅ {currentUser.name || currentUser.email}
            <div className="text-gray-500 mt-1">ID: {currentUser._id?.slice(0, 8)}...</div>
          </div>
        ) : (
          <div className="text-xs text-red-400">❌ No user loaded</div>
        )}
      </div>

      {/* IndexedDB Stats */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="text-sm font-semibold text-gray-400 mb-2">IndexedDB Cache</div>
        {stats ? (
          <div className="text-xs space-y-1">
            <div className={stats.users > 0 ? 'text-green-400' : 'text-red-400'}>
              Users: {stats.users} {stats.users > 0 ? '✅' : '❌'}
            </div>
            <div className={stats.tasks > 0 ? 'text-green-400' : 'text-red-400'}>
              Tasks: {stats.tasks} {stats.tasks > 0 ? '✅' : '❌'}
            </div>
            <div className="text-gray-400">
              Projects: {stats.projects}
            </div>
            <div className="text-gray-400">
              Messages: {stats.messages}
            </div>
            <div className={stats.pendingSync > 0 ? 'text-yellow-400' : 'text-gray-400'}>
              Pending Sync: {stats.pendingSync}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400">Loading...</div>
        )}
      </div>

      {/* Sync Status */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="text-sm font-semibold text-gray-400 mb-2">Sync Queue</div>
        <div className="text-xs">
          <div className={pendingSyncCount > 0 ? 'text-yellow-400' : 'text-green-400'}>
            {pendingSyncCount} changes queued
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="p-3 bg-gray-800 rounded">
        <div className="text-sm font-semibold text-gray-400 mb-2">Diagnosis</div>
        <div className="text-xs space-y-1">
          {!isOnline && !currentUser && (
            <div className="text-red-400">
              ⚠️ Offline but no cached user!
              <div className="text-gray-500 mt-1">Go online and navigate first</div>
            </div>
          )}
          {!isOnline && currentUser && stats && stats.tasks === 0 && (
            <div className="text-yellow-400">
              ⚠️ User cached but no tasks!
              <div className="text-gray-500 mt-1">Visit task pages while online</div>
            </div>
          )}
          {!isOnline && currentUser && stats && stats.tasks > 0 && (
            <div className="text-green-400">
              ✅ Ready for offline mode!
              <div className="text-gray-500 mt-1">All data cached</div>
            </div>
          )}
          {isOnline && (
            <div className="text-blue-400">
              🟢 Online - building cache...
              <div className="text-gray-500 mt-1">Navigate around to cache data</div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          onClick={async () => {
            const stats = await getOfflineStats();
            alert(JSON.stringify(stats, null, 2));
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded"
        >
          Show Full Stats
        </button>
        <button
          onClick={async () => {
            const users = await offlineDB.users.toArray();
            const tasks = await offlineDB.tasks.toArray();
            console.log('=== OFFLINE DB DUMP ===');
            console.log('Users:', users);
            console.log('Tasks:', tasks);
            console.log('=====================');
            alert('Check console for full data dump');
          }}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded"
        >
          Dump DB to Console
        </button>
      </div>
    </div>
  );
}
