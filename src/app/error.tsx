/**
 * Global Error Boundary with improved UI
 * - Handles uncaught exceptions
 * - Provides retry functionality
 * - Logs errors (in a real app, this would go to Sentry)
 */

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Runtime Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Something went wrong!
        </h2>

        <p className="mb-6 text-gray-600 dark:text-gray-400">
          We encountered an unexpected error. Our team has been notified.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 overflow-x-auto rounded bg-gray-100 p-4 text-left text-xs text-red-600 dark:bg-gray-950 dark:text-red-400">
            <p className="font-mono">{error.message}</p>
            {error.digest && <p className="mt-1 text-gray-500">Digest: {error.digest}</p>}
          </div>
        )}

        <button
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
