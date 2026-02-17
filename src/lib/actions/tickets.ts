'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { addTimelineEvent } from './timeline';
import { createAuditLog } from './audit';
import { checkRateLimit } from '@/lib/ratelimit';
import { requirePermission } from '@/lib/permissions';
import { decodeCursor, encodeCursor } from '@/lib/utils';
import type { Database } from '@/types/database.types';

export type TicketStatus = Database['public']['Enums']['ticket_status'];

export interface CreateTicketInput {
  org_id: string;
  title: string;
  description?: string;
  severity: number; // 0-4
  assignee_id?: string;
  tags?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  severity?: number;
  status?: TicketStatus;
  assignee_id?: string | null;
  statusChangeReason?: string; // Required when reopening
}

export async function createTicket(input: CreateTicketInput) {
  const user = await requireAuth();

  // 1. Check Rate Limit
  await checkRateLimit(user.id, 'ticketCreate');

  // 2. Check Permission
  await requirePermission(input.org_id, 'ticket.create');

  const supabase = await createClient();

  // Validate severity
  if (input.severity < 1 || input.severity > 5) {
    throw new Error('Severity must be between 1 and 5');
  }

  // Create ticket
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      org_id: input.org_id,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: 'open',
      assignee_id: input.assignee_id,
      created_by: user.id,
    })
    .select()
    .single();

  console.log("Log data ticket: ", ticket)

  if (error) throw error;

  // Add timeline event
  await addTimelineEvent({
    ticket_id: ticket.id,
    org_id: ticket.org_id,
    event_type: 'ticket_created',
    metadata: { severity: ticket.severity },
  });

  // Add audit log
  await createAuditLog({
    org_id: ticket.org_id,
    action: 'ticket.created',
    entity_type: 'ticket',
    entity_id: ticket.id,
    new_data: { title: ticket.title, severity: ticket.severity - 1 },
  });

  revalidatePath(`/orgs/${ticket.org_id}/tickets`);
  return ticket;
}

export async function getTicket(ticketId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error) throw error;

  // Fetch creator details using Admin API
  if (!data.created_by) {
    return {
      ...data,
      creator_name: 'Unknown User',
      creator_email: '',
    };
  }

  const supabaseAdmin = await import('@/lib/supabase/server').then((mod) =>
    mod.createServiceRoleClient()
  );

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(data.created_by);

  // Enrich ticket with creator info
  return {
    ...data,
    creator_name: userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'Unknown User',
    creator_email: userData.user?.email || '',
  };
}

export async function updateTicket(ticketId: string, updates: UpdateTicketInput) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get current ticket state
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (fetchError) throw fetchError;

  // Check Permission
  await requirePermission(currentTicket.org_id, 'ticket.update');

  // CRITICAL VALIDATION: Resolved -> Investigating requires reason
  if (
    currentTicket.status === 'resolved' &&
    updates.status === 'investigating' &&
    !updates.statusChangeReason
  ) {
    throw new Error('Reason required when reopening a resolved ticket');
  }

  // Update ticket
  const { data: updatedTicket, error } = await supabase
    .from('tickets')
    .update({
      title: updates.title,
      description: updates.description,
      severity: updates.severity,
      status: updates.status,
      assignee_id: updates.assignee_id,
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;

  // Add timeline events for status changes
  if (currentTicket.status !== updatedTicket.status) {
    await addTimelineEvent({
      ticket_id: ticketId,
      org_id: currentTicket.org_id,
      event_type: 'status_change',
      metadata: {
        from: currentTicket.status,
        to: updatedTicket.status,
        reason: updates.statusChangeReason,
      },
    });
  }

  // Add logic for assignment changes, etc.

  // Add audit log
  await createAuditLog({
    org_id: currentTicket.org_id,
    action: 'ticket.updated',
    entity_type: 'ticket',
    entity_id: ticketId,
    old_data: currentTicket,
    new_data: updatedTicket,
  });

  revalidatePath(`/orgs/${currentTicket.org_id}/tickets/${ticketId}`);
  return updatedTicket;
}

export async function deleteTicket(ticketId: string, hardDelete: boolean = false) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select('org_id')
    .eq('id', ticketId)
    .single();

  if (fetchError) throw fetchError;

  await requirePermission(ticket.org_id, 'ticket.delete');

  if (hardDelete) {
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
    if (error) throw error;
  }

  await createAuditLog({
    org_id: ticket.org_id,
    action: 'ticket.deleted',
    entity_type: 'ticket',
    entity_id: ticketId,
  });

  revalidatePath(`/orgs/${ticket.org_id}/tickets`);
}

export async function listTickets(params: {
  org_id: string;
  cursor?: string;
  limit?: number;
  status?: TicketStatus;
  severity?: number;
  assignee_id?: string;
  search?: string;
}) {
  await requireAuth();
  const supabase = await createClient();

  const limit = params.limit || 20;
  let query = supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .eq('org_id', params.org_id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (params.status) query = query.eq('status', params.status);
  if (params.severity) query = query.eq('severity', params.severity);
  if (params.assignee_id) query = query.eq('assignee_id', params.assignee_id);

  // Search in title and description using ILIKE (case-insensitive)
  if (params.search) {
    const searchTerm = `%${params.search}%`;
    query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }


  // Implement cursor pagination
  if (params.cursor) {
    const { created_at, id } = decodeCursor(params.cursor);
    // (created_at, id) < (cursor_date, cursor_id)
    query = query.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const hasNextPage = data.length > limit;
  const tickets = hasNextPage ? data.slice(0, -1) : data;
  const nextCursor = hasNextPage
    ? encodeCursor({ created_at: tickets[tickets.length - 1].created_at, id: tickets[tickets.length - 1].id })
    : null;

  // Enrich with creator details
  const supabaseAdmin = await import('@/lib/supabase/server').then((mod) =>
    mod.createServiceRoleClient()
  );

  const enrichedTickets = await Promise.all(
    tickets.map(async (ticket) => {
      let creatorName = 'Unknown';
      if (ticket.created_by) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ticket.created_by);
        creatorName = userData.user?.user_metadata?.full_name ||
          userData.user?.email?.split('@')[0] ||
          'Unknown';
      }
      return {
        ...ticket,
        creator_name: creatorName,
      };
    })
  );

  return {
    tickets: enrichedTickets,
    nextCursor,
    hasNextPage,
    totalCount: count,
  };
}
