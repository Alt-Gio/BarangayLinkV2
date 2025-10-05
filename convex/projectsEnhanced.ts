import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";
import { Id } from "./_generated/dataModel";

// Create a new project with all details
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
    department: v.string(),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
    publicVisibility: v.union(v.literal("public"), v.literal("internal"), v.literal("private")),
    projectLevel: v.number(), // 1-10 difficulty
    impactArea: v.array(v.string()),
    estimatedBeneficiaries: v.optional(v.number()),
    successCriteria: v.array(v.object({
      criterion: v.string(),
      targetValue: v.optional(v.string()),
    })),
    milestones: v.array(v.object({
      title: v.string(),
      description: v.string(),
      dueDate: v.number(),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    
    // Calculate XP reward based on project level and duration
    const durationDays = Math.ceil((args.endDate - args.startDate) / (1000 * 60 * 60 * 24));
    const totalExperienceReward = args.projectLevel * 100 + durationDays * 10;

    // Generate unique liveblocks room ID
    const liveblocksRoom = `project-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      status: "draft", // Initial status
      priority: args.priority,
      urgency: args.urgency,
      budget: args.budget,
      spent: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      createdBy: currentUser._id,
      assignedTo: [currentUser._id], // Creator is automatically assigned
      department: args.department,
      tags: args.tags,
      attachments: [],
      progress: 0,
      liveblocksRoom,
      isPublic: args.isPublic,
      
      // Approval workflow - starts as pending for BUILDER, approved for MANAGER/ADMIN
      approvalStatus: currentUser.userLevel.name === "BUILDER" ? "pending" : "approved",
      
      // Success criteria with achieved flags
      successCriteria: args.successCriteria.map(sc => ({
        ...sc,
        achieved: false,
      })),
      
      // Milestones with completion tracking
      milestones: args.milestones.map(m => ({
        id: `milestone-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ...m,
        completed: false,
      })),
      
      // Gamification
      totalExperienceReward,
      projectLevel: args.projectLevel,
      
      // Impact and visibility
      impactArea: args.impactArea,
      estimatedBeneficiaries: args.estimatedBeneficiaries,
      publicVisibility: args.publicVisibility,
      
      // History tracking
      statusHistory: [{
        status: "draft",
        changedBy: currentUser._id,
        changedAt: Date.now(),
        notes: "Project created",
      }],
    });

    // Create notification for department managers if pending approval
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
              data: {
                projectId,
                projectTitle: args.title,
                creatorName: currentUser.name,
              },
            },
          });
        }
      }
    }

    return projectId;
  },
});

// Approve or reject project with feedback
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
    
    // Check if user can approve this project
    const canReview = currentUser.userLevel.name === "ADMIN" ||
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department);
    
    if (!canReview) throw new Error("You cannot review projects outside your department");
    
    let newStatus = project.status;
    let approvalStatus = project.approvalStatus;
    
    if (args.action === "approve") {
      approvalStatus = "approved";
      newStatus = "approved"; // Ready to start
    } else if (args.action === "reject") {
      approvalStatus = "rejected";
      newStatus = "cancelled";
    } else {
      approvalStatus = "revision_requested";
    }
    
    await ctx.db.patch(args.projectId, {
      approvalStatus,
      status: newStatus,
      approvedBy: args.action === "approve" ? currentUser._id : undefined,
      approvedAt: args.action === "approve" ? Date.now() : undefined,
      rejectionReason: args.action === "reject" ? args.feedback : undefined,
      revisionNotes: args.action === "request_revision" ? args.feedback : undefined,
      statusHistory: [
        ...project.statusHistory,
        {
          status: newStatus,
          changedBy: currentUser._id,
          changedAt: Date.now(),
          notes: args.feedback || `Project ${args.action}d`,
        },
      ],
    });

    // Notify project creator
    const creator = await ctx.db.get(project.createdBy);
    if (creator) {
      await ctx.db.insert("notifications", {
        userId: project.createdBy,
        title: `Project ${args.action === "approve" ? "Approved" : args.action === "reject" ? "Rejected" : "Needs Revision"}`,
        message: `Your project "${project.title}" has been ${args.action}d by ${currentUser.name}${args.feedback ? `: ${args.feedback}` : ""}`,
        type: args.action === "approve" ? "success" : "warning",
        category: "project_approval",
        isRead: false,
        createdAt: Date.now(),
        metadata: {
          priority: project.priority,
          category: "project_approval",
          relatedId: String(args.projectId),
          data: {
            projectId: args.projectId,
            projectTitle: project.title,
            reviewerName: currentUser.name,
            action: args.action,
          },
        },
      });
    }

    return args.projectId;
  },
});

