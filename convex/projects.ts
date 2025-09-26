import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

// Get active projects for public display
export const getActiveProjects = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .filter((q) => q.and(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("isPublic"), true)
      ))
      .order("desc")
      .take(20);
  },
});

// Get all projects with role-based filtering
export const getAllProjects = query({
  args: {},
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      
      if (currentUser.userLevel.name === "ADMIN") {
        // ADMIN can see all projects
        return await ctx.db.query("projects").order("desc").collect();
      } else if (currentUser.userLevel.name === "MANAGER") {
        // MANAGER can see department projects
        return await ctx.db
          .query("projects")
          .filter((q) => q.eq(q.field("department"), currentUser.department))
          .order("desc")
          .collect();
      } else {
        // BUILDER/WORKER can see assigned projects only
        return await ctx.db
          .query("projects")
          .filter((q) => q.or(
            q.eq(q.field("createdBy"), currentUser._id),
            // Check if user is in assignedTo array
            // Note: This is a simplified check - in production you'd want a more robust solution
            q.eq(q.field("isPublic"), true)
          ))
          .order("desc")
          .collect();
      }
    } catch (error) {
      // If no user is authenticated, return only public projects
      return await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .order("desc")
        .take(10);
    }
  },
});

// Enhanced project update mutation
export const updateProjectDetails = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    budget: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.id("users"))),
    department: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    location: v.optional(v.string()),
    isPublic: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Role-based edit permissions
    const canEdit = currentUser.userLevel.name === "ADMIN" ||
                   (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                   (currentUser.userLevel.name === "BUILDER" && project.createdBy === currentUser._id);
                   
    if (!canEdit) throw new Error("Permission denied");
    
    const updateData: any = {};
    Object.keys(args).forEach(key => {
      if (key !== 'projectId' && args[key as keyof typeof args] !== undefined) {
        updateData[key] = args[key as keyof typeof args];
      }
    });
    
    await ctx.db.patch(args.projectId, updateData);
    return args.projectId;
  }
});

// Get project team members with full details
export const getProjectTeamMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];
    
    const teamMembers = await Promise.all(
      (project.assignedTo || []).map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;
        const userLevel = await ctx.db.get(user.userLevel);
        return { ...user, userLevel };
      })
    );
    
    return teamMembers.filter(Boolean);
  }
});

// Search available users for project assignment
export const searchAvailableUsers = query({
  args: { 
    department: v.string(),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("users")
      .filter((q) => q.eq(q.field("department"), args.department));
    
    const users = await query.collect();
    
    // Get users with their levels
    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        return { ...user, userLevel };
      })
    );
    
    // Filter by search term if provided
    let filteredUsers = usersWithLevels.filter(user => user.userLevel !== null);
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(term) ||
        (user.position && user.position.toLowerCase().includes(term)) ||
        user.userLevel!.name.toLowerCase().includes(term)
      );
    }
    
    // Sort: WORKER first, then others
    filteredUsers.sort((a, b) => {
      if (a.userLevel!.name === "WORKER" && b.userLevel!.name !== "WORKER") return -1;
      if (a.userLevel!.name !== "WORKER" && b.userLevel!.name === "WORKER") return 1;
      return a.name.localeCompare(b.name);
    });
    
    return filteredUsers.slice(0, args.limit || 20);
  }
});

// Assign user to project with enhanced permissions
export const assignUserToProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    const canAssign = currentUser.userLevel.name === "ADMIN" ||
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     (currentUser.userLevel.name === "BUILDER" && project.createdBy === currentUser._id);
                     
    if (!canAssign) throw new Error("Permission denied");
    
    const currentAssignees = project.assignedTo || [];
    if (!currentAssignees.includes(args.userId)) {
      await ctx.db.patch(args.projectId, {
        assignedTo: [...currentAssignees, args.userId]
      });
    }
    
    return args.projectId;
  }
});

// Remove user from project team
export const removeUserFromProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    const canRemove = currentUser.userLevel.name === "ADMIN" ||
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     (currentUser.userLevel.name === "BUILDER" && project.createdBy === currentUser._id);
                     
    if (!canRemove) throw new Error("Permission denied");
    
    const currentAssignees = project.assignedTo || [];
    await ctx.db.patch(args.projectId, {
      assignedTo: currentAssignees.filter(id => id !== args.userId)
    });
    
    return args.projectId;
  }
});

// Legacy add team member (now using assignUserToProject instead)
export const addTeamMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check permissions
    const canManage = currentUser.userLevel.name === "ADMIN" || 
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     (project.createdBy === currentUser._id);
    
    if (!canManage) throw new Error("Not authorized to manage this project");
    
    // Add user if not already in the team
    if (!project.assignedTo.includes(args.userId)) {
      await ctx.db.patch(args.projectId, {
        assignedTo: [...project.assignedTo, args.userId]
      });
    }
    
    return args.projectId;
  },
});

// Remove team member from project
export const removeTeamMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check permissions
    const canManage = currentUser.userLevel.name === "ADMIN" || 
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     (project.createdBy === currentUser._id);
    
    if (!canManage) throw new Error("Not authorized to manage this project");
    
    // Remove user from team
    await ctx.db.patch(args.projectId, {
      assignedTo: project.assignedTo.filter(id => id !== args.userId)
    });
    
    return args.projectId;
  },
});

// Approve or reject project (for MANAGER/ADMIN)
export const approveProject = mutation({
  args: {
    projectId: v.id("projects"),
    approved: v.boolean(),
    comments: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Only MANAGER of same department or ADMIN can approve
    const canApprove = currentUser.userLevel.name === "ADMIN" ||
                      (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department);
    
    if (!canApprove) throw new Error("Permission denied");
    
    await ctx.db.patch(args.projectId, {
      status: args.approved ? "active" : "cancelled"
    });
    
    return args.projectId;
  }
});

// Delete project
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects")
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check permissions - only ADMIN, project owner, or MANAGER of same department
    const canDelete = currentUser.userLevel.name === "ADMIN" || 
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     (project.createdBy === currentUser._id);
    
    if (!canDelete) throw new Error("Not authorized to delete this project");
    
    // Delete all associated tasks first
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();
      
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    
    // Delete the project
    await ctx.db.delete(args.projectId);
    
    return args.projectId;
  },
});

// Archive project
export const archiveProject = mutation({
  args: {
    projectId: v.id("projects")
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check permissions
    const canArchive = currentUser.userLevel.name === "ADMIN" || 
                      (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                      (project.createdBy === currentUser._id);
    
    if (!canArchive) throw new Error("Not authorized to archive this project");
    
    await ctx.db.patch(args.projectId, {
      status: "completed"
    });
    
    return args.projectId;
  },
});
