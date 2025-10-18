"use client";

// Temporary debug page to check if environment variables are loading
export default function DebugEnvPage() {
  const envVars = {
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing',
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Loaded' : '❌ Missing',
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing',
    FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Loaded' : '❌ Missing',
    FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Loaded' : '❌ Missing',
    FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Loaded' : '❌ Missing',
    FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? '✅ Loaded' : '❌ Missing',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Environment Variables Debug</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 space-y-3">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="font-mono text-sm">{key}</span>
              <span className={value.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <h2 className="font-semibold mb-2">📝 Instructions:</h2>
          <ul className="text-sm space-y-1 text-gray-300">
            <li>• All variables should show ✅ Loaded</li>
            <li>• If showing ❌ Missing, check your .env.local file</li>
            <li>• Make sure to restart dev server after changes</li>
            <li>• Delete this page after debugging</li>
          </ul>
        </div>

        <div className="mt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
