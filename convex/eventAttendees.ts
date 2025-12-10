import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getEventAttendees = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();

    const enrichedAttendees = await Promise.all(
      attendees.map(async (attendee) => {
        if (attendee.userId) {
          const user = await ctx.db.get(attendee.userId);
          return {
            ...attendee,
            userName: user?.name,
            userImage: user?.imageUrl,
          };
        }
        return {
          ...attendee,
          userName: `${attendee.firstName} ${attendee.lastName}`,
          userImage: null,
        };
      })
    );

    return enrichedAttendees;
  },
});

export const getAttendeeStats = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();

    const stats = {
      total: attendees.length,
      confirmed: attendees.filter((a) => a.rsvpStatus === "confirmed").length,
      pending: attendees.filter((a) => a.rsvpStatus === "pending").length,
      declined: attendees.filter((a) => a.rsvpStatus === "declined").length,
      maybe: attendees.filter((a) => a.rsvpStatus === "maybe").length,
      waitlist: attendees.filter((a) => a.rsvpStatus === "waitlist").length,
      attended: attendees.filter((a) => a.attendanceStatus === "attended").length,
      noShow: attendees.filter((a) => a.attendanceStatus === "no-show").length,
      cancelled: attendees.filter((a) => a.attendanceStatus === "cancelled").length,
    };

    return stats;
  },
});

export const getAllEventsWithAttendees = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.neq(q.field("status"), "archived"))
      .collect();

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const attendees = await ctx.db
          .query("eventAttendees")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        const organizer = event.organizer ? await ctx.db.get(event.organizer) : null;

        return {
          ...event,
          organizerName: organizer?.name || "Unknown",
          attendeeCount: attendees.length,
          confirmedCount: attendees.filter((a) => a.rsvpStatus === "confirmed").length,
        };
      })
    );

    return eventsWithCounts.sort((a, b) => b.startDate - a.startDate);
  },
});

