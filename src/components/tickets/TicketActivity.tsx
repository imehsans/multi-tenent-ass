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
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 id="activity-title" className="text-lg font-medium text-gray-900">
          Activity
        </h2>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <Timeline events={events} />
      </div>
      <div className="bg-gray-50 px-4 py-6 sm:px-6">
        <div className="flex space-x-3">
          <div className="min-w-0 flex-1">
            <CommentForm ticketId={ticketId} onOptimisticAdd={addOptimisticEvent} />
          </div>
        </div>
      </div>
    </div>
  );
}
