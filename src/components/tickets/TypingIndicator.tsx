'use client';

import { useTypingIndicator } from '@/hooks/useTypingIndicator';

interface TypingIndicatorProps {
  ticketId: string;
}

export function TypingIndicator({ ticketId }: TypingIndicatorProps) {
  const { typingUsers } = useTypingIndicator(ticketId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="px-6 py-2 text-sm text-gray-500 italic animate-pulse">
      {typingUsers.length === 1 ? (
        <span>{typingUsers[0]} is typing...</span>
      ) : typingUsers.length === 2 ? (
        <span>{typingUsers[0]} and {typingUsers[1]} are typing...</span>
      ) : (
        <span>{typingUsers[0]} and {typingUsers.length - 1} others are typing...</span>
      )}
    </div>
  );
}
