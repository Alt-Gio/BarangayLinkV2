import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllHouseholds = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const households = await ctx.db
      .query("households")
      .order("desc")
      .take(limit);
    
    return households;
  },
});

export const getHouseholdById = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const household = await ctx.db.get(args.householdId);
    if (!household) return null;
    
    const members = await ctx.db
      .query("residents")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();
    
    return {
      ...household,
      members,
    };
  },
});

export const searchHouseholds = query({
  args: {
    searchTerm: v.optional(v.string()),
    purok: v.optional(v.string()),
    isIndigent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let households = await ctx.db.query("households").collect();
    
    if (args.purok) {
      households = households.filter((h) => h.purok === args.purok);
    }
    
    if (args.isIndigent !== undefined) {
      households = households.filter((h) => h.isIndigent === args.isIndigent);
    }
    
    // Filter by search term (household number, street, house number)
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      households = households.filter((h) =>
        h.householdNumber.toLowerCase().includes(term) ||
        h.street.toLowerCase().includes(term) ||
        h.houseNumber.toLowerCase().includes(term)
      );
    }
    
    return households;
  },
});

// Get household statistics
export const getHouseholdStats = query({
  handler: async (ctx) => {
    const households = await ctx.db.query("households").collect();
    
    const totalHouseholds = households.length;
    const indigentHouseholds = households.filter((h) => h.isIndigent).length;
    const fourPsBeneficiaries = households.filter((h) => h.is4PsBeneficiary).length;
    
    // Count by purok
    const byPurok: Record<string, number> = {};
    households.forEach((h) => {
      byPurok[h.purok] = (byPurok[h.purok] || 0) + 1;
    });
    
    return {
      totalHouseholds,
      indigentHouseholds,
      fourPsBeneficiaries,
      byPurok,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create new household
export const createHousehold = mutation({
  args: {
    houseNumber: v.string(),
    street: v.string(),
    purok: v.string(),
    barangay: v.string(),
    city: v.string(),
    province: v.string(),
    zipCode: v.string(),
    yearEstablished: v.optional(v.number()),
    monthlyIncome: v.optional(v.string()),
    isIndigent: v.boolean(),
    is4PsBeneficiary: v.boolean(),
    hasElectricity: v.boolean(),
    hasWater: v.boolean(),
    hasInternet: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");
    
    // Generate household number
    const currentYear = new Date().getFullYear();
    const existingHouseholds = await ctx.db.query("households").collect();
    const nextNumber = existingHouseholds.length + 1;
    const householdNumber = `H-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
    
    // Create household
    const householdId = await ctx.db.insert("households", {
      householdNumber,
      houseNumber: args.houseNumber,
      street: args.street,
      purok: args.purok,
      barangay: args.barangay,
      city: args.city,
      province: args.province,
      zipCode: args.zipCode,
      totalMembers: 0,
      yearEstablished: args.yearEstablished,
      monthlyIncome: args.monthlyIncome,
      isIndigent: args.isIndigent,
      is4PsBeneficiary: args.is4PsBeneficiary,
      hasElectricity: args.hasElectricity,
      hasWater: args.hasWater,
      hasInternet: args.hasInternet,
      notes: args.notes,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return householdId;
  },
});

// Update household
export const updateHousehold = mutation({
  args: {
    householdId: v.id("households"),
    houseNumber: v.string(),
    street: v.string(),
    purok: v.string(),
    barangay: v.string(),
    city: v.string(),
    province: v.string(),
    zipCode: v.string(),
    yearEstablished: v.optional(v.number()),
    monthlyIncome: v.optional(v.string()),
    isIndigent: v.boolean(),
    is4PsBeneficiary: v.boolean(),
    hasElectricity: v.boolean(),
    hasWater: v.boolean(),
    hasInternet: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { householdId, ...updates } = args;
    
    await ctx.db.patch(householdId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Delete household (only if no members)
export const deleteHousehold = mutation({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    // Check if household has members
    const members = await ctx.db
      .query("residents")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();
    
    if (members.length > 0) {
      throw new Error("Cannot delete household with members. Remove all members first.");
    }
    
    await ctx.db.delete(args.householdId);
    return { success: true };
  },
});

// Update household head
export const setHouseholdHead = mutation({
  args: {
    householdId: v.id("households"),
    residentId: v.id("residents"),
  },
  handler: async (ctx, args) => {
    // Verify resident belongs to this household
    const resident = await ctx.db.get(args.residentId);
    if (!resident || resident.householdId !== args.householdId) {
      throw new Error("Resident does not belong to this household");
    }
    
    // Update household
    await ctx.db.patch(args.householdId, {
      householdHeadId: args.residentId,
      updatedAt: Date.now(),
    });
    
    // Update resident's relation to head
    await ctx.db.patch(args.residentId, {
      relationToHead: "Head",
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Update total members count
export const updateMemberCount = mutation({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("residents")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    await ctx.db.patch(args.householdId, {
      totalMembers: members.length,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
