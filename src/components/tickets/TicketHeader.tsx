/**
 * Ticket Header Component
 *
 * Header for the ticket detail page.
 * Could include back button, breadcrumbs, or action buttons (Edit, Delete).
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/20/solid';
import { deleteTicket } from '@/lib/actions/tickets';

interface TicketHeaderProps {
  orgId: string;
  ticketId: string;
  canDelete?: boolean;
}

export function TicketHeader({ orgId, ticketId, canDelete }: TicketHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTicket(ticketId);
      router.push(`/orgs/${orgId}/tickets`);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket');
      setIsDeleting(false);
    }
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <Button
        variant="ghost"
        onClick={() => router.push(`/orgs/${orgId}/tickets`)}
        className="flex cursor-pointer items-center gap-2 pl-0 hover:bg-transparent hover:text-blue-600"
      >
        <div className="flex items-center gap-2">
          <span>
            <ArrowLeftIcon className="h-5 w-5" />
          </span>
          <span> Back to Tickets</span>
        </div>
      </Button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {canDelete && (
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
          >
            <div className="flex items-center gap-2">
              <span>
                <TrashIcon className="h-4 w-4" />
              </span>
              <span>
                Delete
              </span>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}
