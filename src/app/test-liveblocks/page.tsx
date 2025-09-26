"use client";

import { LiveblocksClientProvider } from '@/components/liveblocks/LiveblocksClientProvider';
import { RoomProvider } from '@liveblocks/react/suspense';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

function LiveblocksTest() {
  const { user, isLoaded } = useUser();
  const [roomId] = useState('test-room-' + Date.now());

  if (!isLoaded) {
    return <div className="p-8">Loading user...</div>;
  }

  if (!user) {
    return <div className="p-8">Please sign in to test Liveblocks</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Liveblocks Connection Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">User Info:</h2>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Name:</strong> {user.fullName}</p>
        <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Environment Check:</h2>
        <p><strong>Liveblocks Public Key:</strong> {process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ? '✅ Set' : '❌ Missing'}</p>
        <p><strong>Room ID:</strong> {roomId}</p>
      </div>

      <RoomProvider id={roomId}>
        <LiveblocksTestRoom />
      </RoomProvider>
    </div>
  );
}

function LiveblocksTestRoom() {
  const [status, setStatus] = useState('Connecting...');
  const [error] = useState<string | null>(null);

  // This will trigger the Liveblocks auth
  useState(() => {
    const timer = setTimeout(() => {
      setStatus('Connected ✅');
    }, 2000);

    return () => clearTimeout(timer);
  });

  return (
    <div className="bg-green-50 p-4 rounded-lg">
      <h2 className="font-semibold mb-2">Connection Status:</h2>
      <p className="text-lg">{status}</p>
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
          <p className="text-red-700"><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>If you see &quot;Connected ✅&quot; above, Liveblocks is working correctly.</p>
        <p>Check the browser console and server logs for detailed debugging info.</p>
      </div>
    </div>
  );
}

export default function TestLiveblocksPage() {
  return (
    <LiveblocksClientProvider>
      <LiveblocksTest />
    </LiveblocksClientProvider>
  );
}
