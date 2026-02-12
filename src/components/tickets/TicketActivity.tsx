/**
 * Ticket Activity Feed Component
 *
 * Combines Timeline list and Comment Form to manage optimistic UI state.
 */

'use client';

import { Timeline } from './Timeline';
import { CommentForm } from './CommentForm';
import { useRealtimeTimeline } from '@/hooks/useRealtimeTimeline';

interface TicketActivityProps {
  ticketId: string;
  initialEvents: any[];
}

export function TicketActivity({ ticketId, initialEvents }: TicketActivityProps) {
  const { events, addOptimisticEvent } = useRealtimeTimeline(ticketId, initialEvents);

  return (
    <div className="flex flex-col">
      <div className="flex-1 px-6 py-6">
        <Timeline events={events} />
      </div>
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <CommentForm ticketId={ticketId} onOptimisticAdd={addOptimisticEvent} />
      </div>
    </div>
  );
}
