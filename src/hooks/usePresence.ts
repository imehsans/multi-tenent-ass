/**
 * usePresence Hook
 *
 * Tracks which users are currently viewing a specific ticket.
 * Uses Supabase Presence for live state syncing.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface PresenceUser {
  user_id: string;
  email?: string;
  online_at: string;
}

export function usePresence(ticketId: string) {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 1. Subscribe to ticket-specific presence channel
    const channel = supabase.channel(`ticket-${ticketId}-presence`, {
      config: {
        presence: {
          key: ticketId,
        },
      },
    });

    // 2. Listen for sync events
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];

        Object.keys(state).forEach((key) => {
          // Supabase returns array of presence objects for each key
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.user_id) {
              users.push({
                user_id: presence.user_id,
                email: presence.email,
                online_at: presence.online_at,
              });
            }
          });
        });

        // Deduplicate users if needed (though key usually handles it)
        const uniqueUsers = Array.from(new Map(users.map((u) => [u.user_id, u])).values());
        setPresenceUsers(uniqueUsers);
      })
      .subscribe();

    // 3. Track current user
    const trackPresence = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await channel.track({
        user_id: user.id,
        email: user.email,
        online_at: new Date().toISOString(),
      });
    };

    trackPresence();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  return { presenceUsers };
}
