'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { addTimelineEvent } from './timeline';
import { createAuditLog } from './audit';
import { checkRateLimit } from '@/lib/ratelimit';
import { requirePermission, requireRole } from '@/lib/permissions';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function uploadAttachment(formData: FormData) {
  const user = await requireAuth();

  // Rate Limit
  await checkRateLimit(user.id, 'fileUpload');

  const orgId = formData.get('org_id') as string;
  await requirePermission(orgId, 'attachment.upload');

  const supabase = await createClient();

  const file = formData.get('file') as File;
  const ticketId = formData.get('ticket_id') as string;

  if (!file) throw new Error('No file provided');
  if (file.size > MAX_FILE_SIZE) throw new Error('File size exceeds 100MB limit');

  // Create unique filename
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const filePath = `${orgId}/${ticketId}/${filename}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Save attachment metadata to database
  const { data: attachment, error: dbError } = await supabase
    .from('attachments')
    .insert({
      ticket_id: ticketId,
      org_id: orgId,
      file_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  // Add timeline event
  await addTimelineEvent({
    ticket_id: ticketId,
    org_id: orgId,
    event_type: 'attachment_added',
    metadata: { file_name: file.name, attachment_id: attachment.id },
  });

  // Add audit log
  await createAuditLog({
    org_id: orgId,
    action: 'attachment.uploaded',
    entity_type: 'attachment',
    entity_id: attachment.id,
    new_data: { file_name: file.name, file_size: file.size },
  });

  revalidatePath(`/orgs/${orgId}/tickets/${ticketId}`);
  return attachment;
}

export async function getAttachmentUrl(attachmentId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get attachment details
  const { data: attachment, error } = await supabase
    .from('attachments')
    .select('file_path, org_id')
    .eq('id', attachmentId)
    .single();

  if (error) throw error;

  // Ensure user is a member of the organization (any role)
  await requireRole(attachment.org_id, ['owner', 'admin', 'member', 'viewer']); // Basic read access check

  // Generate signed URL (valid for 1 hour)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('attachments')
    .createSignedUrl(attachment.file_path, 3600); // 1 hour

  if (signedError) throw signedError;

  return signedData.signedUrl;
}

export async function deleteAttachment(attachmentId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('file_path, org_id, ticket_id')
    .eq('id', attachmentId)
    .single();

  if (fetchError) throw fetchError;

  await requirePermission(attachment.org_id, 'attachment.delete');

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([attachment.file_path]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase.from('attachments').delete().eq('id', attachmentId);

  if (dbError) throw dbError;

  await createAuditLog({
    org_id: attachment.org_id,
    action: 'attachment.deleted',
    entity_type: 'attachment',
    entity_id: attachmentId,
  });

  revalidatePath(`/orgs/${attachment.org_id}/tickets/${attachment.ticket_id}`);
}

export async function listAttachments(ticketId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get ticket to find org_id
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('org_id')
    .eq('id', ticketId)
    .single();

  if (ticketError) throw ticketError;

  // Verify membership
  await requireRole(ticket.org_id, ['owner', 'admin', 'member', 'viewer']);

  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
