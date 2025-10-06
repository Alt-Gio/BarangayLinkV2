/**
 * Pagination Helper Functions for Convex Queries
 * Provides consistent pagination across all data queries
 */

import { v } from "convex/values";

// Standard pagination arguments
export const paginationArgs = {
  page: v.optional(v.number()),
  limit: v.optional(v.number()),
  sortBy: v.optional(v.string()),
  sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
};

// Pagination result type helper
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number = 1,
  limit: number = 50
): PaginatedResult<T> {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get pagination parameters with defaults
 */
export function getPaginationParams(
  page?: number,
  limit?: number
): { page: number; limit: number; offset: number } {
  const normalizedPage = Math.max(1, page || 1);
  const normalizedLimit = Math.min(100, Math.max(1, limit || 50));
  const offset = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset,
  };
}
