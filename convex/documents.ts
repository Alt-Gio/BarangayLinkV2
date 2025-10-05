import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Upload document metadata (file itself is uploaded via Convex file storage)
export const createDocument = mutation({
  args: {
    fileName: v.string(),
    originalName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    storageId: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    accessLevel: v.union(v.literal("public"), v.literal("internal"), v.literal("restricted")),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const documentId = await ctx.db.insert("documents", {
      ...args,
      uploadedBy: user._id,
    });

    return documentId;
  },
});

// Get all documents
export const getAllDocuments = query({
  args: {
    category: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, projectId, taskId, limit = 50 }) => {
    let documentsQuery = ctx.db.query("documents");

    if (category) {
      documentsQuery = documentsQuery.filter((q) => q.eq(q.field("category"), category));
    }
    if (projectId) {
      documentsQuery = documentsQuery.filter((q) => q.eq(q.field("projectId"), projectId));
    }
    if (taskId) {
      documentsQuery = documentsQuery.filter((q) => q.eq(q.field("taskId"), taskId));
    }

    const documents = await documentsQuery
      .order("desc")
      .take(limit);

    // Enrich with uploader info
    const enrichedDocs = await Promise.all(
      documents.map(async (doc) => {
        const uploader = await ctx.db.get(doc.uploadedBy);
        return {
          ...doc,
          uploaderName: uploader?.name || "Unknown",
          uploaderEmail: uploader?.email || "",
        };
      })
    );

    return enrichedDocs;
  },
});

// Get document by ID
export const getDocumentById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) return null;

    const uploader = await ctx.db.get(document.uploadedBy);
    return {
      ...document,
      uploaderName: uploader?.name || "Unknown",
      uploaderEmail: uploader?.email || "",
    };
  },
});

// Get documents by project
export const getProjectDocuments = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("projectId"), projectId))
      .order("desc")
      .collect();

    const enrichedDocs = await Promise.all(
      documents.map(async (doc) => {
        const uploader = await ctx.db.get(doc.uploadedBy);
        return {
          ...doc,
          uploaderName: uploader?.name || "Unknown",
        };
      })
    );

    return enrichedDocs;
  },
});

// Get documents by task
export const getTaskDocuments = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("taskId"), taskId))
      .order("desc")
      .collect();

    const enrichedDocs = await Promise.all(
      documents.map(async (doc) => {
        const uploader = await ctx.db.get(doc.uploadedBy);
        return {
          ...doc,
          uploaderName: uploader?.name || "Unknown",
        };
      })
    );

    return enrichedDocs;
  },
});

// Update document metadata
export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    fileName: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    accessLevel: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("restricted"))),
  },
  handler: async (ctx, { documentId, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is the uploader or admin
    const userLevel = await ctx.db.get(user.userLevel);
    const isAdmin = userLevel?.name === "ADMIN";
    const isUploader = document.uploadedBy === user._id;

    if (!isAdmin && !isUploader) {
      throw new Error("Permission denied. Only document owner or admin can update.");
    }

    await ctx.db.patch(documentId, updates);
    return documentId;
  },
});

// Delete document
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is the uploader or admin
    const userLevel = await ctx.db.get(user.userLevel);
    const isAdmin = userLevel?.name === "ADMIN";
    const isUploader = document.uploadedBy === user._id;

    if (!isAdmin && !isUploader) {
      throw new Error("Permission denied. Only document owner or admin can delete.");
    }

    // Delete the file from storage
    await ctx.storage.delete(document.storageId);

    // Delete the document record
    await ctx.db.delete(documentId);
    
    return { success: true };
  },
});

// Get upload URL for file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL for viewing/downloading
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

// Search documents
export const searchDocuments = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { searchTerm, category }) => {
    let documentsQuery = ctx.db.query("documents");

    if (category) {
      documentsQuery = documentsQuery.filter((q) => q.eq(q.field("category"), category));
    }

    const documents = await documentsQuery.collect();

    // Filter by search term (filename or description)
    const filtered = documents.filter((doc) => {
      const searchLower = searchTerm.toLowerCase();
      const fileNameMatch = doc.fileName.toLowerCase().includes(searchLower);
      const descMatch = doc.description?.toLowerCase().includes(searchLower) || false;
      const tagMatch = doc.tags.some((tag) => tag.toLowerCase().includes(searchLower));
      return fileNameMatch || descMatch || tagMatch;
    });

    // Enrich with uploader info
    const enrichedDocs = await Promise.all(
      filtered.map(async (doc) => {
        const uploader = await ctx.db.get(doc.uploadedBy);
        return {
          ...doc,
          uploaderName: uploader?.name || "Unknown",
        };
      })
    );

    return enrichedDocs;
  },
});

// Get document statistics
export const getDocumentStats = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();

    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    const byCategory = documents.reduce((acc: Record<string, number>, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDocuments: documents.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      byCategory,
      publicDocuments: documents.filter((d) => d.isPublic).length,
      privateDocuments: documents.filter((d) => !d.isPublic).length,
    };
  },
});
