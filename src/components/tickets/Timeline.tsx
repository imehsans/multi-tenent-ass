/**
 * Timeline Component
 *
 * Displays list of events (comments, status changes) for a ticket.
 */

'use client';

import { formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: string; // 'comment' | 'status_change' | etc.
  event_type?: string;
  content: string | null;
  created_at: string;
  actor_id?: string;
  metadata?: any;
}

// Timeline is now a presentation component controlled by parent
interface TimelineProps {
  events: any[];
}

export function Timeline({ events }: TimelineProps) {
  // const events = useRealtimeTimeline(ticketId, initialEvents); // Moved to parent

  if (!events || events.length === 0) {
    return <div className="py-8 text-center text-gray-500">No activity yet.</div>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => {
          // Normalize event data (Supabase realtime payload vs initial fetch might differ slightly if not careful, but usually consistent)
          // Actually, database types say 'event_type', but initial code used 'type'. Let's handle both.
          const eventType = event.event_type || event.type;
          const content = event.content;
          const actorId = event.actor_id || event.user_id;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white">
                    <span className="text-xs font-medium text-white">
                      {/* Placeholder Avatar - Use actorId to seed distinct color if possible */}U
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-500">
                        User{' '}
                        <span className="font-medium text-gray-900">
                          {actorId ? actorId.slice(0, 8) : 'Unknown'}
                        </span>{' '}
                        {eventType === 'comment' ? 'commented' : `performed ${eventType}`}
                      </p>
                      <div className="mt-1 text-sm text-gray-700">
                        <p className="whitespace-pre-wrap">{content}</p>
                        {/* Show metadata changes if available */}
                        {event.metadata && (
                          <div className="mt-1 text-xs text-gray-500">
                            {JSON.stringify(event.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={event.created_at}>
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
