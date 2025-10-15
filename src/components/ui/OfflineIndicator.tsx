"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, Wifi, RefreshCw, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [show, setShow] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setJustReconnected(false);
    } else if (wasOffline) {
      setJustReconnected(true);
      setTimeout(() => {
        setShow(false);
        setJustReconnected(false);
      }, 3000);
    } else {
      setShow(false);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex justify-center p-4">
        <div
          className={`
            flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm
            pointer-events-auto transition-all duration-300 ease-in-out
            ${
              isOnline
                ? "bg-emerald-500/90 text-white"
                : "bg-red-500/90 text-white"
            }
          `}
        >
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Back online - Syncing data...</span>
              <RefreshCw className="w-4 h-4 animate-spin" />
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-medium">You're offline</p>
                <p className="text-sm opacity-90">
                  Changes will sync when you reconnect
                </p>
              </div>
              <AlertCircle className="w-4 h-4" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
