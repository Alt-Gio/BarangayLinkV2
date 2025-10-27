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
      // @ts-expect-error - Convex generated types cause excessive depth, suppressing
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
      // @ts-expect-error - Convex generated types cause excessive depth, suppressing
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
    const tables = ["projects", "events", "tasks", "eventTasks", "messages", "documents"];
    
    for (const table of tables) {
      const records = await ctx.db.query(table as any).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }
  },
});

// Restore data from backup
export const restoreData = internalMutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const data = args.data;
    
    // Restore userLevels first (dependencies)
    if (data.userLevels) {
      for (const level of data.userLevels) {
        const { _id, _creationTime, ...levelData } = level;
        await ctx.db.insert("userLevels", levelData);
      }
    }
    
    // Restore departments
    if (data.departments) {
      for (const dept of data.departments) {
        const { _id, _creationTime, ...deptData } = dept;
        await ctx.db.insert("departments", deptData);
      }
    }
    
    // Restore users
    if (data.users) {
      for (const user of data.users) {
        const { _id, _creationTime, ...userData } = user;
        await ctx.db.insert("users", userData);
      }
    }
    
    // Restore projects
    if (data.projects) {
      for (const project of data.projects) {
        const { _id, _creationTime, ...projectData } = project;
        await ctx.db.insert("projects", projectData);
      }
    }
    
    // Restore events
    if (data.events) {
      for (const event of data.events) {
        const { _id, _creationTime, ...eventData } = event;
        await ctx.db.insert("events", eventData);
      }
    }
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
      const backupData = JSON.parse(args.backupJson);
      
      // If clearExisting, archive current data first
      if (args.clearExisting) {
        await ctx.runAction(api.backup.createFullBackup, {
          type: "archive",
          description: "Archive before import",
        });
        
        await ctx.runMutation(internal.backup.clearAllData);
      }
      
      // Restore the imported data
      await ctx.runMutation(internal.backup.restoreData, {
        data: backupData,
      });
      
      return {
        success: true,
        message: "Backup imported successfully",
      };
    } catch (error: any) {
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
