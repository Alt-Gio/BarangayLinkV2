"use client";

import { useOfflineData } from '@/contexts/OfflineDataContext';
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, isSyncing, lastSyncTime, pendingSyncCount, syncNow } = useOfflineData();
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Don't show if online, not syncing, and no pending changes
  if (isOnline && !isSyncing && pendingSyncCount === 0 && !isDismissed) {
    return null;
  }
  
  // Reset dismissed state when going offline
  if (!isOnline && isDismissed) {
    setIsDismissed(false);
  }
  
  const getBackgroundColor = () => {
    if (isSyncing) return 'bg-blue-600';
    if (!isOnline) return 'bg-orange-600';
    if (pendingSyncCount > 0) return 'bg-yellow-600';
    return 'bg-emerald-600';
  };
  
  const getMessage = () => {
    if (isSyncing) return 'Syncing changes...';
    if (!isOnline) return `You're offline - ${pendingSyncCount} change${pendingSyncCount !== 1 ? 's' : ''} will sync when reconnected`;
    if (pendingSyncCount > 0) return `${pendingSyncCount} change${pendingSyncCount !== 1 ? 's' : ''} pending sync`;
    return 'All changes synced!';
  };
  
  const getIcon = () => {
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (pendingSyncCount > 0) return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getBackgroundColor()} text-white px-4 py-3 shadow-lg transition-all duration-300`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="font-medium text-sm">{getMessage()}</p>
            {!isOnline && (
              <p className="text-xs text-white/80 mt-0.5">
                Changes are saved locally and will sync automatically
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isOnline && !isSyncing && pendingSyncCount > 0 && (
            <button
              onClick={syncNow}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
            >
              Sync Now
            </button>
          )}
          
          {isOnline && !isSyncing && pendingSyncCount === 0 && (
            <button
              onClick={() => setIsDismissed(true)}
              className="px-2 py-1 hover:bg-white/10 rounded text-sm transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
