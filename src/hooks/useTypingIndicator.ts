'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTypingIndicator(ticketId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const supabase = createClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`ticket-${ticketId}-typing`);

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

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (value.length > 0) {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_email: user.email,
            is_typing: true,
          },
        });

        typingTimeoutRef.current = setTimeout(async () => {
          await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              user_email: user.email,
              is_typing: false,
            },
          });
        }, 2000); 
      } else {
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
