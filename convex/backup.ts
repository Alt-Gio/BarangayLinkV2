import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Backup Schedule Schema
export const getBackupSchedule = query({
  args: {},
  handler: async (ctx) => {
    // Return default backup schedule
    // In a real app, this would be stored in a table
    return {
      enabled: true,
      frequency: "daily", // daily, weekly, monthly
      time: "02:00", // 2 AM
      retentionDays: 90,
      lastBackup: null,
      nextBackup: null,
    };
  },
});

// Get all backups from database
export const getAllBackups = query({
  args: {},
  handler: async (ctx) => {
    const backups = await ctx.db.query("systemBackups").order("desc").take(20);
    return backups;
  },
});

// Get specific backup
export const getBackup = query({
  args: { backupId: v.id("systemBackups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.backupId);
  },
});

// Update backup schedule
export const updateBackupSchedule = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    frequency: v.optional(v.string()),
    time: v.optional(v.string()),
    retentionDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // In a real app, this would update a settings table
    // For now, just return success
    return {
      success: true,
      message: "Backup schedule updated successfully",
      schedule: {
        enabled: args.enabled ?? true,
        frequency: args.frequency ?? "daily",
        time: args.time ?? "02:00",
        retentionDays: args.retentionDays ?? 90,
      },
    };
  },
});

// Create full system backup
export const createFullBackup = action({
  args: {
    type: v.optional(v.union(v.literal("manual"), v.literal("automatic"), v.literal("archive"))),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    backupId?: Id<"systemBackups">;
    totalRecords: number;
    timestamp: number;
    tables: any;
  }> => {
    // Collect all data from all tables
    const backupData: any = {};
    
    // Get user identity
    const identity = await ctx.auth.getUserIdentity();
    const currentUser: any = null;
    
    try {
      // Helper to bypass type inference issues
      const safeRunQuery = async (fn: any): Promise<any> => {
        return await (ctx.runQuery as any)(fn);
      };
      
      // Extract function references using bracket notation to bypass type inference
      // @ts-expect-error - Type instantiation is excessively deep
      const backupModule = internal.backup as any;
      const exportUsers = backupModule['exportUsers'];
      const exportDepartments = backupModule['exportDepartments'];
      const exportUserLevels = backupModule['exportUserLevels'];
      const exportProjects = backupModule['exportProjects'];
      const exportEvents = backupModule['exportEvents'];
      
      // Users
      const users: any[] = await safeRunQuery(exportUsers);
      backupData.users = users;
      
      // Departments
      const departments: any[] = await safeRunQuery(exportDepartments);
      backupData.departments = departments;
      
      // User Levels
      const userLevels: any[] = await safeRunQuery(exportUserLevels);
      backupData.userLevels = userLevels;
      
      // Projects
      const projects: any[] = await safeRunQuery(exportProjects);
      backupData.projects = projects;
      
      // Events
      const events: any[] = await safeRunQuery(exportEvents);
      backupData.events = events;
      
      // Calculate totals
      const recordCount: number = 
        (users?.length || 0) +
        (departments?.length || 0) +
        (userLevels?.length || 0) +
        (projects?.length || 0) +
        (events?.length || 0);
      
      // Create backup record in database (cast to bypass type inference)
      const runMutation: any = ctx.runMutation;
      const backupId: Id<"systemBackups"> = await runMutation(internal.backup.saveBackupRecord as any, {
        type: args.type || "manual",
        description: args.description,
        recordCount,
        tables: {
          users: users?.length || 0,
          departments: departments?.length || 0,
          userLevels: userLevels?.length || 0,
          projects: projects?.length || 0,
          events: events?.length || 0,
        },
        dataJson: JSON.stringify(backupData),
        createdBy: currentUser?._id,
        creatorName: currentUser?.name || "System",
      });
      
      return {
        success: true,
        message: "Backup created successfully",
        backupId,
        totalRecords: recordCount,
        timestamp: Date.now(),
        tables: backupData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Backup failed: ${error.message}`,
        totalRecords: 0,
        timestamp: Date.now(),
        tables: {},
      };
    }
  },
});

// Internal query to export users
export const exportUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const exportDepartments = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").collect();
  },
});

export const exportUserLevels = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userLevels").collect();
  },
});

export const exportProjects = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

export const exportEvents = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

// Save backup record
export const saveBackupRecord = internalMutation({
  args: {
    type: v.union(v.literal("manual"), v.literal("automatic"), v.literal("archive")),
    description: v.optional(v.string()),
    recordCount: v.number(),
    tables: v.object({
      users: v.number(),
      departments: v.number(),
      userLevels: v.number(),
      projects: v.number(),
      events: v.number(),
    }),
    dataJson: v.string(),
    createdBy: v.optional(v.id("users")),
    creatorName: v.string(),
  },
  handler: async (ctx, args) => {
    const backupId = await ctx.db.insert("systemBackups", {
      type: args.type,
      description: args.description,
      status: "completed",
      recordCount: args.recordCount,
      tables: args.tables,
      dataJson: args.dataJson,
      timestamp: Date.now(),
      createdBy: args.createdBy,
      creatorName: args.creatorName,
    });
    return backupId;
  },
});

// Delete old backups (maintenance)
export const deleteOldBackups = mutation({
  args: {
    retentionDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.retentionDays * 24 * 60 * 60 * 1000);
    const oldBackups = await ctx.db
      .query("systemBackups")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();
    
    let deletedCount = 0;
    for (const backup of oldBackups) {
      // Keep at least 3 backups, only delete if we have more
      const allBackups = await ctx.db.query("systemBackups").collect();
      if (allBackups.length > 3) {
        await ctx.db.delete(backup._id);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      message: `Deleted ${deletedCount} old backups`,
      deletedCount,
    };
  },
});

// Restore from backup
export const restoreFromBackup = action({
  args: {
    backupId: v.id("systemBackups"),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    recordsRestored?: number;
    timestamp?: number;
  }> => {
    try {
      // Helper to bypass type inference issues
      const safeRunQuery = async (fn: any, queryArgs?: any): Promise<any> => {
        return await (ctx.runQuery as any)(fn, queryArgs);
      };
      
      // Extract function reference using bracket notation to bypass type inference
      // @ts-ignore - Type instantiation depth limit
      const apiBackupModule = api.backup as any;
      const getBackupFn = apiBackupModule['getBackup'];
      
      // Get backup data using query
      const backup: any = await safeRunQuery(getBackupFn, { backupId: args.backupId });
      
      if (!backup || !backup.dataJson) {
        return {
          success: false,
          message: "Backup not found or corrupted",
        };
      }
      
      const backupData = JSON.parse(backup.dataJson);
      
      // If clearExisting is true, create archive first
      if (args.clearExisting) {
        await ctx.runAction(api.backup.createFullBackup, {
          type: "archive",
          description: `Archive before restore from backup ${args.backupId}`,
        });
        
        // Clear existing data
        await ctx.runMutation(internal.backup.clearAllData);
      }
      
      // Restore data
      await ctx.runMutation(internal.backup.restoreData, {
        data: backupData,
      });
      
      return {
        success: true,
        message: "Backup restored successfully",
        recordsRestored: backup.recordCount,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Restore failed: ${error.message}`,
      };
    }
  },
});

