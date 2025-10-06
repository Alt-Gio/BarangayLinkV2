/**
 * Common React Hooks
 * Reusable hooks to reduce code duplication
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { errorHandler, handleAsync } from '@/lib/errorHandler';
import { debounce } from '@/lib/utils';

// ============================================
// AUTH & USER HOOKS
// ============================================

/**
 * Get current user with type safety
 */
export function useCurrentUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && clerkUser ? {} : "skip"
  );

  return {
    user: convexUser,
    clerkUser,
    isLoaded,
    isAuthenticated: !!convexUser,
  };
}

/**
 * Check user permissions
 */
export function usePermissions() {
  const { user } = useCurrentUser();

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user?.userLevel) return false;
      
      // Admin has all permissions
      if (user.userLevel.name === 'ADMIN') return true;
      
      return user.userLevel.permissions?.includes(permission) || false;
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some(p => hasPermission(p));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      return permissions.every(p => hasPermission(p));
    },
    [hasPermission]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.userLevel?.name === 'ADMIN',
    isManager: user?.userLevel?.name === 'MANAGER',
  };
}

// ============================================
// ASYNC STATE HOOKS
// ============================================

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Handle async operations with loading and error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    const [data, error] = await handleAsync(asyncFunction());

    if (error) {
      setState({ data: null, loading: false, error: error.originalError || new Error(error.message) });
    } else {
      setState({ data, loading: false, error: null });
    }

    return data;
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

// ============================================
// FORM HOOKS
// ============================================

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void> | void;
}

/**
 * Form state management with validation
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    if (validate) {
      const fieldErrors = validate(values);
      if (fieldErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
      }
    }
  }, [validate, values]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setTouched(
          Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        );
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      errorHandler.logError({
        message: 'Form submission error',
        originalError: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  };
}

// ============================================
// UI HOOKS
// ============================================

/**
 * Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Toggle boolean state
 */
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  return [value, toggle, setValue];
}

/**
 * Local storage with sync
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Responsive hooks
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

/**
 * Click outside detection
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

/**
 * Intersection Observer hook
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Copy to clipboard
 */
export function useCopyToClipboard(): [
  boolean,
  (text: string) => Promise<void>
] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  return [copied, copy];
}

/**
 * Window size hook
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
