import Dexie, { Table } from 'dexie';

// Define types for offline storage
export interface OfflineUser {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  userLevel: any;
  department?: string;
  position: string;
  level: number;
  experience: number;
  gold: number;
  health: number;
  mana: number;
  imageUrl?: string;
  lastSynced: number;
}

export interface OfflineTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  difficulty: string;
  userId: string;
  projectId?: string;
  dueDate?: number;
  xpReward: number;
  goldReward: number;
  type: string;
  lastSynced: number;
  pendingSync?: boolean;
}

export interface OfflineProject {
  id: string;
  title: string;
  description: string;
  status: string;
  department: string;
  budget: number;
  startDate: number;
  endDate: number;
  lastSynced: number;
}

export interface OfflineMessage {
  id: string;
  roomId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  messageType: string;
  lastSynced: number;
}

export interface OfflineNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: number;
  actionUrl?: string;
  lastSynced: number;
}

export interface PendingMutation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  synced: boolean;
  error?: string;
}

// Create offline database
class OfflineDatabase extends Dexie {
  users!: Table<OfflineUser>;
  tasks!: Table<OfflineTask>;
  projects!: Table<OfflineProject>;
  messages!: Table<OfflineMessage>;
  notifications!: Table<OfflineNotification>;
  pendingMutations!: Table<PendingMutation>;

  constructor() {
    super('BarangayLinkOfflineDB');
    
    this.version(1).stores({
      users: 'id, clerkId, email, lastSynced',
      tasks: 'id, userId, projectId, status, lastSynced, pendingSync',
      projects: 'id, department, status, lastSynced',
      messages: 'id, roomId, senderId, timestamp, lastSynced',
      notifications: 'id, userId, isRead, createdAt, lastSynced',
      pendingMutations: '++id, type, table, timestamp, synced',
    });
  }
}

export const offlineDB = new OfflineDatabase();

// Helper functions
export async function cleanupOldOfflineData(daysOld: number = 7) {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  
  try {
    await offlineDB.tasks.where('lastSynced').below(cutoffTime).delete();
    await offlineDB.projects.where('lastSynced').below(cutoffTime).delete();
    await offlineDB.messages.where('lastSynced').below(cutoffTime).delete();
    await offlineDB.notifications.where('lastSynced').below(cutoffTime).delete();
    
    console.log(`✅ Cleaned up offline data older than ${daysOld} days`);
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
  }
}

export async function clearAllOfflineData() {
  try {
    await offlineDB.users.clear();
    await offlineDB.tasks.clear();
    await offlineDB.projects.clear();
    await offlineDB.messages.clear();
    await offlineDB.notifications.clear();
    await offlineDB.pendingMutations.clear();
    
    console.log('✅ All offline data cleared');
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
}

export async function getOfflineStats() {
  try {
    // Count items safely with error handling for each table
    const userCount = await offlineDB.users.count().catch(() => 0);
    const taskCount = await offlineDB.tasks.count().catch(() => 0);
    const projectCount = await offlineDB.projects.count().catch(() => 0);
    const messageCount = await offlineDB.messages.count().catch(() => 0);
    const notificationCount = await offlineDB.notifications.count().catch(() => 0);
    
    // Count pending mutations safely
    let pendingCount = 0;
    try {
      const allMutations = await offlineDB.pendingMutations.toArray();
      pendingCount = allMutations.filter(m => !m.synced).length;
    } catch (error) {
      console.warn('Could not count pending mutations:', error);
    }
    
    return {
      users: userCount,
      tasks: taskCount,
      projects: projectCount,
      messages: messageCount,
      notifications: notificationCount,
      pendingSync: pendingCount,
    };
  } catch (error) {
    console.error('Failed to get offline stats:', error);
    return {
      users: 0,
      tasks: 0,
      projects: 0,
      messages: 0,
      notifications: 0,
      pendingSync: 0,
    };
  }
}
