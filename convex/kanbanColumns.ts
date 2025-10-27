import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all kanban columns for a milestone
 */
export const getColumns = query({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .order("asc")
      .collect();

    // If no columns exist, create default ones
    if (columns.length === 0) {
      return null; // Frontend will initialize defaults
    }

    return columns.sort((a, b) => a.order - b.order);
  },
});

/**
 * Initialize default columns for a milestone
 */
export const initializeDefaultColumns = mutation({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if columns already exist
    const existing = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .first();

    if (existing) {
      return { message: "Columns already initialized" };
    }

    // Create default columns
    const defaultColumns = [
      {
        title: "To Do",
        statusKey: "todo",
        color: "gray",
        order: 0,
        isDefault: true,
      },
      {
        title: "In Progress",
        statusKey: "in_progress",
        color: "blue",
        order: 1,
        isDefault: true,
      },
      {
        title: "In Review",
        statusKey: "review",
        color: "purple",
        order: 2,
        isDefault: true,
      },
      {
        title: "Done",
        statusKey: "completed",
        color: "green",
        order: 3,
        isDefault: true,
      },
    ];

    for (const col of defaultColumns) {
      await ctx.db.insert("kanbanColumns", {
        milestoneId: args.milestoneId,
        title: col.title,
        statusKey: col.statusKey,
        color: col.color,
        order: col.order,
        isDefault: col.isDefault,
        rules: {},
        createdAt: Date.now(),
        createdBy: user._id,
      });
    }

    return { message: "Default columns created" };
  },
});

/**
 * Create a new custom column
 */
