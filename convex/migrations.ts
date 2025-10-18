import { mutation } from "./_generated/server";

// Migration: Add status field to all existing users
export const addStatusToExistingUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of allUsers) {
      // Check if user already has status field
      if (!(user as any).status) {
        // Add status field - default to "active" for existing users
        await ctx.db.patch(user._id, {
          status: "active" as const,
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
    
    return {
      success: true,
      message: `Migration complete: ${updatedCount} users updated, ${skippedCount} users already had status`,
      updatedCount,
      skippedCount,
      totalUsers: allUsers.length,
    };
  },
});
