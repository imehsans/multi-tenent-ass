'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Application Error
            </h2>

            <p className="mb-6 text-gray-600">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 overflow-x-auto rounded bg-gray-100 p-4 text-left text-xs text-red-600">
                <p className="font-mono">{error.message}</p>
                {error.digest && <p className="mt-1 text-gray-500">Digest: {error.digest}</p>}
              </div>
            )}

            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
