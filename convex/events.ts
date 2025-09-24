import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

export const createProjectEvent = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency")),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    
    return await ctx.db.insert("events", {
      title: args.title,
      description: args.description,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      organizer: currentUser._id,
      attendees: [currentUser._id],
      maxAttendees: args.maxAttendees,
      isPublic: true,
      requiresApproval: false,
      status: "published",
      attachments: []
    });
  },
});

export const getProjectEvents = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // For now, return all events since we don't have projectId field in events table
    // TODO: Add projectId field to events schema
    return await ctx.db
      .query("events")
      .order("desc")
      .collect();
  },
});

export const joinEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    if (!event.attendees.includes(currentUser._id)) {
      await ctx.db.patch(args.eventId, {
        attendees: [...event.attendees, currentUser._id]
      });
    }
    
    return args.eventId;
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")))
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer or ADMIN can edit
    if (event.organizer !== currentUser._id && currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Not authorized to edit this event");
    }
    
    const { eventId, ...updateData } = args;
    await ctx.db.patch(args.eventId, updateData);
    
    return args.eventId;
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer or ADMIN can delete
    if (event.organizer !== currentUser._id && currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Not authorized to delete this event");
    }
    
    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});
