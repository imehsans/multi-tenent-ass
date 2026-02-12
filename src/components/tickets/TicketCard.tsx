/**
 * Ticket Card Component
 *
 * Displays a single ticket summary in a list.
 * Includes status badge, severity indicator, and assignee avatar.
 */

import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'investigating' | 'mitigated' | 'resolved';
  severity: number;
  created_at: string;
  org_id: string;
  assignee_id?: string;
  ticket_tags?: { tag: string }[];
}

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const severityColor = (level: number) => {
    switch (level) {
      case 5:
        return 'bg-red-500'; // Critical
      case 4:
        return 'bg-orange-500'; // High
      case 3:
        return 'bg-yellow-500'; // Medium
      case 2:
        return 'bg-blue-500'; // Low
      default:
        return 'bg-gray-400'; // Trivial
    }
  };

  return (
    <Link
      href={`/orgs/${ticket.org_id}/tickets/${ticket.id}`}
      className="group block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-sm text-gray-500">#{ticket.id.slice(0, 8)}</span>
            <StatusBadge status={ticket.status} />
            <span
              className={`inline-block h-2 w-2 rounded-full ${severityColor(ticket.severity)}`}
              title={`Severity: ${ticket.severity}`}
            />
          </div>

          <h3 className="truncate text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
            {ticket.title}
          </h3>

          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span>
                Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            </span>

            {ticket.assignee_id && (
              <span className="flex items-center gap-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs">
                  {/* Placeholder for Avatar */}U
                </span>
                <span>Assigned</span>
              </span>
            )}
          </div>
        </div>

        {ticket.ticket_tags && ticket.ticket_tags.length > 0 && (
          <div className="ml-4 flex gap-1">
            {ticket.ticket_tags.map((tagObj, idx) => (
              <span
                key={idx}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {tagObj.tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
