import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllRequests = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    let requests;
    
    if (args.status) {
      requests = await ctx.db
        .query("certificateRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .take(limit);
    } else {
      requests = await ctx.db
        .query("certificateRequests")
        .order("desc")
        .take(limit);
    }
    
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const resident = await ctx.db.get(request.residentId);
        return {
          ...request,
          resident,
        };
      })
    );
    
    return enrichedRequests;
  },
});

export const getRequestById = query({
  args: { requestId: v.id("certificateRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;
    
    const resident = await ctx.db.get(request.residentId);
    
    return {
      ...request,
      resident,
    };
  },
});

export const getRequestsByResident = query({
  args: { residentId: v.id("residents") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("certificateRequests")
      .withIndex("by_resident", (q) => q.eq("residentId", args.residentId))
      .order("desc")
      .collect();
    
    return requests;
  },
});

export const getRequestStats = query({
  handler: async (ctx) => {
    const requests = await ctx.db.query("certificateRequests").collect();
    
    const totalRequests = requests.length;
    const pending = requests.filter((r) => r.status === "Pending").length;
    const forReview = requests.filter((r) => r.status === "For Review").length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const released = requests.filter((r) => r.status === "Released").length;
    const rejected = requests.filter((r) => r.status === "Rejected").length;
    
    const byType: Record<string, number> = {};
    requests.forEach((r) => {
      byType[r.certificateType] = (byType[r.certificateType] || 0) + 1;
    });
    
    return {
      totalRequests,
      pending,
      forReview,
      approved,
      released,
      rejected,
      byType,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create new certificate request
export const createRequest = mutation({
  args: {
    residentId: v.id("residents"),
    certificateType: v.string(),
    purpose: v.string(),
    notes: v.optional(v.string()),
    requestedForId: v.optional(v.id("residents")), // For family member requests
  },
  handler: async (ctx, args) => {
    const resident = await ctx.db.get(args.residentId);
    if (!resident) throw new Error("Resident not found");
    
    // Determine who the certificate is for
    const targetResidentId = args.requestedForId || args.residentId;
    const targetResident = await ctx.db.get(targetResidentId);
    if (!targetResident) throw new Error("Target resident not found");
    
    // If requesting for someone else, validate permissions
    if (args.requestedForId && args.requestedForId !== args.residentId) {
      // Check if same household
      if (resident.householdId !== targetResident.householdId) {
        throw new Error("Can only request certificates for household members");
      }
      
      // Check permissions based on relationship
      const canRequest = 
        resident.relationToHead === "Head" || // Household head can request for anyone
        (resident.relationToHead === "Spouse" && 
         ["Child", "Grandchild"].includes(targetResident.relationToHead)); // Spouse can request for children
      
      if (!canRequest) {
        throw new Error("You are not authorized to request certificates for this person");
      }
    }
    
    // Check if target resident is verified
    if (!targetResident.isVerified) {
      throw new Error("Resident must be verified before requesting certificates");
    }
    
    // Generate control number
    const currentYear = new Date().getFullYear();
    const existingRequests = await ctx.db.query("certificateRequests").collect();
    const nextNumber = existingRequests.length + 1;
    const controlNumber = `CR-${currentYear}-${String(nextNumber).padStart(5, "0")}`;
    
    // Create request
    const requestId = await ctx.db.insert("certificateRequests", {
      controlNumber,
      residentId: targetResidentId, // Certificate is FOR this person
      requestedBy: `${resident.firstName} ${resident.lastName}`, // But REQUESTED BY this person
      certificateType: args.certificateType as any,
      purpose: args.purpose,
      status: "Pending",
      requestedAt: Date.now(),
      isPaid: false,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { requestId, controlNumber };
  },
});

// Update request status
export const updateRequestStatus = mutation({
  args: {
    requestId: v.id("certificateRequests"),
    status: v.string(),
    adminNotes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const updates: any = {
      status: args.status,
      adminNotes: args.adminNotes,
      updatedAt: Date.now(),
    };
    
    // Set appropriate timestamp based on status
    if (args.status === "For Review") {
      updates.reviewedBy = user._id;
      updates.reviewedAt = Date.now();
    } else if (args.status === "Approved") {
      updates.approvedBy = user._id;
      updates.approvedAt = Date.now();
    } else if (args.status === "Released") {
      updates.releasedBy = user._id;
      updates.releasedAt = Date.now();
    } else if (args.status === "Rejected") {
      updates.rejectionReason = args.rejectionReason;
    }
    
    await ctx.db.patch(args.requestId, updates);
    
    return { success: true };
  },
});

// Mark request as paid
export const markAsPaid = mutation({
  args: {
    requestId: v.id("certificateRequests"),
    amount: v.number(),
    paymentMethod: v.string(),
    orNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      isPaid: true,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      orNumber: args.orNumber,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Cancel request
export const cancelRequest = mutation({
  args: {
    requestId: v.id("certificateRequests"),
    cancellationReason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "Cancelled",
      cancellationReason: args.cancellationReason,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Link certificate to request
export const linkCertificate = mutation({
  args: {
    requestId: v.id("certificateRequests"),
    certificateId: v.id("certificates"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      certificateId: args.certificateId,
      status: "Approved",
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
