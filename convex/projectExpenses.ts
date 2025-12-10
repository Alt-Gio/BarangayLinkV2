import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

export const createExpense = mutation({
  args: {
    projectId: v.id("projects"),
    category: v.string(), // "supplies", "labor", "equipment", "transportation", "food", "other"
    amount: v.number(),
    description: v.string(),
    receiptUrl: v.optional(v.string()),
    date: v.optional(v.number()),
    vendor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const expenseId = await ctx.db.insert("projectExpenses", {
      projectId: args.projectId,
      category: args.category,
      amount: args.amount,
      description: args.description,
      receiptUrl: args.receiptUrl || "",
      vendor: args.vendor || "",
      submittedBy: user._id,
      approvedBy: undefined,
      status: "pending",
      submittedAt: Date.now(),
      expenseDate: args.date || Date.now(),
      approvedAt: undefined,
      rejectionReason: undefined,
    });

    const budget = await ctx.db
      .query("projectBudgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (budget && budget.approvers) {
      for (const approverId of budget.approvers) {
        await ctx.db.insert("notifications", {
          userId: approverId,
          type: "expense_pending",
          title: "New Expense for Approval",
          message: `${user.name} submitted an expense of ${budget.currency} ${args.amount.toFixed(2)} for ${args.category}`,
          priority: "normal",
          isRead: false,
          metadata: {
            expenseId,
            projectId: args.projectId,
            amount: args.amount,
            category: args.category,
          },
          createdAt: Date.now(),
        });
      }
    }

    await ctx.db.insert("userActivityLogs", {
      userId: user._id,
      activityType: "action",
      action: "expense_submitted",
      targetType: "project",
      targetId: args.projectId,
      metadata: {
        expenseId,
        amount: args.amount,
        category: args.category,
      },
      timestamp: Date.now(),
    });

    return expenseId;
  },
});

// Approve expense
export const approveExpense = mutation({
  args: {
    expenseId: v.id("projectExpenses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");

    // Check if user is an approver
    const budget = await ctx.db
      .query("projectBudgets")
      .withIndex("by_project", (q) => q.eq("projectId", expense.projectId))
      .first();

    if (!budget || !budget.approvers.includes(user._id)) {
      throw new Error("Not authorized to approve expenses");
    }

    // Update expense status
    await ctx.db.patch(args.expenseId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: Date.now(),
    });

    // Update budget spent amount
    await ctx.runMutation(api.projectBudget.updateSpent, {
      projectId: expense.projectId,
      amount: expense.amount,
      operation: "add",
    });

    // Notify submitter
    await ctx.db.insert("notifications", {
      userId: expense.submittedBy,
      type: "expense_approved",
      title: "Expense Approved",
      message: `Your expense of ${budget.currency} ${expense.amount.toFixed(2)} was approved`,
      priority: "normal",
      isRead: false,
      metadata: {
        expenseId: args.expenseId,
        amount: expense.amount,
        category: expense.category,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Reject expense
export const rejectExpense = mutation({
  args: {
    expenseId: v.id("projectExpenses"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");

    // Check if user is an approver
    const budget = await ctx.db
      .query("projectBudgets")
      .withIndex("by_project", (q) => q.eq("projectId", expense.projectId))
      .first();

    if (!budget || !budget.approvers.includes(user._id)) {
      throw new Error("Not authorized to reject expenses");
    }

    // Update expense status
    await ctx.db.patch(args.expenseId, {
      status: "rejected",
      approvedBy: user._id,
      approvedAt: Date.now(),
      rejectionReason: args.reason,
    });

    // Notify submitter
    await ctx.db.insert("notifications", {
      userId: expense.submittedBy,
      type: "expense_rejected",
      title: "Expense Rejected",
      message: `Your expense of ${budget?.currency || "PHP"} ${expense.amount.toFixed(2)} was rejected: ${args.reason}`,
      priority: "normal",
      isRead: false,
      metadata: {
        expenseId: args.expenseId,
        amount: expense.amount,
        category: expense.category,
        reason: args.reason,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get project expenses
export const getProjectExpenses = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("projectExpenses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    const expenses = await query.collect();

    // Filter by status if provided
    const filtered = args.status
      ? expenses.filter((e) => e.status === args.status)
      : expenses;

    // Enrich with user data
    const enriched = await Promise.all(
      filtered.map(async (expense) => {
        const submitter = await ctx.db.get(expense.submittedBy);
        const approver = expense.approvedBy
          ? await ctx.db.get(expense.approvedBy)
          : null;

        return {
          ...expense,
          submitterName: submitter?.name || "Unknown",
          approverName: approver?.name || null,
        };
      })
    );

    return enriched.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// Get pending approvals for user
export const getPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) return [];

    // Find all budgets where user is an approver
    const budgets = await ctx.db
      .query("projectBudgets")
      .collect();

    const userBudgets = budgets.filter((b) => b.approvers.includes(user._id));

    if (userBudgets.length === 0) return [];

    // Get all pending expenses for those projects
    const allExpenses = await ctx.db
      .query("projectExpenses")
      .collect();

    const pendingExpenses = allExpenses.filter(
      (e) =>
        e.status === "pending" &&
        userBudgets.some((b) => b.projectId === e.projectId)
    );

    // Enrich with project and user data
    const enriched = await Promise.all(
      pendingExpenses.map(async (expense) => {
        const project = await ctx.db.get(expense.projectId);
        const submitter = await ctx.db.get(expense.submittedBy);

        return {
          ...expense,
          projectName: project?.title || "Unknown Project",
          submitterName: submitter?.name || "Unknown",
        };
      })
    );

    return enriched.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// Get expense summary
export const getExpenseSummary = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("projectExpenses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const approved = expenses.filter((e) => e.status === "approved");
    const pending = expenses.filter((e) => e.status === "pending");
    const rejected = expenses.filter((e) => e.status === "rejected");

    const totalApproved = approved.reduce((sum, e) => sum + e.amount, 0);
    const totalPending = pending.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    approved.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return {
      total: expenses.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      totalApproved,
      totalPending,
      byCategory,
    };
  },
});

// Export expenses to CSV
export const exportExpenses = query({
  args: {
    projectId: v.id("projects"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("projectExpenses")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Filter by date range if provided
    const filtered = expenses.filter((e) => {
      if (args.startDate && e.expenseDate < args.startDate) return false;
      if (args.endDate && e.expenseDate > args.endDate) return false;
      return true;
    });

    // Enrich with user data
    const enriched = await Promise.all(
      filtered.map(async (expense) => {
        const submitter = await ctx.db.get(expense.submittedBy);
        const approver = expense.approvedBy
          ? await ctx.db.get(expense.approvedBy)
          : null;

        return {
          date: new Date(expense.expenseDate).toISOString().split("T")[0],
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          vendor: expense.vendor,
          submitter: submitter?.name || "Unknown",
          approver: approver?.name || "Pending",
          status: expense.status,
          submittedDate: new Date(expense.submittedAt).toISOString().split("T")[0],
        };
      })
    );

    return enriched;
  },
});
