import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new comment/thread
export const createComment = mutation({
  args: {
    resourceType: v.string(), // 'project', 'event', 'task', 'sprint'
    resourceId: v.string(), // Generic ID that can be from any table
    body: v.string(),
    category: v.optional(v.string()), // 'general', 'question', 'feedback', 'bug', 'feature'
    priority: v.optional(v.string()), // 'low', 'medium', 'high'
    parentId: v.optional(v.id("comments")), // For replies
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const commentId = await ctx.db.insert("comments", {
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      body: args.body,
      category: args.category || 'general',
      priority: args.priority || 'medium',
      parentId: args.parentId,
      userId: user._id,
      userName: user.name,
      userAvatar: user.imageUrl,
      resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return commentId;
  },
});

// Get all comments for a resource
export const getComments = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .filter((q) => 
        q.and(
          q.eq(q.field("resourceType"), args.resourceType),
          q.eq(q.field("resourceId"), args.resourceId)
        )
      )
      .order("desc")
      .collect();

    return comments;
  },
});

// Get comment threads (top-level comments with replies)
export const getCommentThreads = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get top-level comments (no parent)
    const topLevelComments = await ctx.db
      .query("comments")
      .filter((q) => 
        q.and(
          q.eq(q.field("resourceType"), args.resourceType),
          q.eq(q.field("resourceId"), args.resourceId),
          q.eq(q.field("parentId"), undefined)
        )
      )
      .order("desc")
      .collect();

    // Get all replies for each thread
    const threads = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await ctx.db
          .query("comments")
          .filter((q) => q.eq(q.field("parentId"), comment._id))
          .order("asc")
          .collect();

        return {
          ...comment,
          replies,
          replyCount: replies.length,
        };
      })
    );

    return threads;
  },
});

// Edit comment
export const editComment = mutation({
  args: {
    commentId: v.id("comments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || comment.userId !== user._id) {
      throw new Error("Not authorized to edit this comment");
    }

    await ctx.db.patch(args.commentId, {
      body: args.body,
      updatedAt: Date.now(),
    });

    return args.commentId;
  },
});

// Delete comment
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    const isAdmin = userLevel?.name === "ADMIN" || userLevel?.name === "MANAGER";
    const isOwner = comment.userId === user._id;

    if (!isAdmin && !isOwner) {
      throw new Error("Not authorized to delete this comment");
    }

    // Delete all replies first
    const replies = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("parentId"), args.commentId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // Delete the comment
    await ctx.db.delete(args.commentId);

    return args.commentId;
  },
});

// Toggle resolved status
export const toggleResolved = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    await ctx.db.patch(args.commentId, {
      resolved: !comment.resolved,
      updatedAt: Date.now(),
    });

    return args.commentId;
  },
});

// Update comment metadata (category, priority)
export const updateCommentMetadata = mutation({
  args: {
    commentId: v.id("comments"),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.category !== undefined) updates.category = args.category;
    if (args.priority !== undefined) updates.priority = args.priority;

    await ctx.db.patch(args.commentId, updates);

    return args.commentId;
  },
});

// Get comment count for a resource
export const getCommentCount = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .filter((q) => 
        q.and(
          q.eq(q.field("resourceType"), args.resourceType),
          q.eq(q.field("resourceId"), args.resourceId)
        )
      )
      .collect();

    return comments.length;
  },
});
