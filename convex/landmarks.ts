import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all landmarks
export const getAllLandmarks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("landmarks").collect();
  },
});

// Get Barangay Hall coordinates (system setting)
export const getBarangayHallCoordinates = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("systemSettings")
      .filter((q) => q.eq(q.field("key"), "barangayHallCoordinates"))
      .first();
    
    return settings?.value || {
      latitude: 13.1469299,
      longitude: 123.7494046
    };
  },
});

// Update Barangay Hall coordinates
export const updateBarangayHallCoordinates = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("systemSettings")
      .filter((q) => q.eq(q.field("key"), "barangayHallCoordinates"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: {
          latitude: args.latitude,
          longitude: args.longitude,
        },
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemSettings", {
        key: "barangayHallCoordinates",
        value: {
          latitude: args.latitude,
          longitude: args.longitude,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Create new landmark
export const createLandmark = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    googleMapsUrl: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const landmarkId = await ctx.db.insert("landmarks", {
      name: args.name,
      icon: args.icon,
      color: args.color,
      latitude: args.latitude,
      longitude: args.longitude,
      googleMapsUrl: args.googleMapsUrl,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return landmarkId;
  },
});

// Update landmark
export const updateLandmark = mutation({
  args: {
    id: v.id("landmarks"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    googleMapsUrl: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      icon: args.icon,
      color: args.color,
      latitude: args.latitude,
      longitude: args.longitude,
      googleMapsUrl: args.googleMapsUrl,
      description: args.description,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete landmark
export const deleteLandmark = mutation({
  args: {
    id: v.id("landmarks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Get projects without coordinates
export const getProjectsWithoutCoordinates = query({
  args: {},
  handler: async (ctx) => {
    const allProjects = await ctx.db.query("projects").collect();
    
    return allProjects.filter(
      (project) => !project.coordinates?.latitude || !project.coordinates?.longitude
    );
  },
});

// Get events without coordinates
export const getEventsWithoutCoordinates = query({
  args: {},
  handler: async (ctx) => {
    const allEvents = await ctx.db.query("events").collect();
    
    return allEvents.filter(
      (event) => !event.coordinates?.latitude || !event.coordinates?.longitude
    );
  },
});

// Bulk update project coordinates
export const updateProjectCoordinates = mutation({
  args: {
    projectId: v.id("projects"),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      coordinates: {
        latitude: args.latitude,
        longitude: args.longitude,
      },
    });

    return { success: true };
  },
});

// Bulk update event coordinates
export const updateEventCoordinates = mutation({
  args: {
    eventId: v.id("events"),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      coordinates: {
        latitude: args.latitude,
        longitude: args.longitude,
      },
    });

    return { success: true };
  },
});
