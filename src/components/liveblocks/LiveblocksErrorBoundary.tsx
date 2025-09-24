"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface LiveblocksErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface LiveblocksErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class LiveblocksErrorBoundary extends React.Component<
  LiveblocksErrorBoundaryProps,
  LiveblocksErrorBoundaryState
> {
  constructor(props: LiveblocksErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LiveblocksErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Liveblocks Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <CardTitle className="text-red-700">Collaboration Error</CardTitle>
            </div>
            <CardDescription>
              There was an issue connecting to the collaboration service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Error:</strong> {this.state.error?.message || 'Unknown error'}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => window.location.reload()} 
                size="sm"
                className="flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              <p>If this problem persists, please check:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Your internet connection</li>
                <li>Liveblocks service status</li>
                <li>Environment configuration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use
export function LiveblocksErrorWrapper({ 
  children, 
  fallback 
}: LiveblocksErrorBoundaryProps) {
  return (
    <LiveblocksErrorBoundary fallback={fallback}>
      {children}
    </LiveblocksErrorBoundary>
  );
}
