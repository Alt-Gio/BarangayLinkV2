import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

// Get featured public projects for landing page
export const getFeaturedPublicProjects = query({
  args: {},
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.and(
        q.eq(q.field("isPublic"), true),
        q.eq(q.field("isFeatured"), true)
      ))
      .collect();
    
    // Sort by featured order, then by creation date
    return projects.sort((a, b) => {
      if (a.featuredOrder && b.featuredOrder) {
        return a.featuredOrder - b.featuredOrder;
      }
      return b._creationTime - a._creationTime;
    }).slice(0, 6);
  },
});

// Get all public projects with progress
export const getPublicProjects = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 12;
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.and(
        q.eq(q.field("isPublic"), true),
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "approved")
        )
      ))
      .order("desc")
      .take(limit);
    
    // Enrich with task counts and team details
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        
        return {
          ...project,
          taskStats: {
            completed: completedTasks,
            total: totalTasks,
          },
        };
      })
    );
    
    return enrichedProjects;
  },
});

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
      
      if (currentUser.userLevel.name === "ADMIN" || currentUser.userLevel.name === "CAPTAIN") {
        // ADMIN/CAPTAIN can see all projects
        return await ctx.db.query("projects").order("desc").take(100); // OPTIMIZED: Limit to 100 projects
      } else if (currentUser.userLevel.name === "MANAGER") {
        // MANAGER can see department projects + projects they're assigned to
        const allProjects = await ctx.db.query("projects").order("desc").take(200); // OPTIMIZED
        return allProjects.filter(project => 
          project.department === currentUser.department || 
          project.assignedTo.includes(currentUser._id)
        );
      } else {
        // BUILDER/WORKER can see assigned projects + created projects + public projects
        const allProjects = await ctx.db.query("projects").order("desc").take(200); // OPTIMIZED
        return allProjects.filter(project => 
          project.createdBy === currentUser._id ||
          project.assignedTo.includes(currentUser._id) ||
          project.isPublic === true
        );
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
    const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Only Manager+ can edit projects
    // Manager can edit projects in their department, Admin can edit all
    const canEdit = currentUser.userLevel.name === "ADMIN" ||
                   (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department);
                   
    if (!canEdit) throw new Error("Only Managers and Admins can edit projects");
    
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

// Get single project by ID
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project;
  },
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

// ============================================
// PAGINATED QUERIES (Performance Optimized)
// ============================================

import { createPaginatedResponse, getPaginationParams, paginationArgs } from "./pagination";

// Get paginated projects
export const getPaginatedProjects = query({
  args: {
    ...paginationArgs,
    status: v.optional(v.string()),
    department: v.optional(v.string()),
    priority: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { page, limit } = getPaginationParams(args.page, args.limit);
    
    try {
      const currentUser = await getCurrentUser(ctx);
      let projects = await ctx.db.query("projects").collect();
      
      // Role-based filtering
      if (currentUser.userLevel.name !== "ADMIN") {
        if (currentUser.userLevel.name === "MANAGER") {
          projects = projects.filter(p => p.department === currentUser.department);
        } else {
          projects = projects.filter(p => 
            p.createdBy === currentUser._id || 
            p.assignedTo.includes(currentUser._id) ||
            p.isPublic
          );
        }
      }
      
      // Apply filters
      if (args.status) {
        projects = projects.filter(p => p.status === args.status);
      }
      if (args.department) {
        projects = projects.filter(p => p.department === args.department);
      }
      if (args.priority) {
        projects = projects.filter(p => p.priority === args.priority);
      }
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        projects = projects.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort
      projects.sort((a, b) => b._creationTime - a._creationTime);
      if (args.sortOrder === "asc") {
        projects.reverse();
      }
      
      return createPaginatedResponse(projects, page, limit);
    } catch (error) {
      // If no user authenticated, return only public projects
      let projects = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();
        
      return createPaginatedResponse(projects, page, limit);
    }
  },
});

