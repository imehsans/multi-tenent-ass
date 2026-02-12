'use client';

import { Loader2, ChevronDown } from 'lucide-react';

interface PaginationProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  totalCount?: number;
  currentCount?: number;
}

export function Pagination({
  onLoadMore,
  hasMore,
  isLoading,
  totalCount,
  currentCount,
}: PaginationProps) {
  if (!hasMore && (!currentCount || currentCount === 0)) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* Show count if available */}
      {totalCount !== undefined && currentCount !== undefined && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {currentCount} of {totalCount} tickets
        </p>
      )}

      {/* Load More Button */}
      {hasMore ? (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Load More
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      ) : (
        currentCount &&
        currentCount > 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">All tickets loaded</p>
        )
      )}
    </div>
  );
}
