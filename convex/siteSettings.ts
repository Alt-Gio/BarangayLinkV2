import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get a specific site setting by key
export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    return setting;
  },
});

// Get all site settings
export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("siteSettings").collect();
    
    // Convert to key-value object for easier use
    const settingsObj: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });
    
    return settingsObj;
  },
});

// Update or create a site setting
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || (userLevel.name !== "Admin" && userLevel.level !== 5)) {
      throw new Error("Only admins can update site settings");
    }

    // Check if setting exists
    const existingSetting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const now = Date.now();

    if (existingSetting) {
      // Update existing setting
      await ctx.db.patch(existingSetting._id, {
        value: args.value,
        updatedBy: user._id,
        updatedAt: now,
      });
    } else {
      // Create new setting
      await ctx.db.insert("siteSettings", {
        key: args.key,
        value: args.value,
        updatedBy: user._id,
        updatedAt: now,
        createdAt: now,
      });
    }

    return { success: true };
  },
});

// Update multiple settings at once
export const updateMultipleSettings = mutation({
  args: {
    settings: v.array(
      v.object({
        key: v.string(),
        value: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin
    const userLevel = await ctx.db.get(user.userLevel);
    if (!userLevel || (userLevel.name !== "Admin" && userLevel.level !== 5)) {
      throw new Error("Only admins can update site settings");
    }

    const now = Date.now();

    // Update or create each setting
    for (const setting of args.settings) {
      const existingSetting = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();

      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, {
          value: setting.value,
          updatedBy: user._id,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("siteSettings", {
          key: setting.key,
          value: setting.value,
          updatedBy: user._id,
          updatedAt: now,
          createdAt: now,
        });
      }
    }

    return { success: true };
  },
});

// Initialize default settings (can be called once to set defaults)
export const initializeDefaultSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const defaults = [
      {
        key: "siteName",
        value: "BarangayLink",
      },
      {
        key: "mission",
        value: "To build a thriving, inclusive community through transparent governance, innovative project management, and active citizen participation. We leverage technology to keep our residents informed and engaged in every step of our community's development.",
      },
      {
        key: "vision",
        value: "A progressive community committed to transparency, collaboration, and sustainable development",
      },
      {
        key: "copyright",
        value: "© 2024 Barangay Bitano. All rights reserved.",
      },
      {
        key: "version",
        value: "v2.0.0",
      },
    ];

    const now = Date.now();

    for (const setting of defaults) {
      const existing = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();

      if (!existing) {
        await ctx.db.insert("siteSettings", {
          key: setting.key,
          value: setting.value,
          updatedBy: user._id,
          updatedAt: now,
          createdAt: now,
        });
      }
    }

    return { success: true, message: "Default settings initialized" };
  },
});
