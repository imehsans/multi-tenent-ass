/**
 * Ticket List Page
 *
 * Server Component that fetches tickets and renders the list view.
 * Handles server-side filtering and pagination.
 */

import { listTickets } from '@/lib/actions/tickets';
import { TicketList } from '@/components/tickets/TicketList';
import { TicketFilters } from '@/components/tickets/TicketFilters';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TicketsPage({ params, searchParams }: PageProps) {
  const { orgId } = await params;
  const resolvedSearchParams = await searchParams; // Await searchParams

  const status =
    typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;
  const severityStr =
    typeof resolvedSearchParams.severity === 'string' ? resolvedSearchParams.severity : undefined;
  const severity = severityStr ? parseInt(severityStr) : undefined;
  const search =
    typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
  const cursor =
    typeof resolvedSearchParams.cursor === 'string' ? resolvedSearchParams.cursor : undefined;

  // Fetch tickets server-side
  const { tickets, nextCursor, hasNextPage, totalCount } = await listTickets({
    org_id: orgId,
    status: status as any,
    severity: severity,
    search: search,
    cursor: cursor,
    limit: 10,
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tickets</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track issues for your organization.
            </p>
          </div>
          <Link href={`/orgs/${orgId}/tickets/new`}>
            <Button variant="primary">+ New Ticket</Button>
          </Link>
        </div>

        {/* Filters */}
        <TicketFilters />

        {/* Realtime List */}
        <TicketList
          orgId={orgId}
          initialTickets={tickets}
          hasNextPage={hasNextPage}
          nextCursor={nextCursor}
        />

        {/* Pagination hint (cursor logic needs fully implementing) */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Showing {tickets.length} of {totalCount} tickets
        </div>
      </div>
    </div>
  );
}
