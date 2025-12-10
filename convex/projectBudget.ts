import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const setBudget = mutation({
  args: {
    projectId: v.id("projects"),
    totalBudget: v.number(),
    currency: v.optional(v.string()),
    alertThresholds: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("projectBudgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    const budgetData = {
      projectId: args.projectId,
      totalBudget: args.totalBudget,
      allocated: 0,
      spent: 0,
      currency: args.currency || "PHP",
      alertThresholds: args.alertThresholds || [75, 90, 100],
      alertsSent: [] as number[],
      approvers: [user._id],
      createdBy: user._id,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, budgetData);
      return existing._id;
    } else {
      return await ctx.db.insert("projectBudgets", {
        ...budgetData,
        createdAt: Date.now(),
      });
    }
  },
});

export const getBudget = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const budget = await ctx.db
      .query("projectBudgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (!budget) return null;

    const utilization = budget.totalBudget > 0 
      ? (budget.spent / budget.totalBudget) * 100 
      : 0;

    const remaining = budget.totalBudget - budget.spent;

    const alerts = budget.alertThresholds.map((threshold) => ({
      threshold,
      triggered: utilization >= threshold,
      sent: budget.alertsSent.includes(threshold),
    }));

    return {
      ...budget,
      utilization: Math.round(utilization * 100) / 100,
      remaining,
      status:
        utilization >= 100
          ? "exceeded"
          : utilization >= 90
          ? "critical"
          : utilization >= 75
          ? "warning"
          : "healthy",
      alerts,
    };
  },
});

// Update spent amount (called when expense is approved)
export const updateSpent = mutation({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
    operation: v.union(v.literal("add"), v.literal("subtract")),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db
      .query("projectBudgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (!budget) {
      throw new Error("Budget not found for project");
    }

    const newSpent =
      args.operation === "add"
        ? budget.spent + args.amount
        : budget.spent - args.amount;

    await ctx.db.patch(budget._id, {
      spent: Math.max(0, newSpent),
      updatedAt: Date.now(),
    });

    // Check if we need to send alerts
    const utilization = (newSpent / budget.totalBudget) * 100;
    const newAlerts = budget.alertThresholds.filter(
      (threshold) =>
        utilization >= threshold && !budget.alertsSent.includes(threshold)
    );

    if (newAlerts.length > 0) {
      // Send notifications for new alerts
      for (const threshold of newAlerts) {
        // Notify approvers
        for (const approverId of budget.approvers) {
          await ctx.db.insert("notifications", {
            userId: approverId,
            type: "budget_alert",
            title: `Budget Alert: ${threshold}% Reached`,
            message: `Project budget has reached ${threshold}% utilization (${budget.currency} ${newSpent.toFixed(2)} / ${budget.totalBudget.toFixed(2)})`,
            priority: threshold >= 90 ? "high" : "normal",
            isRead: false,
            metadata: {
              projectId: args.projectId,
              threshold,
              utilization: Math.round(utilization),
              spent: newSpent,
              total: budget.totalBudget,
            },
            createdAt: Date.now(),
          });
        }
      }

      // Update alerts sent
      await ctx.db.patch(budget._id, {
        alertsSent: [...budget.alertsSent, ...newAlerts],
      });
    }

    return { newSpent, utilization };
  },
});

// Get budget summary for all projects
export const getAllBudgets = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
    status: v.optional(v.string()), // "healthy", "warning", "critical", "exceeded"
  },
  handler: async (ctx, args) => {
    // Get budgets based on projectId if provided
    let budgets;
    if (args.projectId !== undefined) {
      const projectId = args.projectId;
      const budget = await ctx.db
        .query("projectBudgets")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .first();
      budgets = budget ? [budget] : [];
    } else {
      budgets = await ctx.db.query("projectBudgets").collect();
    }
    
    const limit = args.limit || 100;

    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const project = await ctx.db.get(budget.projectId);
        const utilization = budget.totalBudget > 0
          ? (budget.spent / budget.totalBudget) * 100
          : 0;

        const status =
          utilization >= 100
            ? "exceeded"
            : utilization >= 90
            ? "critical"
            : utilization >= 75
            ? "warning"
            : "healthy";

        return {
          ...budget,
          projectName: project?.title || "Unknown Project",
          utilization: Math.round(utilization * 100) / 100,
          remaining: budget.totalBudget - budget.spent,
          status,
        };
      })
    );

    // Filter by status if provided
    const filtered = args.status
      ? enriched.filter((b) => b.status === args.status)
      : enriched;

    // Sort by utilization (highest first)
    return filtered
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, limit);
  },
});

// Get budget analytics
export const getBudgetAnalytics = query({
  args: {
    projectId: v.optional(v.id("projects")),
    timeRange: v.optional(v.string()), // "week", "month", "quarter", "year"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ranges = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    const since = args.timeRange
      ? now - ranges[args.timeRange as keyof typeof ranges]
      : now - ranges.month;

    // Get budgets
    let budgets;
    if (args.projectId !== undefined) {
      const projectId = args.projectId;
      const budget = await ctx.db
        .query("projectBudgets")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .first();
      budgets = budget ? [budget] : [];
    } else {
      budgets = await ctx.db.query("projectBudgets").collect();
    }

    // Calculate totals
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const avgUtilization =
      budgets.length > 0
        ? budgets.reduce(
            (sum, b) => sum + (b.totalBudget > 0 ? (b.spent / b.totalBudget) * 100 : 0),
            0
          ) / budgets.length
        : 0;

    // Status breakdown
    const statusCounts = {
      healthy: 0,
      warning: 0,
      critical: 0,
      exceeded: 0,
    };

    budgets.forEach((budget) => {
      const utilization = budget.totalBudget > 0
        ? (budget.spent / budget.totalBudget) * 100
        : 0;
      if (utilization >= 100) statusCounts.exceeded++;
      else if (utilization >= 90) statusCounts.critical++;
      else if (utilization >= 75) statusCounts.warning++;
      else statusCounts.healthy++;
    });

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      avgUtilization: Math.round(avgUtilization * 100) / 100,
      projectCount: budgets.length,
      statusCounts,
      currency: budgets[0]?.currency || "PHP",
    };
  },
});
