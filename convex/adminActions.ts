import { mutation } from "./_generated/server";

/**
 * ADMIN ONLY: Manually trigger project progress sync for all projects
 * This should be run once after deploying the progress sync feature
 */
export const syncAllProjectsProgressAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if admin
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can run this action");
    }

    // Trigger the migration
    await ctx.scheduler.runAfter(0, "projectProgressMigration:syncAllProjectsProgress" as any, {});

    return { 
      success: true, 
      message: "Progress sync started for all projects. Check console for progress." 
    };
  },
});
