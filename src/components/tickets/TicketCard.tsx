/**
 * Ticket Card Component
 *
 * Modern, card-based display for a single ticket.
 * Shows status, severity, creator, and key metadata.
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
  creator_name?: string; // Enhanced via listTickets
}

interface TicketCardProps {
  ticket: Ticket;
}

const SEVERITY_CONFIG: Record<number, { bg: string; text: string; dot: string; label: string }> = {
  1: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Low' },
  2: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Medium' },
  3: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'High' },
  4: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600', label: 'Critical' },
  5: { bg: 'bg-red-600', text: 'text-white', dot: 'bg-white', label: 'Blocker' },
};

export function TicketCard({ ticket }: TicketCardProps) {
  const severity = SEVERITY_CONFIG[ticket.severity] || SEVERITY_CONFIG[2];

  // Helper to safely get initial
  const getInitial = (name?: string) => {
    return (name || 'U').charAt(0).toUpperCase();
  };

  return (
    <Link
      href={`/orgs/${ticket.org_id}/tickets/${ticket.id}`}
      className="group flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="space-y-4">
        {/* Header: ID, Status, Severity */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-gray-500">#{ticket.id.slice(0, 8)}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${severity.bg} ${severity.text} shadow-sm`}>
            <span className={`h-2 w-2 rounded-full ${severity.dot}`} />
            {severity.label}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 leading-tight">
            {ticket.title}
          </h3>

          {/* Tags */}
          {ticket.ticket_tags && ticket.ticket_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ticket.ticket_tags.map((tagObj, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                >
                  {tagObj.tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Meta Info */}
      <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-[10px] font-bold text-gray-600 ring-1 ring-white">
            {getInitial(ticket.creator_name)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate" title={ticket.creator_name}>
              {ticket.creator_name || 'Unknown'}
            </span>
            <span className="text-[10px] text-gray-400">
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div>
          {ticket.assignee_id ? (
            <div className="flex -space-x-1" title="Assigned">
              <div className="h-6 w-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold">
                A
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Unassigned</span>
          )}
        </div>
      </div>
    </Link>
  );
}
