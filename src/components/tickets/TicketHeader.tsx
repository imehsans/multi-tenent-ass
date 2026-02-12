/**
 * Ticket Header Component
 *
 * Header for the ticket detail page.
 * Could include back button, breadcrumbs, or action buttons (Edit, Delete).
 */

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/20/solid'; // Assumes heroicons installed

interface TicketHeaderProps {
  orgId: string;
  ticketId: string;
}

export function TicketHeader({ orgId }: TicketHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex items-center justify-between">
      <Button
        variant="ghost"
        onClick={() => router.push(`/orgs/${orgId}/tickets`)}
        className="flex items-center gap-2 pl-0 hover:bg-transparent hover:text-blue-600"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Tickets
      </Button>

      {/* Additional actions like Edit could go here */}
    </div>
  );
}
