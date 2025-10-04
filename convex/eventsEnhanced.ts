import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

// Create project event (milestone, deadline, meeting)
export const createProjectEvent = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency")),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    isPublic: v.boolean(),
    requiresApproval: v.boolean(),
    maxAttendees: v.optional(v.number()),
    notifyTeam: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const project = await ctx.db.get(args.projectId);
    
    if (!project) throw new Error("Project not found");
    
    // Check if user can create events for this project
    const canCreate = currentUser.userLevel.name === "ADMIN" ||
                     (currentUser.userLevel.name === "MANAGER" && project.department === currentUser.department) ||
                     project.assignedTo.includes(currentUser._id) ||
                     project.createdBy === currentUser._id;
    
    if (!canCreate) throw new Error("You cannot create events for this project");
    
    // Create the event
    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: `${args.description}\n\nProject: ${project.title} (ID: ${args.projectId})`,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      organizer: currentUser._id,
      attendees: [...project.assignedTo], // All project members are attendees
      maxAttendees: args.maxAttendees,
      isPublic: args.isPublic,
      requiresApproval: args.requiresApproval,
      status: "published",
      attachments: [],
      liveblocksRoom: project.liveblocksRoom,
    });

    // Notify project team members
    if (args.notifyTeam) {
      for (const userId of project.assignedTo) {
        if (userId !== currentUser._id) {
          await ctx.db.insert("notifications", {
            userId,
            title: `New Event: ${args.title}`,
            message: `${currentUser.name} scheduled an event for ${project.title}`,
            type: "info",
            category: "event",
            isRead: false,
            createdAt: Date.now(),
            actionUrl: `/events/${eventId}`,
            metadata: {
              priority: "medium",
              category: "project_event",
              relatedId: String(args.projectId),
              data: {
                projectId: args.projectId,
                eventId,
                eventTitle: args.title,
                eventDate: args.startDate,
                projectTitle: project.title,
              },
            },
          });
        }
      }
    }

    // If event is public, notify all department members
    if (args.isPublic) {
      const departmentUsers = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("department"), project.department))
        .collect();
      
      for (const user of departmentUsers) {
        if (!project.assignedTo.includes(user._id) && user._id !== currentUser._id) {
          await ctx.db.insert("notifications", {
            userId: user._id,
            title: `Public Event: ${args.title}`,
            message: `New public event scheduled in ${project.department} department`,
            type: "info",
            category: "event",
            isRead: false,
            createdAt: Date.now(),
            actionUrl: `/events/${eventId}`,
            metadata: {
              priority: "low",
              category: "public_event",
              relatedId: String(args.projectId),
              data: {
                eventId,
                eventTitle: args.title,
                eventDate: args.startDate,
              },
            },
          });
        }
      }
    }

    return eventId;
  },
});

// Get all events for a project
export const getProjectEvents = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];
    
    const allEvents = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("type"), "project"))
      .order("asc")
      .collect();
    
    // Filter events that reference this project
    const projectEvents = allEvents.filter(e =>
      e.description.includes(String(args.projectId)) ||
      e.liveblocksRoom === project.liveblocksRoom
    );
    
    // Enrich with organizer details
    const enrichedEvents = await Promise.all(
      projectEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        const organizerLevel = organizer ? await ctx.db.get(organizer.userLevel) : null;
        
        return {
          ...event,
          organizer: organizer ? { ...organizer, userLevel: organizerLevel } : null,
          attendeeCount: event.attendees.length,
        };
      })
    );
    
    return enrichedEvents;
  },
});

