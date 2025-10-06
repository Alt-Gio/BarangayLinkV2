import { httpAction, internalAction, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { WebhookEvent } from "@clerk/clerk-sdk-node";
import { Webhook } from "svix";

export const fulfillClerkWebhook = httpAction(async (ctx, request) => {
  const payloadString = await request.text();
  const headerPayload = request.headers;

  try {
    // Verify webhook directly
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET environment variable is not set");
    }
    const wh = new Webhook(webhookSecret);
    const result = wh.verify(payloadString, {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    }) as WebhookEvent;
    
    switch (result.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.createOrUpdateFromClerk, {
          data: result.data,
        });
        break;
      case "user.deleted":
        if (result.data?.id) {
          await ctx.runMutation(internal.users.deleteUser, {
            clerkUserId: result.data.id,
          });
        }
        break;
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }
});

export const fulfill = internalAction({
  args: {
    payload: v.string(),
    headers: v.object({
      svix_id: v.string(),
      svix_timestamp: v.string(), 
      svix_signature: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET environment variable is not set");
    }
    const wh = new Webhook(webhookSecret);
    const payload = wh.verify(args.payload, {
      "svix-id": args.headers.svix_id,
      "svix-timestamp": args.headers.svix_timestamp,
      "svix-signature": args.headers.svix_signature,
    }) as WebhookEvent;
    return payload;
  },
});

// ============================================
// CLERK SYNC UTILITIES
// ============================================

// Manually sync all existing Clerk users to Convex
export const syncAllClerkUsers = mutation({
  args: {
    users: v.array(v.object({
      clerkId: v.string(),
      email: v.string(),
      name: v.string(),
      imageUrl: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
    };

    for (const userData of args.users) {
      try {
        // Check if user already exists
        const existingUser = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("clerkId"), userData.clerkId))
          .first();

        if (existingUser) {
          // Update existing user
          await ctx.db.patch(existingUser._id, {
            email: userData.email,
            name: userData.name,
            imageUrl: userData.imageUrl,
            metadata: {
              ...existingUser.metadata,
              lastLogin: Date.now(),
            },
          });
          results.updated++;
        } else {
          // Create new user with WORKER level
          const workerLevel = await ctx.db
            .query("userLevels")
            .filter((q) => q.eq(q.field("name"), "WORKER"))
            .first();

          if (!workerLevel) {
            throw new Error("WORKER user level not found. Please initialize user levels first.");
          }

          const userId = await ctx.db.insert("users", {
            clerkId: userData.clerkId,
            email: userData.email,
            name: userData.name,
            userLevel: workerLevel._id,
            department: "General",
            position: "Community Member",
            isActive: true,
            level: 1,
            experience: 0,
            gold: 100,
            health: 100,
            mana: 50,
            streakCount: 0,
            lastActiveDate: Date.now(),
            totalTasksCompleted: 0,
            totalHoursLogged: 0,
            projectSuccessRate: 0,
            imageUrl: userData.imageUrl,
            metadata: {
              lastLogin: Date.now(),
              preferences: {
                notifications: true,
                theme: "light",
              },
            },
          });

          // Create welcome notification
          try {
            await ctx.db.insert("notifications", {
              userId,
              title: "Welcome to BarangayLink!",
              message: "Welcome to our community management system. Start by exploring your dashboard and joining community activities.",
              type: "welcome",
              category: "system",
              isRead: false,
              createdAt: Date.now(),
            });
          } catch (error) {
            // Notifications table might not exist
          }

          results.created++;
        }
      } catch (error) {
        results.errors++;
      }
    }

    return results;
  },
});

// Get all users from Convex for comparison
export const getAllConvexUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      createdAt: user._creationTime,
    }));
  },
});

// Check sync status between Clerk and Convex
export const getSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    const convexUsers = await ctx.db.query("users").collect();
    const userLevels = await ctx.db.query("userLevels").collect();
    
    return {
      convexUserCount: convexUsers.length,
      userLevelsCount: userLevels.length,
      userLevels: userLevels.map(level => ({
        name: level.name,
        permissions: level.permissions,
      })),
      recentUsers: convexUsers
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 5)
        .map(user => ({
          email: user.email,
          name: user.name,
          createdAt: new Date(user._creationTime).toISOString(),
        })),
    };
  },
});
