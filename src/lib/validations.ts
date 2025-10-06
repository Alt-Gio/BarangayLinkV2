/**
 * Zod Validation Schemas
 * Centralized validation for forms and API inputs
 */

import { z } from 'zod';

// ============================================
// USER VALIDATIONS
// ============================================

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  department: z.string().min(1, 'Department is required').optional(),
  position: z.string().min(2, 'Position must be at least 2 characters').max(100),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  skills: z.array(z.string()).max(20, 'Maximum 20 skills allowed').optional(),
});

export const userRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(2, 'Position is required').max(100),
});

// ============================================
// PROJECT VALIDATIONS
// ============================================

export const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'active', 'on_hold', 'completed', 'cancelled', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  urgency: z.enum(['normal', 'urgent', 'emergency']),
  budget: z.number().positive('Budget must be positive').max(100000000, 'Budget exceeds maximum'),
  spent: z.number().nonnegative('Spent amount cannot be negative').optional(),
  startDate: z.number().positive(),
  endDate: z.number().positive(),
  location: z.string().max(200).optional(),
  department: z.string().min(1, 'Department is required'),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed').optional(),
  isPublic: z.boolean().default(false),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const projectUpdateSchema = projectSchema.partial();

// ============================================
// TASK VALIDATIONS
// ============================================

export const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  type: z.enum(['todo', 'daily', 'habit', 'milestone', 'reward']),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']),
  status: z.enum(['todo', 'in_progress', 'review', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.number().positive().optional(),
  estimatedHours: z.number().positive().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

// ============================================
// EVENT VALIDATIONS
// ============================================

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  type: z.enum(['meeting', 'community', 'project', 'emergency']),
  startDate: z.number().positive(),
  endDate: z.number().positive(),
  location: z.string().min(1, 'Location is required').max(200),
  maxAttendees: z.number().positive().max(10000).optional(),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// ============================================
// DOCUMENT VALIDATIONS
// ============================================

export const documentUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  mimeType: z.string().regex(/^[\w-]+\/[\w-+.]+$/, 'Invalid MIME type'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(20).optional(),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(['public', 'internal', 'restricted']),
});

// ============================================
// MESSAGING VALIDATIONS
// ============================================

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  roomId: z.string().min(1),
});

export const chatRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  participantIds: z.array(z.string()).min(1, 'At least one participant required').max(50),
});

// ============================================
// SEARCH VALIDATIONS
// ============================================

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  type: z.enum(['all', 'projects', 'tasks', 'users', 'documents', 'events']).optional(),
  dateFrom: z.number().optional(),
  dateTo: z.number().optional(),
  department: z.string().optional(),
  limit: z.number().positive().max(100).default(20),
  offset: z.number().nonnegative().default(0),
});

// ============================================
// PAGINATION VALIDATIONS
// ============================================

export const paginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate data against a schema
 * Returns [data, error] tuple
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): [T | null, z.ZodError | null] {
  try {
    const validated = schema.parse(data);
    return [validated, null];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return [null, error];
    }
    throw error;
  }
}

/**
 * Get user-friendly error messages from Zod errors
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return errors;
}

/**
 * Format validation errors for display
 */
export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
}
