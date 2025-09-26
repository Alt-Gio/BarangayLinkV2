import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all departments
export const getAllDepartments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").order("asc").collect();
  },
});

// Get department by ID
export const getDepartmentById = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, { departmentId }) => {
    return await ctx.db.get(departmentId);
  },
});

// Get departments by category
export const getDepartmentsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("departments")
      .filter((q) => q.eq(q.field("category"), category))
      .order("asc")
      .collect();
  },
});

// Create new department (Admin only)
export const createDepartment = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    head: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    location: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // TODO: Add permission check for admin
    
    const departmentId = await ctx.db.insert("departments", {
      name: args.name,
      description: args.description,
      category: args.category,
      head: args.head,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      location: args.location,
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return departmentId;
  },
});

// Update department (Admin only)
export const updateDepartment = mutation({
  args: {
    departmentId: v.id("departments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    head: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    location: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { departmentId, ...updates }) => {
    // TODO: Add permission check for admin
    
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await ctx.db.patch(departmentId, updateData);
    return departmentId;
  },
});

// Get users count by department
export const getDepartmentUserCounts = query({
  args: {},
  handler: async (ctx) => {
    const departments = await ctx.db.query("departments").collect();
    const users = await ctx.db.query("users").collect();

    return departments.map(dept => ({
      ...dept,
      userCount: users.filter(user => user.department === dept.name).length,
    }));
  },
});

// Seed initial departments
export const seedDepartments = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if departments already exist
    const existingDepts = await ctx.db.query("departments").collect();
    if (existingDepts.length > 0) {
      return { message: "Departments already exist" };
    }

    const departments = [
      // Administrative Departments
      {
        name: "Administration",
        description: "General administrative functions and executive management",
        category: "Administrative",
        head: "Barangay Captain",
        contactEmail: "admin@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5600",
        location: "Barangay Hall - 2nd Floor",
        isActive: true,
      },
      {
        name: "Secretary Office",
        description: "Document management, records keeping, and official correspondence",
        category: "Administrative", 
        head: "Barangay Secretary",
        contactEmail: "secretary@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5601",
        location: "Barangay Hall - 1st Floor",
        isActive: true,
      },
      {
        name: "Treasury",
        description: "Financial management, budget planning, and revenue collection",
        category: "Administrative",
        head: "Barangay Treasurer",
        contactEmail: "treasury@barangaybitano.gov.ph", 
        contactPhone: "+63 2 1234 5602",
        location: "Barangay Hall - 1st Floor",
        isActive: true,
      },

      // Public Services
      {
        name: "Health Services",
        description: "Community health programs, medical services, and wellness initiatives",
        category: "Public Services",
        head: "Health Officer",
        contactEmail: "health@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5610",
        location: "Barangay Health Center",
        isActive: true,
      },
      {
        name: "Social Services",
        description: "Social welfare programs, senior citizen services, and community assistance",
        category: "Public Services",
        head: "Social Worker",
        contactEmail: "social@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5611",
        location: "Community Center",
        isActive: true,
      },
      {
        name: "Education & Youth",
        description: "Educational programs, youth development, and skills training",
        category: "Public Services",
        head: "Education Coordinator",
        contactEmail: "education@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5612",
        location: "Learning Center",
        isActive: true,
      },

      // Infrastructure & Development
      {
        name: "Public Works",
        description: "Infrastructure development, road maintenance, and construction projects",
        category: "Infrastructure",
        head: "Engineering Officer",
        contactEmail: "publicworks@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5620",
        location: "Engineering Office",
        isActive: true,
      },
      {
        name: "Urban Planning",
        description: "Community planning, zoning, and development coordination",
        category: "Infrastructure",
        head: "Planning Officer",
        contactEmail: "planning@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5621",
        location: "Planning Office",
        isActive: true,
      },
      {
        name: "Environmental Management",
        description: "Waste management, environmental protection, and sustainability programs",
        category: "Infrastructure",
        head: "Environmental Officer",
        contactEmail: "environment@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5622",
        location: "Environmental Office",
        isActive: true,
      },

      // Safety & Security
      {
        name: "Peace & Order",
        description: "Community security, crime prevention, and emergency response",
        category: "Safety & Security",
        head: "Security Chief",
        contactEmail: "security@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5630",
        location: "Security Office",
        isActive: true,
      },
      {
        name: "Disaster Risk Management",
        description: "Emergency preparedness, disaster response, and risk reduction",
        category: "Safety & Security",
        head: "DRRM Officer",
        contactEmail: "drrm@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5631",
        location: "Emergency Operations Center",
        isActive: true,
      },
      {
        name: "Traffic Management",
        description: "Traffic control, parking management, and road safety",
        category: "Safety & Security",
        head: "Traffic Officer",
        contactEmail: "traffic@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5632",
        location: "Traffic Office",
        isActive: true,
      },

      // Economic Development
      {
        name: "Business Permits & Licensing",
        description: "Business registration, permit processing, and regulatory compliance",
        category: "Economic Development",
        head: "Business Officer",
        contactEmail: "business@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5640",
        location: "Business Office",
        isActive: true,
      },
      {
        name: "Market Management",
        description: "Public market operations, vendor management, and commercial activities",
        category: "Economic Development",
        head: "Market Supervisor",
        contactEmail: "market@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5641",
        location: "Public Market Office",
        isActive: true,
      },
      {
        name: "Tourism & Culture",
        description: "Cultural preservation, tourism promotion, and community events",
        category: "Economic Development",
        head: "Tourism Officer",
        contactEmail: "tourism@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5642",
        location: "Cultural Center",
        isActive: true,
      },

      // Information Technology
      {
        name: "Information Technology",
        description: "Digital services, system maintenance, and technology support",
        category: "Technology",
        head: "IT Manager",
        contactEmail: "it@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5650",
        location: "IT Office",
        isActive: true,
      },
      {
        name: "Communications",
        description: "Public information, media relations, and community communications",
        category: "Technology",
        head: "Communications Officer",
        contactEmail: "communications@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5651",
        location: "Communications Office",
        isActive: true,
      },

      // General/Default
      {
        name: "General",
        description: "General community members and volunteers",
        category: "Community",
        head: "Community Coordinator",
        contactEmail: "community@barangaybitano.gov.ph",
        contactPhone: "+63 2 1234 5660",
        location: "Community Center",
        isActive: true,
      },
    ];

    const departmentIds = [];
    for (const dept of departments) {
      const id = await ctx.db.insert("departments", {
        ...dept,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      departmentIds.push(id);
    }

    return { 
      message: "Departments seeded successfully", 
      count: departmentIds.length,
      departmentIds 
    };
  },
});
