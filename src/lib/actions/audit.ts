'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth'; 

export interface CreateAuditLogInput {
  org_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      org_id: input.org_id,
      actor_id: user.id,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      old_data: input.old_data,
      new_data: input.new_data,
    })
    .select()
    .single();

  if (error) {
    // Audit logging failure should not crash main operation, just log error
    console.error('Failed to create audit log:', error);
    return null;
  }

  return data;
}

export async function getAuditLogs(params: {
  org_id: string;
  action?: string;
  actor_id?: string;
  entity_type?: string;
  cursor?: string;
  limit?: number;
}) { 
  const supabase = await createClient();

  const limit = params.limit || 50;
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('org_id', params.org_id)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (params.action) query = query.eq('action', params.action);
  if (params.actor_id) query = query.eq('actor_id', params.actor_id);
  if (params.entity_type) query = query.eq('entity_type', params.entity_type);

  // Simple cursor: created_at based
  if (params.cursor) {
    query = query.lt('created_at', params.cursor); // Simpler than composite cursor for audits usually
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const hasNextPage = data.length > limit;
  const logs = hasNextPage ? data.slice(0, -1) : data;
  const nextCursor = hasNextPage ? logs[logs.length - 1].created_at : null;

  return {
    logs,
    hasNextPage,
    nextCursor,
    totalCount: count || 0,
  };
}
