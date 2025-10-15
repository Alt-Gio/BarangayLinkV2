import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// FACEBOOK CONNECTION MANAGEMENT
// ============================================

/**
 * Connect user's Facebook account
 */
export const connectFacebookAccount = mutation({
  args: {
    facebookUserId: v.string(),
    facebookName: v.string(),
    facebookProfilePic: v.optional(v.string()),
    accessToken: v.string(),
    pageAccessToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    pageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if connection already exists
    const existing = await ctx.db
      .query("facebookConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        facebookUserId: args.facebookUserId,
        facebookName: args.facebookName,
        facebookProfilePic: args.facebookProfilePic,
        accessToken: args.accessToken,
        pageAccessToken: args.pageAccessToken,
        tokenExpiresAt: args.tokenExpiresAt,
        pageId: args.pageId,
        isActive: true,
        messengerEnabled: true,
        notificationsEnabled: true,
        lastSyncedAt: Date.now(),
        syncStatus: "active",
        lastError: undefined,
      });
      return existing._id;
    }

    // Create new connection
    const connectionId = await ctx.db.insert("facebookConnections", {
      userId: user._id,
      facebookUserId: args.facebookUserId,
      facebookName: args.facebookName,
      facebookProfilePic: args.facebookProfilePic,
      accessToken: args.accessToken,
      pageAccessToken: args.pageAccessToken,
      tokenExpiresAt: args.tokenExpiresAt,
      pageId: args.pageId,
      isActive: true,
      messengerEnabled: true,
      notificationsEnabled: true,
      connectedAt: Date.now(),
      lastSyncedAt: Date.now(),
      syncStatus: "active",
    });

    return connectionId;
  },
});

/**
 * Get user's Facebook connection status
 */
export const getFacebookConnection = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return null;

    const connection = await ctx.db
      .query("facebookConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!connection) return null;

    // Return connection info without sensitive tokens
    return {
      _id: connection._id,
      facebookUserId: connection.facebookUserId,
      facebookName: connection.facebookName,
      facebookProfilePic: connection.facebookProfilePic,
      isActive: connection.isActive,
      messengerEnabled: connection.messengerEnabled,
      notificationsEnabled: connection.notificationsEnabled,
      connectedAt: connection.connectedAt,
      lastSyncedAt: connection.lastSyncedAt,
      syncStatus: connection.syncStatus,
      lastError: connection.lastError,
      tokenExpiresAt: connection.tokenExpiresAt,
    };
  },
});

/**
 * Disconnect Facebook account
 */
export const disconnectFacebook = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const connection = await ctx.db
      .query("facebookConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        isActive: false,
        messengerEnabled: false,
        syncStatus: "disconnected",
      });
    }

    return { success: true };
  },
});

/**
 * Update messenger settings
 */
export const updateMessengerSettings = mutation({
  args: {
    messengerEnabled: v.boolean(),
    notificationsEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const connection = await ctx.db
      .query("facebookConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!connection) throw new Error("Facebook not connected");

    await ctx.db.patch(connection._id, {
      messengerEnabled: args.messengerEnabled,
      notificationsEnabled: args.notificationsEnabled,
    });

    return { success: true };
  },
});

// ============================================
// MESSAGE SYNC FUNCTIONS
// ============================================

/**
 * Log a message sync event
 */
export const logMessageSync = mutation({
  args: {
    internalMessageId: v.optional(v.id("messages")),
    messengerMessageId: v.optional(v.string()),
    roomId: v.id("chatRooms"),
    content: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    platform: v.union(v.literal("internal"), v.literal("messenger"), v.literal("both")),
    recipientId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const syncId = await ctx.db.insert("messageSyncLog", {
      internalMessageId: args.internalMessageId,
      messengerMessageId: args.messengerMessageId,
      roomId: args.roomId,
      senderId: user._id,
      recipientId: args.recipientId,
      content: args.content,
      direction: args.direction,
      platform: args.platform,
      syncStatus: "synced",
      syncedAt: Date.now(),
      timestamp: Date.now(),
    });

    return syncId;
  },
});

/**
 * Get sync status for messages in a room
 */
export const getRoomSyncStatus = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, { roomId }) => {
    const syncLogs = await ctx.db
      .query("messageSyncLog")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .order("desc")
      .take(50);

    return syncLogs;
  },
});

/**
 * Get user by Facebook User ID (for incoming webhook messages)
 */
export const getUserByFacebookId = query({
  args: { facebookUserId: v.string() },
  handler: async (ctx, { facebookUserId }) => {
    const connection = await ctx.db
      .query("facebookConnections")
      .withIndex("by_facebook_user_id", (q) => q.eq("facebookUserId", facebookUserId))
      .first();

    if (!connection) return null;

    const user = await ctx.db.get(connection.userId);
    return user;
  },
});

/**
 * Store incoming Messenger message
 */
export const storeIncomingMessengerMessage = mutation({
  args: {
    messengerMessageId: v.string(),
    facebookUserId: v.string(),
    content: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the user by Facebook ID
    const connection = await ctx.db
      .query("facebookConnections")
      .withIndex("by_facebook_user_id", (q) => q.eq("facebookUserId", args.facebookUserId))
      .first();

    if (!connection) {
      console.log("No user found for Facebook ID:", args.facebookUserId);
      return null;
    }

    const user = await ctx.db.get(connection.userId);
    if (!user) return null;

    // Find or create a direct chat room for this user (with themselves for external messages)
    // Or you could create a special "Messenger" room
    const rooms = await ctx.db
      .query("chatRooms")
      .filter((q) => q.eq(q.field("type"), "direct"))
      .collect();

    let roomId = null;
    for (const room of rooms) {
      if (room.participants.includes(user._id)) {
        roomId = room._id;
        break;
      }
    }

    // If no room exists, create one
    if (!roomId) {
      roomId = await ctx.db.insert("chatRooms", {
        name: `${user.name} - Messenger`,
        type: "direct",
        participants: [user._id],
        createdBy: user._id,
        isActive: true,
        lastMessage: args.content,
        lastMessageAt: args.timestamp,
      });
    }

    // Store the message
    const messageId = await ctx.db.insert("messages", {
      roomId: roomId,
      content: args.content,
      messageType: "text",
      sender: user._id,
      attachments: [],
      isEdited: false,
      readBy: [],
    });

    // Log the sync
    await ctx.db.insert("messageSyncLog", {
      internalMessageId: messageId,
      messengerMessageId: args.messengerMessageId,
      roomId: roomId,
      senderId: user._id,
      content: args.content,
      direction: "inbound",
      platform: "messenger",
      syncStatus: "synced",
      syncedAt: Date.now(),
      timestamp: args.timestamp,
    });

    return { messageId, roomId };
  },
});

/**
 * Get access token for sending messages (internal use only, should be called from actions)
 */
export const getAccessToken = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const connection = await ctx.db
      .query("facebookConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!connection || !connection.isActive) return null;

    return {
      accessToken: connection.accessToken,
      pageAccessToken: connection.pageAccessToken,
    };
  },
});