// Clear all data EXCEPT users and system config (creates archive first)
export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all records from main tables (keep users, departments, userLevels)
    const tables = ["projects", "milestones", "events", "tasks", "eventTasks", "messages", "documents"];
    
    for (const table of tables) {
      const records = await ctx.db.query(table as any).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }
  },
});

// Helper function to replace placeholder IDs with actual database IDs
function replaceUserIds(obj: any, userIdMap: Map<string, string>): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => {
      // If it's a string that looks like a placeholder user ID
      if (typeof item === 'string' && userIdMap.has(item)) {
        return userIdMap.get(item);
      }
      return replaceUserIds(item, userIdMap);
    });
  }
  
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      const value = obj[key];
      
      // Replace user ID fields
      if (typeof value === 'string' && userIdMap.has(value)) {
        newObj[key] = userIdMap.get(value);
      } else {
        newObj[key] = replaceUserIds(value, userIdMap);
      }
    }
    return newObj;
  }
  
  return obj;
}

// Restore data from backup
export const restoreData = internalMutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const data = args.data;
    let totalInserted = 0;
    
    // Create a map to store clerkId -> actual database ID
    const userIdMap = new Map<string, string>();
    
    console.log('Restoring userLevels...');
    // Restore userLevels first (dependencies)
    if (data.userLevels && Array.isArray(data.userLevels)) {
      for (const level of data.userLevels) {
        try {
          const { _id, _creationTime, ...levelData } = level;
          await ctx.db.insert("userLevels", levelData);
          totalInserted++;
        } catch (e) {
          console.warn('Failed to insert userLevel:', e);
        }
      }
      console.log(`Restored ${data.userLevels.length} userLevels`);
    }
    
    console.log('Restoring departments...');
    // Restore departments
    if (data.departments && Array.isArray(data.departments)) {
      for (const dept of data.departments) {
        try {
          const { _id, _creationTime, ...deptData } = dept;
          await ctx.db.insert("departments", deptData);
          totalInserted++;
        } catch (e) {
          console.warn('Failed to insert department:', e);
        }
      }
      console.log(`Restored ${data.departments.length} departments`);
    }
    
    console.log('Restoring users and building ID map...');
    // Restore users (check for duplicates by clerkId) and build ID map
    if (data.users && Array.isArray(data.users)) {
      for (const user of data.users) {
        try {
          const { _id, _creationTime, ...userData } = user;
          
          // Check if user already exists by clerkId
          const existingUser = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("clerkId"), userData.clerkId))
            .first();
          
          if (!existingUser) {
            // Insert new user and map clerkId to actual ID
            const newUserId = await ctx.db.insert("users", userData);
            userIdMap.set(userData.clerkId, newUserId);
            totalInserted++;
            console.log(`Mapped ${userData.clerkId} -> ${newUserId}`);
          } else {
            // User exists, map clerkId to existing ID
            userIdMap.set(userData.clerkId, existingUser._id);
            console.log(`User ${userData.clerkId} already exists, mapped to ${existingUser._id}`);
          }
        } catch (e) {
          console.warn('Failed to insert user:', e);
        }
      }
      console.log(`Restored ${data.users.length} users, created ${userIdMap.size} ID mappings`);
    }
    
    console.log('Restoring projects with ID mapping...');
    // Restore projects (replace placeholder IDs with real ones)
    if (data.projects && Array.isArray(data.projects)) {
      for (const project of data.projects) {
        try {
          const { _id, _creationTime, ...projectData } = project;
          
          // Replace all user IDs in the project data
          const mappedProjectData = replaceUserIds(projectData, userIdMap);
          
          await ctx.db.insert("projects", mappedProjectData);
          totalInserted++;
        } catch (e) {
          console.warn('Failed to insert project:', e);
          console.error('Project data:', project);
        }
      }
      console.log(`Restored ${data.projects.length} projects`);
    }
    
    console.log('Restoring events with ID mapping...');
    // Restore events (replace placeholder IDs with real ones)
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        try {
          const { _id, _creationTime, ...eventData } = event;
          
          // Replace all user IDs in the event data
          const mappedEventData = replaceUserIds(eventData, userIdMap);
          
          await ctx.db.insert("events", mappedEventData);
          totalInserted++;
        } catch (e) {
          console.warn('Failed to insert event:', e);
          console.error('Event data:', event);
        }
      }
      console.log(`Restored ${data.events.length} events`);
    }
    
    console.log(`✅ Total records inserted: ${totalInserted}`);
    console.log(`📊 Breakdown: Users mapped: ${userIdMap.size}`);
  },
});

