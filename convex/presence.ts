import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update user's online presence
export const updatePresence = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("away"), v.literal("offline")),
    currentPage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return null;

    // Check if presence record exists
    const existingPresence = await ctx.db
      .query("onlinePresence")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, {
        lastSeen: Date.now(),
        status: args.status,
        currentPage: args.currentPage,
        isActive: args.status !== "offline",
      });
      return existingPresence._id;
    } else {
      const id = await ctx.db.insert("onlinePresence", {
        userId: user._id,
        clerkId: identity.subject,
        lastSeen: Date.now(),
        status: args.status,
        currentPage: args.currentPage,
        isActive: args.status !== "offline",
      });
      return id;
    }
  },
});

// Get online users
export const getOnlineUsers = query({
  args: {
    includeAway: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const allPresence = await ctx.db
      .query("onlinePresence")
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.gte(q.field("lastSeen"), fiveMinutesAgo))
      .collect();

    const onlineUsers = await Promise.all(
      allPresence
        .filter((p) => 
          args.includeAway 
            ? p.status === "online" || p.status === "away"
            : p.status === "online"
        )
        .map(async (presence) => {
          const user = await ctx.db.get(presence.userId);
          if (!user) return null;

          const userLevel = await ctx.db.get(user.userLevel);
          
          // Generate achievement badges based on stats
          const metadata = (user.metadata as any) || {};
          const stats = metadata.activityStats || {};
          const mockAchievements = [];
          
          if (user.level && user.level >= 2) {
            mockAchievements.push({ title: "Level " + user.level, icon: "⭐" });
          }
          if (user.experience && user.experience >= 100) {
            mockAchievements.push({ title: user.experience + " XP", icon: "🏆" });
          }
          // Add time-based achievements
          if (stats.totalMinutes >= 60) {
            mockAchievements.push({ title: Math.floor(stats.totalMinutes / 60) + "h Worked", icon: "⏰" });
          }

          return {
            _id: user._id,
            clerkId: user.clerkId,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            department: user.department,
            position: user.position,
            userLevel: userLevel?.name,
            status: presence.status,
            lastSeen: presence.lastSeen,
            currentPage: presence.currentPage,
            currentActivity: metadata.currentActivity || null,
            achievements: mockAchievements.slice(0, 3),
          };
        })
    );

    return onlineUsers.filter(Boolean).sort((a, b) => {
      // Online first, then away
      if (a!.status === "online" && b!.status !== "online") return -1;
      if (a!.status !== "online" && b!.status === "online") return 1;
      return b!.lastSeen - a!.lastSeen;
    });
  },
});

// Get all users with online status
export const getAllUsersWithStatus = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const usersWithStatus = await Promise.all(
      allUsers.map(async (user) => {
        const userLevel = await ctx.db.get(user.userLevel);
        
        // Check presence
        const presence = await ctx.db
          .query("onlinePresence")
          .filter((q) => q.eq(q.field("userId"), user._id))
          .first();

        let status: "online" | "away" | "offline" = "offline";
        let lastSeen = 0;

        if (presence && presence.lastSeen > fiveMinutesAgo) {
          status = presence.status;
          lastSeen = presence.lastSeen;
        }

        return {
          _id: user._id,
          clerkId: user.clerkId,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          department: user.department,
          position: user.position,
          userLevel: userLevel?.name || "WORKER",
          level: user.level,
          experience: user.experience,
          status,
          lastSeen,
        };
      })
    );

    // Sort: online first, then by name
    return usersWithStatus.sort((a, b) => {
      if (a.status === "online" && b.status !== "online") return -1;
      if (a.status !== "online" && b.status === "online") return 1;
      if (a.status === "away" && b.status === "offline") return -1;
      if (a.status === "offline" && b.status === "away") return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

// Heartbeat to keep user online
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return;

    const presence = await ctx.db
      .query("onlinePresence")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (presence) {
      await ctx.db.patch(presence._id, {
        lastSeen: Date.now(),
        status: "online",
        isActive: true,
      });
    } else {
      await ctx.db.insert("onlinePresence", {
        userId: user._id,
        clerkId: identity.subject,
        lastSeen: Date.now(),
        status: "online",
        currentPage: "/collab",
        isActive: true,
      });
    }
  },
});

// Get user presence by clerk ID
export const getUserPresence = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) return null;

    const presence = await ctx.db
      .query("onlinePresence")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!presence) {
      return {
        status: "offline" as const,
        lastSeen: 0,
      };
    }

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    if (presence.lastSeen < fiveMinutesAgo) {
      return {
        status: "offline" as const,
        lastSeen: presence.lastSeen,
      };
    }

    return {
      status: presence.status,
      lastSeen: presence.lastSeen,
    };
  },
});
