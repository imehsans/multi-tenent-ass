import { TicketStatus } from '@/lib/actions/tickets';

const statusStyles: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  mitigated: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  mitigated: 'Mitigated',
  resolved: 'Resolved',
};

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]} ${className} `}
    >
      {statusLabels[status]}
    </span>
  );
}
