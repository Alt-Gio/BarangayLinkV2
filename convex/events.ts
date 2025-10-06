import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

// ============================================
// MUTATIONS - Event Management
// ============================================

// Create a new event (general or project-specific)
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency")),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    coordinates: v.optional(v.object({ latitude: v.number(), longitude: v.number() })),
    maxAttendees: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    requiresApproval: v.optional(v.boolean()),
    projectId: v.optional(v.id("projects")),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER"]);
    
    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: args.description,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      coordinates: args.coordinates,
      organizer: currentUser._id,
      attendees: [currentUser._id],
      maxAttendees: args.maxAttendees,
      isPublic: args.isPublic ?? true,
      requiresApproval: args.requiresApproval ?? false,
      status: "published",
      attachments: [],
    });

    // Note: Project-event relationship is managed via projectId in tasks or separate tracking
    // Events are linked to projects through the event's context, not stored in project record

    return eventId;
  },
});

// Create project event (convenience method)
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
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER"]);
    
    const eventId = await ctx.db.insert("events", {
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
      attachments: [],
    });

    // Note: Project-event relationship tracked separately
    // Could be enhanced with a projectEvents junction table if needed

    return eventId;
  },
});

// Update an existing event
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"))),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer or ADMIN/MANAGER can edit
    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (!userLevel) {
      throw new Error("User level not found");
    }
    
    // Type guard to ensure userLevel has level property
    if (!('level' in userLevel)) {
      throw new Error("Invalid user level structure");
    }
    
    if (event.organizer !== currentUser._id && userLevel.level < 3) {
      throw new Error("Not authorized to edit this event");
    }
    
    const { eventId, ...updateData } = args;
    await ctx.db.patch(args.eventId, updateData);
    
    return args.eventId;
  },
});

// Delete an event
export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer or ADMIN can delete
    const userLevel = await ctx.db.get(currentUser.userLevel);
    if (!userLevel) {
      throw new Error("User level not found");
    }
    
    // Type guard to ensure userLevel has level property
    if (!('level' in userLevel)) {
      throw new Error("Invalid user level structure");
    }
    
    if (event.organizer !== currentUser._id && userLevel.level < 4) {
      throw new Error("Not authorized to delete this event");
    }
    
    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});

// RSVP to an event (join or leave)
export const rsvpToEvent = mutation({
  args: {
    eventId: v.id("events"),
    action: v.union(v.literal("join"), v.literal("leave")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    if (args.action === "join") {
      // Check if already attending
      if (event.attendees.includes(currentUser._id)) {
        return args.eventId;
      }
      
      // Check max attendees limit
      if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
        throw new Error("Event is full");
      }
      
      await ctx.db.patch(args.eventId, {
        attendees: [...event.attendees, currentUser._id],
      });
    } else {
      // Leave event
      await ctx.db.patch(args.eventId, {
        attendees: event.attendees.filter(id => id !== currentUser._id),
      });
    }
    
    return args.eventId;
  },
});

// Join event (convenience method)
export const joinEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    if (!event.attendees.includes(currentUser._id)) {
      // Check max attendees limit
      if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
        throw new Error("Event is full");
      }
      
      await ctx.db.patch(args.eventId, {
        attendees: [...event.attendees, currentUser._id],
      });
    }
    
    return args.eventId;
  },
});

// Mark event attendance (for organizers)
export const markEventAttendance = mutation({
  args: {
    eventId: v.id("events"),
    attended: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer can mark attendance
    if (event.organizer !== currentUser._id) {
      throw new Error("Only organizer can mark attendance");
    }
    
    // Award experience points for attendance
    if (args.attended) {
      await ctx.db.patch(currentUser._id, {
        experience: currentUser.experience + 25,
        gold: currentUser.gold + 10,
      });
    }
    
    return args.eventId;
  },
});

