import { mutation } from "./_generated/server";
import { v } from "convex/values";

// MIGRATION: Convert assignedTo from single ID to array
// Run this once from Convex Dashboard to fix schema validation errors
export const migrateTasksToArrayAssignedTo = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errors = 0;
    
    for (const task of tasks) {
      try {
        // Check if assignedTo is already an array
        if (Array.isArray(task.assignedTo)) {
          skippedCount++;
          continue;
        }
        
        // Convert single ID to array
        const assignedToArray = task.assignedTo ? [task.assignedTo as any] : [];
        
        await ctx.db.patch(task._id, {
          assignedTo: assignedToArray,
        });
        
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating task ${task._id}:`, error);
        errors++;
      }
    }
    
    const result = {
      total: tasks.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errors,
      message: `✅ Migration complete! ${migratedCount} tasks updated, ${skippedCount} already in array format, ${errors} errors.`
    };
    
    console.log(result);
    return result;
  },
});

// Helper to check migration status
export const checkMigrationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    
    let arrayFormat = 0;
    let stringFormat = 0;
    let emptyFormat = 0;
    
    for (const task of tasks) {
      if (Array.isArray(task.assignedTo)) {
        arrayFormat++;
      } else if (task.assignedTo) {
        stringFormat++;
      } else {
        emptyFormat++;
      }
    }
    
    return {
      total: tasks.length,
      arrayFormat,
      stringFormat,
      emptyFormat,
      needsMigration: stringFormat > 0,
      message: stringFormat > 0 
        ? `⚠️ ${stringFormat} tasks need migration!`
        : `✅ All tasks are in correct format!`
    };
  },
});
