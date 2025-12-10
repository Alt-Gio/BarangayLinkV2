import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, emoji }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");

    const reactions = message.reactions || [];
    
    const existingReaction = reactions.find(
      (r) => r.userId === user._id && r.emoji === emoji
    );

    if (existingReaction) {
      await ctx.db.patch(messageId, {
        reactions: reactions.filter(
          (r) => !(r.userId === user._id && r.emoji === emoji)
        ),
      });
      return { action: "removed" };
    } else {
      await ctx.db.patch(messageId, {
        reactions: [
          ...reactions,
          { emoji, userId: user._id, addedAt: Date.now() },
        ],
      });

      if (message.sender !== user._id) {
        const room = await ctx.db.get(message.roomId);
        const messagePreview = message.content.substring(0, 50);

        await ctx.db.insert("notifications", {
          userId: message.sender,
          type: "message_reaction",
          title: "Someone reacted to your message",
          message: `${user.name} reacted ${emoji} to your message${room ? ` in ${room.name}` : ""}`,
          priority: "low",
          isRead: false,
          metadata: {
            emoji,
            roomId: message.roomId,
            roomName: room?.name,
            messagePreview,
            reactorId: user._id,
            reactorName: user.name,
          },
          createdAt: Date.now(),
        });

        await ctx.db.insert("userActivityLogs", {
          userId: user._id,
          activityType: "action",
          action: "message_reaction",
          targetType: "message",
          targetId: messageId,
          metadata: {
            emoji,
            roomName: room?.name,
          },
          timestamp: Date.now(),
        });
      }

      return { action: "added" };
    }
  },
});

export const getMessageReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.db.get(messageId);
    if (!message || !message.reactions) return [];

    const grouped = message.reactions.reduce((acc: any, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.userId);
      return acc;
    }, {});

    return Object.values(grouped);
  },
});

export const searchMessages = query({
  args: {
    roomId: v.id("chatRooms"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { roomId, query, limit = 50 }) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .collect();

    const searchLower = query.toLowerCase();
    const filtered = messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchLower)
    );

    const enriched = await Promise.all(
      filtered.slice(0, limit).map(async (msg) => {
        const sender = await ctx.db.get(msg.sender);
        return {
          ...msg,
          senderName: sender?.name || "Unknown",
          senderImage: sender?.imageUrl,
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ============================================
// PINNED MESSAGES
// ============================================

// Pin a message
export const pinMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, { roomId, messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");

    // Check if user is admin for group chats
    if (room.type !== "direct") {
      const isAdmin = room.admins?.includes(user._id) || room.createdBy === user._id;
      if (!isAdmin) {
        const userLevel = await ctx.db.get(user.userLevel);
        if (userLevel?.name !== "ADMIN") {
          throw new Error("Only admins can pin messages");
        }
      }
    }

    const pinnedMessages = room.pinnedMessages || [];
    
    // Limit to 10 pinned messages
    if (pinnedMessages.length >= 10 && !pinnedMessages.includes(messageId)) {
      throw new Error("Maximum 10 pinned messages allowed");
    }

    if (!pinnedMessages.includes(messageId)) {
      await ctx.db.patch(roomId, {
        pinnedMessages: [...pinnedMessages, messageId],
      });
    }

    return { success: true };
  },
});

// Unpin a message
export const unpinMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, { roomId, messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");

    // Check if user is admin for group chats
    if (room.type !== "direct") {
      const isAdmin = room.admins?.includes(user._id) || room.createdBy === user._id;
      if (!isAdmin) {
        const userLevel = await ctx.db.get(user.userLevel);
        if (userLevel?.name !== "ADMIN") {
          throw new Error("Only admins can unpin messages");
        }
      }
    }

    const pinnedMessages = room.pinnedMessages || [];
    await ctx.db.patch(roomId, {
      pinnedMessages: pinnedMessages.filter((id) => id !== messageId),
    });

    return { success: true };
  },
});

// Get pinned messages for a room
export const getPinnedMessages = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room || !room.pinnedMessages) return [];

    const messages = await Promise.all(
      room.pinnedMessages.map(async (msgId) => {
        const msg = await ctx.db.get(msgId);
        if (!msg) return null;
        
        const sender = await ctx.db.get(msg.sender);
        return {
          ...msg,
          senderName: sender?.name || "Unknown",
          senderImage: sender?.imageUrl,
        };
      })
    );

    return messages.filter((m) => m !== null);
  },
});

