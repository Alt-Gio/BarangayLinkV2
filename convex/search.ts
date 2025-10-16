import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// GLOBAL SEARCH
// ============================================

export const globalSearch = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number()),
    types: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { query, limit = 10, types }) => {
    const searchQuery = query.toLowerCase().trim();
    if (searchQuery.length < 2) return [];

    const results: any[] = [];

    // Search Projects
    if (!types || types.includes('project')) {
      const projects = await ctx.db
        .query("projects")
        .collect();
      
      const matchedProjects = projects
        .filter(p => 
          p.title.toLowerCase().includes(searchQuery) ||
          p.description?.toLowerCase().includes(searchQuery)
        )
        .slice(0, limit)
        .map(p => ({
          id: p._id,
          type: 'project',
          title: p.title,
          subtitle: p.description,
          url: `/projects/${p._id}`,
          icon: '💼',
          score: p.title.toLowerCase().startsWith(searchQuery) ? 10 : 5,
        }));
      
      results.push(...matchedProjects);
    }

    // Search Tasks
    if (!types || types.includes('task')) {
      const tasks = await ctx.db
        .query("tasks")
        .collect();
      
      const matchedTasks = tasks
        .filter(t => 
          t.title.toLowerCase().includes(searchQuery) ||
          t.description?.toLowerCase().includes(searchQuery)
        )
        .slice(0, limit)
        .map(t => ({
          id: t._id,
          type: 'task',
          title: t.title,
          subtitle: t.description,
          url: `/tasks/my-tasks?taskId=${t._id}`,
          icon: '✅',
          score: t.title.toLowerCase().startsWith(searchQuery) ? 10 : 5,
        }));
      
      results.push(...matchedTasks);
    }

    // Search Users
    if (!types || types.includes('user')) {
      const users = await ctx.db
        .query("users")
        .collect();
      
      const matchedUsers = users
        .filter(u => 
          u.name.toLowerCase().includes(searchQuery) ||
          u.email.toLowerCase().includes(searchQuery) ||
          u.department?.toLowerCase().includes(searchQuery)
        )
        .slice(0, limit)
        .map(u => ({
          id: u._id,
          type: 'user',
          title: u.name,
          subtitle: u.department || u.email,
          url: `/profile/${u._id}`,
          icon: '👤',
          score: u.name.toLowerCase().startsWith(searchQuery) ? 10 : 5,
        }));
      
      results.push(...matchedUsers);
    }

    // Search Events
    if (!types || types.includes('event')) {
      const events = await ctx.db
        .query("events")
        .collect();
      
      const matchedEvents = events
        .filter(e => 
          e.title.toLowerCase().includes(searchQuery) ||
          e.description?.toLowerCase().includes(searchQuery) ||
          e.location?.toLowerCase().includes(searchQuery)
        )
        .slice(0, limit)
        .map(e => ({
          id: e._id,
          type: 'event',
          title: e.title,
          subtitle: e.location || new Date(e.startDate).toLocaleDateString(),
          url: `/events?eventId=${e._id}`,
          icon: '📅',
          score: e.title.toLowerCase().startsWith(searchQuery) ? 10 : 5,
        }));
      
      results.push(...matchedEvents);
    }

    // Search Documents
    if (!types || types.includes('document')) {
      const documents = await ctx.db
        .query("documents")
        .collect();
      
      const matchedDocuments = documents
        .filter(d => 
          d.fileName.toLowerCase().includes(searchQuery) ||
          d.description?.toLowerCase().includes(searchQuery)
        )
        .slice(0, limit)
        .map(d => ({
          id: d._id,
          type: 'document',
          title: d.fileName,
          subtitle: d.description,
          url: `/documents/${d._id}`,
          icon: '📄',
          score: d.fileName.toLowerCase().startsWith(searchQuery) ? 10 : 5,
        }));
      
      results.push(...matchedDocuments);
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
});

// ============================================
// ADVANCED SEARCH
// ============================================

