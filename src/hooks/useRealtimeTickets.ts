'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeTickets(orgId: string, initialTickets: any[] = []) {
  const [tickets, setTickets] = useState(initialTickets);
  const supabase = createClient();

  useEffect(() => {
    console.log('[Realtime] Setting up subscription for org:', orgId);

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
          console.log('[Realtime] Event received:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            console.log('[Realtime] Adding new ticket to top:', payload.new);
            setTickets((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('[Realtime] Updating ticket:', payload.new.id);
            setTickets((prev) =>
              prev.map((ticket) => (ticket.id === payload.new.id ? payload.new : ticket))
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('[Realtime] Removing ticket:', payload.old.id);
            setTickets((prev) => prev.filter((ticket) => ticket.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    // Cleanup subscription on component unmount
    return () => {
      console.log('[Realtime] Cleaning up subscription for org:', orgId);
      supabase.removeChannel(channel);
    };
  }, [orgId, supabase]);

  return tickets;
}