export const registerAttendee = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.optional(v.id("users")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    specialRequirements: v.optional(v.string()),
    isPublicRSVP: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if already registered
    const existing = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => 
        args.userId 
          ? q.eq(q.field("userId"), args.userId)
          : q.eq(q.field("email"), args.email)
      )
      .first();

    if (existing) {
      throw new Error("Already registered for this event");
    }

    // Generate unique ticket code
    const ticketCode = `TIX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const attendeeId = await ctx.db.insert("eventAttendees", {
      eventId: args.eventId,
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      rsvpStatus: "pending",
      registeredAt: Date.now(),
      emailSent: false,
      remindersSent: 0,
      notes: args.notes,
      specialRequirements: args.specialRequirements,
      ticketCode,
      registrationSource: "web",
      isPublicRSVP: args.isPublicRSVP,
    });

    return attendeeId;
  },
});

// Update attendee RSVP status
export const updateRSVPStatus = mutation({
  args: {
    attendeeId: v.id("eventAttendees"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("declined"),
      v.literal("maybe"),
      v.literal("waitlist")
    ),
  },
  handler: async (ctx, { attendeeId, status }) => {
    const attendee = await ctx.db.get(attendeeId);
    if (!attendee) {
      throw new Error("Attendee not found");
    }

    await ctx.db.patch(attendeeId, {
      rsvpStatus: status,
      confirmedAt: status === "confirmed" ? Date.now() : attendee.confirmedAt,
    });

    return { success: true };
  },
});

// Update attendance status (check-in)
export const updateAttendanceStatus = mutation({
  args: {
    attendeeId: v.id("eventAttendees"),
    status: v.union(
      v.literal("attended"),
      v.literal("no-show"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { attendeeId, status }) => {
    const attendee = await ctx.db.get(attendeeId);
    if (!attendee) {
      throw new Error("Attendee not found");
    }

    await ctx.db.patch(attendeeId, {
      attendanceStatus: status,
      checkedInAt: status === "attended" ? Date.now() : attendee.checkedInAt,
    });

    // 🎮 INTEGRATION: Award XP for event attendance
    if (status === "attended" && attendee.userId) {
      const event = await ctx.db.get(attendee.eventId);
      
      // Award 50 XP for attending event
      const user = await ctx.db.get(attendee.userId);
      if (user && event) {
        const xpGained = 50;
        const newXP = (user.xp || 0) + xpGained;
        
        // Update user XP and level
        const newLevel = calculateLevel(newXP);
        await ctx.db.patch(attendee.userId, {
          xp: newXP,
          level: newLevel,
        });

        // Log activity
        await ctx.db.insert("userActivityLogs", {
          userId: attendee.userId,
          activityType: "action",
          action: "event_checkin",
          targetType: "event",
          targetId: attendee.eventId,
          metadata: {
            eventTitle: event.title,
            xpGained,
          },
          timestamp: Date.now(),
        });

        // Create notification
        await ctx.db.insert("notifications", {
          userId: attendee.userId,
          type: "xp_earned",
          title: "XP Earned! 🌟",
          message: `You earned ${xpGained} XP for attending "${event.title}"!`,
          priority: "low",
          isRead: false,
          metadata: { xpGained, eventTitle: event.title },
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Helper: Calculate level from XP
function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  if (xp < 5500) return 10;
  return 10 + Math.floor((xp - 5500) / 1000);
}

// Send event notification email to an attendee
export const sendEventNotification = mutation({
  args: {
    attendeeId: v.id("eventAttendees"),
    emailType: v.union(
      v.literal("confirmation"),
      v.literal("reminder"),
      v.literal("update"),
      v.literal("cancellation")
    ),
  },
  handler: async (ctx, { attendeeId, emailType }) => {
    const attendee = await ctx.db.get(attendeeId);
    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const event = await ctx.db.get(attendee.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Update email tracking
    await ctx.db.patch(attendeeId, {
      emailSent: true,
      lastEmailSentAt: Date.now(),
      remindersSent: emailType === "reminder" ? attendee.remindersSent + 1 : attendee.remindersSent,
      lastReminderSentAt: emailType === "reminder" ? Date.now() : attendee.lastReminderSentAt,
    });

    // Return email data for sending (will be handled by email service)
    return {
      to: attendee.email,
      subject: `${emailType === "confirmation" ? "Confirmation" : 
                 emailType === "reminder" ? "Reminder" :
                 emailType === "update" ? "Update" : 
                 "Cancellation"}: ${event.title}`,
      eventTitle: event.title,
      eventDate: new Date(event.startDate).toLocaleString(),
      eventLocation: event.location,
      ticketCode: attendee.ticketCode,
      recipientName: attendee.firstName ? `${attendee.firstName} ${attendee.lastName}` : "Attendee",
    };
  },
});

// Send bulk notifications to all attendees of an event
export const sendBulkEventNotification = mutation({
  args: {
    eventId: v.id("events"),
    emailType: v.union(
      v.literal("confirmation"),
      v.literal("reminder"),
      v.literal("update"),
      v.literal("cancellation")
    ),
    filterStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("declined"),
      v.literal("maybe"),
      v.literal("waitlist")
    )),
  },
  handler: async (ctx, { eventId, emailType, filterStatus }) => {
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    let attendeesQuery = ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", eventId));

    const attendees = await attendeesQuery.collect();

    // Filter by status if provided
    const filteredAttendees = filterStatus
      ? attendees.filter((a) => a.rsvpStatus === filterStatus)
      : attendees;

    // Update all attendees' email tracking
    const updates = filteredAttendees.map(async (attendee) => {
      await ctx.db.patch(attendee._id, {
        emailSent: true,
        lastEmailSentAt: Date.now(),
        remindersSent: emailType === "reminder" ? attendee.remindersSent + 1 : attendee.remindersSent,
        lastReminderSentAt: emailType === "reminder" ? Date.now() : attendee.lastReminderSentAt,
      });
    });

    await Promise.all(updates);

    return {
      success: true,
      count: filteredAttendees.length,
      message: `Notifications sent to ${filteredAttendees.length} attendee(s)`,
    };
  },
});

// Delete an attendee registration
export const deleteAttendee = mutation({
  args: { attendeeId: v.id("eventAttendees") },
  handler: async (ctx, { attendeeId }) => {
    await ctx.db.delete(attendeeId);
    return { success: true };
  },
});

// Search attendees across all events
export const searchAttendees = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const attendees = await ctx.db.query("eventAttendees").collect();

    const filtered = attendees.filter((attendee) => {
      const name = attendee.firstName && attendee.lastName
        ? `${attendee.firstName} ${attendee.lastName}`.toLowerCase()
        : "";
      const email = attendee.email.toLowerCase();
      const search = searchTerm.toLowerCase();

      return name.includes(search) || email.includes(search) || attendee.ticketCode?.toLowerCase().includes(search);
    });

    // Enrich with event data
    const enriched = await Promise.all(
      filtered.map(async (attendee) => {
        const event = attendee.eventId ? await ctx.db.get(attendee.eventId) : null;
        return {
          ...attendee,
          eventTitle: event?.title || "Unknown Event",
          eventDate: event?.startDate || 0,
        };
      })
    );

    return enriched;
  },
});

// Manually add attendee and generate ticket code
export const addAttendeeManual = mutation({
  args: {
    eventId: v.id("events"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if attendee already exists for this event
    const existing = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      throw new Error("Attendee with this email already registered for this event");
    }

    // Generate short unique ticket code (8 characters)
    const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create attendee record
    const attendeeId = await ctx.db.insert("eventAttendees", {
      eventId: args.eventId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      rsvpStatus: "confirmed",
      registeredAt: Date.now(),
      emailSent: false,
      remindersSent: 0,
      isPublicRSVP: false,
      ticketCode,
      registrationSource: "manual_invite",
      notes: args.customMessage,
    });

    return {
      success: true,
      attendeeId,
      ticketCode,
    };
  },
});

// Add attendee from public RSVP (landing page)
export const addAttendeeFromRSVP = mutation({
  args: {
    eventId: v.id("events"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if attendee already exists for this event
    const existing = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      // Already registered, return existing
      return {
        success: true,
        attendeeId: existing._id,
        ticketCode: existing.ticketCode,
        alreadyRegistered: true,
      };
    }

    // Generate short unique ticket code (8 characters)
    const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create attendee record
    const attendeeId = await ctx.db.insert("eventAttendees", {
      eventId: args.eventId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      rsvpStatus: "confirmed",
      registeredAt: Date.now(),
      emailSent: false,
      remindersSent: 0,
      isPublicRSVP: true,
      ticketCode,
      registrationSource: "public_rsvp",
    });

    return {
      success: true,
      attendeeId,
      ticketCode,
      alreadyRegistered: false,
    };
  },
});
