import { internalMutation } from "./_generated/server";

export const migrateProjectsToNewSchema = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all projects
    const projects = await ctx.db.query("projects").collect();
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const project of projects) {
      try {
        // Prepare the update object with new required fields
        const updates: any = {};
        
        // Fix status: "planning" -> "draft"
        if ((project as any).status === "planning") {
          updates.status = "draft";
        }
        
        // Add missing required fields if they don't exist
        if (!(project as any).urgency) {
          updates.urgency = "normal";
        }
        
        if (!(project as any).approvalStatus) {
          // Set based on current status
          const currentStatus = updates.status || (project as any).status;
          if (currentStatus === "draft") {
            updates.approvalStatus = "pending";
          } else {
            updates.approvalStatus = "approved";
          }
        }
        
        if (!(project as any).successCriteria) {
          updates.successCriteria = [];
        }
        
        if (!(project as any).milestones) {
          updates.milestones = [];
        }
        
        if (!(project as any).totalExperienceReward) {
          // Calculate based on duration
          const duration = ((project as any).endDate - (project as any).startDate) / (1000 * 60 * 60 * 24);
          updates.totalExperienceReward = Math.round(duration * 10);
        }
        
        if (!(project as any).projectLevel) {
          updates.projectLevel = 3; // Default medium difficulty
        }
        
        if (!(project as any).impactArea) {
          updates.impactArea = [];
        }
        
        if (!(project as any).publicVisibility) {
          updates.publicVisibility = (project as any).isPublic ? "public" : "internal";
        }
        
        if (!(project as any).statusHistory) {
          updates.statusHistory = [{
            status: updates.status || (project as any).status,
            changedBy: (project as any).createdBy,
            changedAt: (project as any)._creationTime,
          }];
        }
        
        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          await ctx.db.patch(project._id, updates);
          migratedCount++;
        }
      } catch (error) {
        console.error(`Error migrating project ${project._id}:`, error);
        errorCount++;
      }
    }
    
    return {
      totalProjects: projects.length,
      migrated: migratedCount,
      errors: errorCount,
      message: `Migration complete: ${migratedCount} projects updated, ${errorCount} errors`
    };
  },
});
