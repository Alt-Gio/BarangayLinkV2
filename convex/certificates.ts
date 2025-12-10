import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllCertificates = query({
  args: {
    certificateType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    let certificates;
    
    if (args.certificateType) {
      certificates = await ctx.db
        .query("certificates")
        .withIndex("by_type", (q) => q.eq("certificateType", args.certificateType as any))
        .order("desc")
        .take(limit);
    } else {
      certificates = await ctx.db
        .query("certificates")
        .order("desc")
        .take(limit);
    }
    
    return certificates;
  },
});

export const getCertificateById = query({
  args: { certificateId: v.id("certificates") },
  handler: async (ctx, args) => {
    const certificate = await ctx.db.get(args.certificateId);
    if (!certificate) return null;
    
    const resident = await ctx.db.get(certificate.residentId);
    
    return {
      ...certificate,
      resident,
    };
  },
});

export const getCertificateByCertificateNumber = query({
  args: { certificateNumber: v.string() },
  handler: async (ctx, args) => {
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_certificate_number", (q) => 
        q.eq("certificateNumber", args.certificateNumber)
      )
      .first();
    
    if (!certificate) return null;
    
    const resident = await ctx.db.get(certificate.residentId);
    
    return {
      ...certificate,
      resident,
    };
  },
});

// Verify certificate by QR code
export const verifyCertificateByQR = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .first();
    
    if (!certificate) {
      return { valid: false, message: "Certificate not found" };
    }
    
    if (!certificate.isValid) {
      return { 
        valid: false, 
        message: "Certificate has been invalidated",
        reason: certificate.invalidationReason,
      };
    }
    
    // Check expiration
    if (certificate.validUntil && certificate.validUntil < Date.now()) {
      return { valid: false, message: "Certificate has expired" };
    }
    
    const resident = await ctx.db.get(certificate.residentId);
    
    return {
      valid: true,
      certificate: {
        ...certificate,
        resident,
      },
    };
  },
});

// Get certificates by resident
export const getCertificatesByResident = query({
  args: { residentId: v.id("residents") },
  handler: async (ctx, args) => {
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_resident", (q) => q.eq("residentId", args.residentId))
      .order("desc")
      .collect();
    
    return certificates;
  },
});

// Get certificate statistics
export const getCertificateStats = query({
  handler: async (ctx) => {
    const certificates = await ctx.db.query("certificates").collect();
    
    const totalCertificates = certificates.length;
    const validCertificates = certificates.filter((c) => c.isValid).length;
    const invalidatedCertificates = certificates.filter((c) => !c.isValid).length;
    
    // Count by type
    const byType: Record<string, number> = {};
    certificates.forEach((c) => {
      byType[c.certificateType] = (byType[c.certificateType] || 0) + 1;
    });
    
    // This month's certificates
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthTimestamp = thisMonth.getTime();
    
    const thisMonthCount = certificates.filter(
      (c) => c.issuedAt >= thisMonthTimestamp
    ).length;
    
    return {
      totalCertificates,
      validCertificates,
      invalidatedCertificates,
      thisMonthCount,
      byType,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Generate certificate
export const generateCertificate = mutation({
  args: {
    residentId: v.id("residents"),
    certificateType: v.string(),
    purpose: v.string(),
    validUntil: v.optional(v.number()),
    amount: v.optional(v.number()),
    orNumber: v.optional(v.string()),
    requestId: v.optional(v.id("certificateRequests")),
    issuedByPosition: v.string(),
    notedBy: v.optional(v.string()),
    notedByPosition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");
    
    const resident = await ctx.db.get(args.residentId);
    if (!resident) throw new Error("Resident not found");
    
    // Generate certificate number based on type
    const currentYear = new Date().getFullYear();
    const existingCerts = await ctx.db.query("certificates").collect();
    const nextNumber = existingCerts.length + 1;
    
    // Prefix based on certificate type
    const prefixes: Record<string, string> = {
      "Barangay Clearance": "BC",
      "Certificate of Indigency": "CI",
      "Certificate of Residency": "CR",
      "Certificate of Good Moral": "CGM",
      "Business Permit": "BP",
      "COMELEC Certification": "CC",
      "First Time Job Seeker": "FTJS",
      "Certificate of No Income": "CNI",
    };
    
    const prefix = prefixes[args.certificateType] || "CERT";
    const certificateNumber = `${prefix}-${currentYear}-${String(nextNumber).padStart(5, "0")}`;
    
    // Generate QR code data
    const qrCode = `${certificateNumber}-${Date.now()}-${resident.barangayIdNumber}`;
    
    // Create certificate
    const certificateId = await ctx.db.insert("certificates", {
      certificateNumber,
      qrCode,
      certificateType: args.certificateType as any,
      residentId: args.residentId,
      residentName: `${resident.firstName} ${resident.lastName}`,
      purpose: args.purpose,
      validUntil: args.validUntil,
      issuedBy: user._id,
      issuedByName: user.name,
      issuedByPosition: args.issuedByPosition,
      notedBy: args.notedBy,
      notedByPosition: args.notedByPosition,
      isValid: true,
      amount: args.amount,
      orNumber: args.orNumber,
      requestId: args.requestId,
      issuedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // If linked to a request, update the request
    if (args.requestId) {
      await ctx.db.patch(args.requestId, {
        certificateId,
        status: "Approved",
        updatedAt: Date.now(),
      });
    }
    
    return certificateId;
  },
});

// Invalidate certificate
export const invalidateCertificate = mutation({
  args: {
    certificateId: v.id("certificates"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(args.certificateId, {
      isValid: false,
      invalidatedBy: user._id,
      invalidatedAt: Date.now(),
      invalidationReason: args.reason,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Update certificate PDF
export const updateCertificatePDF = mutation({
  args: {
    certificateId: v.id("certificates"),
    pdfUrl: v.string(),
    pdfStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.certificateId, {
      pdfUrl: args.pdfUrl,
      pdfStorageId: args.pdfStorageId,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
