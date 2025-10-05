import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// BACKUP FUNCTIONS
// ============================================

// Create a full backup of all data
export const createFullBackup = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user is admin
    const user = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.runQuery(internal.users.getUserLevel, {
      levelId: user.userLevel,
    });
    
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can create backups");
    }

    const timestamp = Date.now();
    const backupData: any = {};

    // Backup all tables
    const tables = [
      "users",
      "userLevels",
      "departments",
      "projects",
      "tasks",
      "events",
      "documents",
      "chatRooms",
      "messages",
      "notifications",
      "searchHistory",
    ];

    for (const table of tables) {
      try {
        const data = await ctx.runQuery(internal.backup.getTableData, { table });
        backupData[table] = data;
      } catch (error) {
        console.error(`Error backing up ${table}:`, error);
      }
    }

    // Save backup metadata
    const backupId = await ctx.runMutation(internal.backup.saveBackupMetadata, {
      timestamp,
      createdBy: user._id,
      tables: Object.keys(backupData),
      recordCount: Object.values(backupData).reduce(
        (sum: number, records: any) => sum + records.length,
        0
      ),
    });

    return {
      backupId,
      timestamp,
      tables: Object.keys(backupData),
      totalRecords: Object.values(backupData).reduce(
        (sum: number, records: any) => sum + records.length,
        0
      ),
      data: backupData,
    };
  },
});

// Get table data for backup
export const getTableData = query({
  args: { table: v.string() },
  handler: async (ctx, { table }) => {
    // @ts-ignore - Dynamic table access
    const data = await ctx.db.query(table).collect();
    return data;
  },
});

// Save backup metadata
export const saveBackupMetadata = mutation({
  args: {
    timestamp: v.number(),
    createdBy: v.id("users"),
    tables: v.array(v.string()),
    recordCount: v.number(),
  },
  handler: async (ctx, args) => {
    const backupId = await ctx.db.insert("backups", {
      timestamp: args.timestamp,
      createdBy: args.createdBy,
      tables: args.tables,
      recordCount: args.recordCount,
      status: "completed",
      type: "full",
    });
    return backupId;
  },
});

// Get all backups
export const getAllBackups = query({
  args: {},
  handler: async (ctx) => {
    const backups = await ctx.db
      .query("backups")
      .order("desc")
      .take(50);

    // Enrich with creator info
    const enrichedBackups = await Promise.all(
      backups.map(async (backup) => {
        const creator = await ctx.db.get(backup.createdBy);
        return {
          ...backup,
          creatorName: creator?.name || "Unknown",
        };
      })
    );

    return enrichedBackups;
  },
});

// Delete old backups (keep last N)
export const cleanupOldBackups = mutation({
  args: { keepCount: v.number() },
  handler: async (ctx, { keepCount }) => {
    const backups = await ctx.db
      .query("backups")
      .order("desc")
      .collect();

    const toDelete = backups.slice(keepCount);
    
    for (const backup of toDelete) {
      await ctx.db.delete(backup._id);
    }

    return { deleted: toDelete.length };
  },
});

// ============================================
// EXPORT FUNCTIONS
// ============================================

// Export specific table to JSON
export const exportTable = query({
  args: { 
    table: v.string(),
    format: v.optional(v.union(v.literal("json"), v.literal("csv"))),
  },
  handler: async (ctx, { table, format = "json" }) => {
    // @ts-ignore
    const data = await ctx.db.query(table).collect();

    if (format === "csv") {
      // Convert to CSV format
      if (data.length === 0) return "";
      
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) =>
          headers.map((header) => JSON.stringify(row[header] || "")).join(",")
        ),
      ];
      return csvRows.join("\n");
    }

    return JSON.stringify(data, null, 2);
  },
});

// Export users with filters
export const exportUsers = query({
  args: {
    department: v.optional(v.string()),
    userLevelName: v.optional(v.string()),
  },
  handler: async (ctx, { department, userLevelName }) => {
    let users = await ctx.db.query("users").collect();

    if (department) {
      users = users.filter((u) => u.department === department);
    }

    if (userLevelName) {
      // Filter by user level name
      const filteredUsers = [];
      for (const user of users) {
        const level = await ctx.db.get(user.userLevel);
        if (level && level.name === userLevelName) {
          filteredUsers.push(user);
        }
      }
      users = filteredUsers;
    }

    return users;
  },
});

