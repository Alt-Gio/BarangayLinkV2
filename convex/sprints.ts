import { v } from "convex/values";
import { query } from "./_generated/server";

// Helper function to get all sprints (internal)
async function getAllSprintsInternal(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return [];

  // Get all project-type events (treated as sprints)
  const allEvents = await ctx.db.query("events").collect();
  
  // Filter for project events and milestones
  const sprints = allEvents.filter(
    (e: any) => e.type === "project" || e.type === "milestone"
  );

  // Enrich with task data and progress
  const enrichedSprints = await Promise.all(
    sprints.map(async (sprint: any) => {
      // Get organizer details
      const organizer = await ctx.db.get(sprint.organizer);
      
      // Get project details if linked
      let projectName = null;
      let projectTasks: any[] = [];
      
      if (sprint.projectId) {
        const project = await ctx.db.get(sprint.projectId);
        projectName = project?.title || null;
        
        // Get tasks for this project
        const allTasks = await ctx.db.query("tasks").collect();
        projectTasks = allTasks.filter(
          (t: any) => t.projectId === sprint.projectId
        );
      }

      // Calculate progress based on actual tasks
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (t: any) => t.status === "completed"
      ).length;
      const percentage =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate velocity (points per day)
      const durationMs = sprint.endDate - sprint.startDate;
      const durationDays = Math.max(1, durationMs / (1000 * 60 * 60 * 24));
      const velocity = Math.round(completedTasks / durationDays);

      // Determine health status
      const now = Date.now();
      const timeElapsed = now - sprint.startDate;
      const totalDuration = sprint.endDate - sprint.startDate;
      const timeProgress = (timeElapsed / totalDuration) * 100;

      let health: "on-track" | "at-risk" | "behind" = "on-track";
      if (percentage < timeProgress - 20) {
        health = "behind";
      } else if (percentage < timeProgress) {
        health = "at-risk";
      }

      return {
        ...sprint,
        organizerDetails: organizer
          ? {
              _id: organizer._id,
              name: organizer.name,
              imageUrl: organizer.imageUrl,
            }
          : null,
        projectName,
        progress: {
          total: totalTasks,
          completed: completedTasks,
          percentage: Math.round(percentage),
        },
        velocity,
        health,
        attendeeCount: sprint.attendees.length,
      };
    })
  );

  // Sort by start date (newest first for active, oldest for upcoming)
  return enrichedSprints.sort((a: any, b: any) => b.startDate - a.startDate);
}

// Get active sprints
export const getActiveSprints = query({
  args: {},
  handler: async (ctx) => {
    const allSprints = await getAllSprintsInternal(ctx);
    const now = Date.now();
    
    return allSprints.filter(
      (s: any) => s.startDate <= now && s.endDate >= now && s.status === "published"
    );
  },
});

// Get upcoming sprints
export const getUpcomingSprints = query({
  args: {},
  handler: async (ctx) => {
    const allSprints = await getAllSprintsInternal(ctx);
    const now = Date.now();
    
    return allSprints.filter(
      (s: any) => s.startDate > now && s.status === "published"
    );
  },
});

// Get completed sprints
export const getCompletedSprints = query({
  args: {},
  handler: async (ctx) => {
    const allSprints = await getAllSprintsInternal(ctx);
    const now = Date.now();
    
    return allSprints.filter(
      (s: any) => s.endDate < now || s.status === "archived"
    );
  },
});

// Get sprint statistics
export const getSprintStats = query({
  args: {},
  handler: async (ctx) => {
    const allSprints = await getAllSprintsInternal(ctx);
    const now = Date.now();
    
    const active = allSprints.filter(
      (s: any) => s.startDate <= now && s.endDate >= now && s.status === "published"
    );
    const upcoming = allSprints.filter((s: any) => s.startDate > now && s.status === "published");
    const completed = allSprints.filter((s: any) => s.endDate < now || s.status === "archived");
    const milestones = allSprints.filter((s: any) => s.type === "milestone");
    
    return {
      active: active.length,
      upcoming: upcoming.length,
      completed: completed.length,
      milestones: milestones.length,
    };
  },
});