// Start an approved project
export const startProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    if (project.approvalStatus !== "approved") {
      throw new Error("Project must be approved before starting");
    }
    
    // Check permission
    const canStart = currentUser.userLevel.name === "ADMIN" ||
                    (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                    project.createdBy === currentUser._id ||
                    project.assignedTo.includes(currentUser._id);
    
    if (!canStart) throw new Error("You cannot start this project");
    
    await ctx.db.patch(args.projectId, {
      status: "active",
      actualStartDate: Date.now(),
      statusHistory: [
        ...project.statusHistory,
        {
          status: "active",
          changedBy: currentUser._id,
          changedAt: Date.now(),
          notes: "Project started",
        },
      ],
    });

    // Notify all assigned team members
    for (const userId of project.assignedTo) {
      if (userId !== currentUser._id) {
        await ctx.db.insert("notifications", {
          userId,
          title: "Project Started!",
          message: `${project.title} has been started by ${currentUser.name}`,
          type: "info",
          category: "project",
          isRead: false,
          createdAt: Date.now(),
          metadata: {
            priority: project.priority,
            category: "project",
            relatedId: String(args.projectId),
            data: {
              projectId: args.projectId,
              projectTitle: project.title,
            },
          },
        });
      }
    }

    return args.projectId;
  },
});

// Update project progress (auto-calculated from tasks, but can be manual)
export const updateProjectProgress = mutation({
  args: {
    projectId: v.id("projects"),
    progress: v.optional(v.number()), // 0-100, optional (auto-calc if not provided)
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    let progress = args.progress;
    
    // Auto-calculate from tasks if not provided
    if (progress === undefined) {
      const tasks = await ctx.db
        .query("tasks")
        .filter((q) => q.eq(q.field("projectId"), args.projectId))
        .collect();
      
      if (tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.status === "completed").length;
        progress = Math.round((completedTasks / tasks.length) * 100);
      } else {
        progress = 0;
      }
    }
    
    await ctx.db.patch(args.projectId, { progress });
    
    // Check if all milestones are completed -> mark project as near completion
    const completedMilestones = project.milestones.filter(m => m.completed).length;
    if (completedMilestones === project.milestones.length && project.milestones.length > 0) {
      await ctx.db.patch(args.projectId, {
        statusHistory: [
          ...project.statusHistory,
          {
            status: project.status,
            changedBy: currentUser._id,
            changedAt: Date.now(),
            notes: "All milestones completed!",
          },
        ],
      });
    }
    
    return progress;
  },
});

// Update project details
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("draft"),
        v.literal("pending_approval"),
        v.literal("approved"),
        v.literal("active"),
        v.literal("on_hold"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("archived")
      )),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
      urgency: v.optional(v.union(v.literal("normal"), v.literal("urgent"), v.literal("emergency"))),
      budget: v.optional(v.number()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      location: v.optional(v.string()),
      estimatedBeneficiaries: v.optional(v.number()),
      impactArea: v.optional(v.array(v.string())),
      successCriteria: v.optional(v.array(v.object({
        criterion: v.string(),
        targetValue: v.optional(v.string()),
        achieved: v.optional(v.boolean()),
      }))),
      milestones: v.optional(v.array(v.object({
        id: v.optional(v.string()),
        title: v.string(),
        description: v.string(),
        dueDate: v.number(),
        order: v.optional(v.number()),
        completed: v.optional(v.boolean()),
      }))),
      tags: v.optional(v.array(v.string())),
      publicVisibility: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("private"))),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check if user can update this project
    const canUpdate = currentUser.userLevel.name === "ADMIN" ||
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     project.createdBy === currentUser._id ||
                     project.assignedTo.includes(currentUser._id);
    
    if (!canUpdate) throw new Error("You cannot update this project");
    
    // Prepare the update object, only including fields that were provided
    const updateData: any = {};
    
    Object.keys(args.updates).forEach((key) => {
      const value = (args.updates as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
    // Add status history if status changed
    if (args.updates.status && args.updates.status !== project.status) {
      updateData.statusHistory = [
        ...project.statusHistory,
        {
          status: args.updates.status,
          changedBy: currentUser._id,
          changedAt: Date.now(),
          notes: "Project updated",
        },
      ];
    }
    
    await ctx.db.patch(args.projectId, updateData);
    
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
    
    const updatedMilestones = project.milestones.map(m =>
      m.id === args.milestoneId
        ? { ...m, completed: true, completedAt: Date.now() }
        : m
    );
    
    await ctx.db.patch(args.projectId, {
      milestones: updatedMilestones,
    });

    // Notify team about milestone completion
    const milestone = project.milestones.find(m => m.id === args.milestoneId);
    if (milestone) {
      for (const userId of project.assignedTo) {
        if (userId !== currentUser._id) {
          await ctx.db.insert("notifications", {
            userId,
            title: "Milestone Completed! 🎉",
            message: `"${milestone.title}" has been completed in ${project.title}`,
            type: "success",
            category: "project",
            isRead: false,
            createdAt: Date.now(),
            metadata: {
              priority: "medium",
              category: "project_milestone",
              relatedId: String(args.projectId),
              data: {
                projectId: args.projectId,
                projectTitle: project.title,
                milestoneTitle: milestone.title,
              },
            },
          });
        }
      }
    }

    // Reward XP for milestone completion
    const xpReward = Math.floor(project.totalExperienceReward / project.milestones.length);
    return { success: true, xpReward };
  },
});

