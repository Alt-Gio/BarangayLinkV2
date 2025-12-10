import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function calculateAge(birthdate: number): number {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export const getAllResidents = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const residents = await ctx.db
      .query("residents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);
    
    return residents;
  },
});

export const getResidentById = query({
  args: { residentId: v.id("residents") },
  handler: async (ctx, args) => {
    const resident = await ctx.db.get(args.residentId);
    if (!resident) return null;
    
    const household = await ctx.db.get(resident.householdId);
    
    return {
      ...resident,
      household,
    };
  },
});

export const getResidentsByHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const residents = await ctx.db
      .query("residents")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return residents;
  },
});

export const searchResidents = query({
  args: {
    searchTerm: v.optional(v.string()),
    purok: v.optional(v.string()),
    isSeniorCitizen: v.optional(v.boolean()),
    isPWD: v.optional(v.boolean()),
    isIndigent: v.optional(v.boolean()),
    isVoter: v.optional(v.boolean()),
    gender: v.optional(v.union(v.literal("Male"), v.literal("Female"))),
  },
  handler: async (ctx, args) => {
    let residents = await ctx.db
      .query("residents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    if (args.isSeniorCitizen !== undefined) {
      residents = residents.filter((r) => r.isSeniorCitizen === args.isSeniorCitizen);
    }
    if (args.isPWD !== undefined) {
      residents = residents.filter((r) => r.isPWD === args.isPWD);
    }
    if (args.isIndigent !== undefined) {
      residents = residents.filter((r) => r.isIndigent === args.isIndigent);
    }
    if (args.isVoter !== undefined) {
      residents = residents.filter((r) => r.isVoter === args.isVoter);
    }
    if (args.gender) {
      residents = residents.filter((r) => r.gender === args.gender);
    }
    
    if (args.purok) {
      const households = await ctx.db.query("households").collect();
      const householdsByPurok = households.filter((h) => h.purok === args.purok);
      const householdIds = new Set(householdsByPurok.map((h) => h._id));
      residents = residents.filter((r) => householdIds.has(r.householdId));
    }
    
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      residents = residents.filter(
        (r) =>
          r.firstName.toLowerCase().includes(term) ||
          r.lastName.toLowerCase().includes(term) ||
          (r.middleName && r.middleName.toLowerCase().includes(term)) ||
          r.barangayIdNumber.toLowerCase().includes(term)
      );
    }
    
    return residents;
  },
});

