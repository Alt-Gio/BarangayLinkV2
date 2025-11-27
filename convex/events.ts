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
    type: v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency"), v.literal("milestone")),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    coordinates: v.optional(v.object({ latitude: v.number(), longitude: v.number() })),
    maxAttendees: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    requiresApproval: v.optional(v.boolean()),
    allowPublicRSVP: v.optional(v.boolean()),
    allowDocumentUpload: v.optional(v.boolean()),
    projectId: v.optional(v.id("projects")),
    imageUrl: v.optional(v.string()),
    department: v.optional(v.string()),
    milestoneTaskCount: v.optional(v.number()), // For milestone events
    enableEasyAttendance: v.optional(v.boolean()), // Easy attendance via code/QR
    enableSmartVision: v.optional(v.boolean()), // Camera check-in with hand detection
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER", "WORKER"]);
    
    // Get user level to determine event status
    const userLevel = typeof currentUser.userLevel === 'object' && currentUser.userLevel !== null && 'level' in currentUser.userLevel
      ? currentUser.userLevel.level
      : 0;
    
    // Builder (2) and Worker (1) events go to pending if requiresApproval is true
    // Manager (4) and Admin (5) events are published immediately
    const eventStatus = (userLevel < 4 && args.requiresApproval) ? "pending" : "published";
    
    // Generate join code if Easy Attendance is enabled
    let joinCode: string | undefined;
    if (args.enableEasyAttendance) {
      let attempts = 0;
      do {
        joinCode = Math.floor(1000 + Math.random() * 9000).toString();
        const existing = await ctx.db
          .query("events")
          .withIndex("by_join_code", q => q.eq("joinCode", joinCode))
          .first();
        if (!existing) break;
        attempts++;
      } while (attempts < 10);
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
      attendees: [currentUser._id],
      maxAttendees: args.maxAttendees,
      isPublic: args.isPublic ?? true,
      requiresApproval: args.requiresApproval ?? false,
      allowPublicRSVP: args.allowPublicRSVP ?? false,
      allowDocumentUpload: args.allowDocumentUpload ?? false,
      status: eventStatus,
      projectId: args.projectId, // Link to project
      imageUrl: args.imageUrl, // Event image
      publicAttendees: [],
      attachments: [],
      milestoneTaskCount: args.milestoneTaskCount, // For milestones
      // Easy Attendance & Smart Vision
      enableEasyAttendance: args.enableEasyAttendance ?? false,
      enableSmartVision: args.enableSmartVision ?? false,
      joinCode: joinCode,
      guestAttendees: [],
    });

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
    type: v.optional(v.union(v.literal("meeting"), v.literal("community"), v.literal("project"), v.literal("emergency"), v.literal("milestone"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    coordinates: v.optional(v.object({ latitude: v.number(), longitude: v.number() })),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"))),
    maxAttendees: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    requiresApproval: v.optional(v.boolean()),
    allowPublicRSVP: v.optional(v.boolean()),
    allowDocumentUpload: v.optional(v.boolean()),
    enableEasyAttendance: v.optional(v.boolean()),
    enableSmartVision: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer or ADMIN/MANAGER can edit
    const userLevel = typeof currentUser.userLevel === 'object' && currentUser.userLevel !== null && '_id' in currentUser.userLevel
      ? currentUser.userLevel
      : await ctx.db.get(currentUser.userLevel as any);
    
    if (!userLevel) {
      throw new Error("User level not found");
    }
    
    // Type guard to ensure userLevel has level property
    if (!('level' in userLevel)) {
      throw new Error("Invalid user level structure");
    }
    
    if (event.organizer !== currentUser._id && userLevel.level < 4) {
      throw new Error("You cannot edit this event because you are not the organizer");
    }
    
    const { eventId, ...updateData } = args;
    
    // Generate join code if enabling easy attendance for the first time
    let joinCode = event.joinCode;
    if (args.enableEasyAttendance && !joinCode) {
      let attempts = 0;
      do {
        joinCode = Math.floor(1000 + Math.random() * 9000).toString();
        const existing = await ctx.db
          .query("events")
          .withIndex("by_join_code", q => q.eq("joinCode", joinCode))
          .first();
        if (!existing) break;
        attempts++;
      } while (attempts < 10);
      (updateData as any).joinCode = joinCode;
    }
    
    await ctx.db.patch(args.eventId, updateData);
    
    return args.eventId;
  },
});

