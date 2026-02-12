/**
 * useTypingIndicator Hook
 *
 * Provides a way to broadcast "typing" events to other users on the same ticket.
 * Includes debouncing and automatic cleanup.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTypingIndicator(ticketId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const supabase = createClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Subscribe to ticket-specific typing channel
    const channel = supabase.channel(`ticket-${ticketId}-typing`);

    // 2. Listen for 'broadcast' events
    channel
      .on(
        'broadcast',
        { event: 'typing' },
        ({ payload }: { payload: { user_email: string; is_typing: boolean } }) => {
          const { user_email, is_typing } = payload;

          setTypingUsers((prev) => {
            if (is_typing && !prev.includes(user_email)) {
              // Add user if typing
              return [...prev, user_email];
            } else if (!is_typing) {
              // Remove user if stopped typing
              return prev.filter((email) => email !== user_email);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  const indicateTyping = useCallback(
    async (value: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase.channel(`ticket-${ticketId}-typing`);

      // 3. Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 4. Broadcast "started typing" (debounce logic)
      if (value.length > 0) {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_email: user.email,
            is_typing: true,
          },
        });

        // 5. Auto-broadcast "stopped typing" after 2s
        typingTimeoutRef.current = setTimeout(async () => {
          await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              user_email: user.email,
              is_typing: false,
            },
          });
        }, 2000); // 2 second typing window
      } else {
        // Immediate stop if input is cleared
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_email: user.email,
            is_typing: false,
          },
        });
      }
    },
    [ticketId, supabase]
  );

  return { typingUsers, indicateTyping };
}
