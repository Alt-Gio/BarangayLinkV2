import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Toggle project visibility (public/private)
export const toggleProjectVisibility = mutation({
  args: {
    projectId: v.id("projects"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      isPublic: args.isPublic,
    });
    return { success: true, isPublic: args.isPublic };
  },
});

// Toggle event visibility (public/private)
export const toggleEventVisibility = mutation({
  args: {
    eventId: v.id("events"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      isPublic: args.isPublic,
    });
    return { success: true, isPublic: args.isPublic };
  },
});

// Get project details for editing
export const getProjectForEdit = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// Get event details for editing
export const getEventForEdit = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

// Quick update project coordinates from map
export const quickUpdateProjectLocation = mutation({
  args: {
    projectId: v.id("projects"),
    latitude: v.number(),
    longitude: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      coordinates: {
        latitude: args.latitude,
        longitude: args.longitude,
      },
    };
    
    if (args.location) {
      updateData.location = args.location;
    }
    
    await ctx.db.patch(args.projectId, updateData);
    return { success: true };
  },
});

// Quick update event coordinates from map
export const quickUpdateEventLocation = mutation({
  args: {
    eventId: v.id("events"),
    latitude: v.number(),
    longitude: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      coordinates: {
        latitude: args.latitude,
        longitude: args.longitude,
      },
    };
    
    if (args.location) {
      updateData.location = args.location;
    }
    
    await ctx.db.patch(args.eventId, updateData);
    return { success: true };
  },
});
