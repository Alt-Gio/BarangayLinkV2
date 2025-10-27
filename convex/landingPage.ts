import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * LANDING PAGE MANAGEMENT
 * Functions to manage featured projects on the landing page
 */

// Get featured projects for landing page
export const getFeaturedProjects = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("isFeatured"), true))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .take(limit);

    // Sort by featured order
    const sorted = projects.sort((a, b) => (a.featuredOrder || 999) - (b.featuredOrder || 999));

    // Enrich with team members and task counts
    const enriched = await Promise.all(
      sorted.map(async (project) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .take(100);

        const completedTasks = tasks.filter((t) => t.status === "done").length;

        // Get team member details
        const teamMembers = await Promise.all(
          project.assignedTo.slice(0, 5).map((userId) => ctx.db.get(userId))
        );

        // Get image URL if storage ID exists
        let imageUrl: string | undefined = project.featuredImage;
        if (project.featuredImageStorageId) {
          const url = await ctx.storage.getUrl(project.featuredImageStorageId);
          imageUrl = url ?? undefined;
        }

        return {
          ...project,
          imageUrl,
          teamCount: project.assignedTo.length,
          teamMembers: teamMembers.filter(Boolean).map((m) => ({
            name: m!.name,
            imageUrl: m!.imageUrl,
          })),
          taskStats: {
            total: tasks.length,
            completed: completedTasks,
            completion: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
          },
        };
      })
    );

    return enriched;
  },
});

// Get all projects with featured status (for admin management)
export const getAllProjectsForFeatured = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get current user and check if admin
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can manage featured projects");
    }

    const projects = await ctx.db.query("projects").take(200);

    // Enrich with image URLs
    const enriched = await Promise.all(
      projects.map(async (project) => {
        let imageUrl: string | undefined = project.featuredImage;
        if (project.featuredImageStorageId) {
          const url = await ctx.storage.getUrl(project.featuredImageStorageId);
          imageUrl = url ?? undefined;
        }

        return {
          _id: project._id,
          title: project.title,
          description: project.description,
          status: project.status,
          department: project.department,
          budget: project.budget,
          progress: project.progress,
          isPublic: project.isPublic,
          isFeatured: project.isFeatured || false,
          featuredOrder: project.featuredOrder || null,
          imageUrl,
          featuredImageStorageId: project.featuredImageStorageId,
        };
      })
    );

    return enriched.sort((a, b) => {
      // Sort featured first, then by order
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      if (a.isFeatured && b.isFeatured) {
        return (a.featuredOrder || 999) - (b.featuredOrder || 999);
      }
      return 0;
    });
  },
});

// Toggle project featured status
export const toggleProjectFeatured = mutation({
  args: {
    projectId: v.id("projects"),
    isFeatured: v.boolean(),
    featuredOrder: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, isFeatured, featuredOrder }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin permissions
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can manage featured projects");
    }

    // Update project
    await ctx.db.patch(projectId, {
      isFeatured,
      featuredOrder: featuredOrder || undefined,
    });

    return { success: true };
  },
});

// Update project featured order
export const updateFeaturedOrder = mutation({
  args: {
    projectId: v.id("projects"),
    newOrder: v.number(),
  },
  handler: async (ctx, { projectId, newOrder }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin permissions
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can reorder featured projects");
    }

    await ctx.db.patch(projectId, {
      featuredOrder: newOrder,
    });

    return { success: true };
  },
});

// Generate upload URL for project image
export const generateProjectImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Set project featured image
export const setProjectFeaturedImage = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, { projectId, storageId, fileName, fileSize }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin permissions
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can manage project images");
    }

    // Get project details
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Get image URL
    const url = await ctx.storage.getUrl(storageId);
    const imageUrl: string | undefined = url ?? undefined;

    // Update project with image
    await ctx.db.patch(projectId, {
      featuredImageStorageId: storageId,
      featuredImage: imageUrl,
    });

    // ALSO SAVE TO DOCUMENT LIBRARY
    // Create a document entry so it shows in the document library
    await ctx.db.insert("documents", {
      fileName: fileName,
      originalName: fileName,
      fileSize: fileSize,
      mimeType: "image/jpeg", // or detect from file
      storageId: storageId,
      category: "Images",
      tags: ["landing-page", "featured-project", project.department.toLowerCase()],
      description: `Featured image for project: ${project.title}`,
      isPublic: true,
      accessLevel: "public",
      uploadedBy: user._id,
      projectId: projectId,
    });

    return { success: true, imageUrl };
  },
});

// Remove project featured image
export const removeProjectFeaturedImage = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin permissions
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.name !== "ADMIN") {
      throw new Error("Only admins can manage project images");
    }

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Delete from storage if exists
    if (project.featuredImageStorageId) {
      await ctx.storage.delete(project.featuredImageStorageId);
    }

    await ctx.db.patch(projectId, {
      featuredImageStorageId: undefined,
      featuredImage: undefined,
    });

    return { success: true };
  },
});
