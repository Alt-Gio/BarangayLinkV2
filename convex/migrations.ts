import { mutation, internalMutation } from "./_generated/server";

/**
 * Migration: Add role field to all existing users based on their userLevel
 * SECURITY: Assigns roles based on userLevel hierarchy, not position
 * Runs automatically on deployment
 */
export const addRoleToExistingUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    
    let updatedCount = 0;
    let skippedCount = 0;
    const roleAssignments: Record<string, number> = {
      admin: 0,
      captain: 0,
      manager: 0,
      builder: 0,
      worker: 0,
    };
    
    for (const user of allUsers) {
      // Check if user already has role field
      if (!(user as any).role) {
        // Get user's level from userLevels table
        const userLevelId = (user as any).userLevel;
        const userLevel = await ctx.db.get(userLevelId) as any;
        
        if (!userLevel || !userLevel.name) {
          console.error(`User ${user._id} has invalid userLevel reference`);
          continue;
        }
        
        // Map userLevel name to role (SECURITY-BASED MAPPING)
        let role: "admin" | "captain" | "manager" | "builder" | "worker" = "worker";
        const levelName = (userLevel.name as string).toUpperCase();
        
        if (levelName === "ADMIN" || levelName === "ADMINISTRATOR") {
          role = "admin";
        } else if (levelName === "CAPTAIN" || levelName === "LEAD") {
          role = "captain";
        } else if (levelName === "MANAGER" || levelName === "SUPERVISOR") {
          role = "manager";
        } else if (levelName === "BUILDER" || levelName === "DEVELOPER" || levelName === "ENGINEER") {
          role = "builder";
        } else if (levelName === "WORKER" || levelName === "MEMBER" || levelName === "USER") {
          role = "worker";
        } else {
          // Fallback: check userLevel.level (security hierarchy)
          const levelNum = userLevel.level;
          if (levelNum >= 5) {
            role = "admin";
          } else if (levelNum >= 4) {
            role = "captain";
          } else if (levelNum >= 3) {
            role = "manager";
          } else if (levelNum >= 2) {
            role = "builder";
          } else {
            role = "worker";
          }
        }
        
        await ctx.db.patch(user._id, {
          role: role as any,
        });
        
        updatedCount++;
        roleAssignments[role]++;
      } else {
        skippedCount++;
      }
    }
    
    return {
      success: true,
      message: `SECURITY FIX COMPLETE: ${updatedCount} users assigned roles based on userLevel hierarchy`,
      updatedCount,
      skippedCount,
      totalUsers: allUsers.length,
      roleDistribution: roleAssignments,
    };
  },
});

/**
 * AUTOMATIC SECURITY FIX: Runs on every deployment
 * Ensures all users have roles assigned based on userLevel
 */
export const autoFixMissingRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    
    let fixedCount = 0;
    
    for (const user of allUsers) {
      if (!(user as any).role) {
        const userLevelId = (user as any).userLevel;
        const userLevel = await ctx.db.get(userLevelId) as any;
        
        if (!userLevel || !userLevel.name) continue;
        
        let role: "admin" | "captain" | "manager" | "builder" | "worker" = "worker";
        const levelName = (userLevel.name as string).toUpperCase();
        const levelNum = userLevel.level as number;
        
        // Security-based role assignment
        if (levelName.includes("ADMIN")) {
          role = "admin";
        } else if (levelName.includes("CAPTAIN") || levelName.includes("LEAD")) {
          role = "captain";
        } else if (levelName.includes("MANAGER") || levelName.includes("SUPERVISOR")) {
          role = "manager";
        } else if (levelName.includes("BUILDER") || levelName.includes("DEVELOPER")) {
          role = "builder";
        } else if (levelNum >= 5) {
          role = "admin";
        } else if (levelNum >= 4) {
          role = "captain";
        } else if (levelNum >= 3) {
          role = "manager";
        } else if (levelNum >= 2) {
          role = "builder";
        } else {
          role = "worker";
        }
        
        await ctx.db.patch(user._id, { role: role as any });
        fixedCount++;
      }
    }
    
    return { fixed: fixedCount, total: allUsers.length };
  },
});

/**
 * Migration: Calculate and populate user statistics
 * Run once to fill totalTasksCompleted, projectSuccessRate, totalHoursLogged
 */
export const populateUserStatistics = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    let updatedCount = 0;
    const statsReport: any = {
      totalUsers: allUsers.length,
      usersWithTasks: 0,
      usersWithProjects: 0,
      usersWithHours: 0,
    };

    for (const user of allUsers) {
      try {
        // 1. Calculate tasks completed
        const allTasks = await ctx.db.query("tasks").collect();
        const completedTasks = allTasks.filter((t: any) => 
          t.completed && 
          (t.assignedTo?.includes(user._id) || t.createdBy === user._id)
        );

        // 2. Calculate project success rate
        const allProjects = await ctx.db.query("projects").collect();
        const userProjects = allProjects.filter((p: any) => 
          p.assignedTo?.includes(user._id) || p.createdBy === user._id
        );
        const completedProjects = userProjects.filter((p: any) => p.status === "completed");
        const successRate = userProjects.length > 0 
          ? (completedProjects.length / userProjects.length) * 100 
          : 0;

        // 3. Calculate hours from sessions
        const allSessions = await ctx.db.query("userSessions").collect();
        const userSessions = allSessions.filter((s: any) => s.userId === user._id);
        
        let totalHours = 0;
        for (const session of userSessions) {
          if ((session as any).logoutTime) {
            const hours = ((session as any).logoutTime - (session as any).loginTime) / (1000 * 60 * 60);
            totalHours += hours;
          }
        }

        // Update user stats
        await ctx.db.patch(user._id, {
          totalTasksCompleted: completedTasks.length,
          projectSuccessRate: Math.round(successRate),
          totalHoursLogged: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        });

        // Track stats
        if (completedTasks.length > 0) statsReport.usersWithTasks++;
        if (userProjects.length > 0) statsReport.usersWithProjects++;
        if (totalHours > 0) statsReport.usersWithHours++;

        updatedCount++;
      } catch (error) {
        console.error(`Failed to update stats for user ${user._id}:`, error);
      }
    }

    return {
      success: true,
      message: `Statistics populated for ${updatedCount} users`,
      updatedCount,
      ...statsReport,
    };
  },
});

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
