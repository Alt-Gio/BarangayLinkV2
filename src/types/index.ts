/**
 * Comprehensive TypeScript Types for BarangayLink V2
 * Centralized type definitions to ensure type safety across the application
 */

import { Id } from "../../convex/_generated/dataModel";

// ============================================
// USER TYPES
// ============================================

export interface UserLevel {
  _id: Id<"userLevels">;
  _creationTime: number;
  name: string;
  level: number;
  permissions: string[];
  description: string;
  isActive: boolean;
}

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  clerkId: string;
  email: string;
  name: string;
  userLevel: Id<"userLevels">;
  department?: string;
  position: string;
  phone?: string;
  isActive: boolean;
  level: number;
  experience: number;
  gold: number;
  health: number;
  mana: number;
  streakCount: number;
  lastActiveDate?: number;
  totalTasksCompleted: number;
  totalHoursLogged: number;
  projectSuccessRate: number;
  imageUrl?: string;
  bio?: string;
  skills?: string[];
}

export interface UserWithLevel extends Omit<User, 'userLevel'> {
  userLevel: UserLevel;
}

// ============================================
// DEPARTMENT TYPES
// ============================================

export interface Department {
  _id: Id<"departments">;
  _creationTime: number;
  name: string;
  description: string;
  category: string;
  head?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DepartmentWithStats extends Department {
  userCount: number;
  headInfo?: {
    name: string;
  };
}

// ============================================
// PROJECT TYPES
// ============================================

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  _id: Id<"projects">;
  _creationTime: number;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: number;
  endDate?: number;
  budget?: number;
  department: string;
  projectManager: Id<"users">;
  teamMembers: Id<"users">[];
  tags?: string[];
  location?: string;
  progressPercentage: number;
  isActive: boolean;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectWithDetails extends Project {
  manager: UserWithLevel;
  team: UserWithLevel[];
  taskCount: number;
  completedTaskCount: number;
}

// ============================================
// TASK TYPES
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'todo' | 'daily' | 'habit';

export interface Task {
  _id: Id<"tasks">;
  _creationTime: number;
  userId: Id<"users">;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: number;
  projectId?: Id<"projects">;
  eventId?: Id<"events">;
  assignedTo?: Id<"users">;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  dependencies?: Id<"tasks">[];
  attachments?: string[];
  xpReward: number;
  goldReward: number;
  difficulty: string;
  repeatConfig?: {
    frequency: string;
    days?: number[];
    endDate?: number;
  };
  completionRate?: number;
  streakCount?: number;
  lastCompleted?: number;
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
    hours?: number;
  }[];
  loggedHours: {
    hours: number;
    date: number;
    userId: Id<"users">;
    description?: string;
  }[];
  projectImpactScore?: number;
  isBlocking: boolean;
}

export interface TaskWithDetails extends Task {
  assignedUser?: UserWithLevel;
  project?: Project;
}

// ============================================
// EVENT TYPES
// ============================================

export type EventType = 'meeting' | 'deadline' | 'milestone' | 'holiday' | 'training';

export interface Event {
  _id: Id<"events">;
  _creationTime: number;
  title: string;
  description?: string;
  type: EventType;
  startDate: number;
  endDate: number;
  location?: string;
  organizer: Id<"users">;
  attendees: Id<"users">[];
  projectId?: Id<"projects">;
  isAllDay: boolean;
  reminderMinutes?: number;
  recurringConfig?: {
    frequency: string;
    interval: number;
    endDate?: number;
  };
  status: string;
  color?: string;
}

// ============================================
// DOCUMENT TYPES
// ============================================

export type DocumentType = 'pdf' | 'doc' | 'xls' | 'img' | 'other';
export type DocumentAccess = 'public' | 'private' | 'restricted';

export interface Document {
  _id: Id<"documents">;
  _creationTime: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: DocumentType;
  fileSize: number;
  uploadedBy: Id<"users">;
  projectId?: Id<"projects">;
  department?: string;
  tags?: string[];
  accessLevel: DocumentAccess;
  sharedWith?: Id<"users">[];
  version: number;
  isActive: boolean;
  uploadedAt: number;
  lastModified: number;
}

// ============================================
// CHAT/MESSAGE TYPES
// ============================================

export type ChatRoomType = 'direct' | 'group' | 'project' | 'department';

export interface ChatRoom {
  _id: Id<"chatRooms">;
  _creationTime: number;
  name?: string;
  type: ChatRoomType;
  participants: Id<"users">[];
  projectId?: Id<"projects">;
  department?: string;
  createdBy: Id<"users">;
  lastMessage?: string;
  lastMessageAt?: number;
  isActive: boolean;
}

export interface Message {
  _id: Id<"messages">;
  _creationTime: number;
  chatRoomId: Id<"chatRooms">;
  senderId: Id<"users">;
  content: string;
  type: string;
  attachments?: string[];
  replyTo?: Id<"messages">;
  reactions?: {
    emoji: string;
    userId: Id<"users">;
  }[];
  isEdited: boolean;
  isDeleted: boolean;
  sentAt: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'event' | 'message';

export interface Notification {
  _id: Id<"notifications">;
  _creationTime: number;
  userId: Id<"users">;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: {
    category?: string;
    priority?: string;
    relatedId?: string;
    data?: any;
  };
  createdAt: number;
  readAt?: number;
  isRead: boolean;
}

// ============================================
// BACKUP TYPES
// ============================================

export type BackupStatus = 'completed' | 'failed' | 'in_progress';
export type BackupType = 'full' | 'partial' | 'scheduled';

export interface Backup {
  _id: Id<"backups">;
  _creationTime: number;
  timestamp: number;
  createdBy: Id<"users">;
  tables: string[];
  recordCount: number;
  status: BackupStatus;
  type: BackupType;
}

export interface BackupSchedule {
  _id: Id<"backupSchedules">;
  _creationTime: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  retentionDays: number;
  updatedBy: Id<"users">;
  updatedAt: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// FORM TYPES
// ============================================

export interface FormState<T = any> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PageProps<T = any> {
  params: T;
  searchParams?: Record<string, string | string[] | undefined>;
}

// ============================================
// FILTER/SEARCH TYPES
// ============================================

export interface FilterOptions {
  status?: string[];
  priority?: string[];
  department?: string[];
  dateFrom?: number;
  dateTo?: number;
  assignedTo?: Id<"users">[];
  tags?: string[];
}

export interface SearchParams {
  query: string;
  filters?: FilterOptions;
  pagination?: PaginationParams;
}

// ============================================
// STATS/ANALYTICS TYPES
// ============================================

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  upcomingEvents: number;
  unreadMessages: number;
  teamMembers: number;
}

export interface UserStats {
  level: number;
  experience: number;
  gold: number;
  health: number;
  mana: number;
  streakCount: number;
  tasksCompleted: number;
  projectsCompleted: number;
  achievementsUnlocked: number;
}

// ============================================
// EXPORT/IMPORT TYPES
// ============================================

export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  tables: string[];
  dateFrom?: number;
  dateTo?: number;
  filters?: FilterOptions;
}

// ============================================
// PERMISSION TYPES
// ============================================

export type Permission =
  | 'view_projects'
  | 'create_projects'
  | 'edit_projects'
  | 'delete_projects'
  | 'view_tasks'
  | 'create_tasks'
  | 'edit_tasks'
  | 'delete_tasks'
  | 'view_users'
  | 'manage_users'
  | 'manage_departments'
  | 'view_reports'
  | 'manage_system'
  | 'backup_data';

export interface PermissionCheck {
  userId: Id<"users">;
  permission: Permission;
  resourceId?: string;
}
