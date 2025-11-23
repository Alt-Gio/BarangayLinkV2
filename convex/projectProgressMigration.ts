import { internalMutation } from "./_generated/server";

/**
 * MIGRATION: Sync all projects' progress based on their tasks
 * Run this once to update all existing projects
 */
export const syncAllProjectsProgress = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔄 Starting project progress migration...");
    
    // Get all projects
    const projects = await ctx.db.query("projects").collect();
    console.log(`📊 Found ${projects.length} projects to sync`);
    
    let updated = 0;
    let failed = 0;
    
    for (const project of projects) {
      try {
        // Get all tasks for this project
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        if (tasks.length === 0) {
          // No tasks, set progress to 0
          await ctx.db.patch(project._id, { progress: 0 });
          console.log(`✅ ${project.title}: 0% (no tasks)`);
          updated++;
          continue;
        }
        
        // Count completed tasks (status === 'done' or 'completed' or completed === true)
        const completedTasks = tasks.filter(
          (t) => t.status === "done" || t.status === "completed" || t.completed === true
        ).length;
        
        // Calculate progress percentage
        const progress = Math.round((completedTasks / tasks.length) * 100);
        
        // Update project progress field
        await ctx.db.patch(project._id, { progress });
        
        console.log(`✅ ${project.title}: ${progress}% (${completedTasks}/${tasks.length} tasks)`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to sync ${project.title}:`, error);
        failed++;
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Updated: ${updated} projects`);
    console.log(`❌ Failed: ${failed} projects`);
    
    return { 
      success: true, 
      updated, 
      failed,
      total: projects.length 
    };
  },
});
