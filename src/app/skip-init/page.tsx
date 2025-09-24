"use client";

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SkipInitPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const handleSkipToApp = () => {
    // Redirect to the main app
    router.push('/dashboard');
  };

  const handleSkipToCollaboration = () => {
    // Redirect to collaboration demo
    router.push('/collaboration');
  };

  const handleGoBack = () => {
    // Go back to the main page
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Database Initialization Bypass</h1>
          <p className="text-gray-400">
            Skip the database initialization and go directly to the application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Dashboard</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Go to the main dashboard with role-based features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSkipToApp}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a3 3 0 01-3-3V9a3 3 0 013-3h4a3 3 0 013 3v1z" />
                </svg>
                <span>Collaboration</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Try the real-time collaboration features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSkipToCollaboration}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Try Collaboration
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">User Authentication:</span>
              <span className={`font-medium ${isLoaded && user ? 'text-green-400' : 'text-yellow-400'}`}>
                {isLoaded ? (user ? '✅ Signed In' : '⚠️ Not Signed In') : '⏳ Loading...'}
              </span>
            </div>
            {user && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{user.fullName || user.firstName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{user.emailAddresses[0]?.emailAddress}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Note: Some features may not work properly without database initialization.
            You can always return to complete the setup later.
          </p>
          
          <div className="flex space-x-4 justify-center">
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              ← Back to Setup
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🔄 Retry Initialization
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
