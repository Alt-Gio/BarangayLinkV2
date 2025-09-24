import { mutation } from "./_generated/server";

// Initialize the database with required data
export const initializeDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already initialized
    const existingLevels = await ctx.db.query("userLevels").collect();
    if (existingLevels.length > 0) {
      return { success: true, message: "Database already initialized" };
    }

    // Create user levels
    const userLevels = [
      {
        name: "WORKER",
        level: 1,
        permissions: ["view_projects", "view_tasks", "update_own_tasks"],
        description: "Basic access to view and update assigned tasks",
        isActive: true,
      },
      {
        name: "BUILDER",
        level: 2,
        permissions: [
          "view_projects", 
          "view_tasks", 
          "create_tasks", 
          "update_tasks", 
          "delete_own_tasks"
        ],
        description: "Can create and manage tasks within projects",
        isActive: true,
      },
      {
        name: "MANAGER",
        level: 3,
        permissions: [
          "view_projects",
          "create_projects",
          "update_projects",
          "delete_projects",
          "view_tasks",
          "create_tasks",
          "update_tasks",
          "delete_tasks",
          "manage_team",
          "view_analytics"
        ],
        description: "Can manage projects, tasks, and team members",
        isActive: true,
      },
      {
        name: "ADMIN",
        level: 4,
        permissions: [
          "full_access",
          "manage_users",
          "manage_system",
          "view_all_data",
          "export_data",
          "system_settings"
        ],
        description: "Full system access and user management",
        isActive: true,
      },
    ];

    // Insert user levels
    for (const level of userLevels) {
      await ctx.db.insert("userLevels", level);
    }

    return { 
      success: true, 
      message: "Database initialized successfully",
      levelsCreated: userLevels.length 
    };
  },
});