// Archive an event (soft delete)
export const archiveEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only organizer or ADMIN/MANAGER can archive
    // Check if userLevel is already an object or if we need to fetch it
    const userLevel = typeof currentUser.userLevel === 'object' && currentUser.userLevel !== null && '_id' in currentUser.userLevel
      ? currentUser.userLevel
      : await ctx.db.get(currentUser.userLevel as any);
    
    if (!userLevel) {
      throw new Error("User level not found");
    }
    
    if (!('level' in userLevel)) {
      throw new Error("Invalid user level structure");
    }
    
    if (event.organizer !== currentUser._id && userLevel.level < 3) {
      throw new Error("Not authorized to archive this event");
    }
    
    await ctx.db.patch(args.eventId, {
      status: "archived",
      archivedAt: Date.now(),
      archivedBy: currentUser._id,
    });
    
    return args.eventId;
  },
});

// Restore an archived event
export const restoreEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    if (event.status !== "archived") throw new Error("Event is not archived");
    
    // Only organizer or ADMIN/MANAGER can restore
    const userLevel = typeof currentUser.userLevel === 'object' && currentUser.userLevel !== null && '_id' in currentUser.userLevel
      ? currentUser.userLevel
      : await ctx.db.get(currentUser.userLevel as any);
    
    if (!userLevel) {
      throw new Error("User level not found");
    }
    
    if (!('level' in userLevel)) {
      throw new Error("Invalid user level structure");
    }
    
    if (event.organizer !== currentUser._id && userLevel.level < 3) {
      throw new Error("Not authorized to restore this event");
    }
    
    await ctx.db.patch(args.eventId, {
      status: "published",
      archivedAt: undefined,
      archivedBy: undefined,
    });
    
    return args.eventId;
  },
});

// Delete an event (permanent - only for ADMIN)
export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Only ADMIN can permanently delete
    const userLevel = typeof currentUser.userLevel === 'object' && currentUser.userLevel !== null && '_id' in currentUser.userLevel
      ? currentUser.userLevel
      : await ctx.db.get(currentUser.userLevel as any);
    
    if (!userLevel) {
      throw new Error("User level not found");
    }
    
    if (!('level' in userLevel)) {
      throw new Error("Invalid user level structure");
    }
    
    if (userLevel.level < 4) {
      throw new Error("Only administrators can permanently delete events");
    }
    
    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});