export const createColumn = mutation({
  args: {
    milestoneId: v.id("milestones"),
    title: v.string(),
    color: v.string(),
    insertAfterId: v.optional(v.id("kanbanColumns")), // Insert after this column
    rules: v.optional(
      v.object({
        requiresAssignment: v.optional(v.boolean()),
        requiresDescription: v.optional(v.boolean()),
        requiresStoryPoints: v.optional(v.boolean()),
        minStoryPoints: v.optional(v.number()),
        requiresPriority: v.optional(v.boolean()),
        requiresDueDate: v.optional(v.boolean()),
        requiresReviewer: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get all columns
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();

    // Sort by order
    columns.sort((a, b) => a.order - b.order);

    // Find insertion position
    let insertOrder: number;
    if (args.insertAfterId) {
      const targetColumn = columns.find(c => c._id === args.insertAfterId);
      if (targetColumn) {
        insertOrder = targetColumn.order + 1;
        // Shift all columns after this one
        for (const col of columns) {
          if (col.order >= insertOrder) {
            await ctx.db.patch(col._id, { order: col.order + 1 });
          }
        }
      } else {
        insertOrder = columns.length;
      }
    } else {
      insertOrder = columns.length;
    }

    // Create statusKey from title
    const statusKey = args.title.toLowerCase().replace(/\s+/g, "_");

    const columnId = await ctx.db.insert("kanbanColumns", {
      milestoneId: args.milestoneId,
      title: args.title,
      statusKey,
      color: args.color,
      order: insertOrder,
      isDefault: false,
      rules: args.rules || {},
      createdAt: Date.now(),
      createdBy: user._id,
    });

    return columnId;
  },
});

/**
 * Update a column
 */
export const updateColumn = mutation({
  args: {
    columnId: v.id("kanbanColumns"),
    title: v.optional(v.string()),
    color: v.optional(v.string()),
    rules: v.optional(
      v.object({
        requiresAssignment: v.optional(v.boolean()),
        requiresDescription: v.optional(v.boolean()),
        requiresStoryPoints: v.optional(v.boolean()),
        minStoryPoints: v.optional(v.number()),
        requiresPriority: v.optional(v.boolean()),
        requiresDueDate: v.optional(v.boolean()),
        requiresReviewer: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const column = await ctx.db.get(args.columnId);
    if (!column) throw new Error("Column not found");

    const updates: any = {};
    if (args.title) updates.title = args.title;
    if (args.color) updates.color = args.color;
    if (args.rules) updates.rules = args.rules;

    await ctx.db.patch(args.columnId, updates);

    return { success: true };
  },
});

/**
 * Delete a column (only if not default)
 * Moves tasks to the nearest left non-deletable column
 */
export const deleteColumn = mutation({
  args: {
    columnId: v.id("kanbanColumns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const column = await ctx.db.get(args.columnId);
    if (!column) throw new Error("Column not found");

    if (column.isDefault) {
      throw new Error("Cannot delete default columns");
    }

    // Get all columns sorted by order
    const allColumns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", column.milestoneId))
      .collect();
    
    allColumns.sort((a, b) => a.order - b.order);

    // Find the nearest left default/non-deletable column
    let targetColumn = null;
    for (let i = allColumns.length - 1; i >= 0; i--) {
      if (allColumns[i].order < column.order && allColumns[i].isDefault) {
        targetColumn = allColumns[i];
        break;
      }
    }

    // If no left column found, use the first default column
    if (!targetColumn) {
      targetColumn = allColumns.find(c => c.isDefault);
    }

    if (!targetColumn) {
      throw new Error("No default column found to move tasks to");
    }

    // Move all tasks from deleted column to target column
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", column.milestoneId))
      .collect();

    for (const task of tasks) {
      if (task.status === column.statusKey) {
        await ctx.db.patch(task._id, {
          status: targetColumn.statusKey,
        });
      }
    }

    // Delete the column
    await ctx.db.delete(args.columnId);

    return { 
      success: true, 
      movedTasksTo: targetColumn.title,
      taskCount: tasks.filter(t => t.status === column.statusKey).length,
    };
  },
});

/**
 * Reorder columns
 */
export const reorderColumns = mutation({
  args: {
    milestoneId: v.id("milestones"),
    columnIds: v.array(v.id("kanbanColumns")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Update order for each column
    for (let i = 0; i < args.columnIds.length; i++) {
      await ctx.db.patch(args.columnIds[i], { order: i });
    }

    return { success: true };
  },
});

/**
 * Validate if a task can be moved to a column
 */
export const validateTaskMove = query({
  args: {
    taskId: v.id("tasks"),
    targetColumnId: v.id("kanbanColumns"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const column = await ctx.db.get(args.targetColumnId);
    if (!column) throw new Error("Column not found");

    const errors: string[] = [];

    // Check rules
    if (column.rules.requiresAssignment && (!task.assignedTo || task.assignedTo.length === 0)) {
      errors.push("Task must have at least one assignee");
    }

    if (column.rules.requiresDescription && !task.description) {
      errors.push("Task must have a description");
    }

    if (column.rules.requiresStoryPoints && !task.storyPoints) {
      errors.push("Task must have story points assigned");
    }

    if (column.rules.minStoryPoints && task.storyPoints && task.storyPoints < column.rules.minStoryPoints) {
      errors.push(`Task must have at least ${column.rules.minStoryPoints} story points`);
    }

    if (column.rules.requiresPriority && !task.priority) {
      errors.push("Task must have a priority set");
    }

    if (column.rules.requiresDueDate && !task.dueDate) {
      errors.push("Task must have a due date");
    }

    return {
      canMove: errors.length === 0,
      errors,
    };
  },
});

/**
 * Remove "Task List" columns (migration helper)
 * Call this once to clean up old "Task List" columns
 */
export const removeTaskListColumns = mutation({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Find "task_list" column
    const allColumns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
      .collect();

    const taskListColumn = allColumns.find(c => c.statusKey === "task_list");
    
    if (!taskListColumn) {
      return { message: "No Task List column found" };
    }

    allColumns.sort((a, b) => a.order - b.order);

    // Find the nearest left default column (should be "To Do")
    let targetColumn = null;
    for (let i = allColumns.length - 1; i >= 0; i--) {
      if (allColumns[i].order < taskListColumn.order && allColumns[i].isDefault) {
        targetColumn = allColumns[i];
        break;
      }
    }

    if (!targetColumn) {
      targetColumn = allColumns.find(c => c.isDefault && c.statusKey === "todo");
    }

    if (targetColumn) {
      // Move all tasks from task_list to target column
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_milestone", (q) => q.eq("milestoneId", args.milestoneId))
        .collect();

      let movedCount = 0;
      for (const task of tasks) {
        if (task.status === "task_list") {
          await ctx.db.patch(task._id, {
            status: targetColumn.statusKey,
          });
          movedCount++;
        }
      }

      // Delete the Task List column
      await ctx.db.delete(taskListColumn._id);

      return { 
        message: "Task List column removed", 
        movedTasksTo: targetColumn.title,
        taskCount: movedCount,
      };
    }

    return { message: "Could not find target column" };
  },
});
