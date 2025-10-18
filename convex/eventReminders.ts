import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Schedule event reminders when event is created
 * Sends notifications 24 hours before, 1 hour before, and at event start
 */
export const scheduleEventReminders = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const now = Date.now();
    const eventStart = event.startDate;

    // Don't schedule if event has already started
    if (eventStart <= now) {
      return { scheduled: false, reason: "Event already started" };
    }

    // Get all attendees from the event
    const attendeeIds = event.attendees || [];

    const reminderTimes = [
      { time: 24 * 60 * 60 * 1000, label: "24 hours" },
      { time: 60 * 60 * 1000, label: "1 hour" },
      { time: 15 * 60 * 1000, label: "15 minutes" },
    ];

    for (const { time, label } of reminderTimes) {
      const reminderTime = eventStart - time;
      
      // Only schedule if reminder time is in the future
      if (reminderTime > now) {
        await ctx.scheduler.runAt(
          reminderTime,
          internal.eventReminders.sendEventReminderToAll,
          {
            eventId: args.eventId,
            reminderLabel: label,
          }
        );
      }
    }

    return { scheduled: true, count: attendeeIds.length };
  },
});

/**
 * Send event reminder to all participants
 */
export const sendEventReminderToAll = internalMutation({
  args: {
    eventId: v.id("events"),
    reminderLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;

    // Get all attendees from the event
    const attendeeIds = event.attendees || [];

    const now = Date.now();

    for (const attendeeId of attendeeIds) {
      // Create in-app notification
      await ctx.db.insert("notifications", {
        userId: attendeeId,
        type: "info",
        title: `📅 Event Reminder: ${event.title}`,
        message: `Event starts in ${args.reminderLabel}`,
        category: "event_reminder",
        relatedId: args.eventId,
        relatedType: "event",
        isRead: false,
        createdAt: now,
        actionUrl: `/events/${args.eventId}`,
        metadata: {
          priority: "high",
          category: "event_reminder",
          relatedId: args.eventId,
          data: {
            eventTitle: event.title,
            eventDate: event.startDate,
            reminderLabel: args.reminderLabel,
          }
        }
      });

      // 📅 Send push notification
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotification,
        {
          userId: attendeeId,
          title: `📅 Event in ${args.reminderLabel}`,
          body: `${event.title} starts soon!`,
          url: `/events/${args.eventId}`,
          icon: "/icon-192x192.png",
          tag: `event-reminder-${args.eventId}`,
          requireInteraction: args.reminderLabel === "15 minutes", // Sticky for imminent events
        }
      );
    }

    console.log(`✅ Event reminders sent to ${attendeeIds.length} attendees`);
  },
});

/**
 * Send reminder to specific user
 */
export const sendEventReminderToUser = internalMutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    reminderLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;

    const now = Date.now();

    // Create in-app notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "info",
      title: `📅 Event Reminder: ${event.title}`,
      message: `Event starts in ${args.reminderLabel}`,
      category: "event_reminder",
      relatedId: args.eventId,
      relatedType: "event",
      isRead: false,
      createdAt: now,
      actionUrl: `/events/${args.eventId}`,
      metadata: {
        priority: "high",
        category: "event_reminder",
        relatedId: args.eventId,
        data: {
          eventTitle: event.title,
          eventDate: event.startDate,
          reminderLabel: args.reminderLabel,
        }
      }
    });

    // 📅 Send push notification
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendPushNotification,
      {
        userId: args.userId,
        title: `📅 Event in ${args.reminderLabel}`,
        body: `${event.title} starts soon!`,
        url: `/events/${args.eventId}`,
        icon: "/icon-192x192.png",
        tag: `event-reminder-${args.eventId}`,
      }
    );
  },
});
