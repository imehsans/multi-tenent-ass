/**
 * Invites Server Actions
 *
 * Manage organization invitations.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

export async function inviteMember(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const orgId = formData.get('org_id') as string;

  if (!email || !orgId) {
    throw new Error('Email and Organization ID are required');
  }

  // Check if inviter is admin/owner
  const { data: membership, error: membershipError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  if (membershipError || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Unauthorized: You must be an owner or admin to invite members.');
  }

  // Check if user already exists in auth system (simplified)
  // Real implementation would look up by email, but RLS prevents querying arbitrary users.
  // We'll simulate by checking if they are already a member.

  // NOTE: For this exercise, we assume the user might exist.
  // Since we can't query auth.users by email easily without admin privileges,
  // we will insert into a 'pending_invites' table (if we had one) or
  // try to add them directly if we knew their UUID.

  // WORKAROUND for Demo:
  // We'll simulate a successful invite.
  // In a real app, we'd use supabase.auth.admin.inviteUserByEmail(email)
  // which requires SERVICE ROLE KEY.

  // We will use the service role client here solely for invitation.
  const supabaseAdmin = await import('@/lib/supabase/server').then((mod) =>
    mod.createServiceRoleClient()
  );

  const { data: invitedUser, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { organization_id: orgId, role: role || 'member' },
    });

  if (inviteError) {
    console.error('Invite failed:', inviteError);
    throw new Error('Failed to send invitation: ' + inviteError.message);
  }

  // If user already exists, we might need to add them to user_roles directly.
  // The trigger on auth.users usually handles this or we do it manually.
  if (invitedUser.user) {
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: invitedUser.user.id,
      org_id: orgId,
      role: (role as 'owner' | 'admin' | 'member' | 'viewer') || 'member',
    });

    if (roleError) {
      // Ignore unique violation if they are already a member
      if (!roleError.message.includes('unique constraint')) {
        console.error('Failed to add role:', roleError);
      }
    }
  }

  revalidatePath(`/orgs/${orgId}/members`);
  return { success: true };
}
