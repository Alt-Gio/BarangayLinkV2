import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add expense to project
export const addExpense = mutation({
  args: {
    projectId: v.id("projects"),
    description: v.string(),
    amount: v.number(),
    category: v.union(
      v.literal("materials"),
      v.literal("labor"),
      v.literal("equipment"),
      v.literal("transportation"),
      v.literal("permits"),
      v.literal("utilities"),
      v.literal("other")
    ),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const expenseId = await ctx.db.insert("expenses", {
      projectId: args.projectId,
      description: args.description,
      amount: args.amount,
      category: args.category,
      date: args.date,
      notes: args.notes,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return expenseId;
  },
});

// Get all expenses for a project
export const getProjectExpenses = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    // Enrich with creator info
    const enrichedExpenses = await Promise.all(
      expenses.map(async (expense) => {
        const creator = await ctx.db.get(expense.createdBy);
        return {
          ...expense,
          createdBy: creator ? {
            _id: creator._id,
            name: creator.name,
            imageUrl: creator.imageUrl,
          } : null,
        };
      })
    );

    return enrichedExpenses;
  },
});

// Get expense statistics for a project
export const getExpenseStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .collect();

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Group by category
    const byCategory = {
      materials: expenses.filter(e => e.category === "materials").reduce((sum, e) => sum + e.amount, 0),
      labor: expenses.filter(e => e.category === "labor").reduce((sum, e) => sum + e.amount, 0),
      equipment: expenses.filter(e => e.category === "equipment").reduce((sum, e) => sum + e.amount, 0),
      transportation: expenses.filter(e => e.category === "transportation").reduce((sum, e) => sum + e.amount, 0),
      permits: expenses.filter(e => e.category === "permits").reduce((sum, e) => sum + e.amount, 0),
      utilities: expenses.filter(e => e.category === "utilities").reduce((sum, e) => sum + e.amount, 0),
      other: expenses.filter(e => e.category === "other").reduce((sum, e) => sum + e.amount, 0),
    };

    return {
      totalExpenses,
      expenseCount: expenses.length,
      byCategory,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
    };
  },
});

// Update expense
export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("materials"),
      v.literal("labor"),
      v.literal("equipment"),
      v.literal("transportation"),
      v.literal("permits"),
      v.literal("utilities"),
      v.literal("other")
    )),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { expenseId, ...updates } = args;

    await ctx.db.patch(expenseId, updates);

    return expenseId;
  },
});

// Delete expense
export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.expenseId);

    return { success: true };
  },
});
