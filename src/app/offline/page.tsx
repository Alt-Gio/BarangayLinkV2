"use client";

/**
 * Offline Fallback Page
 * Shown when user is offline and PWA cannot load requested page
 * iOS Safari fallback
 */

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          It looks like you've lost your internet connection. 
          Don't worry, some features are still available offline.
        </p>

        {/* Available Features */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">
            Available Offline:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-300">
                View cached projects and tasks
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-300">
                Read offline messages
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-300">
                Create draft content (syncs when online)
              </span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="text-gray-500 text-sm mt-8">
          Your changes will be saved locally and synced automatically when you're back online.
        </p>
      </div>
    </div>
  );
}