// Complete entire project
export const completeProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check if user can complete this project
    const canComplete = currentUser.userLevel.name === "ADMIN" ||
                       (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                       project.createdBy === currentUser._id;
    
    if (!canComplete) throw new Error("You cannot complete this project");
    
    await ctx.db.patch(args.projectId, {
      status: "completed",
      actualEndDate: Date.now(),
      progress: 100,
      statusHistory: [
        ...project.statusHistory,
        {
          status: "completed",
          changedBy: currentUser._id,
          changedAt: Date.now(),
          notes: "Project completed successfully",
        },
      ],
    });

    // Distribute XP rewards to all team members
    for (const userId of project.assignedTo) {
      const user = await ctx.db.get(userId);
      if (user) {
        const xpReward = project.totalExperienceReward;
        const newExperience = user.experience + xpReward;
        const newLevel = Math.floor(newExperience / 1000) + 1;
        
        await ctx.db.patch(userId, {
          experience: newExperience,
          level: newLevel,
        });

        // Notify about completion and XP
        await ctx.db.insert("notifications", {
          userId,
          title: "Project Completed! 🎊",
          message: `${project.title} is complete! You earned ${xpReward} XP!`,
          type: "success",
          category: "project_completion",
          isRead: false,
          createdAt: Date.now(),
          metadata: {
            priority: "high",
            category: "project_completion",
            relatedId: String(args.projectId),
            data: {
              projectId: args.projectId,
              projectTitle: project.title,
              xpReward,
              newLevel,
            },
          },
        });
      }
    }

    return args.projectId;
  },
});

// Get project with full details including team, tasks, events
export const getProjectDetails = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    
    // Get creator details
    const creator = await ctx.db.get(project.createdBy);
    const creatorLevel = creator ? await ctx.db.get(creator.userLevel) : null;
    
    // Get team members
    const teamMembers = await Promise.all(
      project.assignedTo.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;
        const userLevel = await ctx.db.get(user.userLevel);
        return { ...user, userLevel };
      })
    );
    
    // Get tasks
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();
    
    // Get project events
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("type"), "project"))
      .collect();
    
    const projectEvents = events.filter(e => {
      // Check if event description or attachments reference this project
      return e.description.includes(project.title) || e.description.includes(String(args.projectId));
    });
    
    // Get approver details if approved
    let approver = null;
    if (project.approvedBy) {
      approver = await ctx.db.get(project.approvedBy);
    }
    
    return {
      ...project,
      creator: creator ? { ...creator, userLevel: creatorLevel } : null,
      teamMembers: teamMembers.filter(Boolean),
      tasks,
      events: projectEvents,
      approver,
      stats: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === "completed").length,
        inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
        totalMilestones: project.milestones.length,
        completedMilestones: project.milestones.filter(m => m.completed).length,
        daysRemaining: Math.ceil((project.endDate - Date.now()) / (1000 * 60 * 60 * 24)),
        budgetUsed: (project.spent / project.budget) * 100,
      },
    };
  },
});

// Get projects filtered by status for dashboard
export const getProjectsByStatus = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("archived")
    )),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      
      let query = ctx.db.query("projects");
      
      // Filter by status
      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }
      
      let projects = await query.order("desc").collect();
      
      // Role-based filtering
      if (currentUser.userLevel.name === "WORKER" || currentUser.userLevel.name === "BUILDER") {
        projects = projects.filter(p =>
          p.assignedTo.includes(currentUser._id) ||
          p.createdBy === currentUser._id ||
          (p.isPublic && p.publicVisibility === "public")
        );
      } else if (currentUser.userLevel.name === "MANAGER") {
        if (args.department) {
          projects = projects.filter(p => p.department === args.department);
        } else {
          projects = projects.filter(p => p.department === currentUser.department);
        }
      }
      // ADMIN sees all
      
      return projects;
    } catch (error) {
      // Return only public projects if not authenticated
      let query = ctx.db.query("projects")
        .filter((q) => q.and(
          q.eq(q.field("isPublic"), true),
          q.eq(q.field("publicVisibility"), "public")
        ));
      
      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }
      
      return await query.order("desc").take(20);
    }
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
      .order("desc")
      .collect();
    
    // Managers only see their department
    if (currentUser.userLevel.name === "MANAGER") {
      projects = projects.filter(p => p.department === currentUser.department);
    }
    
    // Enrich with creator details
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const creator = await ctx.db.get(project.createdBy);
        const creatorLevel = creator ? await ctx.db.get(creator.userLevel) : null;
        return {
          ...project,
          creator: creator ? { ...creator, userLevel: creatorLevel } : null,
        };
      })
    );
    
    return enrichedProjects;
  },
});