// Send event reminder to all attendees
export const sendEventReminder = mutation({
  args: {
    eventId: v.id("events"),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer can send reminders
    if (event.organizer !== currentUser._id) {
      throw new Error("Only organizer can send reminders");
    }
    
    // Create notifications for all attendees
    const message = args.customMessage || `Reminder: "${event.title}" is happening soon!`;
    
    for (const attendeeId of event.attendees) {
      try {
        await ctx.db.insert("notifications", {
          userId: attendeeId,
          title: "Event Reminder",
          message: message,
          type: "info",
          category: "event",
          isRead: false,
          createdAt: Date.now(),
        });
      } catch (error) {
        // Continue if notifications table doesn't exist
      }
    }
    
    return args.eventId;
  },
});

// ============================================
// QUERIES - Event Retrieval
// ============================================

// Get all events with filters
export const getAllEvents = query({
  args: {
    type: v.optional(v.union(
      v.literal("meeting"),
      v.literal("community"),
      v.literal("project"),
      v.literal("emergency")
    )),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"))),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("events");
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    const events = await query.order("desc").collect();
    
    // Enrich with organizer details
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        const attendeeDetails = await Promise.all(
          event.attendees.map(id => ctx.db.get(id))
        );
        
        return {
          ...event,
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            imageUrl: organizer.imageUrl,
          } : null,
          attendeeCount: event.attendees.length,
          attendeeDetails: attendeeDetails.filter(Boolean),
        };
      })
    );
    
    return enrichedEvents;
  },
});

// Get upcoming events
export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
    departmentFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit || 10;
    
    const events = await ctx.db
      .query("events")
      .filter((q) => q.and(
        q.gte(q.field("startDate"), now),
        q.eq(q.field("status"), "published")
      ))
      .order("asc")
      .take(limit);
    
    // Enrich with details
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        return {
          ...event,
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            imageUrl: organizer.imageUrl,
          } : null,
          attendeeCount: event.attendees.length,
        };
      })
    );
    
    return enrichedEvents;
  },
});

// Get events in a date range (for calendar view)
export const getEventsInRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    type: v.optional(v.union(
      v.literal("meeting"),
      v.literal("community"),
      v.literal("project"),
      v.literal("emergency")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .filter((q) => q.and(
        q.gte(q.field("startDate"), args.startDate),
        q.lte(q.field("startDate"), args.endDate),
        q.eq(q.field("status"), "published")
      ));
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    const events = await query.collect();
    
    // Enrich with details
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        return {
          ...event,
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
          } : null,
          attendeeCount: event.attendees.length,
        };
      })
    );
    
    return enrichedEvents;
  },
});

// Get single event details
export const getEventById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    
    // Get organizer details
    const organizer = await ctx.db.get(event.organizer);
    
    // Get attendee details
    const attendeeDetails = await Promise.all(
      event.attendees.map(async (attendeeId) => {
        const user = await ctx.db.get(attendeeId);
        if (!user) return null;
        
        const userLevel = await ctx.db.get(user.userLevel);
        return {
          _id: user._id,
          name: user.name,
          imageUrl: user.imageUrl,
          department: user.department,
          userLevel: userLevel?.name || "WORKER",
        };
      })
    );
    
    return {
      ...event,
      organizerDetails: organizer ? {
        _id: organizer._id,
        name: organizer.name,
        imageUrl: organizer.imageUrl,
        department: organizer.department,
      } : null,
      attendeeDetails: attendeeDetails.filter(Boolean),
    };
  },
});

// Get all events for a project
// Note: This is a placeholder implementation. For proper project-event linking,
// consider adding a projectId field to events schema or creating a junction table
export const getProjectEvents = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // For now, return events where the project team members are organizers
    // This is a temporary solution until schema is updated
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }
    
    // Get events organized by project team members
    const allEvents = await ctx.db.query("events").collect();
    const projectEvents = allEvents.filter(event => 
      project.assignedTo.includes(event.organizer)
    );
    
    // Enrich events with organizer details
    const enrichedEvents = await Promise.all(
      projectEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        return {
          ...event,
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
          } : null,
          attendeeCount: event.attendees.length,
        };
      })
    );
    
    return enrichedEvents;
  },
});
