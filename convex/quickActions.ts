import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Send a quick ping notification to a user
export const sendPing = mutation({
  args: {
    targetUserId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) throw new Error("Target user not found");

    const now = Date.now();

    // Create a notification
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      title: "👋 Quick Ping!",
      message: args.message || `${currentUser.name} wants to connect with you`,
      type: "info",
      category: "ping",
      relatedId: currentUser._id,
      relatedType: "user",
      isRead: false,
      createdAt: now,
      actionUrl: "/messages",
      metadata: {
        priority: "medium",
        category: "ping",
        relatedId: currentUser._id,
        data: {
          senderId: currentUser._id,
          senderName: currentUser.name,
          senderImage: currentUser.imageUrl,
          customMessage: args.message,
        }
      }
    });

    return { success: true };
  },
});
