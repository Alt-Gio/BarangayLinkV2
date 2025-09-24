"use client";

import React from 'react';
import { useDatabaseConnection } from '../../lib/databaseConnection';

export function DatabaseStatusIndicator() {
  const { databaseStatus, isReady, isLoading } = useDatabaseConnection();

  if (isReady) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-blue-900/90 border border-blue-600 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          ) : (
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          )}
          <span className="text-blue-300 text-sm font-medium">
            {isLoading ? 'Setting up database...' : 'Database ready'}
          </span>
        </div>
        {isLoading && (
          <div className="mt-2 text-xs text-blue-200">
            <div className="flex justify-between">
              <span>Users:</span>
              <span>{databaseStatus.tables.users}</span>
            </div>
            <div className="flex justify-between">
              <span>Projects:</span>
              <span>{databaseStatus.tables.projects}</span>
            </div>
            <div className="flex justify-between">
              <span>Events:</span>
              <span>{databaseStatus.tables.events}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
