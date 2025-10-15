"use client";

// IndexedDB wrapper for offline data storage

const DB_NAME = "barangaylink_offline_db";
const DB_VERSION = 1;

// Store names
export const STORES = {
  PROJECTS: "projects",
  TASKS: "tasks",
  MESSAGES: "messages",
  EVENTS: "events",
  QUEUE: "sync_queue", // Pending mutations when offline
  CACHE: "data_cache",
} as const;

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(STORES.PROJECTS, {
            keyPath: "_id",
          });
          projectStore.createIndex("status", "status", { unique: false });
          projectStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, {
            keyPath: "_id",
          });
          taskStore.createIndex("status", "status", { unique: false });
          taskStore.createIndex("userId", "userId", { unique: false });
          taskStore.createIndex("projectId", "projectId", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messageStore = db.createObjectStore(STORES.MESSAGES, {
            keyPath: "_id",
          });
          messageStore.createIndex("roomId", "roomId", { unique: false });
          messageStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.EVENTS)) {
          const eventStore = db.createObjectStore(STORES.EVENTS, {
            keyPath: "_id",
          });
          eventStore.createIndex("startDate", "startDate", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          const queueStore = db.createObjectStore(STORES.QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          });
          queueStore.createIndex("timestamp", "timestamp", { unique: false });
          queueStore.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, {
            keyPath: "key",
          });
          cacheStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  // Generic CRUD operations
  async set(storeName: string, data: any): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, key: string): Promise<any> {
    const db = await this.init();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.init();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Queue management for offline mutations
  async addToQueue(mutation: {
    type: string;
    function: string;
    args: any;
    timestamp: number;
  }): Promise<number> {
    const db = await this.init();
    const transaction = db.transaction(STORES.QUEUE, "readwrite");
    const store = transaction.objectStore(STORES.QUEUE);
    
    return new Promise((resolve, reject) => {
      const request = store.add(mutation);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getQueue(): Promise<any[]> {
    return this.getAll(STORES.QUEUE);
  }

  async clearQueue(): Promise<void> {
    return this.clear(STORES.QUEUE);
  }

  async removeFromQueue(id: number): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(STORES.QUEUE, "readwrite");
    const store = transaction.objectStore(STORES.QUEUE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache with TTL
  async setCache(
    key: string,
    data: any,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): Promise<void> {
    await this.set(STORES.CACHE, {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });
  }

  async getCache(key: string): Promise<any> {
    const cached = await this.get(STORES.CACHE, key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiry) {
      await this.delete(STORES.CACHE, key);
      return null;
    }
    
    return cached.data;
  }

  // Cleanup expired cache
  async cleanupExpiredCache(): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(STORES.CACHE, "readwrite");
    const store = transaction.objectStore(STORES.CACHE);
    const index = store.index("timestamp");
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (Date.now() > cursor.value.expiry) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Initialize on load
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(console.error);
  
  // Cleanup expired cache every hour
  setInterval(() => {
    offlineStorage.cleanupExpiredCache().catch(console.error);
  }, 60 * 60 * 1000);
}
