import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, checkPermission } from "./roleBasedAccess";

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
    milestoneTaskCount: v.optional(v.number()),
    enableEasyAttendance: v.optional(v.boolean()),
    enableSmartVision: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER", "BUILDER", "WORKER"]);
    
    const userLevel = typeof currentUser.userLevel === 'object' && currentUser.userLevel !== null && 'level' in currentUser.userLevel
      ? currentUser.userLevel.level
      : 0;
    
    const eventStatus = (userLevel < 4 && args.requiresApproval) ? "pending" : "published";
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
      projectId: args.projectId,
      imageUrl: args.imageUrl,
      publicAttendees: [],
      attachments: [],
      milestoneTaskCount: args.milestoneTaskCount,
      enableEasyAttendance: args.enableEasyAttendance ?? false,
      enableSmartVision: args.enableSmartVision ?? false,
      joinCode: joinCode,
      guestAttendees: [],
    });

    return eventId;
  },
});

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

    return eventId;
  },
});

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
    
    const userLevel = typeof currentUser.userLevel === 'object' && currentUser.userLevel !== null && '_id' in currentUser.userLevel
      ? currentUser.userLevel
      : await ctx.db.get(currentUser.userLevel as any);
    
    if (!userLevel) {
      throw new Error("User level not found");
    }
    
    if (!('level' in userLevel)) {
      throw new Error("Invalid user level structure");
    }
    
    if (event.organizer !== currentUser._id && userLevel.level < 4) {
      throw new Error("You cannot edit this event because you are not the organizer");
    }
    
    const { eventId, ...updateData } = args;
    
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

export const archiveEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
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

export const restoreEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    if (event.status !== "archived") throw new Error("Event is not archived");
    
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

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
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
    
    let currentUser;
    try {
      currentUser = await getCurrentUser(ctx);
    } catch {
      currentUser = null;
    }
    
    if (args.action === "join") {
      if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
        throw new Error("Event is full");
      }
      
      if (currentUser) {
        if (event.attendees.includes(currentUser._id)) {
          return args.eventId;
        }
        
        await ctx.db.patch(args.eventId, {
          attendees: [...event.attendees, currentUser._id],
        });
      } else if (args.attendeeInfo) {
        const { firstName, lastName, email, documentStorageId } = args.attendeeInfo;
        
        const publicAttendees = event.publicAttendees || [];
        
        const alreadyRegistered = publicAttendees.some(
          att => att.email.toLowerCase() === email.toLowerCase()
        );
        
        if (!alreadyRegistered) {
          let documentId: string | undefined;
          if (documentStorageId) {
            documentId = await ctx.storage.getUrl(documentStorageId) || undefined;
          }

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
          
          const existingDoc = await ctx.db
            .query("documents")
            .filter(q => 
              q.and(
                q.eq(q.field("category"), "attendance"),
                q.eq(q.field("eventId"), args.eventId)
              )
            )
            .first();
          
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
            await ctx.db.patch(existingDoc._id, {
              description,
              fileSize: description.length,
              originalName: `Attendance: ${event.title} (${newPublicAttendees.length} attendees)`,
            });
          } else {
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
      if (currentUser) {
        await ctx.db.patch(args.eventId, {
          attendees: event.attendees.filter(id => id !== currentUser._id),
        });
      }
    }
    
    return args.eventId;
  },
});

export const joinEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    if (!event.attendees.includes(currentUser._id)) {
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

export const markEventAttendance = mutation({
  args: {
    eventId: v.id("events"),
    attended: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    if (event.organizer !== currentUser._id) {
      throw new Error("Only organizer can mark attendance");
    }
    
    if (args.attended) {
      await ctx.db.patch(currentUser._id, {
        experience: currentUser.experience + 25,
        gold: currentUser.gold + 10,
      });
    }
    
    return args.eventId;
  },
});

export const sendEventReminder = mutation({
  args: {
    eventId: v.id("events"),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkPermission(ctx, ["ADMIN", "MANAGER"]);
    const event = await ctx.db.get(args.eventId);
    
    if (!event) throw new Error("Event not found");
    
    if (event.organizer !== currentUser._id) {
      throw new Error("Only organizer can send reminders");
    }
    
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
      }
    }
    
    return args.eventId;
  },
});

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
    
    const events = await query.order("desc").take(100);
    
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        const attendeeDetails = await Promise.all(
          event.attendees.map(id => ctx.db.get(id))
        );
        
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
          projectName,
        };
      })
    );
    
    return enrichedEvents;
  },
});

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
    
    const sortedEvents = events
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, limit);
    
    const enrichedEvents = await Promise.all(
      sortedEvents.map(async (event) => {
        const organizer = await ctx.db.get(event.organizer);
        
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
          imageUrl,
          organizerDetails: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            imageUrl: organizer.imageUrl,
          } : null,
          attendeeCount: event.attendees.length,
          projectName,
        };
      })
    );
    
    return enrichedEvents;
  },
});

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

export const getEventById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    
    const organizer = await ctx.db.get(event.organizer);
    
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

export const getProjectEvents = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db.query("events").take(500);
    const projectEvents = allEvents.filter(event => 
      event.projectId && event.projectId === args.projectId
    );
    
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
    
    return enrichedEvents.sort((a, b) => a.startDate - b.startDate);
  },
});

export const getArchivedEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("status"), "archived"))
      .order("desc")
      .take(100);
    
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
    .take(100);
  
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