export const advancedSearch = query({
  args: {
    query: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
    department: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, type, status, priority, dateFrom, dateTo, assignedTo, department, tags, limit = 50 } = args;
    
    let results: any[] = [];

    // Filter by type
    if (!type || type === 'task') {
      let tasks = await ctx.db.query("tasks").collect();
      
      if (query) {
        tasks = tasks.filter(t => 
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.description?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (status) {
        tasks = tasks.filter(t => t.status === status);
      }
      
      if (priority) {
        tasks = tasks.filter(t => t.priority === priority);
      }
      
      if (assignedTo) {
        tasks = tasks.filter(t => t.assignedTo.includes(assignedTo));
      }
      
      if (dateFrom) {
        tasks = tasks.filter(t => t._creationTime >= dateFrom);
      }
      
      if (dateTo) {
        tasks = tasks.filter(t => t._creationTime <= dateTo);
      }

      if (tags && tags.length > 0) {
        tasks = tasks.filter(t => 
          t.tags?.some((tag: string) => tags.includes(tag))
        );
      }
      
      results.push(...tasks.map(t => ({
        ...t,
        type: 'task',
        url: `/tasks/my-tasks?taskId=${t._id}`,
      })));
    }

    if (!type || type === 'project') {
      let projects = await ctx.db.query("projects").collect();
      
      if (query) {
        projects = projects.filter(p => 
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (status) {
        projects = projects.filter(p => p.status === status);
      }
      
      if (dateFrom) {
        projects = projects.filter(p => p._creationTime >= dateFrom);
      }
      
      if (dateTo) {
        projects = projects.filter(p => p._creationTime <= dateTo);
      }

      if (tags && tags.length > 0) {
        projects = projects.filter(p => 
          p.tags?.some((tag: string) => tags.includes(tag))
        );
      }
      
      results.push(...projects.map(p => ({
        ...p,
        type: 'project',
        url: `/projects/${p._id}`,
      })));
    }

    if (!type || type === 'user') {
      let users = await ctx.db.query("users").collect();
      
      if (query) {
        users = users.filter(u => 
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (department) {
        users = users.filter(u => u.department === department);
      }
      
      results.push(...users.map(u => ({
        ...u,
        type: 'user',
        url: `/profile/${u._id}`,
      })));
    }

    if (!type || type === 'event') {
      let events = await ctx.db.query("events").collect();
      
      if (query) {
        events = events.filter(e => 
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.description?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (dateFrom) {
        events = events.filter(e => e.startDate >= dateFrom);
      }
      
      if (dateTo) {
        events = events.filter(e => e.startDate <= dateTo);
      }
      
      results.push(...events.map(e => ({
        ...e,
        type: 'event',
        url: `/events?eventId=${e._id}`,
      })));
    }

    return results.slice(0, limit);
  },
});

// ============================================
// SEARCH HISTORY
// ============================================

export const getSearchHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    const history = await ctx.db
      .query("searchHistory")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .take(10);

    return history;
  },
});

export const addSearchHistory = mutation({
  args: {
    query: v.string(),
    resultType: v.string(),
    resultId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return;

    // Check if this exact search already exists
    const existing = await ctx.db
      .query("searchHistory")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("query"), args.query)
        )
      )
      .first();

    if (existing) {
      // Update the timestamp
      await ctx.db.patch(existing._id, {
        timestamp: Date.now(),
        count: (existing.count || 1) + 1,
      });
    } else {
      // Add new history entry
      await ctx.db.insert("searchHistory", {
        userId: user._id,
        query: args.query,
        resultType: args.resultType,
        resultId: args.resultId,
        timestamp: Date.now(),
        count: 1,
      });
    }

    // Keep only last 50 searches per user
    const allHistory = await ctx.db
      .query("searchHistory")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();

    if (allHistory.length > 50) {
      for (const item of allHistory.slice(50)) {
        await ctx.db.delete(item._id);
      }
    }
  },
});

export const clearSearchHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return;

    const history = await ctx.db
      .query("searchHistory")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    for (const item of history) {
      await ctx.db.delete(item._id);
    }
  },
});

// ============================================
// TRENDING SEARCHES
// ============================================

export const getTrendingSearches = query({
  args: {},
  handler: async (ctx) => {
    const history = await ctx.db
      .query("searchHistory")
      .order("desc")
      .collect();

    // Group by query and count
    const queryCount = new Map<string, number>();
    
    history.forEach(item => {
      const count = queryCount.get(item.query) || 0;
      queryCount.set(item.query, count + (item.count || 1));
    });

    // Convert to array and sort by count
    const trending = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return trending;
  },
});

// ============================================
// SEARCH SUGGESTIONS (Autocomplete)
// ============================================

export const getSearchSuggestions = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();

    // Get suggestions from projects
    const projects = await ctx.db.query("projects").collect();
    projects.forEach(p => {
      if (p.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(p.title);
      }
    });

    // Get suggestions from tasks
    const tasks = await ctx.db.query("tasks").collect();
    tasks.forEach(t => {
      if (t.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(t.title);
      }
    });

    // Get suggestions from users
    const users = await ctx.db.query("users").collect();
    users.forEach(u => {
      if (u.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(u.name);
      }
    });

    return Array.from(suggestions).slice(0, 10);
  },
});