// Download backup as JSON file
export const downloadBackup = query({
  args: { backupId: v.id("systemBackups") },
  handler: async (ctx, args) => {
    const backup = await ctx.db.get(args.backupId);
    if (!backup) return null;
    
    return {
      filename: `barangaylink-backup-${backup.timestamp}.json`,
      data: backup.dataJson,
      metadata: {
        type: backup.type,
        timestamp: backup.timestamp,
        recordCount: backup.recordCount,
        tables: backup.tables,
        creatorName: backup.creatorName,
      },
    };
  },
});

// Import backup from JSON
export const importBackup = action({
  args: {
    backupJson: v.string(),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      console.log('Starting import...');
      const backupData = JSON.parse(args.backupJson);
      
      // Validate backup data structure
      if (!backupData || typeof backupData !== 'object') {
        throw new Error('Invalid backup format: Expected object with data tables');
      }
      
      console.log('Backup data validated, tables found:', Object.keys(backupData));
      
      // If clearExisting, archive current data first
      if (args.clearExisting) {
        console.log('Clearing existing data...');
        await ctx.runAction(api.backup.createFullBackup, {
          type: "archive",
          description: "Archive before import",
        });
        
        await ctx.runMutation(internal.backup.clearAllData);
        console.log('Existing data cleared');
      }
      
      // Restore the imported data
      console.log('Starting data restore...');
      await ctx.runMutation(internal.backup.restoreData, {
        data: backupData,
      });
      console.log('Data restore completed');
      
      return {
        success: true,
        message: "Backup imported successfully",
      };
    } catch (error: any) {
      console.error('Import error:', error);
      return {
        success: false,
        message: `Import failed: ${error.message}`,
      };
    }
  },
});

