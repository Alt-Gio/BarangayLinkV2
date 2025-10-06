"use client";

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';

// ============================================================================
// CLIENT-SIDE DATABASE CONNECTION MANAGER
// ============================================================================

export interface DatabaseStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  isInitialized: boolean;
  tables: {
    userLevels: number;
    users: number;
    projects: number;
    events: number;
    chatRooms: number;
    userSessions: number;
    messages: number;
    notifications: number;
  };
  lastUpdate: number;
  error?: string;
}

// Hook for managing database connection and initialization
export function useDatabaseConnection() {
  const { user: clerkUser, isLoaded } = useUser();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [initializationStatus, setInitializationStatus] = useState<'pending' | 'initializing' | 'completed' | 'error'>('pending');
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Queries
  const databaseStatus = useQuery(api.databaseManager.getDatabaseStatus);
  
  // Mutations
  const initializeDatabase = useMutation(api.databaseManager.initializeDatabase);
  const syncUserFromClerk = useMutation(api.databaseManager.syncUserFromClerk);

  // Check connection status
  useEffect(() => {
    if (databaseStatus) {
      setConnectionStatus('connected');
      if (!databaseStatus.isInitialized && initializationStatus === 'pending') {
        setInitializationStatus('initializing');
        handleDatabaseInitialization();
      } else if (databaseStatus.isInitialized && initializationStatus !== 'completed') {
        setInitializationStatus('completed');
      }
    } else if (databaseStatus === null) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database status is null, setting error state');
      }
      setConnectionStatus('error');
    }
  }, [databaseStatus, initializationStatus]);

  // Add timeout mechanism
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (connectionStatus === 'connecting' || initializationStatus === 'initializing') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Database connection/initialization timed out after 30 seconds');
        }
        setHasTimedOut(true);
        // Don't set error state immediately, just mark as timed out
      }
    }, 30000); // 30 seconds timeout

    return () => clearTimeout(timeout);
  }, [connectionStatus, initializationStatus]);

  // Sync user from Clerk when available
  useEffect(() => {
    if (isLoaded && clerkUser && connectionStatus === 'connected' && initializationStatus === 'completed') {
      handleUserSync();
    }
  }, [isLoaded, clerkUser, connectionStatus, initializationStatus]);

  // Skip user sync requirement if database is ready but user sync is optional
  useEffect(() => {
    if (connectionStatus === 'connected' && initializationStatus === 'completed' && (!isLoaded || !clerkUser)) {
      // Database ready, proceeding without user sync (no user signed in)
    }
  }, [connectionStatus, initializationStatus, isLoaded, clerkUser]);

  const handleDatabaseInitialization = async () => {
    try {
      await initializeDatabase({});
      setInitializationStatus('completed');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database initialization failed:', error);
      }
      setInitializationStatus('error');
    }
  };

  const handleUserSync = async () => {
    if (!clerkUser) return;

    try {
      await syncUserFromClerk({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        imageUrl: clerkUser.imageUrl,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('User sync failed:', error);
      }
    }
  };

  const reinitializeDatabase = async () => {
    setInitializationStatus('initializing');
    await handleDatabaseInitialization();
  };

  const getConnectionInfo = (): DatabaseStatus => {
    if (!databaseStatus) {
      return {
        status: connectionStatus === 'error' ? 'error' : 'connecting',
        isInitialized: false,
        tables: {
          userLevels: 0,
          users: 0,
          projects: 0,
          events: 0,
          chatRooms: 0,
          userSessions: 0,
          messages: 0,
          notifications: 0,
        },
        lastUpdate: 0,
        error: connectionStatus === 'error' ? 'Failed to connect to database' : undefined,
      };
    }

    return {
      status: connectionStatus,
      isInitialized: databaseStatus.isInitialized,
      tables: databaseStatus.tables,
      lastUpdate: databaseStatus.lastUpdate,
    };
  };

  // Determine if we should proceed (don't wait indefinitely for user sync)
  const shouldProceed = connectionStatus === 'connected' && initializationStatus === 'completed';
  const isStillLoading = (connectionStatus === 'connecting' || initializationStatus === 'initializing') && !hasTimedOut;

  return {
    connectionStatus,
    initializationStatus,
    databaseStatus: getConnectionInfo(),
    reinitializeDatabase,
    isReady: shouldProceed,
    isLoading: isStillLoading,
    hasError: connectionStatus === 'error' || initializationStatus === 'error',
    hasTimedOut,
  };
}

// Hook for database operations
export function useDatabaseOperations() {
  const cleanupOldData = useMutation(api.databaseManager.cleanupOldData);
  const exportAllData = useQuery(api.databaseManager.exportAllData);

  const performCleanup = async (daysOld: number = 30) => {
    try {
      const result = await cleanupOldData({ daysOld });
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database cleanup failed:', error);
      }
      throw error;
    }
  };

  const exportData = () => {
    return exportAllData;
  };

  return {
    performCleanup,
    exportData,
  };
}

// Note: React components moved to separate .tsx files to avoid TypeScript parsing issues
// DatabaseConnectionProvider and DatabaseStatusIndicator will be created as separate components
