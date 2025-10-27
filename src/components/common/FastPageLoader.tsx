"use client";

import { Suspense, ReactNode } from 'react';
import RippleLoader from '@/components/ui/RippleLoader';

/**
 * PERFORMANCE OPTIMIZATION WRAPPER
 * 
 * Wraps pages to:
 * 1. Show instant loading UI
 * 2. Lazy load heavy components
 * 3. Prevent blocking the main thread
 * 4. Enable streaming SSR for faster perceived performance
 */

interface FastPageLoaderProps {
  children: ReactNode;
  loadingText?: string;
  fallback?: ReactNode;
}

export function FastPageLoader({ 
  children, 
  loadingText = "Loading...",
  fallback 
}: FastPageLoaderProps) {
  
  const defaultFallback = (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <RippleLoader size="lg" color="emerald" text={loadingText} />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * LAZY LOADED SECTION
 * 
 * Use this to lazy-load non-critical sections of your page
 * They'll load after the initial page render
 */

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  delay?: number; // Optional delay before loading (ms)
}

export function LazySection({ children, fallback, delay = 0 }: LazySectionProps) {
  const [shouldRender, setShouldRender] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!shouldRender) {
    return fallback || <div className="animate-pulse bg-gray-800/50 rounded-lg h-32" />;
  }

  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Import React for hooks
import * as React from 'react';
