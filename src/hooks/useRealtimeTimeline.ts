'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeTimeline(ticketId: string, initialEvents: any[] = []) {
  const [events, setEvents] = useState(initialEvents);
  const supabase = createClient();

  useEffect(() => {
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
              if (prev.some((e) => e.id === payload.new.id)) {
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
