import { internalMutation } from "../_generated/server";

// Migration: Convert assignedTo from single ID to array
export const migrateTasksAssignedTo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const task of tasks) {
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
    }
    
    return {
      total: tasks.length,
      migrated: migratedCount,
      skipped: skippedCount,
      message: `Migration complete! ${migratedCount} tasks updated, ${skippedCount} already in array format.`
    };
  },
});
