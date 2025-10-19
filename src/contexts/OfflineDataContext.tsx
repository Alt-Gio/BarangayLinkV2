"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { offlineDB, OfflineTask, PendingMutation } from '@/lib/offlineDB';
import { useNetworkState } from '@/hooks/useNetworkState';
import { Id } from '../../convex/_generated/dataModel';

interface OfflineDataContextType {
  // User data
  currentUser: any;
  userPermissions: string[];
  
  // App state
  isOnline: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingSyncCount: number;
  
  // Data methods
  getTasks: () => Promise<any[]>;
  getTask: (id: string) => Promise<any | null>;
  
  // Mutation methods (work offline!)
  createTask: (data: any) => Promise<void>;
  updateTask: (id: string, data: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  
  // Sync methods
  syncNow: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const OfflineDataContext = createContext<OfflineDataContextType | undefined>(undefined);

export function OfflineDataProvider({ children }: { children: ReactNode }) {
  const isOnline = useNetworkState();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  
  // Online queries (only when online)
  const onlineUser = useQuery(
    api.users.getCurrentUser,
    isOnline ? {} : "skip"
  );
  
  const onlinePermissions = useQuery(
    api.users.getUserPermissions,
    isOnline && onlineUser ? {} : "skip"
  );
  
  const onlineTasks = useQuery(
    api.gamifiedTasks.getGamifiedTasks,
    isOnline && onlineUser ? {} : "skip"
  );
  
  // Convex mutations
  const convexCreateTask = useMutation(api.gamifiedTasks.createTask);
  const convexUpdateTask = useMutation(api.gamifiedTasks.updateTask);
  const convexDeleteTask = useMutation(api.gamifiedTasks.deleteTask);
  const convexCompleteTask = useMutation(api.gamifiedTasks.completeTask);
  
  // Local state (serves data when offline)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  // Sync online user data to offline storage
  useEffect(() => {
    if (isOnline && onlineUser) {
      offlineDB.users.put({
        id: onlineUser._id,
        clerkId: onlineUser.clerkId,
        name: onlineUser.name,
        email: onlineUser.email,
        userLevel: onlineUser.userLevel,
        department: onlineUser.department,
        position: onlineUser.position,
        level: onlineUser.level || 1,
        experience: onlineUser.experience || 0,
        gold: onlineUser.gold || 0,
        health: onlineUser.health || 100,
        mana: onlineUser.mana || 50,
        imageUrl: onlineUser.imageUrl,
        lastSynced: Date.now(),
      }).catch(error => console.error('Failed to cache user:', error));
      
      setCurrentUser(onlineUser);
      setLastSyncTime(Date.now());
    }
  }, [isOnline, onlineUser]);
  
  useEffect(() => {
    if (isOnline && onlinePermissions) {
      setUserPermissions(onlinePermissions);
    }
  }, [isOnline, onlinePermissions]);
  
  // Sync online tasks to offline storage
  useEffect(() => {
    if (isOnline && onlineTasks && onlineTasks.length > 0) {
      const tasksToSave = onlineTasks.map((task: any) => ({
        id: task._id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority || 'medium',
        difficulty: task.difficulty || 'medium',
        userId: task.userId,
        projectId: task.projectId,
        dueDate: task.dueDate,
        xpReward: task.xpReward || 0,
        goldReward: task.goldReward || 0,
        type: task.type || 'task',
        lastSynced: Date.now(),
        pendingSync: false,
      }));
      
      offlineDB.tasks.bulkPut(tasksToSave).catch(error => 
        console.error('Failed to cache tasks:', error)
      );
    }
  }, [isOnline, onlineTasks]);
  
  // Load from offline storage on mount (for initial offline state)
  useEffect(() => {
    async function loadOfflineData() {
      if (!currentUser) {
        const cachedUsers = await offlineDB.users.toArray();
        if (cachedUsers.length > 0) {
          setCurrentUser(cachedUsers[0]);
          console.log('📦 Loaded user from offline cache');
        }
      }
      
      // Update pending sync count
      updatePendingSyncCount();
    }
    
    loadOfflineData();
  }, []);
  
  // Update pending sync count
  const updatePendingSyncCount = async () => {
    try {
      // Get all pending mutations (filter in memory instead of index)
      const allMutations = await offlineDB.pendingMutations.toArray();
      const unsyncedCount = allMutations.filter(m => !m.synced).length;
      setPendingSyncCount(unsyncedCount);
    } catch (error) {
      console.error('Failed to count pending mutations:', error);
      setPendingSyncCount(0);
    }
  };
  
  // Get tasks (online or offline)
  const getTasks = useCallback(async () => {
    if (isOnline && onlineTasks) {
      return onlineTasks;
    }
    // Serve from offline storage
    const offlineTasks = await offlineDB.tasks.toArray();
    return offlineTasks;
  }, [isOnline, onlineTasks]);
  
  // Get single task
  const getTask = async (id: string) => {
    const task = await offlineDB.tasks.get(id);
    return task || null;
  };
  
  // Create task (works offline!)
  const createTask = async (data: any) => {
    if (isOnline) {
      // Direct to Convex
      try {
        await convexCreateTask(data);
        console.log('✅ Task created online');
      } catch (error) {
        console.error('Failed to create task online:', error);
        throw error;
      }
    } else {
      // Save locally + mark for sync
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await offlineDB.tasks.add({
        id: tempId,
        title: data.title,
        description: data.description || '',
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        difficulty: data.difficulty || 'medium',
        userId: currentUser?._id || data.userId,
        projectId: data.projectId,
        dueDate: data.dueDate,
        xpReward: data.xpReward || 0,
        goldReward: data.goldReward || 0,
        type: data.type || 'task',
        lastSynced: 0,
        pendingSync: true,
      });
      
      // Queue mutation for later sync
      await offlineDB.pendingMutations.add({
        type: 'create',
        table: 'tasks',
        data: { ...data, tempId },
        timestamp: Date.now(),
        synced: false,
      });
      
      await updatePendingSyncCount();
      console.log('📴 Task queued for sync (offline)');
    }
  };
  
  // Update task (works offline!)
  const updateTask = async (id: string, data: any) => {
    if (isOnline) {
      try {
        await convexUpdateTask({ 
          taskId: id as Id<"tasks">, 
          ...data 
        });
        console.log('✅ Task updated online');
      } catch (error) {
        console.error('Failed to update task online:', error);
        throw error;
      }
    } else {
      await offlineDB.tasks.update(id, {
        ...data,
        pendingSync: true,
      });
      
      await offlineDB.pendingMutations.add({
        type: 'update',
        table: 'tasks',
        data: { id, ...data },
        timestamp: Date.now(),
        synced: false,
      });
      
      await updatePendingSyncCount();
      console.log('📴 Task update queued for sync (offline)');
    }
  };
  
  // Delete task (works offline!)
  const deleteTask = async (id: string) => {
    if (isOnline) {
      try {
        await convexDeleteTask({ taskId: id as Id<"tasks"> });
        console.log('✅ Task deleted online');
      } catch (error) {
        console.error('Failed to delete task online:', error);
        throw error;
      }
    } else {
      await offlineDB.tasks.delete(id);
      
      await offlineDB.pendingMutations.add({
        type: 'delete',
        table: 'tasks',
        data: { id },
        timestamp: Date.now(),
        synced: false,
      });
      
      await updatePendingSyncCount();
      console.log('📴 Task deletion queued for sync (offline)');
    }
  };
  
  // Complete task (works offline!)
  const completeTask = async (id: string) => {
    if (isOnline) {
      try {
        await convexCompleteTask({ taskId: id as Id<"tasks"> });
        console.log('✅ Task completed online');
      } catch (error) {
        console.error('Failed to complete task online:', error);
        throw error;
      }
    } else {
      await offlineDB.tasks.update(id, {
        status: 'completed',
        pendingSync: true,
      });
      
      await offlineDB.pendingMutations.add({
        type: 'update',
        table: 'tasks',
        data: { id, status: 'completed' },
        timestamp: Date.now(),
        synced: false,
      });
      
      await updatePendingSyncCount();
      console.log('📴 Task completion queued for sync (offline)');
    }
  };
  
  // Sync pending mutations when back online
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      console.log('⚠️ Cannot sync while offline');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Get all mutations and filter unsynced ones in memory
      const allMutations = await offlineDB.pendingMutations.toArray();
      const pendingMutations = allMutations.filter(m => !m.synced);
      
      console.log(`🔄 Syncing ${pendingMutations.length} pending mutations...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const mutation of pendingMutations) {
        try {
          if (mutation.table === 'tasks') {
            if (mutation.type === 'create') {
              const { tempId, ...taskData } = mutation.data;
              await convexCreateTask(taskData);
              
              // Remove temp task from offline storage
              if (tempId) {
                await offlineDB.tasks.delete(tempId);
              }
            } else if (mutation.type === 'update') {
              const { id, ...updateData } = mutation.data;
              await convexUpdateTask({
                taskId: id as Id<"tasks">,
                ...updateData,
              });
            } else if (mutation.type === 'delete') {
              await convexDeleteTask({ taskId: mutation.data.id as Id<"tasks"> });
            }
          }
          
          // Mark as synced
          if (mutation.id) {
            await offlineDB.pendingMutations.update(mutation.id, { synced: true });
          }
          successCount++;
        } catch (error: any) {
          console.error('Failed to sync mutation:', mutation, error);
          
          // Store error for later review
          if (mutation.id) {
            await offlineDB.pendingMutations.update(mutation.id, { 
              error: error.message 
            });
          }
          errorCount++;
        }
      }
      
      // Cleanup synced mutations
      const allMutationsAfterSync = await offlineDB.pendingMutations.toArray();
      const syncedMutations = allMutationsAfterSync.filter(m => m.synced);
      for (const mutation of syncedMutations) {
        if (mutation.id) {
          await offlineDB.pendingMutations.delete(mutation.id);
        }
      }
      
      setLastSyncTime(Date.now());
      await updatePendingSyncCount();
      
      console.log(`✅ Sync complete! Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, convexCreateTask, convexUpdateTask, convexDeleteTask]);
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !isSyncing && pendingSyncCount > 0) {
      console.log('🔄 Auto-syncing pending changes...');
      syncNow();
    }
  }, [isOnline, isSyncing, pendingSyncCount, syncNow]);
  
  // Clear offline data
  const clearOfflineData = async () => {
    try {
      await offlineDB.users.clear();
      await offlineDB.tasks.clear();
      await offlineDB.projects.clear();
      await offlineDB.messages.clear();
      await offlineDB.notifications.clear();
      await offlineDB.pendingMutations.clear();
      
      setCurrentUser(null);
      setUserPermissions([]);
      setPendingSyncCount(0);
      
      console.log('✅ All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  };
  
  const value = {
    currentUser,
    userPermissions,
    isOnline,
    isLoading: !currentUser,
    isSyncing,
    lastSyncTime,
    pendingSyncCount,
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    syncNow,
    clearOfflineData,
  };
  
  return (
    <OfflineDataContext.Provider value={value}>
      {children}
    </OfflineDataContext.Provider>
  );
}

export function useOfflineData() {
  const context = useContext(OfflineDataContext);
  if (!context) {
    throw new Error('useOfflineData must be used within OfflineDataProvider');
  }
  return context;
}