// ============================================
// ENHANCED PROJECT MANAGEMENT (from projectsEnhanced.ts)
// ============================================

// Create a new project with all details (enhanced version)
export const createProject = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    urgency: v.union(v.literal("normal"), v.literal("urgent"), v.literal("emergency")),
    budget: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.optional(v.string()),
    coordinates: v.optional(v.object({ latitude: v.number(), longitude: v.number() })),
    department: v.string(),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
    publicVisibility: v.union(v.literal("public"), v.literal("internal"), v.literal("private")),
    projectLevel: v.number(),
    impactArea: v.array(v.string()),
    estimatedBeneficiaries: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.string())), // Team members
    successCriteria: v.array(v.object({
      criterion: v.string(),
      targetValue: v.optional(v.string()),
    })),
    milestones: v.optional(v.array(v.object({
      title: v.string(),
      description: v.string(),
      dueDate: v.number(),
      order: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    
    const durationDays = Math.ceil((args.endDate - args.startDate) / (1000 * 60 * 60 * 24));
    const totalExperienceReward = args.projectLevel * 100 + durationDays * 10;
    const liveblocksRoom = `project-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      status: "draft",
      priority: args.priority,
      urgency: args.urgency,
      budget: args.budget,
      spent: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      coordinates: args.coordinates,
      createdBy: currentUser._id,
      assignedTo: args.assignedTo && args.assignedTo.length > 0 
        ? args.assignedTo.map(id => id as any) 
        : [currentUser._id], // Use provided team or default to creator
      department: args.department,
      tags: args.tags,
      attachments: [],
      progress: 0,
      liveblocksRoom,
      isPublic: args.isPublic,
      approvalStatus: currentUser.userLevel.name === "BUILDER" ? "pending" : "approved",
      successCriteria: args.successCriteria.map(sc => ({ ...sc, achieved: false })),
      milestones: args.milestones ? args.milestones.map(m => ({
        id: `milestone-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ...m,
        completed: false,
      })) : [],
      totalExperienceReward,
      projectLevel: args.projectLevel,
      impactArea: args.impactArea,
      estimatedBeneficiaries: args.estimatedBeneficiaries,
      publicVisibility: args.publicVisibility,
      statusHistory: [{
        status: "draft",
        changedBy: currentUser._id,
        changedAt: Date.now(),
        notes: "Project created",
      }],
    });

    if (currentUser.userLevel.name === "BUILDER") {
      const managers = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("department"), args.department))
        .collect();
      
      for (const manager of managers) {
        const managerLevel = await ctx.db.get(manager.userLevel);
        if (managerLevel && (managerLevel.name === "MANAGER" || managerLevel.name === "ADMIN")) {
          await ctx.db.insert("notifications", {
            userId: manager._id,
            title: "New Project Awaiting Approval",
            message: `${currentUser.name} created "${args.title}" - requires your approval`,
            type: "info",
            category: "project_approval",
            isRead: false,
            createdAt: Date.now(),
            metadata: {
              priority: args.priority,
              category: "project_approval",
              relatedId: String(projectId),
              data: { projectId, projectTitle: args.title, creatorName: currentUser.name },
            },
          });
        }
      }
    }

    return projectId;
  },
});

