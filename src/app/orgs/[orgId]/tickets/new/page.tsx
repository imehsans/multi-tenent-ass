/**
 * Create Ticket Page
 *
 * Renders the TicketForm in creation mode.
 */

import { TicketForm } from '@/components/tickets/TicketForm';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ orgId: string }>;
}

export default async function NewTicketPage({ params }: PageProps) {
  const { orgId } = await params;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">New Ticket</h1>
          <Link href={`/orgs/${orgId}/tickets`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
        </div>

        <TicketForm orgId={orgId} />
      </div>
    </div>
  );
}
