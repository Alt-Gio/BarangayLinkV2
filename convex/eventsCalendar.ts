import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

// Create a new event
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("meeting"),
      v.literal("community"),
      v.literal("project"),
      v.literal("emergency")
    ),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    maxAttendees: v.optional(v.number()),
    isPublic: v.boolean(),
    requiresApproval: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    // Check permissions - BUILDER and above can create events
    if (!["BUILDER", "MANAGER", "ADMIN"].includes(currentUser.userLevel.name)) {
      throw new Error("You don't have permission to create events");
    }

    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: args.description,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      coordinates: args.coordinates,
      organizer: currentUser._id,
      attendees: [currentUser._id], // Creator auto-joins
      maxAttendees: args.maxAttendees,
      isPublic: args.isPublic,
      requiresApproval: args.requiresApproval,
      status: "published",
      attachments: [],
    });

    // Send notification to relevant users
    if (args.isPublic && currentUser.department) {
      const departmentUsers = await ctx.db
        .query("users")
        .filter((q) => q.and(
          q.eq(q.field("department"), currentUser.department),
          q.neq(q.field("_id"), currentUser._id)
        ))
        .take(50);

      for (const user of departmentUsers) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          title: `New Event: ${args.title}`,
          message: `${currentUser.name} created a new ${args.type} event`,
          type: "info",
          category: "event",
          isRead: false,
          createdAt: Date.now(),
          actionUrl: `/events/${eventId}`,
          metadata: {
            priority: args.type === "emergency" ? "high" : "medium",
            category: "new_event",
            relatedId: String(eventId),
            data: { eventId, eventTitle: args.title, eventType: args.type },
          },
        });
      }
    }

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
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
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

// Delete an event
export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
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

// RSVP to an event
export const rsvpToEvent = mutation({
  args: {
    eventId: v.id("events"),
    action: v.union(v.literal("join"), v.literal("leave")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);

    if (!event) throw new Error("Event not found");

    // Check if event requires approval
    if (event.requiresApproval && args.action === "join") {
      // Send notification to organizer for approval
      await ctx.db.insert("notifications", {
        userId: event.organizer,
        title: "Event RSVP Request",
        message: `${currentUser.name} requested to join ${event.title}`,
        type: "info",
        category: "event_rsvp",
        isRead: false,
        createdAt: Date.now(),
        actionUrl: `/events/${args.eventId}`,
        metadata: {
          priority: "medium",
          category: "rsvp_request",
          relatedId: String(args.eventId),
          data: {
            eventId: args.eventId,
            userId: currentUser._id,
            userName: currentUser.name,
          },
        },
      });
      return { status: "pending_approval" };
    }

    // Check max attendees
    if (args.action === "join" && event.maxAttendees) {
      if (event.attendees.length >= event.maxAttendees) {
        throw new Error("Event is at full capacity");
      }
    }

    if (args.action === "join") {
      if (!event.attendees.includes(currentUser._id)) {
        await ctx.db.patch(args.eventId, {
          attendees: [...event.attendees, currentUser._id],
        });
      }
    } else {
      await ctx.db.patch(args.eventId, {
        attendees: event.attendees.filter(id => id !== currentUser._id),
      });
    }

    return { status: "success" };
  },
});

// Get all events with enriched data
export const getAllEvents = query({
  args: {
    type: v.optional(v.union(
      v.literal("meeting"),
      v.literal("community"),
      v.literal("project"),
      v.literal("emergency"),
      v.literal("all")
    )),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      
      let eventsQuery = ctx.db.query("events");
      
      if (args.status) {
        eventsQuery = eventsQuery.filter((q) => q.eq(q.field("status"), args.status));
      }
      
      let events = await eventsQuery.order("desc").collect();

      // Filter by type
      if (args.type && args.type !== "all") {
        events = events.filter(e => e.type === args.type);
      }

      // Filter based on permissions
      if (currentUser.userLevel.name !== "ADMIN") {
        events = events.filter(e =>
          e.isPublic ||
          e.attendees.includes(currentUser._id) ||
          e.organizer === currentUser._id
        );
      }

      // Enrich with organizer data
      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          const organizer = await ctx.db.get(event.organizer);
          const organizerLevel = organizer ? await ctx.db.get(organizer.userLevel) : null;
          
          // Get attendee details
          const attendees = await Promise.all(
            event.attendees.slice(0, 10).map(async (userId) => {
              const user = await ctx.db.get(userId);
              return user ? {
                _id: user._id,
                name: user.name,
                imageUrl: user.imageUrl,
              } : null;
            })
          );

          return {
            ...event,
            organizer: organizer ? {
              _id: organizer._id,
              name: organizer.name,
              imageUrl: organizer.imageUrl,
              department: organizer.department,
              userLevel: organizerLevel,
            } : null,
            attendeesList: attendees.filter(Boolean),
            attendeeCount: event.attendees.length,
            isUserAttending: event.attendees.includes(currentUser._id),
            canEdit: event.organizer === currentUser._id || currentUser.userLevel.name === "ADMIN",
          };
        })
      );

      return enrichedEvents;
    } catch (error) {
      // Return public events only for unauthenticated users
      const publicEvents = await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .order("desc")
        .take(50);
      
      return publicEvents.map(event => ({
        ...event,
        attendeeCount: event.attendees.length,
        isUserAttending: false,
        canEdit: false,
      }));
    }
  },
});

