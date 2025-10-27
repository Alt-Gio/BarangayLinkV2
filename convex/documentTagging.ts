import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * SMART AUTO-TAGGING SYSTEM FOR DOCUMENTS
 * Automatically generates tags based on file type, name, and context
 */

// Smart tag generation based on file analysis
export const generateSmartTags = internalMutation({
  args: {
    fileName: v.string(),
    mimeType: v.string(),
    category: v.string(),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    const tags: string[] = [];
    const fileName = args.fileName.toLowerCase();
    const mimeType = args.mimeType.toLowerCase();

    // 1. FILE TYPE TAGS
    if (mimeType.includes('pdf')) {
      tags.push('pdf', 'document');
    } else if (mimeType.includes('image')) {
      tags.push('image');
      if (mimeType.includes('png')) tags.push('png');
      if (mimeType.includes('jpg') || mimeType.includes('jpeg')) tags.push('jpeg');
      if (mimeType.includes('svg')) tags.push('vector');
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || fileName.includes('.xlsx') || fileName.includes('.xls')) {
      tags.push('spreadsheet', 'excel', 'data');
    } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || fileName.includes('.pptx')) {
      tags.push('presentation', 'slides');
    } else if (mimeType.includes('word') || mimeType.includes('document') || fileName.includes('.docx')) {
      tags.push('word', 'document');
    } else if (mimeType.includes('video')) {
      tags.push('video', 'media');
    } else if (mimeType.includes('audio')) {
      tags.push('audio', 'media');
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
      tags.push('archive', 'compressed');
    } else if (mimeType.includes('text')) {
      tags.push('text', 'plain-text');
    }

    // 2. PURPOSE/CONTENT TAGS (based on filename patterns)
    const contentPatterns = [
      { pattern: /report|summary|analysis/i, tag: 'report' },
      { pattern: /proposal|pitch|plan/i, tag: 'proposal' },
      { pattern: /contract|agreement|legal/i, tag: 'legal' },
      { pattern: /invoice|receipt|billing/i, tag: 'financial' },
      { pattern: /budget|expense|cost/i, tag: 'budget' },
      { pattern: /certificate|diploma|award/i, tag: 'certificate' },
      { pattern: /meeting|minutes|notes/i, tag: 'meeting' },
      { pattern: /specification|spec|requirement/i, tag: 'technical' },
      { pattern: /design|mockup|wireframe/i, tag: 'design' },
      { pattern: /photo|picture|image/i, tag: 'photo' },
      { pattern: /screenshot|capture/i, tag: 'screenshot' },
      { pattern: /logo|brand|identity/i, tag: 'branding' },
      { pattern: /manual|guide|handbook/i, tag: 'documentation' },
      { pattern: /form|template/i, tag: 'template' },
      { pattern: /presentation|slide/i, tag: 'presentation' },
      { pattern: /milestone|deliverable/i, tag: 'milestone' },
      { pattern: /final|approved|signed/i, tag: 'approved' },
      { pattern: /draft|wip|work.in.progress/i, tag: 'draft' },
      { pattern: /v\d+|version|revision/i, tag: 'versioned' },
    ];

    for (const { pattern, tag } of contentPatterns) {
      if (pattern.test(fileName)) {
        tags.push(tag);
      }
    }

    // 3. DATE TAGS (if filename contains dates)
    const yearMatch = fileName.match(/20\d{2}/);
    if (yearMatch) {
      tags.push(`year-${yearMatch[0]}`);
    }

    const monthPatterns = [
      { pattern: /january|jan/i, tag: 'january' },
      { pattern: /february|feb/i, tag: 'february' },
      { pattern: /march|mar/i, tag: 'march' },
      { pattern: /april|apr/i, tag: 'april' },
      { pattern: /may/i, tag: 'may' },
      { pattern: /june|jun/i, tag: 'june' },
      { pattern: /july|jul/i, tag: 'july' },
      { pattern: /august|aug/i, tag: 'august' },
      { pattern: /september|sept|sep/i, tag: 'september' },
      { pattern: /october|oct/i, tag: 'october' },
      { pattern: /november|nov/i, tag: 'november' },
      { pattern: /december|dec/i, tag: 'december' },
    ];

    for (const { pattern, tag } of monthPatterns) {
      if (pattern.test(fileName)) {
        tags.push(tag);
      }
    }

    // 4. CONTEXT TAGS (based on relationships)
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        tags.push('project-related');
        if (project.department) {
          tags.push(project.department.toLowerCase().replace(/\s+/g, '-'));
        }
        if (project.priority) {
          tags.push(`${project.priority}-priority`);
        }
      }
    }

    if (args.taskId) {
      tags.push('task-related');
      const task = await ctx.db.get(args.taskId);
      if (task) {
        if (task.priority) {
          tags.push(`priority-${task.priority}`);
        }
      }
    }

    if (args.eventId) {
      tags.push('event-related');
    }

    // 5. CATEGORY TAG
    if (args.category) {
      tags.push(args.category.toLowerCase().replace(/\s+/g, '-'));
    }

    // Remove duplicates and return
    return [...new Set(tags)];
  },
});