// Get upcoming events (public calendar view)
export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
    departmentFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    try {
      const currentUser = await getCurrentUser(ctx);
      
      // Get all future events
      let events = await ctx.db
        .query("events")
        .filter((q) => q.gte(q.field("startDate"), now))
        .order("asc")
        .collect();
      
      // Filter based on user role
      if (currentUser.userLevel.name === "WORKER" || currentUser.userLevel.name === "BUILDER") {
        events = events.filter(e =>
          e.isPublic ||
          e.attendees.includes(currentUser._id) ||
          e.organizer === currentUser._id
        );
      } else if (currentUser.userLevel.name === "MANAGER" && args.departmentFilter) {
        // Managers can see department events
        const deptProjects = await ctx.db
          .query("projects")
          .filter((q) => q.eq(q.field("department"), args.departmentFilter))
          .collect();
        
        const deptRooms = deptProjects.map(p => p.liveblocksRoom);
        events = events.filter(e =>
          e.isPublic ||
          e.attendees.includes(currentUser._id) ||
          (e.liveblocksRoom && deptRooms.includes(e.liveblocksRoom))
        );
      }
      
      // Enrich events with organizer info
      const enrichedEvents = await Promise.all(
        events.slice(0, args.limit || 50).map(async (event) => {
          const organizer = await ctx.db.get(event.organizer);
          return {
            ...event,
            organizerName: organizer?.name || "Unknown",
            organizerImage: organizer?.imageUrl,
          };
        })
      );
      
      return enrichedEvents;
    } catch (error) {
      // Not authenticated - return only public events
      const publicEvents = await ctx.db
        .query("events")
        .filter((q) => q.and(
          q.eq(q.field("isPublic"), true),
          q.gte(q.field("startDate"), now)
        ))
        .order("asc")
        .take(args.limit || 20);
      
      return publicEvents;
    }
  },
});

// Get events for a specific date range (calendar view)
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
      
      return events;
    } catch (error) {
      // Return public events only
      return await ctx.db
        .query("events")
        .filter((q) => q.and(
          q.eq(q.field("isPublic"), true),
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("startDate"), args.endDate)
        ))
        .order("asc")
        .take(100);
    }
  },
});

// Mark event attendance
export const markEventAttendance = mutation({
  args: {
    eventId: v.id("events"),
    attended: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Check if user is an attendee
    if (!event.attendees.includes(currentUser._id)) {
      throw new Error("You are not registered for this event");
    }
    
    // In a real implementation, you'd have a separate attendance tracking table
    // For now, we'll just send a notification to the organizer
    if (args.attended) {
      await ctx.db.insert("notifications", {
        userId: event.organizer,
        title: "Event Attendance Confirmed",
        message: `${currentUser.name} confirmed attendance for ${event.title}`,
        type: "info",
        category: "event",
        isRead: false,
        createdAt: Date.now(),
        metadata: {
          priority: "low",
          category: "event_attendance",
          relatedId: String(args.eventId),
          data: {
            eventId: args.eventId,
            eventTitle: event.title,
            userName: currentUser.name,
          },
        },
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
    const currentUser = await checkPermission(ctx, ["BUILDER", "MANAGER", "ADMIN"]);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer or admins can send reminders
    if (event.organizer !== currentUser._id && currentUser.userLevel.name !== "ADMIN") {
      throw new Error("Only the event organizer can send reminders");
    }
    
    const timeUntilEvent = Math.ceil((event.startDate - Date.now()) / (1000 * 60 * 60)); // hours
    
    for (const userId of event.attendees) {
      await ctx.db.insert("notifications", {
        userId,
        title: `Reminder: ${event.title}`,
        message: args.customMessage || `Event starts in ${timeUntilEvent} hours at ${event.location}`,
        type: "warning",
        category: "event_reminder",
        isRead: false,
        createdAt: Date.now(),
        actionUrl: `/events/${args.eventId}`,
        metadata: {
          priority: "high",
          category: "event_reminder",
          relatedId: String(args.eventId),
          data: {
            eventId: args.eventId,
            eventTitle: event.title,
            eventDate: event.startDate,
            hoursUntil: timeUntilEvent,
          },
        },
      });
    }
    
    return { sent: event.attendees.length };
  },
});