// ============================================
// POLLS
// ============================================

// Create a poll
export const createPoll = mutation({
  args: {
    roomId: v.id("chatRooms"),
    question: v.string(),
    options: v.array(v.string()),
    allowMultiple: v.optional(v.boolean()),
    expiresInHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const expiresAt = args.expiresInHours
      ? Date.now() + args.expiresInHours * 60 * 60 * 1000
      : undefined;

    const pollData = {
      question: args.question,
      options: args.options.map((text) => ({ text, votes: [] })),
      allowMultiple: args.allowMultiple || false,
      expiresAt,
    };

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      content: `📊 Poll: ${args.question}`,
      messageType: "poll" as const,
      sender: user._id,
      attachments: [],
      isEdited: false,
      readBy: [{ userId: user._id, readAt: Date.now() }],
      pollData,
    });

    // Update room's last message
    await ctx.db.patch(args.roomId, {
      lastMessage: `📊 Poll: ${args.question}`,
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Vote on a poll
export const voteOnPoll = mutation({
  args: {
    messageId: v.id("messages"),
    optionIndex: v.number(),
  },
  handler: async (ctx, { messageId, optionIndex }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(messageId);
    if (!message || message.messageType !== "poll" || !message.pollData) {
      throw new Error("Invalid poll message");
    }

    // Check if poll has expired
    if (message.pollData.expiresAt && Date.now() > message.pollData.expiresAt) {
      throw new Error("Poll has expired");
    }

    const pollData = message.pollData;
    const options = [...pollData.options];

    // If not allowing multiple votes, remove user's previous votes
    if (!pollData.allowMultiple) {
      options.forEach((option) => {
        option.votes = option.votes.filter((id) => id !== user._id);
      });
    }

    // Toggle vote
    const userVoted = options[optionIndex].votes.includes(user._id);
    if (userVoted) {
      options[optionIndex].votes = options[optionIndex].votes.filter(
        (id) => id !== user._id
      );
    } else {
      options[optionIndex].votes.push(user._id);
    }

    await ctx.db.patch(messageId, {
      pollData: {
        ...pollData,
        options,
      },
    });

    return { success: true, action: userVoted ? "removed" : "added" };
  },
});

// ============================================
// CUSTOM STATUS
// ============================================

// Set custom status
export const setCustomStatus = mutation({
  args: {
    status: v.union(
      v.literal("online"),
      v.literal("away"),
      v.literal("busy"),
      v.literal("dnd"),
      v.literal("meeting"),
      v.literal("wfh"),
      v.literal("offline")
    ),
    customMessage: v.optional(v.string()),
    emoji: v.optional(v.string()),
    expiresInMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Find or create presence record
    const presence = await ctx.db
      .query("onlinePresence")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    const expiresAt = args.expiresInMinutes
      ? Date.now() + args.expiresInMinutes * 60 * 1000
      : undefined;

    const customStatus = args.customMessage
      ? {
          message: args.customMessage,
          emoji: args.emoji,
          expiresAt,
        }
      : undefined;

    if (presence) {
      await ctx.db.patch(presence._id, {
        status: args.status,
        customStatus,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("onlinePresence", {
        userId: user._id,
        clerkId: identity.subject,
        lastSeen: Date.now(),
        status: args.status,
        isActive: true,
        customStatus,
      });
    }

    return { success: true };
  },
});

// Get user status
export const getUserStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const presence = await ctx.db
      .query("onlinePresence")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!presence) return { status: "offline", customStatus: null };

    // Check if custom status has expired
    if (presence.customStatus?.expiresAt && Date.now() > presence.customStatus.expiresAt) {
      return {
        status: presence.status,
        customStatus: null,
      };
    }

    return {
      status: presence.status,
      customStatus: presence.customStatus,
    };
  },
});

// ============================================
// GROUP ADMIN FEATURES
// ============================================

// Add group admin
export const addGroupAdmin = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, { roomId, userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");

    // Only room creator or existing admins can add new admins
    const isCreator = room.createdBy === currentUser._id;
    const isAdmin = room.admins?.includes(currentUser._id);
    
    if (!isCreator && !isAdmin) {
      const userLevel = await ctx.db.get(currentUser.userLevel);
      if (userLevel?.name !== "ADMIN") {
        throw new Error("Only room admins can add new admins");
      }
    }

    const admins = room.admins || [];
    if (!admins.includes(userId)) {
      await ctx.db.patch(roomId, {
        admins: [...admins, userId],
      });
    }

    return { success: true };
  },
});

