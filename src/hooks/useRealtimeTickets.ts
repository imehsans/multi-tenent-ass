'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeTickets(orgId: string, initialTickets: any[] = []) {
  const [tickets, setTickets] = useState(initialTickets);
  const supabase = createClient();

  useEffect(() => {
    // 1. Subscribe to organization-scoped tickets channel
    const channel = supabase
      .channel(`org-${orgId}-tickets`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all DB events
          schema: 'public',
          table: 'tickets',
          filter: `org_id=eq.${orgId}`, // CRITICAL: Filter by Org ID
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) =>
              prev.map((ticket) => (ticket.id === payload.new.id ? payload.new : ticket))
            );
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter((ticket) => ticket.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, supabase]);

  return tickets;
}
