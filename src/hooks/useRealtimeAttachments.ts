/**
 * useRealtimeAttachments Hook
 *
 * Subscribes to attachment events for a specific ticket.
 * Listens for INSERT and DELETE events on the attachments table.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeAttachments(ticketId: string, initialAttachments: any[] = []) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const supabase = createClient();

  // Sync with initialAttachments when they change
  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticketId}-attachments`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and DELETE
          schema: 'public',
          table: 'attachments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            setAttachments((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setAttachments((prev) => prev.filter((attachment) => attachment.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  return attachments;
}