// Remove group admin
export const removeGroupAdmin = mutation({
  args: {
    roomId: v.id("chatRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, { roomId, userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) throw new Error("User not found");

    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");

    // Only room creator can remove admins
    if (room.createdBy !== currentUser._id) {
      const userLevel = await ctx.db.get(currentUser.userLevel);
      if (userLevel?.name !== "ADMIN") {
        throw new Error("Only room creator can remove admins");
      }
    }

    const admins = room.admins || [];
    await ctx.db.patch(roomId, {
      admins: admins.filter((id) => id !== userId),
    });

    return { success: true };
  },
});

// Update group settings
export const updateGroupSettings = mutation({
  args: {
    roomId: v.id("chatRooms"),
    settings: v.object({
      onlyAdminsCanSend: v.boolean(),
      onlyAdminsCanAddMembers: v.boolean(),
      joinApprovalRequired: v.boolean(),
    }),
  },
  handler: async (ctx, { roomId, settings }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");

    // Check if user is admin
    const isAdmin = room.admins?.includes(user._id) || room.createdBy === user._id;
    if (!isAdmin) {
      const userLevel = await ctx.db.get(user.userLevel);
      if (userLevel?.name !== "ADMIN") {
        throw new Error("Only admins can update settings");
      }
    }

    await ctx.db.patch(roomId, { settings });
    return { success: true };
  },
});

// Update group info
export const updateGroupInfo = mutation({
  args: {
    roomId: v.id("chatRooms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Check if user is admin
    const isAdmin = room.admins?.includes(user._id) || room.createdBy === user._id;
    if (!isAdmin) {
      const userLevel = await ctx.db.get(user.userLevel);
      if (userLevel?.name !== "ADMIN") {
        throw new Error("Only admins can update group info");
      }
    }

    const updates: any = {};
    if (args.name) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(args.roomId, updates);
    return { success: true };
  },
});

// ============================================
// MEDIA GALLERY
// ============================================

// Get all media from a room
export const getRoomMedia = query({
  args: {
    roomId: v.id("chatRooms"),
    type: v.optional(v.union(v.literal("images"), v.literal("files"), v.literal("all"))),
  },
  handler: async (ctx, { roomId, type = "all" }) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .filter((q) => q.neq(q.field("attachments"), []))
      .collect();

    const mediaMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.sender);
        const documents = await Promise.all(
          msg.attachments.map((id) => ctx.db.get(id))
        );

        const validDocs = documents.filter((doc) => doc !== null);

        // Filter by type if specified
        let filteredDocs = validDocs;
        if (type === "images") {
          filteredDocs = validDocs.filter((doc) => 
            doc!.mimeType.startsWith("image/")
          );
        } else if (type === "files") {
          filteredDocs = validDocs.filter((doc) => 
            !doc!.mimeType.startsWith("image/")
          );
        }

        if (filteredDocs.length === 0) return null;

        return {
          messageId: msg._id,
          timestamp: msg._creationTime,
          sender: {
            name: sender?.name || "Unknown",
            imageUrl: sender?.imageUrl,
          },
          documents: filteredDocs,
        };
      })
    );

    return mediaMessages
      .filter((m) => m !== null)
      .sort((a, b) => b!.timestamp - a!.timestamp);
  },
});
