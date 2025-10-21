import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit public feedback (no authentication required)
export const submitPublicFeedback = mutation({
  args: {
    projectId: v.id("projects"),
    submitterName: v.string(),
    submitterEmail: v.optional(v.string()),
    submitterPhone: v.optional(v.string()),
    feedbackType: v.union(
      v.literal("comment"),
      v.literal("suggestion"),
      v.literal("concern"),
      v.literal("appreciation")
    ),
    rating: v.optional(v.number()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.submitterName.trim()) {
      throw new Error("Name is required");
    }
    
    if (!args.message.trim() || args.message.length < 10) {
      throw new Error("Please provide a meaningful feedback message (at least 10 characters)");
    }

    if (args.message.length > 1000) {
      throw new Error("Feedback message is too long (maximum 1000 characters)");
    }

    if (args.rating && (args.rating < 1 || args.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if project exists and is public
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (!project.isPublic) {
      throw new Error("Feedback can only be submitted for public projects");
    }

    // Create feedback (pending moderation)
    const feedbackId = await ctx.db.insert("projectFeedback", {
      projectId: args.projectId,
      submitterName: args.submitterName.trim(),
      submitterEmail: args.submitterEmail?.trim(),
      submitterPhone: args.submitterPhone?.trim(),
      feedbackType: args.feedbackType,
      rating: args.rating,
      message: args.message.trim(),
      status: "pending", // Requires moderation
      isPublic: false, // Hidden until approved
      submittedAt: Date.now(),
    });

    return {
      success: true,
      feedbackId,
      message: "Thank you! Your feedback has been submitted and will be reviewed by administrators.",
    };
  },
});

// Get approved feedback for a project (public)
export const getProjectFeedback = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const feedback = await ctx.db
      .query("projectFeedback")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "approved")
      )
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(limit);

    return feedback;
  },
});

// Get feedback count for a project
export const getProjectFeedbackCount = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const feedback = await ctx.db
      .query("projectFeedback")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "approved")
      )
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();

    return {
      total: feedback.length,
      byType: {
        comment: feedback.filter((f) => f.feedbackType === "comment").length,
        suggestion: feedback.filter((f) => f.feedbackType === "suggestion").length,
        concern: feedback.filter((f) => f.feedbackType === "concern").length,
        appreciation: feedback.filter((f) => f.feedbackType === "appreciation").length,
      },
      averageRating: feedback.length > 0
        ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter((f) => f.rating).length
        : 0,
    };
  },
});

// Get feedback statistics for project cards
export const getProjectFeedbackStats = query({
  args: { projectIds: v.array(v.id("projects")) },
  handler: async (ctx, args) => {
    const stats: Record<string, { count: number; averageRating: number }> = {};

    for (const projectId of args.projectIds) {
      const feedback = await ctx.db
        .query("projectFeedback")
        .withIndex("by_project_status", (q) =>
          q.eq("projectId", projectId).eq("status", "approved")
        )
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();

      const ratingsWithValues = feedback.filter((f) => f.rating);
      const averageRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsWithValues.length
        : 0;

      stats[projectId] = {
        count: feedback.length,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    }

    return stats;
  },
});

// ===== ADMIN FUNCTIONS =====

// Get all feedback (admin only)
export const getAllFeedback = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("spam")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (userLevel?.name !== "ADMIN" && userLevel?.name !== "MANAGER") {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    const limit = args.limit || 50;

    let feedback;
    
    if (args.status) {
      const status = args.status; // Type narrowing for TypeScript
      feedback = await ctx.db
        .query("projectFeedback")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    } else {
      feedback = await ctx.db
        .query("projectFeedback")
        .order("desc")
        .take(limit);
    }

    // Enrich with project details
    const enriched = await Promise.all(
      feedback.map(async (f) => {
        const project = await ctx.db.get(f.projectId);
        const moderator = f.moderatedBy ? await ctx.db.get(f.moderatedBy) : null;
        
        return {
          ...f,
          project: project ? { _id: project._id, title: project.title, department: project.department } : null,
          moderator: moderator ? { _id: moderator._id, name: moderator.name } : null,
        };
      })
    );

    return enriched;
  },
});

// Approve feedback (admin only)
export const approveFeedback = mutation({
  args: {
    feedbackId: v.id("projectFeedback"),
    makePublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (userLevel?.name !== "ADMIN" && userLevel?.name !== "MANAGER") {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    await ctx.db.patch(args.feedbackId, {
      status: "approved",
      isPublic: args.makePublic !== false, // Default to public
      moderatedBy: currentUser._id,
      moderatedAt: Date.now(),
    });

    return { success: true, message: "Feedback approved" };
  },
});

// Reject feedback (admin only)
export const rejectFeedback = mutation({
  args: {
    feedbackId: v.id("projectFeedback"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (userLevel?.name !== "ADMIN" && userLevel?.name !== "MANAGER") {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    await ctx.db.patch(args.feedbackId, {
      status: "rejected",
      isPublic: false,
      moderatedBy: currentUser._id,
      moderatedAt: Date.now(),
      moderationNote: args.reason,
    });

    return { success: true, message: "Feedback rejected" };
  },
});

// Mark as spam (admin only)
export const markAsSpam = mutation({
  args: { feedbackId: v.id("projectFeedback") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (userLevel?.name !== "ADMIN" && userLevel?.name !== "MANAGER") {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    await ctx.db.patch(args.feedbackId, {
      status: "spam",
      isPublic: false,
      moderatedBy: currentUser._id,
      moderatedAt: Date.now(),
    });

    return { success: true, message: "Marked as spam" };
  },
});
