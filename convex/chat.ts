import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or get direct message room between two users
export const getOrCreateDirectChat = mutation({
  args: {
    participantId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) throw new Error("Current user not found");

    // Check if a direct chat already exists between these two users
    const existingRoom = await ctx.db
      .query("chatRooms")
      .filter((q) => q.eq(q.field("type"), "direct"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const dmRoom = existingRoom.find((room) => {
      const participants = room.participants.map(String);
      return (
        participants.length === 2 &&
        participants.includes(String(currentUser._id)) &&
        participants.includes(String(args.participantId))
      );
    });

    if (dmRoom) {
      return dmRoom._id;
    }

    // Create new direct message room
    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found");

    const roomId = await ctx.db.insert("chatRooms", {
      name: `${currentUser.name} & ${participant.name}`,
      type: "direct",
      participants: [currentUser._id, args.participantId],
      createdBy: currentUser._id,
      isActive: true,
    });

    return roomId;
  },
});

// Create a group chat
export const createGroupChat = mutation({
  args: {
    name: v.string(),
    participantIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) throw new Error("Current user not found");

    // Add current user to participants if not already included
    const participants = [...new Set([currentUser._id, ...args.participantIds])];

    const roomId = await ctx.db.insert("chatRooms", {
      name: args.name,
      type: "general",
      participants,
      createdBy: currentUser._id,
      isActive: true,
    });

    return roomId;
  },
});

// Get all chat rooms for current user
export const getUserChatRooms = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) return [];

    // Get all rooms where user is a participant
    const allRooms = await ctx.db
      .query("chatRooms")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userRooms = allRooms.filter((room) =>
      room.participants.some((p) => String(p) === String(currentUser._id))
    );

    // Enrich with participant details
    const enrichedRooms = await Promise.all(
      userRooms.map(async (room) => {
        const participants = await Promise.all(
          room.participants.map(async (pid) => {
            const user = await ctx.db.get(pid);
            if (!user) return null;
            const userLevel = await ctx.db.get(user.userLevel);
            return {
              _id: user._id,
              name: user.name,
              imageUrl: user.imageUrl,
              department: user.department,
              position: user.position,
              userLevel: userLevel?.name,
            };
          })
        );

        // Get unread count
        const messages = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("roomId"), room._id))
          .collect();

        const unreadCount = messages.filter((msg) => 
          msg.sender !== currentUser._id &&
          !msg.readBy.some((r) => String(r.userId) === String(currentUser._id))
        ).length;

        return {
          ...room,
          participants: participants.filter(Boolean),
          unreadCount,
        };
      })
    );

    return enrichedRooms.sort((a, b) => 
      (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    content: v.string(),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) throw new Error("Current user not found");

    // Verify user is participant in the room
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Chat room not found");

    if (!room.participants.some((p) => String(p) === String(currentUser._id))) {
      throw new Error("You are not a participant in this chat room");
    }

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      content: args.content,
      messageType: "text",
      sender: currentUser._id,
      attachments: [],
      replyTo: args.replyTo,
      isEdited: false,
      readBy: [{
        userId: currentUser._id,
        readAt: Date.now(),
      }],
    });

    // Update room's last message
    await ctx.db.patch(args.roomId, {
      lastMessage: args.content,
      lastMessageAt: Date.now(),
    });

    // Create notifications for other participants
    const otherParticipants = room.participants.filter(
      (p) => String(p) !== String(currentUser._id)
    );

    for (const participantId of otherParticipants) {
      await ctx.db.insert("notifications", {
        userId: participantId,
        title: `New message from ${currentUser.name}`,
        message: args.content.substring(0, 100),
        type: "info",
        category: "chat",
        isRead: false,
        createdAt: Date.now(),
        metadata: {
          relatedId: String(args.roomId),
          data: {
            roomId: args.roomId,
            messageId,
          },
        },
      });
    }

    return messageId;
  },
});

// Get messages for a room
export const getRoomMessages = query({
  args: {
    roomId: v.id("chatRooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) return [];

    // Verify user is participant
    const room = await ctx.db.get(args.roomId);
    if (!room) return [];

    if (!room.participants.some((p) => String(p) === String(currentUser._id))) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    // Enrich with sender details
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.sender);
        return {
          ...msg,
          senderName: sender?.name || "Unknown",
          senderImage: sender?.imageUrl,
        };
      })
    );

    const sorted = enrichedMessages.sort((a, b) => 
      a._creationTime - b._creationTime
    );

    return args.limit ? sorted.slice(-args.limit) : sorted;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    roomId: v.id("chatRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!currentUser) throw new Error("Current user not found");

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    for (const msg of messages) {
      if (msg.sender === currentUser._id) continue;
      
      const alreadyRead = msg.readBy.some(
        (r) => String(r.userId) === String(currentUser._id)
      );
      
      if (!alreadyRead) {
        await ctx.db.patch(msg._id, {
          readBy: [
            ...msg.readBy,
            {
              userId: currentUser._id,
              readAt: Date.now(),
            },
          ],
        });
      }
    }
  },
});
