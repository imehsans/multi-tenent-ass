/**
 * Ticket Detail Page
 *
 * Server Component fetching ticket details, timeline, and rendering the view.
 */

import { getTicket } from '@/lib/actions/tickets';
import { getTimeline } from '@/lib/actions/timeline';
import { listAttachments } from '@/lib/actions/attachments'; // Ensure this matches export
import { TicketHeader } from '@/components/tickets/TicketHeader';
import { TicketActivity } from '@/components/tickets/TicketActivity';
// import { Timeline } from '@/components/tickets/Timeline';
// import { CommentForm } from '@/components/tickets/CommentForm';
import { AttachmentList } from '@/components/attachments/AttachmentList';
import { FileUpload } from '@/components/attachments/FileUpload';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PresenceIndicators } from '@/components/PresenceIndicators';

interface PageProps {
  params: Promise<{ orgId: string; ticketId: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { orgId, ticketId } = await params;

  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) return notFound();

    // Fetch timeline events and attachments
    const timelineEvents = await getTimeline(ticketId);
    const attachments = await listAttachments(ticketId);

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <TicketHeader orgId={orgId} ticketId={ticketId} />

          {/* Header Section */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="flex items-start justify-between px-4 py-5 sm:px-6">
              <div>
                <h3 className="flex items-center gap-2 text-lg leading-6 font-medium text-gray-900">
                  Ticket #{ticket.id.slice(0, 8)}
                  <StatusBadge status={ticket.status} />
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Created by User ID: {ticket.created_by}
                </p>
                <div className="mt-2">
                  <PresenceIndicators ticketId={ticketId} />
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                {ticket.severity}
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
                  <dt className="text-sm font-medium text-gray-500">Title</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {ticket.title}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap text-gray-900 sm:col-span-2 sm:mt-0">
                    {ticket.description || 'No description provided.'}
                  </dd>
                </div>
                {/* Add Assignee, Tags here */}
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
                  <dt className="text-sm font-medium text-gray-500">Attachments</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <AttachmentList ticketId={ticket.id} initialAttachments={attachments || []} />
                    <div className="mt-4">
                      <FileUpload orgId={orgId} ticketId={ticketId} />
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Timeline & Comments */}
          <section aria-labelledby="activity-title" className="mt-8">
            <TicketActivity ticketId={ticket.id} initialEvents={timelineEvents || []} />
          </section>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load ticket', error);
    return notFound();
  }
}
