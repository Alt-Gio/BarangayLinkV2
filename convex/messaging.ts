import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// CHAT ROOMS
// ============================================

// Create a new chat room
export const createChatRoom = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("general"), v.literal("project"), v.literal("department"), v.literal("direct")),
    projectId: v.optional(v.id("projects")),
    department: v.optional(v.string()),
    participants: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if direct message room already exists
    if (args.type === "direct" && args.participants.length === 2) {
      const existing = await ctx.db
        .query("chatRooms")
        .filter((q) => q.eq(q.field("type"), "direct"))
        .collect();

      const existingRoom = existing.find((room) => {
        const roomParticipants = new Set(room.participants.map(String));
        const newParticipants = new Set(args.participants.map(String));
        return roomParticipants.size === newParticipants.size &&
          [...roomParticipants].every(p => newParticipants.has(p));
      });

      if (existingRoom) return existingRoom._id;
    }

    const roomId = await ctx.db.insert("chatRooms", {
      name: args.name,
      type: args.type,
      projectId: args.projectId,
      department: args.department,
      participants: args.participants,
      createdBy: user._id,
      isActive: true,
    });

    return roomId;
  },
});

// Get all chat rooms for current user
export const getMyChatRooms = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    const allRooms = await ctx.db.query("chatRooms").collect();
    
    const userRooms = allRooms.filter((room) =>
      room.participants.some((p) => p === user._id)
    );

    // Enrich with participant info and unread count
    const enrichedRooms = await Promise.all(
      userRooms.map(async (room) => {
        const participants = await Promise.all(
          room.participants.map((id) => ctx.db.get(id))
        );

        // Get unread count
        const messages = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("roomId"), room._id))
          .collect();

        const unreadCount = messages.filter(
          (msg) =>
            msg.sender !== user._id &&
            !msg.readBy.some((r) => r.userId === user._id)
        ).length;

        // For direct messages, get the other user's name
        let displayName = room.name;
        if (room.type === "direct") {
          const otherUser = participants.find((p) => p?._id !== user._id);
          displayName = otherUser?.name || "Unknown User";
        }

        return {
          ...room,
          participants: participants.filter((p) => p !== null),
          unreadCount,
          displayName,
        };
      })
    );

    return enrichedRooms.sort((a, b) => 
      (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );
  },
});

// Get chat room by ID
export const getChatRoom = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return null;

    const participants = await Promise.all(
      room.participants.map((id) => ctx.db.get(id))
    );

    return {
      ...room,
      participants: participants.filter((p) => p !== null),
    };
  },
});

// ============================================
// MESSAGES
// ============================================

// Send a message
export const sendMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    content: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("file"), v.literal("system"))),
    attachments: v.optional(v.array(v.id("documents"))),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      content: args.content,
      messageType: args.messageType || "text",
      sender: user._id,
      attachments: args.attachments || [],
      replyTo: args.replyTo,
      isEdited: false,
      readBy: [{ userId: user._id, readAt: Date.now() }],
    });

    // Update room's last message
    await ctx.db.patch(args.roomId, {
      lastMessage: args.content.substring(0, 100),
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Get messages for a room
export const getRoomMessages = query({
  args: {
    roomId: v.id("chatRooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { roomId, limit = 50 }) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .order("desc")
      .take(limit);

    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.sender);
        let replyToMessage = null;
        if (msg.replyTo) {
          replyToMessage = await ctx.db.get(msg.replyTo);
        }

        return {
          ...msg,
          senderName: sender?.name || "Unknown",
          senderImage: sender?.imageUrl,
          replyToMessage,
        };
      })
    );

    return enrichedMessages.reverse();
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    roomId: v.id("chatRooms"),
  },
  handler: async (ctx, { roomId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .collect();

    for (const message of messages) {
      if (message.sender !== user._id) {
        const alreadyRead = message.readBy.some((r) => r.userId === user._id);
        if (!alreadyRead) {
          await ctx.db.patch(message._id, {
            readBy: [...message.readBy, { userId: user._id, readAt: Date.now() }],
          });
        }
      }
    }
  },
});

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, { messageId, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");

    if (message.sender !== user._id) {
      throw new Error("Can only edit your own messages");
    }

    await ctx.db.patch(messageId, {
      content,
      isEdited: true,
    });
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");

    // Check if user is sender or admin
    const userLevel = await ctx.db.get(user.userLevel);
    const isAdmin = userLevel?.name === "ADMIN";

    if (message.sender !== user._id && !isAdmin) {
      throw new Error("Can only delete your own messages");
    }

    await ctx.db.delete(messageId);
  },
});

// ============================================
// ONLINE PRESENCE
// ============================================

// Get online users
export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    const users = await ctx.db.query("users").collect();
    
    const onlineUsers = users.filter((user) => {
      const lastLogin = user.metadata?.lastLogin;
      return lastLogin && lastLogin > fiveMinutesAgo;
    });

    return onlineUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      imageUrl: user.imageUrl,
      userLevel: user.userLevel,
      department: user.department,
      lastSeen: user.metadata?.lastLogin,
    }));
  },
});

// Update user online status
export const updateOnlineStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      metadata: {
        ...user.metadata,
        lastLogin: Date.now(),
      },
    });
  },
});

// ============================================
// SEARCH & USERS
// ============================================

// Search users for direct messaging
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) return [];

    const users = await ctx.db.query("users").collect();

    const filtered = users.filter((user) => {
      if (user._id === currentUser._id) return false;
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower)
      );
    });

    return filtered.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      department: user.department,
      position: user.position,
    }));
  },
});

// ============================================
// TYPING INDICATORS
// ============================================

// Set user typing status
export const setTyping = mutation({
  args: {
    roomId: v.id("chatRooms"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, { roomId, isTyping }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Update user's metadata with typing status
    const currentMetadata = user.metadata || {};
    await ctx.db.patch(user._id, {
      metadata: {
        ...currentMetadata,
        ...(isTyping 
          ? { typingInRoom: roomId as any, typingAt: Date.now() as any }
          : { typingInRoom: null as any, typingAt: null as any }
        ),
      } as any,
    });
  },
});

// Get users typing in a room
export const getTypingUsers = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) return [];

    const participants = await Promise.all(
      room.participants.map((id) => ctx.db.get(id))
    );

    const now = Date.now();
    const typingUsers = participants.filter((user) => {
      if (!user || !user.metadata) return false;
      const metadata = user.metadata as any;
      if (!metadata.typingInRoom) return false;
      const typingAt = metadata.typingAt || 0;
      return (
        metadata.typingInRoom === roomId &&
        now - typingAt < 5000 // 5 seconds timeout
      );
    });

    return typingUsers.map((user) => ({
      _id: user?._id,
      name: user?.name,
    }));
  },
});

// ============================================
// ANNOUNCEMENTS
// ============================================

// Create announcement (Admin/Manager only)
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    department: v.optional(v.string()),
  },
  handler: async (ctx, { title, content, department }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || !["ADMIN", "MANAGER"].includes(userLevel.name)) {
      throw new Error("Only admins and managers can create announcements");
    }

    // Get all users or department-specific users
    let targetUsers = await ctx.db.query("users").collect();
    if (department) {
      targetUsers = targetUsers.filter((u) => u.department === department);
    }

    // Create notifications for all target users
    for (const targetUser of targetUsers) {
      await ctx.db.insert("notifications", {
        userId: targetUser._id,
        title: `📢 ${title}`,
        message: content,
        type: "info",
        category: "announcement",
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true, notifiedUsers: targetUsers.length };
  },
});
