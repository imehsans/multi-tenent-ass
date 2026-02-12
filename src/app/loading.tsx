'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Loading...</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Preparing your workspace</p>
      </div>
    </div>
  );
}