// Get all unique tags across documents
export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").take(1000);
    
    const tagCounts: Record<string, number> = {};
    
    for (const doc of documents) {
      for (const tag of doc.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    // Sort by count (most used first)
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
  },
});

// Get documents by tag
export const getDocumentsByTag = query({
  args: { 
    tag: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { tag, limit = 50 }) => {
    const allDocs = await ctx.db.query("documents").take(500);
    
    const filtered = allDocs.filter(doc => 
      doc.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    ).slice(0, limit);

    // Enrich with uploader info
    const enrichedDocs = await Promise.all(
      filtered.map(async (doc) => {
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

// Smart category detection
export const detectCategory = mutation({
  args: {
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, { fileName, mimeType }) => {
    const fileNameLower = fileName.toLowerCase();
    const mimeTypeLower = mimeType.toLowerCase();

    // 1. Image files
    if (mimeTypeLower.includes('image')) {
      return 'Images';
    }

    // 2. Reports
    if (fileNameLower.includes('report') || fileNameLower.includes('summary') || fileNameLower.includes('analysis')) {
      return 'Reports';
    }

    // 3. Financial Documents
    if (fileNameLower.includes('invoice') || fileNameLower.includes('receipt') || fileNameLower.includes('budget')) {
      return 'Financial';
    }

    // 4. Legal Documents
    if (fileNameLower.includes('contract') || fileNameLower.includes('agreement') || fileNameLower.includes('legal')) {
      return 'Legal';
    }

    // 5. Presentations
    if (mimeTypeLower.includes('presentation') || fileNameLower.includes('.pptx') || fileNameLower.includes('slides')) {
      return 'Presentations';
    }

    // 6. Spreadsheets
    if (mimeTypeLower.includes('spreadsheet') || fileNameLower.includes('.xlsx') || fileNameLower.includes('.xls')) {
      return 'Spreadsheets';
    }

    // 7. Certificates
    if (fileNameLower.includes('certificate') || fileNameLower.includes('diploma') || fileNameLower.includes('award')) {
      return 'Certificates';
    }

    // 8. Meeting Documents
    if (fileNameLower.includes('meeting') || fileNameLower.includes('minutes') || fileNameLower.includes('agenda')) {
      return 'Meetings';
    }

    // 9. Design Files
    if (fileNameLower.includes('design') || fileNameLower.includes('mockup') || fileNameLower.includes('wireframe')) {
      return 'Design';
    }

    // 10. Technical Documents
    if (fileNameLower.includes('spec') || fileNameLower.includes('requirement') || fileNameLower.includes('technical')) {
      return 'Technical';
    }

    // Default: General
    return 'General';
  },
});
