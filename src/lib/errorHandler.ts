/**
 * Global Error Handler Utility
 * Provides consistent error handling, logging, and user feedback
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  originalError?: Error;
  timestamp: string;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: AppError) => void)[] = [];

  private constructor() {
    // Setup global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle global window errors
   */
  private handleGlobalError(event: ErrorEvent) {
    const appError: AppError = {
      message: event.message,
      originalError: event.error,
      timestamp: new Date().toISOString(),
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    };

    this.logError(appError);
    this.notifyListeners(appError);
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const appError: AppError = {
      message: event.reason?.message || 'Unhandled promise rejection',
      originalError: event.reason,
      timestamp: new Date().toISOString(),
    };

    this.logError(appError);
    this.notifyListeners(appError);
  }

  /**
   * Log error to console and external service
   */
  private logError(error: AppError) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler]', error);
    }

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    this.sendToErrorService(error);
  }

  /**
   * Send error to external tracking service
   */
  private sendToErrorService(error: AppError) {
    // Example: Sentry integration
    // Sentry.captureException(error.originalError || new Error(error.message), {
    //   extra: error.context,
    //   tags: { code: error.code },
    // });

    // For now, just log
    if (process.env.NODE_ENV === 'production') {
      // Could send to your own logging endpoint
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      }).catch(() => {
        // Silently fail if logging fails
      });
    }
  }

  /**
   * Notify registered error listeners
   */
  private notifyListeners(error: AppError) {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  /**
   * Add error listener
   */
  onError(callback: (error: AppError) => void) {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Handle async errors with consistent error handling
   */
  async handleAsync<T>(
    promise: Promise<T>,
    context?: string
  ): Promise<[T | null, AppError | null]> {
    try {
      const data = await promise;
      return [data, null];
    } catch (error) {
      const appError: AppError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        originalError: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date().toISOString(),
        context: context ? { context } : undefined,
      };

      this.logError(appError);
      return [null, appError];
    }
  }

  /**
   * Wrap sync function with error handling
   */
  wrap<T extends (...args: any[]) => any>(fn: T, context?: string): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch((error) => {
            const appError: AppError = {
              message: error instanceof Error ? error.message : 'Unknown error',
              originalError: error instanceof Error ? error : new Error(String(error)),
              timestamp: new Date().toISOString(),
              context: context ? { context } : undefined,
            };
            this.logError(appError);
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        const appError: AppError = {
          message: error instanceof Error ? error.message : 'Unknown error',
          originalError: error instanceof Error ? error : new Error(String(error)),
          timestamp: new Date().toISOString(),
          context: context ? { context } : undefined,
        };
        this.logError(appError);
        throw error;
      }
    }) as T;
  }

  /**
   * Public method to log errors
   */
  public logErrorPublic(error: Error | unknown, context?: string) {
    const appError: AppError = {
      message: error instanceof Error ? error.message : String(error),
      originalError: error instanceof Error ? error : new Error(String(error)),
      timestamp: new Date().toISOString(),
      context: context ? { context } : undefined,
    };
    this.logError(appError);
  }

  /**
   * Create user-friendly error message
   */
  getUserMessage(error: Error | AppError | unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as any).message;
      
      // Common error patterns
      if (message.includes('Network')) {
        return 'Network error. Please check your connection.';
      }
      if (message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }
      if (message.includes('Not authenticated')) {
        return 'Please sign in to continue.';
      }
      if (message.includes('permission')) {
        return 'You don\'t have permission to perform this action.';
      }
      
      return message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error | AppError | unknown): boolean {
    if (typeof error === 'object' && error !== null) {
      const message = (error as any).message || '';
      const status = (error as any).status;

      // Network errors are retryable
      if (message.includes('Network') || message.includes('timeout')) {
        return true;
      }

      // 5xx errors are retryable
      if (status >= 500 && status < 600) {
        return true;
      }

      // 429 Too Many Requests is retryable
      if (status === 429) {
        return true;
      }
    }

    return false;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

/**
 * Utility function for handling async operations
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, AppError | null]> {
  return errorHandler.handleAsync(promise, context);
}

/**
 * Utility function for wrapping functions
 */
export function wrapError<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return errorHandler.wrap(fn, context);
}

/**
 * Create AppError from unknown error
 */
export function createAppError(
  error: unknown,
  context?: Record<string, any>
): AppError {
  return {
    message: error instanceof Error ? error.message : String(error),
    originalError: error instanceof Error ? error : new Error(String(error)),
    timestamp: new Date().toISOString(),
    context,
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error | unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if not retryable
      if (!errorHandler.isRetryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next retry
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}
