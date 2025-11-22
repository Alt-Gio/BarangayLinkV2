import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new version when document is updated
export const createVersion = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.string(),
    content: v.string(),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    changeDescription: v.optional(v.string()),
    changeType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("restored"),
      v.literal("auto_save")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .first();

    if (!user) throw new Error("User not found");

    // Get the document to verify it exists
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    // Get the latest version number
    const latestVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .first();

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Mark all previous versions as not current
    const previousVersions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isCurrentVersion"), true))
      .collect();

    for (const version of previousVersions) {
      await ctx.db.patch(version._id, { isCurrentVersion: false });
    }

    // Create new version
    const versionId = await ctx.db.insert("documentVersions", {
      documentId: args.documentId,
      versionNumber,
      title: args.title,
      content: args.content,
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      changeDescription: args.changeDescription,
      changeType: args.changeType,
      createdBy: user._id,
      createdAt: Date.now(),
      isCurrentVersion: true,
    });

    // Document updated (documents table doesn't have updatedAt field)
    // Version creation timestamp is tracked in the version itself

    return versionId;
  },
});

// Get version history for a document
export const getVersionHistory = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .collect();

    // Enrich with user info
    const enriched = await Promise.all(
      versions.map(async (version) => {
        const user = await ctx.db.get(version.createdBy);
        return {
          ...version,
          createdByUser: user
            ? {
                _id: user._id,
                name: user.name,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// Get a specific version
export const getVersion = query({
  args: {
    versionId: v.id("documentVersions"),
  },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) return null;

    const user = await ctx.db.get(version.createdBy);

    return {
      ...version,
      createdByUser: user
        ? {
            _id: user._id,
            name: user.name,
            imageUrl: user.imageUrl,
          }
        : null,
    };
  },
});

// Get current version of a document
export const getCurrentVersion = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const currentVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isCurrentVersion"), true))
      .first();

    if (!currentVersion) return null;

    const user = await ctx.db.get(currentVersion.createdBy);

    return {
      ...currentVersion,
      createdByUser: user
        ? {
            _id: user._id,
            name: user.name,
            imageUrl: user.imageUrl,
          }
        : null,
    };
  },
});

// Restore a previous version (creates new version with old content)
export const restoreVersion = mutation({
  args: {
    versionId: v.id("documentVersions"),
    changeDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .first();

    if (!user) throw new Error("User not found");

    // Get the version to restore
    const versionToRestore = await ctx.db.get(args.versionId);
    if (!versionToRestore) throw new Error("Version not found");

    // Get latest version number
    const latestVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) =>
        q.eq("documentId", versionToRestore.documentId)
      )
      .order("desc")
      .first();

    const newVersionNumber = latestVersion
      ? latestVersion.versionNumber + 1
      : 1;

    // Mark all previous versions as not current
    const previousVersions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) =>
        q.eq("documentId", versionToRestore.documentId)
      )
      .filter((q) => q.eq(q.field("isCurrentVersion"), true))
      .collect();

    for (const version of previousVersions) {
      await ctx.db.patch(version._id, { isCurrentVersion: false });
    }

    // Create new version with restored content
    const newVersionId = await ctx.db.insert("documentVersions", {
      documentId: versionToRestore.documentId,
      versionNumber: newVersionNumber,
      title: versionToRestore.title,
      content: versionToRestore.content,
      fileUrl: versionToRestore.fileUrl,
      fileName: versionToRestore.fileName,
      fileSize: versionToRestore.fileSize,
      mimeType: versionToRestore.mimeType,
      changeDescription:
        args.changeDescription ||
        `Restored from version ${versionToRestore.versionNumber}`,
      changeType: "restored",
      createdBy: user._id,
      createdAt: Date.now(),
      isCurrentVersion: true,
    });

    // Document restored (documents table doesn't have updatedAt field)
    // Version creation timestamp is tracked in the version itself

    return newVersionId;
  },
});