// RSVP to an event (join or leave) - supports both authenticated and public users
export const rsvpToEvent = mutation({
  args: {
    eventId: v.id("events"),
    action: v.union(v.literal("join"), v.literal("leave")),
    attendeeInfo: v.optional(v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      documentStorageId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Try to get current user (may be null for public RSVP)
    let currentUser;
    try {
      currentUser = await getCurrentUser(ctx);
    } catch {
      currentUser = null;
    }
    
    if (args.action === "join") {
      // Check max attendees limit
      if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
        throw new Error("Event is full");
      }
      
      if (currentUser) {
        // Authenticated user RSVP
        if (event.attendees.includes(currentUser._id)) {
          return args.eventId;
        }
        
        await ctx.db.patch(args.eventId, {
          attendees: [...event.attendees, currentUser._id],
        });
      } else if (args.attendeeInfo) {
        // Public RSVP - add to publicAttendees array and create document
        const { firstName, lastName, email, documentStorageId } = args.attendeeInfo;
        
        const publicAttendees = event.publicAttendees || [];
        
        // Check if already registered
        const alreadyRegistered = publicAttendees.some(
          att => att.email.toLowerCase() === email.toLowerCase()
        );
        
        if (!alreadyRegistered) {
          // Get document URL if uploaded
          let documentId: string | undefined;
          if (documentStorageId) {
            documentId = await ctx.storage.getUrl(documentStorageId) || undefined;
          }

          // Add to event's publicAttendees array
          const newPublicAttendees = [
            ...publicAttendees,
            {
              firstName,
              lastName,
              email,
              joinedAt: Date.now(),
              documentId,
              documentStorageId,
            }
          ];
          
          await ctx.db.patch(args.eventId, {
            publicAttendees: newPublicAttendees,
          });
          
          // Find or create ONE attendance document per event
          const existingDoc = await ctx.db
            .query("documents")
            .filter(q => 
              q.and(
                q.eq(q.field("category"), "attendance"),
                q.eq(q.field("eventId"), args.eventId)
              )
            )
            .first();
          
          // Build attendee list string
          const attendeeList = newPublicAttendees
            .map((att, index) => 
              `${index + 1}. ${att.firstName} ${att.lastName}\n   Email: ${att.email}\n   Joined: ${new Date(att.joinedAt).toLocaleString()}${att.documentId ? '\n   Document: Uploaded ✓' : ''}`
            )
            .join('\n\n');
          
          const description = `EVENT: ${event.title}
TYPE: ${event.type}
LOCATION: ${event.location}
DATE: ${new Date(event.startDate).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATTENDEES (${newPublicAttendees.length} Total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${attendeeList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last Updated: ${new Date().toLocaleString()}`;
          
          if (existingDoc) {
            // Update existing document
            await ctx.db.patch(existingDoc._id, {
              description,
              fileSize: description.length,
              originalName: `Attendance: ${event.title} (${newPublicAttendees.length} attendees)`,
            });
          } else {
            // Create new attendance document
            await ctx.db.insert("documents", {
              fileName: `attendance-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.txt`,
              originalName: `Attendance: ${event.title} (${newPublicAttendees.length} attendees)`,
              fileSize: description.length,
              mimeType: "text/plain",
              storageId: `attendance-${args.eventId}`,
              category: "attendance",
              tags: ["attendance", event.type, "event-rsvp"],
              description,
              isPublic: false,
              accessLevel: "internal",
              eventId: args.eventId,
              uploadedBy: event.organizer,
            });
          }
        }
      }
    } else {
      // Leave event (only for authenticated users)
      if (currentUser) {
        await ctx.db.patch(args.eventId, {
          attendees: event.attendees.filter(id => id !== currentUser._id),
        });
      }
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
    
    const events = await query.order("desc").take(100); // OPTIMIZED: Limit to 100 events for faster loading
    
    // Enrich with organizer details and project information
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        const attendeeDetails = await Promise.all(
          event.attendees.map(id => ctx.db.get(id))
        );
        
        // Fetch project details if event is linked to a project
        let projectName = null;
        if (event.projectId) {
          const project = await ctx.db.get(event.projectId);
          projectName = project?.title || null;
        }
        
        return {
          ...event,
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            imageUrl: organizer.imageUrl,
          } : null,
          attendeeCount: event.attendees.length,
          attendeeDetails: attendeeDetails.filter(Boolean),
          projectName, // Add project name to the event data
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
        q.eq(q.field("status"), "published"),
        q.eq(q.field("isPublic"), true)
      ))
      .collect();
    
    // Sort by startDate and take limit
    const sortedEvents = events
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, limit);
    
    // Enrich with details and project information
    const enrichedEvents = await Promise.all(
      sortedEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        
        // Fetch project details if event is linked to a project
        let projectName = null;
        if (event.projectId) {
          const project = await ctx.db.get(event.projectId);
          projectName = project?.title || null;
        }
        
        // Convert imageUrl storage ID to actual URL
        let imageUrl = event.imageUrl;
        if (event.imageUrl) {
          const url = await ctx.storage.getUrl(event.imageUrl as any);
          imageUrl = url ?? event.imageUrl;
        }
        
        return {
          ...event,
          imageUrl, // Use converted URL
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            imageUrl: organizer.imageUrl,
          } : null,
          attendeeCount: event.attendees.length,
          projectName, // Add project name
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

// Get all events for a specific project
export const getProjectEvents = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Get events directly linked to this project via projectId
    // This includes events created from both:
    // 1. The Project Events Tab (with projectId set)
    // 2. The main Events page with this project linked
    const allEvents = await ctx.db.query("events").take(500); // OPTIMIZED: Limit to 500 events
    const projectEvents = allEvents.filter(event => 
      event.projectId && event.projectId === args.projectId
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
            imageUrl: organizer.imageUrl,
          } : null,
          attendeeCount: event.attendees.length,
        };
      })
    );
    
    // Sort by start date (upcoming first)
    return enrichedEvents.sort((a, b) => a.startDate - b.startDate);
  },
});