// Get events in a date range (for calendar view)
export const getEventsInRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getCurrentUser(ctx);
      
      let events = await ctx.db
        .query("events")
        .filter((q) => q.and(
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("startDate"), args.endDate)
        ))
        .order("asc")
        .collect();

      // Filter based on permissions
      if (currentUser.userLevel.name !== "ADMIN") {
        events = events.filter(e =>
          e.isPublic ||
          e.attendees.includes(currentUser._id) ||
          e.organizer === currentUser._id
        );
      }

      // Enrich events
      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          const organizer = await ctx.db.get(event.organizer);
          return {
            ...event,
            organizerName: organizer?.name || "Unknown",
            organizerImage: organizer?.imageUrl,
            attendeeCount: event.attendees.length,
            isUserAttending: event.attendees.includes(currentUser._id),
          };
        })
      );

      return enrichedEvents;
    } catch (error) {
      // Return public events for unauthenticated users
      const publicEvents = await ctx.db
        .query("events")
        .filter((q) => q.and(
          q.eq(q.field("isPublic"), true),
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("startDate"), args.endDate)
        ))
        .order("asc")
        .take(100);

      return publicEvents.map(event => ({
        ...event,
        attendeeCount: event.attendees.length,
        isUserAttending: false,
      }));
    }
  },
});

// Get single event details
export const getEventById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    try {
      const currentUser = await getCurrentUser(ctx);
      
      // Check permission
      if (!event.isPublic &&
          event.organizer !== currentUser._id &&
          !event.attendees.includes(currentUser._id) &&
          currentUser.userLevel.name !== "ADMIN") {
        return null;
      }

      const organizer = await ctx.db.get(event.organizer);
      const organizerLevel = organizer ? await ctx.db.get(organizer.userLevel) : null;
      
      // Get all attendee details
      const attendees = await Promise.all(
        event.attendees.map(async (userId) => {
          const user = await ctx.db.get(userId);
          const userLevel = user ? await ctx.db.get(user.userLevel) : null;
          return user ? {
            _id: user._id,
            name: user.name,
            imageUrl: user.imageUrl,
            department: user.department,
            userLevel: userLevel,
          } : null;
        })
      );

      return {
        ...event,
        organizer: organizer ? {
          _id: organizer._id,
          name: organizer.name,
          imageUrl: organizer.imageUrl,
          department: organizer.department,
          userLevel: organizerLevel,
        } : null,
        attendeesList: attendees.filter(Boolean),
        isUserAttending: event.attendees.includes(currentUser._id),
        canEdit: event.organizer === currentUser._id || currentUser.userLevel.name === "ADMIN",
      };
    } catch (error) {
      // Public access for unauthenticated users
      if (!event.isPublic) return null;
      
      return {
        ...event,
        attendeeCount: event.attendees.length,
        isUserAttending: false,
        canEdit: false,
      };
    }
  },
});

// Get upcoming events
export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    try {
      const currentUser = await getCurrentUser(ctx);
      
      let events = await ctx.db
        .query("events")
        .filter((q) => q.and(
          q.gte(q.field("startDate"), now),
          q.eq(q.field("status"), "published")
        ))
        .order("asc")
        .take(args.limit || 20);

      // Filter based on permissions
      if (currentUser.userLevel.name !== "ADMIN") {
        events = events.filter(e =>
          e.isPublic ||
          e.attendees.includes(currentUser._id) ||
          e.organizer === currentUser._id
        );
      }

      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          const organizer = await ctx.db.get(event.organizer);
          return {
            ...event,
            organizerName: organizer?.name || "Unknown",
            organizerImage: organizer?.imageUrl,
            attendeeCount: event.attendees.length,
            isUserAttending: event.attendees.includes(currentUser._id),
          };
        })
      );

      return enrichedEvents;
    } catch (error) {
      const publicEvents = await ctx.db
        .query("events")
        .filter((q) => q.and(
          q.eq(q.field("isPublic"), true),
          q.gte(q.field("startDate"), now)
        ))
        .order("asc")
        .take(args.limit || 20);

      return publicEvents.map(event => ({
        ...event,
        attendeeCount: event.attendees.length,
        isUserAttending: false,
      }));
    }
  },
});
