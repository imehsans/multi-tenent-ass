/**
 * Ticket Detail Page
 *
 * Modern, responsive design for ticket details.
 * Features a 2-column layout with main content and sidebar metadata.
 */

import { getTicket } from '@/lib/actions/tickets';
import { getTimeline } from '@/lib/actions/timeline';
import { listAttachments } from '@/lib/actions/attachments';
import { TicketHeader } from '@/components/tickets/TicketHeader';
import { TicketActivity } from '@/components/tickets/TicketActivity';
import { AttachmentList } from '@/components/attachments/AttachmentList';
import { FileUpload } from '@/components/attachments/FileUpload';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PresenceIndicators } from '@/components/PresenceIndicators';
import { TicketDescription } from '@/components/tickets/TicketDescription';

interface PageProps {
  params: Promise<{ orgId: string; ticketId: string }>;
}

const SEVERITY_COLORS = {
   1: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
   2: { label: 'Medium', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
   3: { label: 'High', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
   4: { label: 'Critical', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
   5: { label: 'Blocker', bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300' },
};

export default async function TicketDetailPage({ params }: PageProps) {
  const { orgId, ticketId } = await params;

  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) return notFound();

    const timelineEvents = await getTimeline(ticketId);
    const attachments = await listAttachments(ticketId);

     const severity = SEVERITY_COLORS[ticket.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS[2];

     // Check permissions
     const { hasPermission } = await import('@/lib/permissions');
     const canDelete = await hasPermission(orgId, 'ticket.delete');

    return (
       <div className="min-h-screen bg-gray-50/50 pb-12">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 rounded-lg sticky top-0 z-10">
             <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                <TicketHeader orgId={orgId} ticketId={ticketId} canDelete={canDelete} />

                <div className="mt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className="text-sm font-mono text-gray-500">#{ticket.id.slice(0, 8)}</span>
                         <StatusBadge status={ticket.status} />
                         <PresenceIndicators ticketId={ticketId} />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                         {ticket.title}
                      </h1>
                   </div>

                   {/* Action Buttons could go here */}
                </div>
             </div>
          </div>

          <main className="mx-auto   py-8">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-8">

                   {/* Description Card */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                         <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                         </svg>
                         <h2 className="font-semibold text-gray-900">Description</h2>
                      </div>
                      <div className="p-6">
                         <TicketDescription
                            ticketId={ticket.id}
                            description={ticket.description}
                            canUpdate={await hasPermission(orgId, 'ticket.update')}
                         />
                      </div>
                   </div>

                   {/* Activity Feed */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                         <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <h2 className="font-semibold text-gray-900">Activity & Comments</h2>
                      </div>
                      <div className="p-0">
                         <TicketActivity ticketId={ticket.id} initialEvents={timelineEvents || []} />
                      </div>
                   </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">

                   {/* Ticket Details Card */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">
                         Details
                      </div>
                      <div className="p-6 space-y-6">

                         {/* Severity */}
                         <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</label>
                            <div className="mt-2">
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severity.bg} ${severity.text} ${severity.border}`}>
                                  {severity.label} ({ticket.severity})
                               </span>
                            </div>
                         </div>

                         {/* Creator */}
                         <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</label>
                            <div className="mt-2 flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {(ticket.creator_name || 'U').charAt(0).toUpperCase()}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{ticket.creator_name || 'Unknown User'}</span>
                                  <span className="text-xs text-gray-500">{ticket.creator_email}</span>
                               </div>
                            </div>
                         </div>

                         {/* Assignee (Placeholder) */}
                         <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</label>
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                               <div className="h-8 w-8 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                               </div>
                               <span>Unassigned</span>
                            </div>
                         </div>

                         {/* Dates */}
                         <div className="pt-4 border-t border-gray-100 grid grid-cols-1 gap-4">
                            <div>
                               <span className="block text-xs text-gray-500">Created</span>
                               <span className="block text-sm font-medium text-gray-900">
                                  {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  <span className="text-gray-400 ml-1">at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               </span>
                            </div>
                         </div>

                      </div>
                </div>

                   {/* Attachments Card */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                         <h3 className="font-semibold text-gray-900">Attachments</h3>
                         <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{attachments?.length || 0}</span>
                </div>
                      <div className="p-6">
                         <div className="mb-4">
                    <AttachmentList ticketId={ticket.id} initialAttachments={attachments || []} />
                         </div>
                      <FileUpload orgId={orgId} ticketId={ticketId} />
                      </div>
                   </div>

                </div>
             </div>
          </main >
      </div>
    );
  } catch (error) {
    console.error('Failed to load ticket', error);
    return notFound();
  }
}
