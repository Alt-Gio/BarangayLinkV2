"use client";

/**
 * Toast Notification System
 * Beautiful toast notifications using Sonner
 * Integrated with notification sounds
 */

import { toast as sonnerToast } from 'sonner';
import { playNotificationSound } from './notificationSounds';

export type ToastPriority = 'critical' | 'urgent' | 'high' | 'medium' | 'low';
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'task' | 'message' | 'achievement';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  priority?: ToastPriority;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  sound?: boolean;
}

/**
 * Show a toast notification
 */
export function showToast(options: ToastOptions) {
  const {
    title,
    description,
    type = 'info',
    priority = 'medium',
    action,
    duration,
    sound = true,
  } = options;

  // Play sound based on priority
  if (sound) {
    playNotificationSound(priority);
  }

  // Get duration based on priority
  const toastDuration = duration || getDurationForPriority(priority);

  // Show toast with appropriate styling
  const toastOptions: any = {
    description,
    duration: toastDuration,
    className: `toast-${priority}`,
  };

  if (action) {
    toastOptions.action = {
      label: action.label,
      onClick: action.onClick,
    };
  }

  // Use appropriate toast type
  switch (type) {
    case 'success':
      sonnerToast.success(title, toastOptions);
      break;
    case 'error':
      sonnerToast.error(title, toastOptions);
      break;
    case 'warning':
      sonnerToast.warning(title, toastOptions);
      break;
    case 'task':
    case 'message':
    case 'achievement':
    case 'info':
    default:
      sonnerToast(title, toastOptions);
      break;
  }
}

/**
 * Get toast duration based on priority
 */
function getDurationForPriority(priority: ToastPriority): number {
  switch (priority) {
    case 'critical':
    case 'urgent':
      return 10000; // 10 seconds
    case 'high':
      return 7000;  // 7 seconds
    case 'medium':
      return 5000;  // 5 seconds
    case 'low':
      return 3000;  // 3 seconds
    default:
      return 5000;
  }
}

/**
 * Quick toast helpers
 */
export const toast = {
  success: (title: string, description?: string) => 
    showToast({ title, description, type: 'success', sound: true }),
  
  error: (title: string, description?: string) => 
    showToast({ title, description, type: 'error', priority: 'high', sound: true }),
  
  warning: (title: string, description?: string) => 
    showToast({ title, description, type: 'warning', priority: 'medium', sound: true }),
  
  info: (title: string, description?: string) => 
    showToast({ title, description, type: 'info', sound: true }),
  
  taskAssigned: (title: string, description?: string, onClick?: () => void) => 
    showToast({
      title,
      description,
      type: 'task',
      priority: 'high',
      action: onClick ? { label: 'View Task', onClick } : undefined,
      sound: true,
    }),
  
  message: (title: string, description?: string, onClick?: () => void) => 
    showToast({
      title,
      description,
      type: 'message',
      priority: 'medium',
      action: onClick ? { label: 'View', onClick } : undefined,
      sound: true,
    }),
  
  achievement: (title: string, description?: string) => 
    showToast({
      title,
      description,
      type: 'achievement',
      priority: 'low',
      sound: true,
    }),
};
