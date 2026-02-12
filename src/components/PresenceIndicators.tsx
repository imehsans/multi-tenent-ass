'use client';

import { usePresence } from '@/hooks/usePresence';

interface PresenceIndicatorsProps {
  ticketId: string;
}

export function PresenceIndicators({ ticketId }: PresenceIndicatorsProps) {
  const { presenceUsers } = usePresence(ticketId);

  if (presenceUsers.length === 0) return null;

  return (
    <div className="flex -space-x-1 overflow-hidden p-1">
      {presenceUsers.map((user) => (
        <div
          key={user.user_id}
          className="relative flex inline-block h-6 w-6 items-center justify-center rounded-full bg-green-500 text-[10px] text-white ring-2 ring-white"
          title={user.email || 'Unknown User'}
        >
          {(user.email || 'U').charAt(0).toUpperCase()}
        </div>
      ))}
      <span className="ml-2 self-center text-xs text-gray-500">
        {presenceUsers.length > 1 ? `${presenceUsers.length} viewing` : '1 viewing'}
      </span>
    </div>
  );
}
