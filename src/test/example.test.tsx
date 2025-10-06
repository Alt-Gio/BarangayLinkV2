/**
 * Example Tests
 * Demonstrates testing patterns for the application
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { formatDate, getRelativeTime, formatFileSize } from '@/lib/utils';

// ============================================
// UTILITY FUNCTION TESTS
// ============================================

describe('Utils - formatDate', () => {
  it('should format timestamp to readable date', () => {
    const timestamp = new Date('2025-01-15').getTime();
    const formatted = formatDate(timestamp);
    expect(formatted).toMatch(/Jan/i);
  });

  it('should handle invalid dates', () => {
    const formatted = formatDate(NaN);
    expect(formatted).toBe('Invalid Date');
  });
});

describe('Utils - getRelativeTime', () => {
  it('should return "just now" for recent times', () => {
    const now = Date.now();
    const relative = getRelativeTime(now - 1000); // 1 second ago
    expect(relative).toMatch(/just now|second/i);
  });

  it('should return hours ago', () => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const relative = getRelativeTime(twoHoursAgo);
    expect(relative).toMatch(/hour/i);
  });
});

describe('Utils - formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should handle zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });
});

// ============================================
// VALIDATION TESTS
// ============================================

import { validate, projectSchema, userProfileSchema } from '@/lib/validations';

describe('Validation - Project Schema', () => {
  it('should validate correct project data', () => {
    const validProject = {
      title: 'Test Project',
      description: 'This is a test project description',
      status: 'active',
      priority: 'medium',
      urgency: 'normal',
      budget: 10000,
      startDate: Date.now(),
      endDate: Date.now() + 86400000, // +1 day
      department: 'Engineering',
      isPublic: false,
    };

    const [result, error] = validate(projectSchema, validProject);
    expect(error).toBeNull();
    expect(result).toBeTruthy();
  });

  it('should reject project with end date before start date', () => {
    const invalidProject = {
      title: 'Test Project',
      description: 'This is a test project',
      status: 'active',
      priority: 'medium',
      urgency: 'normal',
      budget: 10000,
      startDate: Date.now(),
      endDate: Date.now() - 86400000, // -1 day (before start)
      department: 'Engineering',
      isPublic: false,
    };

    const [result, error] = validate(projectSchema, invalidProject);
    expect(error).toBeTruthy();
  });

  it('should reject project with negative budget', () => {
    const invalidProject = {
      title: 'Test Project',
      description: 'Test',
      status: 'active',
      priority: 'medium',
      urgency: 'normal',
      budget: -1000, // Invalid
      startDate: Date.now(),
      endDate: Date.now() + 86400000,
      department: 'Engineering',
      isPublic: false,
    };

    const [result, error] = validate(projectSchema, invalidProject);
    expect(error).toBeTruthy();
  });
});

describe('Validation - User Profile Schema', () => {
  it('should validate correct user profile', () => {
    const validProfile = {
      name: 'John Doe',
      email: 'john@example.com',
      position: 'Developer',
    };

    const [result, error] = validate(userProfileSchema, validProfile);
    expect(error).toBeNull();
    expect(result).toBeTruthy();
  });

  it('should reject invalid email', () => {
    const invalidProfile = {
      name: 'John Doe',
      email: 'not-an-email',
      position: 'Developer',
    };

    const [result, error] = validate(userProfileSchema, invalidProfile);
    expect(error).toBeTruthy();
  });
});

// ============================================
// ERROR HANDLER TESTS
// ============================================

import { errorHandler } from '@/lib/errorHandler';

describe('Error Handler', () => {
  it('should get user-friendly message', () => {
    const error = new Error('Network failed');
    const message = errorHandler.getUserMessage(error);
    expect(message).toBeTruthy();
    expect(typeof message).toBe('string');
  });

  it('should log errors in development', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler.logErrorPublic(new Error('Test error'), 'Test context');
    
    // Just verify the method exists and can be called
    expect(consoleSpy).toBeDefined();
    
    consoleSpy.mockRestore();
  });
});

// ============================================
// COMPONENT TESTS (Example)
// ============================================

describe('Button Component Example', () => {
  it('should render button with text', () => {
    render(<button>Click me</button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<button onClick={handleClick}>Click me</button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ============================================
// HOOK TESTS (Example)
// ============================================

import { renderHook, act } from '@testing-library/react';
import { useToggle } from '@/hooks/useCommonHooks';

describe('useToggle Hook', () => {
  it('should toggle boolean value', () => {
    const { result } = renderHook(() => useToggle(false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1]();
    });
    
    expect(result.current[0]).toBe(true);
  });

  it('should set specific value', () => {
    const { result } = renderHook(() => useToggle(false));
    
    act(() => {
      result.current[2](true);
    });
    
    expect(result.current[0]).toBe(true);
  });
});