// ============================================
// RESTORE FUNCTIONS
// ============================================

// Restore from backup (DANGEROUS - Admin only)
export const restoreFromBackup = action({
  args: {
    backupId: v.id("backups"),
    tables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { backupId, tables }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.runQuery(internal.users.getUserLevel, {
      levelId: user.userLevel,
    });
    
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can restore backups");
    }

    // This is a placeholder - actual restore would need the backup data
    // In production, you'd store backups in Convex file storage or external storage
    
    return {
      success: true,
      message: "Restore functionality requires backup data storage implementation",
    };
  },
});

// ============================================
// DATA MIGRATION
// ============================================

// Migrate data between environments
export const migrateData = action({
  args: {
    sourceData: v.any(),
    targetTables: v.array(v.string()),
    mode: v.union(v.literal("merge"), v.literal("replace")),
  },
  handler: async (ctx, { sourceData, targetTables, mode }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.runQuery(internal.users.getUserLevel, {
      levelId: user.userLevel,
    });
    
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can migrate data");
    }

    const results: any = {};

    for (const table of targetTables) {
      if (!sourceData[table]) continue;

      try {
        if (mode === "replace") {
          // Delete existing data
          await ctx.runMutation(internal.backup.clearTable, { table });
        }

        // Insert new data
        const inserted = await ctx.runMutation(internal.backup.bulkInsert, {
          table,
          records: sourceData[table],
        });

        results[table] = { inserted, mode };
      } catch (error: any) {
        results[table] = { error: error.message };
      }
    }

    return results;
  },
});

// Clear table (DANGEROUS)
export const clearTable = mutation({
  args: { table: v.string() },
  handler: async (ctx, { table }) => {
    // @ts-ignore
    const records = await ctx.db.query(table).collect();
    
    for (const record of records) {
      await ctx.db.delete(record._id);
    }

    return { deleted: records.length };
  },
});

// Bulk insert records
export const bulkInsert = mutation({
  args: {
    table: v.string(),
    records: v.array(v.any()),
  },
  handler: async (ctx, { table, records }) => {
    const inserted = [];

    for (const record of records) {
      try {
        // Remove _id and _creationTime as they'll be auto-generated
        const { _id, _creationTime, ...data } = record;
        // @ts-ignore
        const id = await ctx.db.insert(table, data);
        inserted.push(id);
      } catch (error) {
        console.error(`Error inserting record:`, error);
      }
    }

    return inserted.length;
  },
});

// ============================================
// AUTOMATED BACKUP SCHEDULING
// ============================================

// Schedule backup configuration
export const getBackupSchedule = query({
  args: {},
  handler: async (ctx) => {
    const schedule = await ctx.db
      .query("backupSchedules")
      .order("desc")
      .first();

    return schedule || {
      frequency: "daily",
      time: "00:00",
      enabled: true,
      retentionDays: 30,
    };
  },
});

export const updateBackupSchedule = mutation({
  args: {
    frequency: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    time: v.string(),
    enabled: v.boolean(),
    retentionDays: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can update backup schedule");
    }

    // Delete old schedule
    const oldSchedule = await ctx.db
      .query("backupSchedules")
      .order("desc")
      .first();

    if (oldSchedule) {
      await ctx.db.delete(oldSchedule._id);
    }

    // Create new schedule
    const scheduleId = await ctx.db.insert("backupSchedules", {
      ...args,
      updatedBy: user._id,
      updatedAt: Date.now(),
    });

    return scheduleId;
  },
});

// Helper to declare internal functions
const internal = {
  users: {
    getUserByClerkId: null as any,
    getUserLevel: null as any,
  },
  backup: {
    getTableData: null as any,
    saveBackupMetadata: null as any,
    clearTable: null as any,
    bulkInsert: null as any,
  },
};