// Review project (approve/reject/request revision)
export const reviewProject = mutation({
  args: {
    projectId: v.id("projects"),
    action: v.union(v.literal("approve"), v.literal("reject"), v.literal("request_revision")),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    const canReview = currentUser.userLevel.name === "ADMIN" ||
      (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department);
    
    if (!canReview) {
      throw new Error("You don't have permission to review this project");
    }

    const newStatus = 
      args.action === "approve" ? "approved" :
      args.action === "reject" ? "rejected" : "revision_requested";

    await ctx.db.patch(args.projectId, {
      approvalStatus: newStatus,
      status: args.action === "approve" ? "approved" : project.status,
      statusHistory: [
        ...(project.statusHistory || []),
        {
          status: newStatus,
          changedBy: currentUser._id,
          changedAt: Date.now(),
          notes: args.feedback || `Project ${args.action}`,
        },
      ],
    });

    const creator = await ctx.db.get(project.createdBy);
    if (creator) {
      await ctx.db.insert("notifications", {
        userId: creator._id,
        title: `Project ${args.action === "approve" ? "Approved" : args.action === "reject" ? "Rejected" : "Needs Revision"}`,
        message: args.feedback || `Your project "${project.title}" has been ${args.action}`,
        type: args.action === "approve" ? "success" : "warning",
        category: "project_status",
        isRead: false,
        createdAt: Date.now(),
        metadata: {
          priority: project.priority,
          category: "project_status",
          relatedId: String(args.projectId),
          data: { projectId: args.projectId, projectTitle: project.title, action: args.action, feedback: args.feedback },
        },
      });
    }

    return args.projectId;
  },
});

// Start an approved project
export const startProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    if (project.approvalStatus !== "approved") {
      throw new Error("Project must be approved before starting");
    }

    await ctx.db.patch(args.projectId, {
      status: "active",
      statusHistory: [
        ...(project.statusHistory || []),
        {
          status: "active",
          changedBy: currentUser._id,
          changedAt: Date.now(),
          notes: "Project started",
        },
      ],
    });

    return args.projectId;
  },
});

// Update project (comprehensive update)
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
      urgency: v.optional(v.union(v.literal("normal"), v.literal("urgent"), v.literal("emergency"))),
      budget: v.optional(v.number()),
      spent: v.optional(v.number()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      location: v.optional(v.string()),
      coordinates: v.optional(v.object({ latitude: v.number(), longitude: v.number() })),
      tags: v.optional(v.array(v.string())),
      impactArea: v.optional(v.array(v.string())),
      estimatedBeneficiaries: v.optional(v.number()),
      publicVisibility: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("private"))),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Only Manager+ can edit projects
    const canEdit = 
      currentUser.userLevel.name === "ADMIN" ||
      (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department);
    
    if (!canEdit) throw new Error("Only Managers and Admins can edit projects");

    const now = Date.now();
    await ctx.db.patch(args.projectId, args.updates);
    
    // Notify team members of significant changes
    const hasSignificantChange = args.updates.priority || args.updates.urgency || args.updates.endDate || args.updates.budget;
    
    if (hasSignificantChange && project.assignedTo && project.assignedTo.length > 0) {
      let changeDescription = [];
      if (args.updates.priority) changeDescription.push(`priority changed to ${args.updates.priority}`);
      if (args.updates.urgency) changeDescription.push(`urgency changed to ${args.updates.urgency}`);
      if (args.updates.endDate) changeDescription.push(`deadline updated`);
      if (args.updates.budget) changeDescription.push(`budget updated`);
      
      for (const userId of project.assignedTo) {
        if (userId !== currentUser._id) {
          await ctx.db.insert("notifications", {
            userId,
            title: "Project Updated",
            message: `"${project.title}" was updated: ${changeDescription.join(', ')}`,
            type: args.updates.urgency === "emergency" || args.updates.priority === "critical" ? "warning" : "info",
            category: "project_updated",
            relatedId: args.projectId,
            relatedType: "project",
            isRead: false,
            createdAt: now,
            actionUrl: `/projects/${args.projectId}`,
            metadata: {
              priority: args.updates.urgency === "emergency" ? "urgent" : args.updates.priority === "critical" ? "urgent" : args.updates.priority === "high" ? "high" : "medium",
              category: "project_updated",
              relatedId: args.projectId,
              data: {
                projectId: args.projectId,
                projectTitle: project.title,
                updatedBy: currentUser.name,
                updatedById: currentUser._id,
                changes: args.updates,
              }
            }
          });
        }
      }
    }
    
    return args.projectId;
  },
});