// Compare two versions (returns both for client-side diffing)
export const compareVersions = query({
  args: {
    versionId1: v.id("documentVersions"),
    versionId2: v.id("documentVersions"),
  },
  handler: async (ctx, args) => {
    const version1 = await ctx.db.get(args.versionId1);
    const version2 = await ctx.db.get(args.versionId2);

    if (!version1 || !version2) {
      throw new Error("One or both versions not found");
    }

    const user1 = await ctx.db.get(version1.createdBy);
    const user2 = await ctx.db.get(version2.createdBy);

    return {
      version1: {
        ...version1,
        createdByUser: user1
          ? {
              _id: user1._id,
              name: user1.name,
              imageUrl: user1.imageUrl,
            }
          : null,
      },
      version2: {
        ...version2,
        createdByUser: user2
          ? {
              _id: user2._id,
              name: user2.name,
              imageUrl: user2.imageUrl,
            }
          : null,
      },
    };
  },
});

// Lock document for editing
export const lockForEditing = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .first();

    if (!user) throw new Error("User not found");

    // Get current version
    const currentVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isCurrentVersion"), true))
      .first();

    if (!currentVersion) throw new Error("No current version found");

    // Check if already locked
    if (currentVersion.editingLockedBy) {
      // Check if lock is stale (older than 5 minutes)
      const lockAge = Date.now() - (currentVersion.editingLockedAt || 0);
      const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

      if (lockAge < LOCK_TIMEOUT && currentVersion.editingLockedBy !== user._id) {
        const lockingUser = await ctx.db.get(currentVersion.editingLockedBy);
        throw new Error(
          `Document is being edited by ${lockingUser?.name || "another user"}`
        );
      }
    }

    // Lock the document
    await ctx.db.patch(currentVersion._id, {
      editingLockedBy: user._id,
      editingLockedAt: Date.now(),
    });

    return true;
  },
});

// Unlock document
export const unlockDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .first();

    if (!user) throw new Error("User not found");

    // Get current version
    const currentVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isCurrentVersion"), true))
      .first();

    if (!currentVersion) return true;

    // Only the user who locked it can unlock (or admin)
    // Get user level to check admin status
    const userLevelDoc = await ctx.db.get(user.userLevel);
    const isAdmin = userLevelDoc && userLevelDoc.level >= 4;
    
    if (
      currentVersion.editingLockedBy === user._id ||
      isAdmin
    ) {
      await ctx.db.patch(currentVersion._id, {
        editingLockedBy: undefined,
        editingLockedAt: undefined,
      });
    }

    return true;
  },
});

// Get editing status (who is editing)
export const getEditingStatus = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const currentVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isCurrentVersion"), true))
      .first();

    if (!currentVersion || !currentVersion.editingLockedBy) {
      return { isLocked: false };
    }

    // Check if lock is stale
    const lockAge = Date.now() - (currentVersion.editingLockedAt || 0);
    const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    if (lockAge >= LOCK_TIMEOUT) {
      return { isLocked: false };
    }

    const lockingUser = await ctx.db.get(currentVersion.editingLockedBy);

    return {
      isLocked: true,
      lockedBy: lockingUser
        ? {
            _id: lockingUser._id,
            name: lockingUser.name,
            imageUrl: lockingUser.imageUrl,
          }
        : null,
      lockedAt: currentVersion.editingLockedAt,
    };
  },
});

// Auto-save version (creates version without bumping major version)
export const autoSaveVersion = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .first();

    if (!user) throw new Error("User not found");

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    // Get current version
    const currentVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isCurrentVersion"), true))
      .first();

    if (!currentVersion) throw new Error("No current version");

    // Check if user has the lock
    if (
      currentVersion.editingLockedBy &&
      currentVersion.editingLockedBy !== user._id
    ) {
      throw new Error("You don't have the edit lock");
    }

    // Update current version with new content (auto-save doesn't create new version)
    await ctx.db.patch(currentVersion._id, {
      content: args.content,
      changeType: "auto_save",
    });

    return currentVersion._id;
  },
});

// Get version statistics
export const getVersionStats = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const totalVersions = versions.length;
    const contributors = new Set(versions.map((v) => v.createdBy.toString()))
      .size;

    const changeTypes = versions.reduce(
      (acc, v) => {
        acc[v.changeType] = (acc[v.changeType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const latestVersion = versions.reduce((latest, v) =>
      v.versionNumber > latest.versionNumber ? v : latest
    );

    return {
      totalVersions,
      contributors,
      changeTypes,
      latestVersionNumber: latestVersion?.versionNumber || 0,
      createdAt: versions[versions.length - 1]?.createdAt,
      lastUpdatedAt: latestVersion?.createdAt,
    };
  },
});