// Get archived events
export const getArchivedEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("status"), "archived"))
      .order("desc")
      .take(100); // OPTIMIZED: Limit archived events
    
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        const archivedBy = event.archivedBy ? await ctx.db.get(event.archivedBy) : null;
        
        return {
          ...event,
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            imageUrl: organizer.imageUrl,
          } : null,
          archivedByDetails: archivedBy ? {
            _id: archivedBy._id,
            name: archivedBy.name,
          } : null,
          attendeeCount: event.attendees.length,
        };
      })
    );
    
    return enrichedEvents;
  },
});

// Get events by project using projectId field
export const getEventsByProject = query({
args: { projectId: v.id("projects") },
handler: async (ctx, args) => {
  const events = await ctx.db
    .query("events")
    .filter((q) => q.and(
      q.eq(q.field("projectId"), args.projectId),
      q.neq(q.field("status"), "archived")
    ))
    .order("desc")
    .take(100); // OPTIMIZED: Limit export data
  
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

// Export events data for CSV/iCal
export const getEventsForExport = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("events");
    
    if (!args.includeArchived) {
      query = query.filter((q) => q.neq(q.field("status"), "archived"));
    }
    
    const events = await query.take(200); // OPTIMIZED: Limit to 200 events for search
    
    let filteredEvents = events;
    if (args.startDate && args.endDate) {
      filteredEvents = events.filter(e => 
        e.startDate >= args.startDate! && e.startDate <= args.endDate!
      );
    }
    
    const exportData = await Promise.all(
      filteredEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        const attendees = await Promise.all(
          event.attendees.map(id => ctx.db.get(id))
        );
        
        return {
          id: event._id,
          title: event.title,
          description: event.description,
          type: event.type,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          organizer: organizer?.name || "Unknown",
          organizerEmail: organizer?.email || "",
          attendeeCount: event.attendees.length,
          attendeeNames: attendees.filter(Boolean).map(a => a!.name).join(", "),
          maxAttendees: event.maxAttendees,
          isPublic: event.isPublic,
          requiresApproval: event.requiresApproval,
          createdAt: event._creationTime,
        };
      })
    );
    
    return exportData;
  },
});

// Get pending events for approval (Manager+ only)
export const getPendingEvents = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    
    const pendingEvents = await ctx.db
      .query("events")
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect();
    
    // Get organizer details for each event
    const eventsWithOrganizers = await Promise.all(
      pendingEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        
        // Convert imageUrl storage ID to actual URL
        let imageUrl = event.imageUrl;
        if (event.imageUrl) {
          const url = await ctx.storage.getUrl(event.imageUrl as any);
          imageUrl = url ?? event.imageUrl;
        }
        
        return {
          ...event,
          imageUrl, // Use converted URL
          organizerName: organizer?.name || "Unknown",
          organizerEmail: organizer?.email || "",
        };
      })
    );
    
    return eventsWithOrganizers;
  },
});

