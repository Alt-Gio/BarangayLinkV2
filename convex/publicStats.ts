import { query } from "./_generated/server";
import { getCurrentUser } from "./roleBasedAccess";

// Public stats for landing page (no authentication required)
export const getPublicStats = query({
  args: {},
  handler: async (ctx, args) => {
    try {
      // Get public data only
      const [publicProjects, publicEvents] = await Promise.all([
        ctx.db.query("projects")
          .filter((q) => q.eq(q.field("isPublic"), true))
          .collect(),
        ctx.db.query("events")
          .filter((q) => q.eq(q.field("isPublic"), true))
          .collect()
      ]);

      const activeProjects = publicProjects.filter(p => p.status === "active");
      const upcomingEvents = publicEvents.filter(e => e.startDate > Date.now());

      return {
        systemOverview: {
          totalUsers: 0, // Don't expose user count publicly
          activeUsers: 0,
          totalProjects: publicProjects.length,
          activeProjects: activeProjects.length,
          totalTasks: 0, // Don't expose task count publicly
          completedTasks: 0,
          totalBudget: publicProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
          totalSpent: 0
        },
        recentActivity: upcomingEvents.slice(0, 5).map(event => ({
          type: 'event',
          title: event.title,
          description: event.description,
          timestamp: event.startDate
        }))
      };
    } catch (error) {
      console.error("Error getting public stats:", error);
      return {
        systemOverview: {
          totalUsers: 0,
          activeUsers: 0,
          totalProjects: 0,
          activeProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalBudget: 0,
          totalSpent: 0
        },
        recentActivity: []
      };
    }
  },
});

// Enhanced stats for authenticated users (no admin required)
export const getUserStats = query({
  args: {},
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      
      // Get user-specific data
      const [allProjects, allEvents, userTasks] = await Promise.all([
        ctx.db.query("projects").collect(),
        ctx.db.query("events").collect(),
        ctx.db.query("tasks")
          .filter((q) => q.eq(q.field("assignedTo"), currentUser._id))
          .collect()
      ]);

      // Filter projects based on user role
      let visibleProjects = allProjects;
      if (currentUser.userLevel.name === "MANAGER") {
        visibleProjects = allProjects.filter(p => p.department === currentUser.department);
      } else if (currentUser.userLevel.name === "BUILDER" || currentUser.userLevel.name === "WORKER") {
        visibleProjects = allProjects.filter(p => 
          p.createdBy === currentUser._id || 
          p.assignedTo?.includes(currentUser._id) ||
          p.isPublic
        );
      }

      const activeProjects = visibleProjects.filter(p => p.status === "active");
      const upcomingEvents = allEvents.filter(e => e.startDate > Date.now());
      const completedTasks = userTasks.filter(t => t.status === "completed");

      return {
        systemOverview: {
          totalUsers: currentUser.userLevel.name === "ADMIN" ? await ctx.db.query("users").collect().then(users => users.length) : 0,
          activeUsers: 0,
          totalProjects: visibleProjects.length,
          activeProjects: activeProjects.length,
          totalTasks: userTasks.length,
          completedTasks: completedTasks.length,
          totalBudget: visibleProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
          totalSpent: visibleProjects.reduce((sum, p) => sum + (p.spent || 0), 0)
        },
        recentActivity: upcomingEvents.slice(0, 5).map(event => ({
          type: 'event',
          title: event.title,
          description: event.description,
          timestamp: event.startDate
        })),
        userInfo: {
          name: currentUser.name,
          role: currentUser.userLevel.name,
          department: currentUser.department
        }
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      // Fallback to public stats if user not authenticated
      return {
        systemOverview: {
          totalUsers: 0,
          activeUsers: 0,
          totalProjects: 0,
          activeProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalBudget: 0,
          totalSpent: 0
        },
        recentActivity: []
      };
    }
  },
});