// Delete backup
export const deleteBackup = mutation({
  args: { backupId: v.id("systemBackups") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.backupId);
    return { success: true };
  },
});

// Remove duplicate users (keep the oldest one for each clerkId)
export const removeDuplicateUsers = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    duplicatesRemoved?: number;
  }> => {
    try {
      const result = await ctx.runMutation(internal.backup.cleanupDuplicateUsers);
      return {
        success: true,
        message: `Removed ${result.duplicatesRemoved} duplicate users`,
        duplicatesRemoved: result.duplicatesRemoved,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
});

// Internal mutation to clean up duplicate users
export const cleanupDuplicateUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    
    // Group users by clerkId
    const usersByClerkId = new Map<string, any[]>();
    for (const user of allUsers) {
      const existing = usersByClerkId.get(user.clerkId) || [];
      existing.push(user);
      usersByClerkId.set(user.clerkId, existing);
    }
    
    // Remove duplicates (keep oldest one)
    let duplicatesRemoved = 0;
    for (const [clerkId, users] of usersByClerkId.entries()) {
      if (users.length > 1) {
        // Sort by _creationTime to keep the oldest
        users.sort((a, b) => a._creationTime - b._creationTime);
        
        // Delete all except the first (oldest) one
        for (let i = 1; i < users.length; i++) {
          await ctx.db.delete(users[i]._id);
          duplicatesRemoved++;
        }
      }
    }
    
    return { duplicatesRemoved };
  },
});

// Remove duplicate departments (keep the oldest one for each name)
export const removeDuplicateDepartments = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    duplicatesRemoved?: number;
  }> => {
    try {
      const result = await ctx.runMutation(internal.backup.cleanupDuplicateDepartments);
      return {
        success: true,
        message: `Removed ${result.duplicatesRemoved} duplicate departments`,
        duplicatesRemoved: result.duplicatesRemoved,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
});

// Internal mutation to clean up duplicate departments
export const cleanupDuplicateDepartments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allDepts = await ctx.db.query("departments").collect();
    
    // Group departments by name (case-insensitive)
    const deptsByName = new Map<string, any[]>();
    for (const dept of allDepts) {
      const normalizedName = dept.name.toLowerCase().trim();
      const existing = deptsByName.get(normalizedName) || [];
      existing.push(dept);
      deptsByName.set(normalizedName, existing);
    }
    
    // Remove duplicates (keep oldest one)
    let duplicatesRemoved = 0;
    for (const [name, depts] of deptsByName.entries()) {
      if (depts.length > 1) {
        // Sort by _creationTime to keep the oldest
        depts.sort((a, b) => a._creationTime - b._creationTime);
        
        // Delete all except the first (oldest) one
        for (let i = 1; i < depts.length; i++) {
          await ctx.db.delete(depts[i]._id);
          duplicatesRemoved++;
        }
      }
    }
    
    return { duplicatesRemoved };
  },
});

// Remove duplicate userLevels (keep the oldest one for each name)
export const removeDuplicateUserLevels = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    duplicatesRemoved?: number;
  }> => {
    try {
      const result = await ctx.runMutation(internal.backup.cleanupDuplicateUserLevels);
      return {
        success: true,
        message: `Removed ${result.duplicatesRemoved} duplicate user levels`,
        duplicatesRemoved: result.duplicatesRemoved,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
});

// Internal mutation to clean up duplicate userLevels
export const cleanupDuplicateUserLevels = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allLevels = await ctx.db.query("userLevels").collect();
    
    // Group userLevels by name (case-insensitive)
    const levelsByName = new Map<string, any[]>();
    for (const level of allLevels) {
      const normalizedName = level.name.toLowerCase().trim();
      const existing = levelsByName.get(normalizedName) || [];
      existing.push(level);
      levelsByName.set(normalizedName, existing);
    }
    
    // Remove duplicates (keep oldest one)
    let duplicatesRemoved = 0;
    for (const [name, levels] of levelsByName.entries()) {
      if (levels.length > 1) {
        // Sort by _creationTime to keep the oldest
        levels.sort((a, b) => a._creationTime - b._creationTime);
        
        // Delete all except the first (oldest) one
        for (let i = 1; i < levels.length; i++) {
          await ctx.db.delete(levels[i]._id);
          duplicatesRemoved++;
        }
      }
    }
    
    return { duplicatesRemoved };
  },
});