// Complete a milestone
export const completeMilestone = mutation({
  args: {
    projectId: v.id("projects"),
    milestoneId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    const now = Date.now();
    const milestone = project.milestones.find((m: any) => m.id === args.milestoneId);
    
    const updatedMilestones = project.milestones.map((m: any) =>
      m.id === args.milestoneId ? { ...m, completed: true, completedAt: now, completedBy: currentUser._id } : m
    );

    await ctx.db.patch(args.projectId, { milestones: updatedMilestones });
    
    // Notify all team members of milestone completion
    if (project.assignedTo && project.assignedTo.length > 0) {
      for (const userId of project.assignedTo) {
        await ctx.db.insert("notifications", {
          userId,
          title: "Milestone Completed! 🎉",
          message: `${currentUser.name} completed milestone "${milestone?.title || 'Milestone'}" in project "${project.title}"`,
          type: "success",
          category: "project_milestone",
          relatedId: args.projectId,
          relatedType: "project",
          isRead: false,
          createdAt: now,
          actionUrl: `/projects/${args.projectId}`,
          metadata: {
            priority: "high",
            category: "project_milestone",
            relatedId: args.projectId,
            data: {
              projectId: args.projectId,
              projectTitle: project.title,
              milestoneId: args.milestoneId,
              milestoneTitle: milestone?.title,
              completedBy: currentUser.name,
              completedById: currentUser._id,
            }
          }
        });
      }
    }
    
    return args.projectId;
  },
});

// Complete entire project
export const completeProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");

    const now = Date.now();
    
    await ctx.db.patch(args.projectId, {
      status: "completed",
      progress: 100,
      statusHistory: [
        ...(project.statusHistory || []),
        {
          status: "completed",
          changedBy: currentUser._id,
          changedAt: now,
          notes: "Project completed",
        },
      ],
    });

    // Notify all team members of project completion
    if (project.assignedTo && project.assignedTo.length > 0) {
      for (const userId of project.assignedTo) {
        await ctx.db.insert("notifications", {
          userId,
          title: "Project Completed! 🎊",
          message: `Project "${project.title}" has been completed by ${currentUser.name}!`,
          type: "success",
          category: "project_completed",
          relatedId: args.projectId,
          relatedType: "project",
          isRead: false,
          createdAt: now,
          actionUrl: `/projects/${args.projectId}`,
          metadata: {
            priority: "high",
            category: "project_completed",
            relatedId: args.projectId,
            data: {
              projectId: args.projectId,
              projectTitle: project.title,
              completedBy: currentUser.name,
              completedById: currentUser._id,
            }
          }
        });
      }
    }

    return args.projectId;
  },
});

// Get project with full details
export const getProjectDetails = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const teamMembers = await Promise.all(
      project.assignedTo.map((userId: any) => ctx.db.get(userId))
    );

    const creator = await ctx.db.get(project.createdBy);

    return {
      ...project,
      teamMembers: teamMembers.filter(Boolean),
      creator,
    };
  },
});

// Get projects by status
export const getProjectsByStatus = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    )),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    let projects = await ctx.db.query("projects").collect();
    
    if (args.status) {
      projects = projects.filter((p) => p.status === args.status);
    }
    
    if (currentUser.userLevel.name !== "ADMIN") {
      if (currentUser.userLevel.name === "MANAGER") {
        projects = projects.filter((p) => p.department === currentUser.department);
      } else {
        projects = projects.filter((p) =>
          p.createdBy === currentUser._id ||
          p.assignedTo.includes(currentUser._id) ||
          p.isPublic
        );
      }
    }
    
    return projects.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Get pending approvals for managers
export const getPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await checkPermission(ctx, ["MANAGER", "ADMIN"]);
    
    let projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("approvalStatus"), "pending"))
      .collect();
    
    if (currentUser.userLevel.name === "MANAGER") {
      projects = projects.filter((p) => p.department === currentUser.department);
    }
    
    return projects;
  },
});