// Get approved events (Manager+ only)
export const getApprovedEvents = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    
    const approvedEvents = await ctx.db
      .query("events")
      .filter(q => q.eq(q.field("status"), "published"))
      .collect();
    
    const eventsWithOrganizers = await Promise.all(
      approvedEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        let imageUrl = event.imageUrl;
        if (event.imageUrl) {
          const url = await ctx.storage.getUrl(event.imageUrl as any);
          imageUrl = url ?? event.imageUrl;
        }
        return {
          ...event,
          imageUrl,
          organizerName: organizer?.name || "Unknown",
          organizerEmail: organizer?.email || "",
        };
      })
    );
    
    return eventsWithOrganizers;
  },
});

// Get rejected events (Manager+ only)
export const getRejectedEvents = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    
    const rejectedEvents = await ctx.db
      .query("events")
      .filter(q => q.eq(q.field("status"), "cancelled"))
      .collect();
    
    const eventsWithOrganizers = await Promise.all(
      rejectedEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        let imageUrl = event.imageUrl;
        if (event.imageUrl) {
          const url = await ctx.storage.getUrl(event.imageUrl as any);
          imageUrl = url ?? event.imageUrl;
        }
        return {
          ...event,
          imageUrl,
          organizerName: organizer?.name || "Unknown",
          organizerEmail: organizer?.email || "",
        };
      })
    );
    
    return eventsWithOrganizers;
  },
});

// Get all reviewed events (approved + rejected) (Manager+ only)
export const getAllReviewedEvents = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    
    const allEvents = await ctx.db
      .query("events")
      .collect();
    
    const reviewedEvents = allEvents.filter(e => 
      e.status === "published" || e.status === "cancelled"
    );
    
    const eventsWithOrganizers = await Promise.all(
      reviewedEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        let imageUrl = event.imageUrl;
        if (event.imageUrl) {
          const url = await ctx.storage.getUrl(event.imageUrl as any);
          imageUrl = url ?? event.imageUrl;
        }
        return {
          ...event,
          imageUrl,
          organizerName: organizer?.name || "Unknown",
          organizerEmail: organizer?.email || "",
        };
      })
    );
    
    return eventsWithOrganizers;
  },
});

// Approve event (Manager+ only)
export const approveEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    
    if (event.status !== "pending") {
      throw new Error("Event is not pending approval");
    }
    
    await ctx.db.patch(args.eventId, {
      status: "published",
    });
    
    return args.eventId;
  },
});

// Reject event (Manager+ only)
export const rejectEvent = mutation({
  args: { 
    eventId: v.id("events"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    
    if (event.status !== "pending") {
      throw new Error("Event is not pending approval");
    }
    
    await ctx.db.patch(args.eventId, {
      status: "cancelled",
    });
    
    // TODO: Optionally notify the event organizer about rejection
    
    return args.eventId;
  },
});

// DEBUG: Get ALL events with their details (for troubleshooting)
export const debugGetAllEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const now = Date.now();
    
    return events.map(event => ({
      _id: event._id,
      title: event.title,
      type: event.type,
      status: event.status,
      isPublic: event.isPublic,
      requiresApproval: event.requiresApproval,
      allowPublicRSVP: event.allowPublicRSVP,
      startDate: event.startDate,
      isFuture: event.startDate >= now,
      startDateFormatted: new Date(event.startDate).toLocaleString(),
      _creationTime: event._creationTime,
      createdAt: new Date(event._creationTime).toLocaleString(),
    }));
  },
});

// Generate upload URL for event RSVP documents (proof of citizenship, etc.)
export const generateEventDocumentUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ============================================
// EASY ATTENDANCE SYSTEM (Code/QR Join)
// ============================================

// Generate a unique 4-digit join code for an event
export const generateJoinCode = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    
    // Generate a unique 4-digit code
    let code: string;
    let attempts = 0;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await ctx.db
        .query("events")
        .withIndex("by_join_code", q => q.eq("joinCode", code))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);
    
    await ctx.db.patch(args.eventId, { joinCode: code });
    return code;
  },
});

