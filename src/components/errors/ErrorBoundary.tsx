"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to error tracking service (Sentry, etc.)
    this.logErrorToService(error, errorInfo);

    this.setState({
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // For now, log to console
    console.error('Error logged:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                <p className="text-gray-400">We encountered an unexpected error</p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
                <pre className="text-xs text-red-300 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
