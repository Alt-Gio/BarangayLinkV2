"use client";

/**
 * Suppress expected offline errors from Clerk and other services
 * These errors are harmless - the app works offline with cached data
 */

let originalConsoleError: typeof console.error;

export function suppressOfflineErrors() {
  if (typeof window === 'undefined') return;
  
  // Save original console.error
  if (!originalConsoleError) {
    originalConsoleError = console.error;
  }

  // Override console.error to filter out expected offline errors
  console.error = function(...args: any[]) {
    const errorMessage = args.join(' ').toLowerCase();
    
    // List of expected offline errors to suppress
    const offlineErrorPatterns = [
      'failed to load clerk',
      'clerk: failed to load',
      'failed to fetch',
      'networkerror',
      'load failed',
      'network request failed',
      'typeerror: failed to fetch',
    ];
    
    // Check if this is an expected offline error
    const isOfflineError = offlineErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
    
    // If offline and it's an expected error, show a cleaner message
    if (isOfflineError && !navigator.onLine) {
      console.info('🔌 [Offline Mode] Some services unavailable (expected)');
      return;
    }
    
    // Otherwise, log the error normally
    originalConsoleError.apply(console, args);
  };
}

export function restoreConsoleError() {
  if (originalConsoleError) {
    console.error = originalConsoleError;
  }
}

// Auto-suppress when offline
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    console.log('🔌 Offline mode: Suppressing expected service errors');
    suppressOfflineErrors();
  });
  
  window.addEventListener('online', () => {
    console.log('🟢 Online mode: Restoring normal error logging');
    restoreConsoleError();
  });
}
