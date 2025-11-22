import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Import data - you can paste the calendar data here or load from external source
const calendarData = {
  committees: [
    {
      name: "Committee on Appropriation, Finance and Budget",
      chairman: "HON. JERRY QUINTANO, JR.",
      position: "Barangay Kagawad",
      isActive: true
    },
    {
      name: "Committee on Senior Citizen and PWD / INFIA",
      chairman: "HON. JESUS M. ADORNADO",
      position: "Barangay Kagawad",
      isActive: true
    },
    {
      name: "Committee on Education / VAWC / Livelihood",
      chairman: "HON. ANAMARIE A. DEL AYRE",
      position: "Barangay Kagawad",
      isActive: true
    },
    {
      name: "Committee on Barangay Disaster Risk Reduction Management, Peace and Order and Public Safety / BDRRMC",
      chairman: "HON. SALVADOR B. TAOPO, JR.",
      position: "Barangay Kagawad",
      isActive: true
    },
    {
      name: "Committee on Environment",
      chairman: "HON. JOSEPH S. BANTIGUI",
      position: "Barangay Kagawad",
      isActive: true
    },
    {
      name: "Committee on Health / Public Affairs",
      chairman: "HON. SUSAN L. BERMEJO",
      position: "Barangay Kagawad",
      isActive: true
    },
    {
      name: "Committee on Ways and Means / Human Rights",
      chairman: "HON. JUAN S. BANDOLA",
      position: "Barangay Kagawad",
      isActive: true
    },
    {
      name: "Committee on Youth and Sports Development",
      chairman: "HON. PHOEBIE DIANE P. CRUEL",
      position: "SK Chairperson",
      isActive: true
    }
  ]
};

/**
 * Import committees into the database
 * Run with: npx convex run importCalendar:importCommittees
 */
export const importCommittees = internalMutation({
  handler: async (ctx) => {
    console.log("Starting committee import...");
    
    let imported = 0;
    let skipped = 0;
    
    for (const committee of calendarData.committees) {
      // Check if committee already exists
      const existing = await ctx.db
        .query("committees")
        .filter((q) => q.eq(q.field("name"), committee.name))
        .first();
      
      if (existing) {
        console.log(`Skipping existing committee: ${committee.name}`);
        skipped++;
        continue;
      }
      
      await ctx.db.insert("committees", {
        name: committee.name,
        chairman: committee.chairman,
        chairmanPosition: committee.position,
        description: "",
        members: [],
        isActive: committee.isActive,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      console.log(`Imported committee: ${committee.name}`);
      imported++;
    }
    
    console.log(`Import complete! Imported: ${imported}, Skipped: ${skipped}`);
    return { imported, skipped, total: calendarData.committees.length };
  },
});

/**
 * Import calendar entries as events
 * Run with: npx convex run importCalendar:importCalendarEntries --organizerId YOUR_USER_ID
 */
export const importCalendarEntries = internalMutation({
  args: {
    organizerId: v.id("users"),
    dryRun: v.optional(v.boolean()), // If true, just count without inserting
  },
  handler: async (ctx, args) => {
    const { organizerId, dryRun = false } = args;
    
    console.log(`Starting calendar import (dry run: ${dryRun})...`);
    
    // Sample entries - replace with your full calendar data
    const sampleEntries = [
      {
        date: "2025-02-06",
        category: "EVENT",
        type: "meeting",
        title: "Regular Session - Barangay 37",
        startTime: "18:00",
        endTime: "19:00",
        location: "Barangay Hall"
      },
      {
        date: "2025-02-12",
        category: "PROJECT",
        type: "community",
        title: "Dengue Awareness Program - DOH",
        isAllDay: true
      },
      // Add more entries here or load from external source
    ];
    
    let imported = 0;
    let skipped = 0;
    
    for (const entry of sampleEntries) {
      // Parse dates
      const dateStr = entry.date;
      const startTimeStr = entry.startTime || "00:00";
      const endTimeStr = entry.endTime || "23:59";
      
      const startDate = new Date(`${dateStr}T${startTimeStr}:00+08:00`).getTime();
      const endDate = new Date(`${dateStr}T${endTimeStr}:00+08:00`).getTime();
      
      // Check for duplicates
      const existing = await ctx.db
        .query("events")
        .filter((q) => 
          q.and(
            q.eq(q.field("title"), entry.title),
            q.eq(q.field("startDate"), startDate)
          )
        )
        .first();
      
      if (existing) {
        console.log(`Skipping duplicate: ${entry.title} on ${entry.date}`);
        skipped++;
        continue;
      }
      
      if (!dryRun) {
        await ctx.db.insert("events", {
          title: entry.title,
          description: entry.title,
          type: entry.type as any,
          eventCategory: entry.category as any,
          startDate,
          endDate,
          location: entry.location || "TBA",
          organizer: organizerId,
          attendees: [],
          isPublic: true,
          requiresApproval: false,
          status: "published",
          attachments: [],
        });
        
        console.log(`Imported: ${entry.title} on ${entry.date}`);
      } else {
        console.log(`Would import: ${entry.title} on ${entry.date}`);
      }
      
      imported++;
    }
    
    console.log(`Import ${dryRun ? 'preview' : 'complete'}! ${dryRun ? 'Would import' : 'Imported'}: ${imported}, Skipped: ${skipped}`);
    return { imported, skipped, total: sampleEntries.length, dryRun };
  },
});

/**
 * Clear all committees (DANGER!)
 * Run with: npx convex run importCalendar:clearCommittees
 */
export const clearCommittees = internalMutation({
  handler: async (ctx) => {
    const committees = await ctx.db.query("committees").collect();
    
    for (const committee of committees) {
      await ctx.db.delete(committee._id);
    }
    
    console.log(`Deleted ${committees.length} committees`);
    return { deleted: committees.length };
  },
});

/**
 * Clear all events with category (DANGER!)
 * Run with: npx convex run importCalendar:clearCategorizedEvents
 */
export const clearCategorizedEvents = internalMutation({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.neq(q.field("eventCategory"), undefined))
      .collect();
    
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    
    console.log(`Deleted ${events.length} categorized events`);
    return { deleted: events.length };
  },
});
