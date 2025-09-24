"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Users, Zap } from 'lucide-react';

interface LiveblocksLoadingProps {
  type?: 'chat' | 'users' | 'presence' | 'full';
  className?: string;
}

export function LiveblocksLoading({ type = 'full', className = "" }: LiveblocksLoadingProps) {
  if (type === 'chat') {
    return (
      <div className={`p-4 space-y-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="text-sm text-gray-500">Connecting to chat...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'users') {
    return (
      <div className={`p-4 space-y-3 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-green-600 animate-pulse" />
          <span className="text-sm text-gray-500">Loading team members...</span>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'presence') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-full border-2 border-white" />
          ))}
        </div>
        <span className="text-sm text-gray-500">Loading presence...</span>
      </div>
    );
  }

  // Full page loading
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white animate-pulse" />
          </div>
          <CardTitle>Connecting to Collaboration</CardTitle>
          <CardDescription>
            Setting up your real-time workspace...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <span className="text-sm text-gray-600">Authenticating user</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <span className="text-sm text-gray-600">Connecting to room</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-sm text-gray-600">Loading collaboration features</span>
            </div>
          </div>
          
          <div className="pt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

