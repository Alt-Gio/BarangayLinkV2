"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">
                Dashboard Error
              </h2>
              
              <p className="text-gray-400 mb-6">
                Something went wrong while loading your dashboard. This might be a temporary issue.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Dashboard
                </button>
                
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </Link>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-400 bg-gray-900 p-3 rounded overflow-auto">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component for dashboard data
export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Skeleton */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              <div>
                <div className="w-24 h-5 bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="w-32 h-3 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner Skeleton */}
      <div className="bg-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-64 h-8 bg-gray-600 rounded animate-pulse mb-4"></div>
              <div className="w-48 h-4 bg-gray-600 rounded animate-pulse mb-4"></div>
              <div className="w-32 h-6 bg-gray-600 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gray-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="w-16 h-8 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="w-24 h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="w-20 h-3 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Actions Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-16 h-5 bg-gray-700 rounded-full animate-pulse"></div>
                </div>
                <div className="w-32 h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-yellow-900/90 border border-yellow-600 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-yellow-300 text-sm font-medium">
            Reconnecting to database...
          </span>
        </div>
      </div>
    </div>
  );
}
