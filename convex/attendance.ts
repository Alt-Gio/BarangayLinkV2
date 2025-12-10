import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const generateAttendeeQRCode = mutation({
  args: {
    eventId: v.id("events"),
    attendeeId: v.id("eventAttendees"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const attendee = await ctx.db.get(args.attendeeId);
    if (!attendee || attendee.eventId !== args.eventId) {
      throw new Error("Attendee not found");
    }

    let ticketCode = attendee.ticketCode;
    if (!ticketCode) {
      ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await ctx.db.patch(args.attendeeId, {
        ticketCode,
      });
    }

    return {
      ticketCode,
      attendeeId: args.attendeeId,
      eventId: args.eventId,
      email: attendee.email,
    };
  },
});

export const markQRCodeSent = mutation({
  args: {
    attendeeId: v.id("eventAttendees"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.attendeeId, {
      qrCodeSent: true,
      qrCodeSentAt: Date.now(),
    });

    return { success: true };
  },
});

export const checkInViaQR = mutation({
  args: {
    ticketCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const attendee = await ctx.db
      .query("eventAttendees")
      .filter((q) => q.eq(q.field("ticketCode"), args.ticketCode))
      .first();

    if (!attendee) {
      throw new Error("Invalid QR code");
    }

    // Check if already checked in
    if (attendee.checkedInAt) {
      return {
        success: false,
        message: "Already checked in",
        attendee: {
          name: attendee.firstName && attendee.lastName 
            ? `${attendee.firstName} ${attendee.lastName}`
            : attendee.email,
          checkedInAt: attendee.checkedInAt,
        },
      };
    }

    // Get scanner user
    const scannerUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    // Mark as checked in
    await ctx.db.patch(attendee._id, {
      checkedInAt: Date.now(),
      attendanceStatus: "attended",
      checkInMethod: "qr_scan",
      scannedBy: scannerUser?._id,
    });

    // Get event details
    const event = await ctx.db.get(attendee.eventId);

    return {
      success: true,
      message: "Check-in successful",
      attendee: {
        id: attendee._id,
        name: attendee.firstName && attendee.lastName 
          ? `${attendee.firstName} ${attendee.lastName}`
          : attendee.email,
        email: attendee.email,
        checkedInAt: Date.now(),
      },
      event: event ? {
        title: event.title,
        startDate: event.startDate,
        location: event.location,
      } : null,
    };
  },
});

// Manual check-in (without QR)
export const checkInManual = mutation({
  args: {
    attendeeId: v.id("eventAttendees"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const attendee = await ctx.db.get(args.attendeeId);
    if (!attendee) {
      throw new Error("Attendee not found");
    }

    // Check if already checked in
    if (attendee.checkedInAt) {
      throw new Error("Already checked in");
    }

    // Get admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    // Mark as checked in
    await ctx.db.patch(args.attendeeId, {
      checkedInAt: Date.now(),
      attendanceStatus: "attended",
      checkInMethod: "manual",
      scannedBy: adminUser?._id,
      notes: args.notes || attendee.notes,
    });

    return {
      success: true,
      attendee: {
        id: args.attendeeId,
        name: attendee.firstName && attendee.lastName 
          ? `${attendee.firstName} ${attendee.lastName}`
          : attendee.email,
        checkedInAt: Date.now(),
      },
    };
  },
});

// Get attendance list for event
export const getEventAttendance = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Get all attendees
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Enrich with user data and scanner info
    const enrichedAttendees = await Promise.all(
      attendees.map(async (attendee) => {
        let userData = null;
        if (attendee.userId) {
          userData = await ctx.db.get(attendee.userId);
        }

        let scannerData = null;
        if (attendee.scannedBy) {
          scannerData = await ctx.db.get(attendee.scannedBy);
        }

        return {
          ...attendee,
          userName: userData?.name || (attendee.firstName && attendee.lastName 
            ? `${attendee.firstName} ${attendee.lastName}`
            : attendee.email),
          userImageUrl: userData?.imageUrl,
          scannerName: scannerData?.name,
        };
      })
    );

    // Calculate stats
    const totalAttendees = attendees.length;
    const checkedIn = attendees.filter((a) => a.checkedInAt).length;
    const pending = totalAttendees - checkedIn;
    const qrSent = attendees.filter((a) => a.qrCodeSent).length;

    return {
      event,
      attendees: enrichedAttendees,
      stats: {
        total: totalAttendees,
        checkedIn,
        pending,
        qrSent,
        attendanceRate: totalAttendees > 0 ? (checkedIn / totalAttendees) * 100 : 0,
      },
    };
  },
});

// Get recent check-ins (live feed)
export const getRecentCheckIns = query({
  args: {
    eventId: v.id("events"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const limit = args.limit || 10;

    // Get attendees who checked in, sorted by check-in time
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const checkedInAttendees = attendees
      .filter((a) => a.checkedInAt)
      .sort((a, b) => (b.checkedInAt || 0) - (a.checkedInAt || 0))
      .slice(0, limit);

    // Enrich with user data
    const enrichedAttendees = await Promise.all(
      checkedInAttendees.map(async (attendee) => {
        let userData = null;
        if (attendee.userId) {
          userData = await ctx.db.get(attendee.userId);
        }

        return {
          ...attendee,
          userName: userData?.name || (attendee.firstName && attendee.lastName 
            ? `${attendee.firstName} ${attendee.lastName}`
            : attendee.email),
          userImageUrl: userData?.imageUrl,
        };
      })
    );

    return enrichedAttendees;
  },
});

// Undo check-in (admin only)
export const undoCheckIn = mutation({
  args: {
    attendeeId: v.id("eventAttendees"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.attendeeId, {
      checkedInAt: undefined,
      attendanceStatus: undefined,
      checkInMethod: undefined,
      scannedBy: undefined,
    });

    return { success: true };
  },
});
