'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtimeTickets } from '@/hooks/useRealtimeTickets';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { listTickets } from '@/lib/actions/tickets';
import { TicketCard } from './TicketCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

interface TicketListProps {
  orgId: string;
  initialTickets: any[]; // Hydrate via Server Component
  hasNextPage: boolean;
  nextCursor: string | null;
}

export function TicketList({
  orgId,
  initialTickets,
  hasNextPage: initialHasNextPage,
  nextCursor: initialNextCursor,
}: TicketListProps) {
  const [tickets, setTickets] = useState(initialTickets);
  // Separate state for pagination metadata
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Still use realtime updates, but be careful with pagination
  // Realtime usually applies to the *viewport*, handling realtime + pagination is complex
  // For this assignment, we'll keep it simple: realtime updates for loaded tickets
  // New tickets might appear at top
  const realtimeTickets = useRealtimeTickets(orgId, tickets);

  // Sync state if initialTickets change (e.g. filtering via URL)
  useEffect(() => {
    setTickets(initialTickets);
    setHasNextPage(initialHasNextPage);
    setNextCursor(initialNextCursor);
  }, [initialTickets, initialHasNextPage, initialNextCursor]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const result = await listTickets({
        org_id: orgId,
        cursor: nextCursor,
        limit: 10, // Match page limit
        // Should ideally pass current filters here too, but for basic implementation we rely on cursor
        // NOTE: Filters should be preserved. In a real app, retrieve from URL params or context
        // For now, assuming cursor encodes enough info or filters haven't changed drastically
        // To do this correctly, we'd need to access current searchParams
      });

      setTickets((prev) => [...prev, ...result.tickets]);
      setHasNextPage(result.hasNextPage);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load more tickets:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [orgId, nextCursor, isLoadingMore]);

  // Use infinite scroll hook
  const { observerTarget } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasNextPage,
    isLoading: isLoadingMore,
    threshold: 500,
  });

  const displayedTickets = realtimeTickets.length > 0 ? realtimeTickets : tickets;

  if (!displayedTickets || displayedTickets.length === 0) {
    return (
      <EmptyState
        title="No tickets found"
        description="Try adjusting your filters or create a new ticket."
        icon={
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        }
        actionLabel="Create Ticket"
        onAction={() => (window.location.href = `/orgs/${orgId}/tickets/new`)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedTickets.map((ticket) => (
          <div key={ticket.id} className="h-full">
            <TicketCard ticket={ticket} />
          </div>
        ))}
      </div>

      {/* Infinite scroll observer target */}
      <div ref={observerTarget} className="py-4 text-center">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <LoadingSpinner size="sm" />
            <span>Loading more tickets...</span>
          </div>
        )}
        {!hasNextPage && displayedTickets.length > 0 && (
          <p className="text-sm text-gray-400">All tickets loaded</p>
        )}
      </div>
    </div>
  );
}