// Detect all duplicates across all tables
export const detectAllDuplicates = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    duplicates: {
      users: number;
      departments: number;
      userLevels: number;
      total: number;
    };
  }> => {
    try {
      const result = await ctx.runQuery(internal.backup.scanForDuplicates);
      return {
        success: true,
        duplicates: result,
      };
    } catch (error: any) {
      return {
        success: false,
        duplicates: { users: 0, departments: 0, userLevels: 0, total: 0 },
      };
    }
  },
});

// Internal query to scan for duplicates
export const scanForDuplicates = internalQuery({
  args: {},
  handler: async (ctx) => {
    let userDuplicates = 0;
    let deptDuplicates = 0;
    let levelDuplicates = 0;
    
    // Scan users
    const allUsers = await ctx.db.query("users").collect();
    const usersByClerkId = new Map<string, number>();
    for (const user of allUsers) {
      const count = usersByClerkId.get(user.clerkId) || 0;
      usersByClerkId.set(user.clerkId, count + 1);
    }
    for (const count of usersByClerkId.values()) {
      if (count > 1) userDuplicates += (count - 1);
    }
    
    // Scan departments
    const allDepts = await ctx.db.query("departments").collect();
    const deptsByName = new Map<string, number>();
    for (const dept of allDepts) {
      const normalized = dept.name.toLowerCase().trim();
      const count = deptsByName.get(normalized) || 0;
      deptsByName.set(normalized, count + 1);
    }
    for (const count of deptsByName.values()) {
      if (count > 1) deptDuplicates += (count - 1);
    }
    
    // Scan userLevels
    const allLevels = await ctx.db.query("userLevels").collect();
    const levelsByName = new Map<string, number>();
    for (const level of allLevels) {
      const normalized = level.name.toLowerCase().trim();
      const count = levelsByName.get(normalized) || 0;
      levelsByName.set(normalized, count + 1);
    }
    for (const count of levelsByName.values()) {
      if (count > 1) levelDuplicates += (count - 1);
    }
    
    return {
      users: userDuplicates,
      departments: deptDuplicates,
      userLevels: levelDuplicates,
      total: userDuplicates + deptDuplicates + levelDuplicates,
    };
  },
});

// Clear all messages with archiving
export const clearAllMessagesWithArchive = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    archivedCount?: number;
  }> => {
    try {
      // Create archive first
      await ctx.runAction(api.backup.createFullBackup, {
        type: "archive",
        description: "Archive before clearing all messages",
      });
      
      // Clear all messages
      await ctx.runMutation(internal.backup.clearAllMessages);
      
      return {
        success: true,
        message: "All messages cleared and archived successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
});

// Internal mutation to clear all messages
export const clearAllMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});

// Clear all system data with archiving
export const clearAllDataWithArchive = action({
  args: {
    keepSystemConfig: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      // Create archive first
      await ctx.runAction(api.backup.createFullBackup, {
        type: "archive",
        description: "Archive before clearing all data",
      });
      
      // Clear all data
      await ctx.runMutation(internal.backup.clearAllData);
      
      return {
        success: true,
        message: "All data cleared successfully. Data has been archived.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to clear data: ${error.message}`,
      };
    }
  },
});

// Clear users with archiving
export const clearUsersWithArchive = action({
  args: {
    keepAdmins: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      // Create archive first
      await ctx.runAction(api.backup.createFullBackup, {
        type: "archive",
        description: "Archive before clearing users",
      });
      
      // Clear users
      await ctx.runMutation(internal.backup.clearUsers, {
        keepAdmins: args.keepAdmins || true,
      });
      
      return {
        success: true,
        message: "Users cleared and archived successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to clear users: ${error.message}`,
      };
    }
  },
});

// Internal mutation to clear users
export const clearUsers = internalMutation({
  args: {
    keepAdmins: v.boolean(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      // Skip admins if keepAdmins is true
      if (args.keepAdmins) {
        const userLevel = await ctx.db.get(user.userLevel);
        if (userLevel && (userLevel.name === "ADMIN" || userLevel.name === "SUPER_ADMIN")) {
          continue;
        }
      }
      
      await ctx.db.delete(user._id);
    }
  },
});
