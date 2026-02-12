'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from './audit';
import { checkRateLimit } from '@/lib/ratelimit';
import { requirePermission } from '@/lib/permissions';

import type { Database, Json } from '@/types/database.types';

export type TimelineEventType =
  | 'ticket_created'
  | 'comment'
  | 'status_change'
  | 'assignment_change'
  | 'tag_change'
  | 'attachment_added'
  | 'ticket_reopened';

export interface AddTimelineEventInput {
  ticket_id: string;
  org_id: string;
  event_type: TimelineEventType;
  content?: string;
  metadata?: Json;
}

export async function addTimelineEvent(input: AddTimelineEventInput) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ticket_timeline_events')
    .insert({
      ticket_id: input.ticket_id,
      org_id: input.org_id,
      event_type: input.event_type,
      actor_id: user.id,
      content: input.content,
      metadata: input.metadata,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/orgs/${input.org_id}/tickets/${input.ticket_id}`);
  return data;
}

export async function addComment(ticketId: string, content: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Rate Check
  await checkRateLimit(user.id, 'comment');

  // Get ticket to get org_id
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('org_id')
    .eq('id', ticketId)
    .single();

  if (ticketError) throw ticketError;

  await requirePermission(ticket.org_id, 'comment.create');

  // Add comment as timeline event
  const comment = await addTimelineEvent({
    ticket_id: ticketId,
    org_id: ticket.org_id,
    event_type: 'comment',
    content,
  });

  // Audit Log
  await createAuditLog({
    org_id: ticket.org_id,
    action: 'comment.created',
    entity_type: 'comment',
    entity_id: comment.id,
    new_data: { content },
  });

  return comment;
}

export async function getTimeline(ticketId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ticket_timeline_events')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Enrich with actor details
  const supabaseAdmin = await import('@/lib/supabase/server').then((mod) =>
    mod.createServiceRoleClient()
  );

  const enrichedEvents = await Promise.all(
    (data || []).map(async (event) => {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(event.actor_id);

      return {
        ...event,
        actor_name: userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'Unknown User',
        actor_email: userData.user?.email || '',
      };
    })
  );

  return enrichedEvents;
}
