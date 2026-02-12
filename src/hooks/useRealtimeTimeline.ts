/**
 * useRealtimeTimeline Hook
 *
 * Subscribes to timeline events (comments, status changes) for a specific ticket.
 * Listens for INSERT events on the ticket_timeline_events table.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeTimeline(ticketId: string, initialEvents: any[] = []) {
  const [events, setEvents] = useState(initialEvents);
  const supabase = createClient();

  // Sync with initialEvents, but preserve any optimistic events if present?
  // Actually, syncing blindly overrides optimistic state.
  // Better strategy: Only sync initialEvents on mount or if they drastically change length (refresh).
  // For now, let's keep it simple: initial load.
  useEffect(() => {
    // Only set if we have no events yet to prevent overriding optimistic local state,
    // OR deeper merge logic needed.
    // Ideally user is served server-render, then this effect runs.
    if (events.length === 0 && initialEvents.length > 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Handle new Realtime events
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticketId}-timeline`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_timeline_events',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            setEvents((prev) => {
              // Deduplicate based on ID
              if (prev.some((e) => e.id === payload.new.id)) {
                // If content matches, assume it's the confirmed optimistic event
                // We might want to replace the optimistic one with the real one to get correct timestamp etc.
                return prev.map((e) => (e.id === payload.new.id ? payload.new : e));
              }
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  const addOptimisticEvent = (event: any) => {
    setEvents((prev) => [...prev, event]);
  };

  return { events, addOptimisticEvent };
}
