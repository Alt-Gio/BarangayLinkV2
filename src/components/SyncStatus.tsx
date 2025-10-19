"use client";

import { useOfflineData } from '@/contexts/OfflineDataContext';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export function SyncStatus() {
  const { isOnline, isSyncing, lastSyncTime, pendingSyncCount } = useOfflineData();
  
  const getTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-blue-400">Syncing</span>
          <span className="text-[10px] text-gray-500">
            {pendingSyncCount} pending
          </span>
        </div>
      </div>
    );
  }
  
  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
        <CloudOff className="w-4 h-4 text-orange-500" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-orange-400">Offline</span>
          <span className="text-[10px] text-gray-500">
            {pendingSyncCount} change{pendingSyncCount !== 1 ? 's' : ''} queued
          </span>
        </div>
      </div>
    );
  }
  
  if (pendingSyncCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-yellow-500" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-yellow-400">Pending</span>
          <span className="text-[10px] text-gray-500">
            {pendingSyncCount} change{pendingSyncCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
      <Cloud className="w-4 h-4 text-emerald-500" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-emerald-400">Synced</span>
        <span className="text-[10px] text-gray-500">
          {getTimeAgo(lastSyncTime)}
        </span>
      </div>
    </div>
  );
}
