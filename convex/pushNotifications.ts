import { mutation, query, action, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Save user's FCM push subscription token
 */
export const savePushSubscription = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Check if subscription already exists for this user
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // Get device info (client-side would pass this)
    const deviceInfo = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
    };

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        token: args.token,
        updatedAt: now,
        deviceInfo,
      });
      
      console.log(`✅ Updated push subscription for user: ${user.name}`);
    } else {
      // Create new subscription
      await ctx.db.insert("pushSubscriptions", {
        userId: user._id,
        token: args.token,
        createdAt: now,
        updatedAt: now,
        deviceInfo,
      });
      
      console.log(`✅ Created push subscription for user: ${user.name}`);
    }

    return { success: true };
  },
});

/**
 * Get user's push subscription
 */
export const getUserSubscription = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    let targetUserId = args.userId;
    
    if (!targetUserId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), identity.subject))
        .first();
      
      if (!user) return null;
      targetUserId = user._id;
    }

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId!))
      .first();

    return subscription;
  },
});

/**
 * Remove push subscription (when user disables notifications)
 */
export const removePushSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
      console.log(`✅ Removed push subscription for user: ${user.name}`);
    }

    return { success: true };
  },
});

/**
 * Send push notification to a user
 * This will be called by other functions when creating notifications
 */
export const sendPushNotification = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    image: v.optional(v.string()),
    badge: v.optional(v.string()),
    tag: v.optional(v.string()),
    requireInteraction: v.optional(v.boolean()),
    actions: v.optional(v.array(v.object({
      action: v.string(),
      title: v.string(),
      icon: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    // Get user's push subscription
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      console.log(`❌ No push subscription found for user ${args.userId}`);
      return { sent: false, reason: 'no_subscription' };
    }

    console.log(`📤 Sending push notification to user ${args.userId}`);
    console.log(`Title: ${args.title}`);
    console.log(`Body: ${args.body}`);

    // Schedule FCM sending via action
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendFCMNotificationAction,
      {
        token: subscription.token,
        title: args.title,
        body: args.body,
        url: args.url,
        icon: args.icon,
        badge: args.badge,
        tag: args.tag,
        requireInteraction: args.requireInteraction,
        actions: args.actions,
      }
    );
    
    return { 
      sent: true, 
      token: subscription.token.substring(0, 20) + '...',
    };
  },
});

/**
 * Action to actually send FCM notification via API route
 * (Actions can make HTTP requests, mutations cannot)
 */
export const sendFCMNotificationAction = internalAction({
  args: {
    token: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    badge: v.optional(v.string()),
    tag: v.optional(v.string()),
    requireInteraction: v.optional(v.boolean()),
    actions: v.optional(v.array(v.object({
      action: v.string(),
      title: v.string(),
      icon: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    try {
      // Call our Next.js API route to send FCM notification
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const apiSecret = process.env.FCM_API_SECRET || 'development-secret-change-in-production';
      
      const response = await fetch(`${apiUrl}/api/send-fcm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': apiSecret,
        },
        body: JSON.stringify({
          token: args.token,
          title: args.title,
          body: args.body,
          url: args.url,
          icon: args.icon,
          badge: args.badge,
          tag: args.tag,
          requireInteraction: args.requireInteraction,
          actions: args.actions,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ FCM notification sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.error('❌ FCM API error:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Failed to send FCM notification:', error.message);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Get all push subscriptions (admin only)
 */
export const getAllSubscriptions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    // Check if user is admin
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || userLevel.level < 90) {
      throw new Error("Unauthorized: Admin access required");
    }

    const subscriptions = await ctx.db.query("pushSubscriptions").collect();
    
    // Get user info for each subscription
    const subscriptionsWithUsers = await Promise.all(
      subscriptions.map(async (sub) => {
        const subUser = await ctx.db.get(sub.userId);
        return {
          ...sub,
          userName: subUser?.name || 'Unknown',
          userEmail: subUser?.email || 'Unknown',
        };
      })
    );

    return subscriptionsWithUsers;
  },
});
