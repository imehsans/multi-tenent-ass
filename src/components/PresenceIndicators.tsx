'use client';

import { usePresence } from '@/hooks/usePresence';

interface PresenceIndicatorsProps {
  ticketId: string;
}

export function PresenceIndicators({ ticketId }: PresenceIndicatorsProps) {
  const { presenceUsers } = usePresence(ticketId);

  if (presenceUsers.length === 0) return null;

  // Extract names for display
  const getUserName = (user: any) => {
    const email = user.email || 'Unknown';
    return email.split('@')[0]; // Use part before @ as display name
  };

  // Generate presence text
  const getPresenceText = () => {
    if (presenceUsers.length === 1) {
      return `${getUserName(presenceUsers[0])} viewing`;
    } else if (presenceUsers.length === 2) {
      return `${getUserName(presenceUsers[0])}, ${getUserName(presenceUsers[1])} viewing`;
    } else {
      const remaining = presenceUsers.length - 2;
      return `${getUserName(presenceUsers[0])}, ${getUserName(presenceUsers[1])}, +${remaining} viewing`;
    }
  };

  return (
    <div className="flex -space-x-1 overflow-hidden p-1">
      {presenceUsers.slice(0, 3).map((user) => (
        <div
          key={user.user_id}
          className="relative flex inline-block h-6 w-6 items-center justify-center rounded-full bg-green-500 text-[10px] text-white ring-2 ring-white"
          title={user?.email || 'Unknown User'}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-[10px] text-white ring-2 ring-white">
            {(user?.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      ))}
      <span className="ml-2 self-center text-xs text-gray-500">
        {getPresenceText()}
      </span>
    </div>
  );
}