// Get resident statistics
export const getResidentStats = query({
  handler: async (ctx) => {
    const residents = await ctx.db
      .query("residents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    const totalResidents = residents.length;
    const males = residents.filter((r) => r.gender === "Male").length;
    const females = residents.filter((r) => r.gender === "Female").length;
    const seniors = residents.filter((r) => r.isSeniorCitizen).length;
    const pwd = residents.filter((r) => r.isPWD).length;
    const voters = residents.filter((r) => r.isVoter).length;
    const indigents = residents.filter((r) => r.isIndigent).length;
    const ofw = residents.filter((r) => r.isOFW).length;
    
    // Age distribution
    const ageGroups = {
      "0-17": 0,
      "18-35": 0,
      "36-59": 0,
      "60+": 0,
    };
    
    residents.forEach((r) => {
      if (r.age < 18) ageGroups["0-17"]++;
      else if (r.age <= 35) ageGroups["18-35"]++;
      else if (r.age <= 59) ageGroups["36-59"]++;
      else ageGroups["60+"]++;
    });
    
    return {
      totalResidents,
      males,
      females,
      seniors,
      pwd,
      voters,
      indigents,
      ofw,
      ageGroups,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create new resident
export const createResident = mutation({
  args: {
    // Personal Info
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    suffix: v.optional(v.string()),
    nickname: v.optional(v.string()),
    birthdate: v.number(),
    placeOfBirth: v.optional(v.string()),
    gender: v.union(v.literal("Male"), v.literal("Female")),
    civilStatus: v.union(
      v.literal("Single"),
      v.literal("Married"),
      v.literal("Widowed"),
      v.literal("Separated"),
      v.literal("Annulled")
    ),
    nationality: v.string(),
    religion: v.optional(v.string()),
    bloodType: v.optional(v.string()),
    
    // Contact
    phoneNumber: v.string(),
    email: v.optional(v.string()),
    
    // Household
    householdId: v.id("households"),
    relationToHead: v.string(),
    
    // Government IDs
    philHealthNumber: v.optional(v.string()),
    sssNumber: v.optional(v.string()),
    gsissNumber: v.optional(v.string()),
    tinNumber: v.optional(v.string()),
    votersIdNumber: v.optional(v.string()),
    nationalIdNumber: v.optional(v.string()),
    
    // Residency
    yearsOfResidency: v.number(),
    residencyType: v.string(),
    previousAddress: v.optional(v.string()),
    
    // Status
    isVoter: v.boolean(),
    isPWD: v.boolean(),
    isIndigent: v.boolean(),
    is4PsBeneficiary: v.boolean(),
    isOFW: v.boolean(),
    isSoloParent: v.boolean(),
    
    // Occupation
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    monthlyIncome: v.optional(v.string()),
    educationalAttainment: v.optional(v.string()),
    
    // Emergency Contact
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    
    // Medical
    disabilities: v.optional(v.array(v.string())),
    medicalConditions: v.optional(v.array(v.string())),
    
    // Photo
    photoUrl: v.optional(v.string()),
    photoStorageId: v.optional(v.string()),
    
    // Notes
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
    
    // Generate barangay ID number
    const currentYear = new Date().getFullYear();
    const existingResidents = await ctx.db.query("residents").collect();
    const nextNumber = existingResidents.length + 1;
    const barangayIdNumber = `BIT-${currentYear}-${String(nextNumber).padStart(5, "0")}`;
    
    // Calculate age
    const age = calculateAge(args.birthdate);
    const isSeniorCitizen = age >= 60;
    
    // Create resident
    const residentId = await ctx.db.insert("residents", {
      barangayIdNumber,
      qrCode: `${barangayIdNumber}-${Date.now()}`, // Simple QR data
      
      firstName: args.firstName,
      middleName: args.middleName,
      lastName: args.lastName,
      suffix: args.suffix,
      nickname: args.nickname,
      
      birthdate: args.birthdate,
      age,
      placeOfBirth: args.placeOfBirth,
      
      gender: args.gender,
      civilStatus: args.civilStatus,
      nationality: args.nationality,
      religion: args.religion,
      bloodType: args.bloodType as any,
      
      phoneNumber: args.phoneNumber,
      email: args.email,
      
      householdId: args.householdId,
      relationToHead: args.relationToHead as any,
      
      philHealthNumber: args.philHealthNumber,
      sssNumber: args.sssNumber,
      gsissNumber: args.gsissNumber,
      tinNumber: args.tinNumber,
      votersIdNumber: args.votersIdNumber,
      nationalIdNumber: args.nationalIdNumber,
      
      yearsOfResidency: args.yearsOfResidency,
      residencyType: args.residencyType as any,
      previousAddress: args.previousAddress,
      
      isVoter: args.isVoter,
      isSeniorCitizen,
      isPWD: args.isPWD,
      isIndigent: args.isIndigent,
      is4PsBeneficiary: args.is4PsBeneficiary,
      isOFW: args.isOFW,
      isSoloParent: args.isSoloParent,
      
      occupation: args.occupation,
      employer: args.employer,
      monthlyIncome: args.monthlyIncome,
      educationalAttainment: args.educationalAttainment as any,
      
      emergencyContactName: args.emergencyContactName,
      emergencyContactRelationship: args.emergencyContactRelationship,
      emergencyContactPhone: args.emergencyContactPhone,
      
      disabilities: args.disabilities,
      medicalConditions: args.medicalConditions,
      
      photoUrl: args.photoUrl,
      photoStorageId: args.photoStorageId,
      
      isVerified: false,
      isActive: true,
      
      notes: args.notes,
      
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Update household member count
    const household = await ctx.db.get(args.householdId);
    if (household) {
      await ctx.db.patch(args.householdId, {
        totalMembers: household.totalMembers + 1,
        updatedAt: Date.now(),
      });
    }
    
    return residentId;
  },
});

// Update resident
export const updateResident = mutation({
  args: {
    residentId: v.id("residents"),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    suffix: v.optional(v.string()),
    nickname: v.optional(v.string()),
    birthdate: v.number(),
    placeOfBirth: v.optional(v.string()),
    gender: v.union(v.literal("Male"), v.literal("Female")),
    civilStatus: v.string(),
    nationality: v.string(),
    religion: v.optional(v.string()),
    bloodType: v.optional(v.string()),
    phoneNumber: v.string(),
    email: v.optional(v.string()),
    relationToHead: v.string(),
    philHealthNumber: v.optional(v.string()),
    sssNumber: v.optional(v.string()),
    gsissNumber: v.optional(v.string()),
    tinNumber: v.optional(v.string()),
    votersIdNumber: v.optional(v.string()),
    nationalIdNumber: v.optional(v.string()),
    yearsOfResidency: v.number(),
    residencyType: v.string(),
    previousAddress: v.optional(v.string()),
    isVoter: v.boolean(),
    isPWD: v.boolean(),
    isIndigent: v.boolean(),
    is4PsBeneficiary: v.boolean(),
    isOFW: v.boolean(),
    isSoloParent: v.boolean(),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    monthlyIncome: v.optional(v.string()),
    educationalAttainment: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    disabilities: v.optional(v.array(v.string())),
    medicalConditions: v.optional(v.array(v.string())),
    photoUrl: v.optional(v.string()),
    photoStorageId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { residentId, ...updates } = args;
    
    // Recalculate age and senior citizen status
    const age = calculateAge(updates.birthdate);
    const isSeniorCitizen = age >= 60;
    
    await ctx.db.patch(residentId, {
      ...updates,
      age,
      isSeniorCitizen,
      relationToHead: updates.relationToHead as any,
      civilStatus: updates.civilStatus as any,
      residencyType: updates.residencyType as any,
      educationalAttainment: updates.educationalAttainment as any,
      bloodType: updates.bloodType as any,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Verify resident
export const verifyResident = mutation({
  args: { residentId: v.id("residents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(args.residentId, {
      isVerified: true,
      verifiedBy: user._id,
      verifiedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Deactivate resident (soft delete)
export const deactivateResident = mutation({
  args: {
    residentId: v.id("residents"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const resident = await ctx.db.get(args.residentId);
    if (!resident) throw new Error("Resident not found");
    
    await ctx.db.patch(args.residentId, {
      isActive: false,
      deactivatedReason: args.reason,
      updatedAt: Date.now(),
    });
    
    // Update household member count
    const household = await ctx.db.get(resident.householdId);
    if (household) {
      await ctx.db.patch(resident.householdId, {
        totalMembers: Math.max(0, household.totalMembers - 1),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Reactivate resident
export const reactivateResident = mutation({
  args: { residentId: v.id("residents") },
  handler: async (ctx, args) => {
    const resident = await ctx.db.get(args.residentId);
    if (!resident) throw new Error("Resident not found");
    
    await ctx.db.patch(args.residentId, {
      isActive: true,
      deactivatedReason: undefined,
      updatedAt: Date.now(),
    });
    
    // Update household member count
    const household = await ctx.db.get(resident.householdId);
    if (household) {
      await ctx.db.patch(resident.householdId, {
        totalMembers: household.totalMembers + 1,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// ============================================
// PORTAL AUTHENTICATION QUERIES
// ============================================

// Get resident by Clerk user ID (for authenticated portal access)
export const getResidentByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const resident = await ctx.db
      .query("residents")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!resident) return null;
    
    // Get household info
    const household = resident.householdId 
      ? await ctx.db.get(resident.householdId)
      : null;
    
    return {
      ...resident,
      household,
    };
  },
});

// Get resident by email (for linking Clerk account)
export const getResidentByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const resident = await ctx.db
      .query("residents")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!resident) return null;
    
    // Get household info
    const household = resident.householdId 
      ? await ctx.db.get(resident.householdId)
      : null;
    
    return {
      ...resident,
      household,
    };
  },
});

// Link Clerk user to resident record (called when user first logs in)
export const linkClerkUserToResident = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find resident by email
    const resident = await ctx.db
      .query("residents")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!resident) {
      throw new Error("No resident found with this email address. Please contact the barangay office to register.");
    }
    
    // Check if already linked to different user
    if (resident.clerkUserId && resident.clerkUserId !== args.clerkUserId) {
      throw new Error("This resident is already linked to another account.");
    }
    
    // Link the Clerk user
    await ctx.db.patch(resident._id, {
      clerkUserId: args.clerkUserId,
      updatedAt: Date.now(),
    });
    
    return { 
      success: true,
      residentId: resident._id,
      name: `${resident.firstName} ${resident.lastName}`,
    };
  },
});

// Update clerk user ID for a resident (admin function)
export const updateResidentClerkId = mutation({
  args: {
    residentId: v.id("residents"),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.residentId, {
      clerkUserId: args.clerkUserId,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Update resident contact info (for profile updates)
export const updateResidentProfile = mutation({
  args: {
    residentId: v.id("residents"),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    monthlyIncome: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { residentId, ...updates } = args;
    
    await ctx.db.patch(residentId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Get household members for family requests
export const getHouseholdMembers = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("residents")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return members;
  },
});