// Get event by join code (public - no auth required)
export const getEventByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_join_code", q => q.eq("joinCode", args.joinCode))
      .first();
    
    if (!event) return null;
    if (!event.enableEasyAttendance) return null;
    if (event.status !== "published") return null;
    
    return {
      _id: event._id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      imageUrl: event.imageUrl,
      guestCount: event.guestAttendees?.length || 0,
      attendeeCount: event.attendees.length,
      welcomeMessage: event.welcomeMessage,
      checkInInfoText: event.checkInInfoText,
    };
  },
});

// Guest check-in via code or QR (no account needed)
export const guestCheckIn = mutation({
  args: {
    joinCode: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    joinMethod: v.union(v.literal("code"), v.literal("qr"), v.literal("camera"), v.literal("scanner")),
    photoUrl: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_join_code", q => q.eq("joinCode", args.joinCode))
      .first();
    
    if (!event) throw new Error("Invalid join code");
    if (!event.enableEasyAttendance) throw new Error("Easy attendance not enabled for this event");
    if (event.status !== "published") throw new Error("Event is not active");
    
    // Check if guest already exists
    const existingGuests = event.guestAttendees || [];
    const alreadyJoined = existingGuests.find(
      g => g.firstName.toLowerCase() === args.firstName.toLowerCase() && 
           g.lastName.toLowerCase() === args.lastName.toLowerCase()
    );
    
    if (alreadyJoined) {
      throw new Error("You have already checked in to this event");
    }
    
    // Add guest to event
    const newGuest = {
      firstName: args.firstName,
      lastName: args.lastName,
      joinedAt: Date.now(),
      joinMethod: args.joinMethod,
      photoUrl: args.photoUrl,
      message: args.message,
    };
    
    await ctx.db.patch(event._id, {
      guestAttendees: [...existingGuests, newGuest],
    });
    
    return {
      success: true,
      message: `Welcome, ${args.firstName}! You have successfully checked in.`,
      eventTitle: event.title,
      guestNumber: existingGuests.length + 1,
      welcomeMessage: event.welcomeMessage,
    };
  },
});

// Get live guest feed for an event (for dashboard display)
export const getLiveGuestFeed = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    
    const guests = event.guestAttendees || [];
    // Sort by most recent first
    const sortedGuests = [...guests].sort((a, b) => b.joinedAt - a.joinedAt);
    
    return {
      totalGuests: guests.length,
      totalAttendees: event.attendees.length + guests.length,
      recentGuests: sortedGuests.slice(0, 10), // Last 10 check-ins
      joinCode: event.joinCode,
      enableEasyAttendance: event.enableEasyAttendance,
      enableSmartVision: event.enableSmartVision,
      welcomeMessage: event.welcomeMessage,
      checkInInfoText: event.checkInInfoText,
    };
  },
});

// Update event Easy Attendance settings
export const updateEasyAttendanceSettings = mutation({
  args: {
    eventId: v.id("events"),
    enableEasyAttendance: v.boolean(),
    enableSmartVision: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    // Generate join code if enabling easy attendance
    let joinCode = event.joinCode;
    if (args.enableEasyAttendance && !joinCode) {
      let attempts = 0;
      do {
        joinCode = Math.floor(1000 + Math.random() * 9000).toString();
        const existing = await ctx.db
          .query("events")
          .withIndex("by_join_code", q => q.eq("joinCode", joinCode))
          .first();
        if (!existing) break;
        attempts++;
      } while (attempts < 10);
    }
    
    await ctx.db.patch(args.eventId, {
      enableEasyAttendance: args.enableEasyAttendance,
      enableSmartVision: args.enableSmartVision,
      joinCode: args.enableEasyAttendance ? joinCode : undefined,
      guestAttendees: event.guestAttendees || [],
    });
    
    return { success: true, joinCode };
  },
});

// Update event welcome message and check-in info
export const updateEventWelcomeSettings = mutation({
  args: {
    eventId: v.id("events"),
    welcomeMessage: v.optional(v.string()),
    checkInInfoText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    await ctx.db.patch(args.eventId, {
      welcomeMessage: args.welcomeMessage,
      checkInInfoText: args.checkInInfoText,
    });
    
    return { success: true };
  },
});
