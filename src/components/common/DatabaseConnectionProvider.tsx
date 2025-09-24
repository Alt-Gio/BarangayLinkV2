"use client";

import React from 'react';
import { useDatabaseConnection } from '../../lib/databaseConnection';

interface DatabaseConnectionProviderProps {
  children: React.ReactNode;
}

export function DatabaseConnectionProvider({ children }: DatabaseConnectionProviderProps) {
  const { isReady, isLoading, hasError, databaseStatus, hasTimedOut } = useDatabaseConnection();

  if (isLoading && !hasTimedOut) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting to Database</h2>
          <p className="text-gray-400">Setting up your BarangayLink experience...</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Initializing user levels: {databaseStatus.tables.userLevels > 0 ? '✅' : '⏳'}</p>
            <p>Setting up user accounts: {databaseStatus.tables.users > 0 ? '✅' : '⏳'}</p>
            <p>Creating sample data: {databaseStatus.tables.projects > 0 ? '✅' : '⏳'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show timeout message with option to continue
  if (hasTimedOut) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Taking Longer Than Expected</h2>
          <p className="text-gray-400 mb-6">
            The database initialization is taking longer than usual. This might be due to network conditions or server load.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => {
                // Force proceed to the app
                window.location.href = '/dashboard';
              }}
              className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Continue Anyway
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            You can continue to use the app, but some features may not work properly until the database is fully initialized.
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Database Connection Error</h2>
          <p className="text-gray-400 mb-6">
            Unable to connect to the database. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
