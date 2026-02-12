'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { createAuditLog } from './audit';
import { randomBytes } from 'crypto';

const INVITE_EXPIRY_DAYS = 7;

interface CreateInviteInput {
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  org_id: string;
}

export async function createInvite(input: CreateInviteInput) {
  const user = await requireAuth();
  const supabase = await createClient();
  const supabaseAdmin = await import('@/lib/supabase/server').then((mod) =>
    mod.createServiceRoleClient()
  );

  const { email, role, org_id } = input;

  // Validate inputs
  if (!email || !org_id || !role) {
    throw new Error('Email, organization ID, and role are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address');
  }

  // Check if inviter is admin/owner
  const { data: membership, error: membershipError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', org_id)
    .single();

  if (membershipError || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Unauthorized: You must be an owner or admin to invite members.');
  }

  // Step 1: Check if user already exists in the auth system
  const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
  const authUser = existingAuthUser.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let targetUserId: string;
  let userCreated = false;

  if (authUser) {
    // User exists in auth system
    targetUserId = authUser.id;

    // Check if already a member of THIS organization
    const { data: existingMembership } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', targetUserId)
      .eq('org_id', org_id)
      .single();

    if (existingMembership) {
      throw new Error('User is already a member of this organization');
    }
  } else {
    // User doesn't exist - create new account with default password
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: '12345678', // Default password
      email_confirm: true, // Auto-verify email
      user_metadata: {
        full_name: email.split('@')[0], // Use email prefix as name
      },
    });

    if (createUserError || !newUser.user) {
      console.error('Failed to create user:', createUserError);
      throw new Error('Failed to create user account');
    }

    targetUserId = newUser.user.id;
    userCreated = true;
  }

  // Step 2: Add user to organization
  const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
    user_id: targetUserId,
    org_id: org_id,
    role: role,
  });

  if (roleError) {
    console.error('Failed to assign role:', roleError);
    throw new Error('Failed to assign user to organization');
  }

  // Step 3: Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', org_id)
    .single();

  // Step 4: Log audit event
  await createAuditLog({
    org_id,
    action: userCreated ? 'member.created_and_added' : 'member.added',
    entity_type: 'user_role',
    entity_id: targetUserId,
    new_data: {
      email,
      role,
      user_created: userCreated,
      organization: org?.name
    },
  });

  revalidatePath(`/orgs/${org_id}/members`);

  // Return appropriate success message
  if (userCreated) {
    return {
      success: true,
      message: `User created successfully! Email: ${email}, Password: 12345678, Role: ${role}`,
      user: {
        email,
        role,
        created: true,
        default_password: '12345678',
      },
    };
  } else {
    return {
      success: true,
      message: `User added to organization with role: ${role}`,
      user: {
        email,
        role,
        created: false,
      },
    };
  }
}

export async function getInviteByToken(token: string) {
  const supabase = await createClient();

  const { data: invite, error } = await supabase
    .from('invites')
    .select(
      `
      id,
      email,
      role,
      expires_at,
      accepted_at,
      org_id,
      organizations (
        id,
        name,
        slug
      )
    `
    )
    .eq('token', token)
    .single();

  if (error || !invite) {
    return { error: 'Invalid or expired invitation' };
  }

  // Check if already accepted
  if (invite.accepted_at) {
    return { error: 'This invitation has already been accepted' };
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This invitation has expired' };
  }

  return { invite };
}

export async function acceptInvite(token: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    throw new Error('Invalid invitation');
  }

  // Validate invite
  if (invite.accepted_at) {
    throw new Error('Invitation already accepted');
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw new Error('Invitation has expired');
  }

  // Check if user email matches invite (case-insensitive)
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error('This invitation is for a different email address');
  }

  // Check if user is already a member
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('org_id', invite.org_id)
    .single();

  if (existingRole) {
    // Mark as accepted anyway to prevent re-use
    await supabase
      .from('invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    throw new Error('You are already a member of this organization');
  }

  // Add user to organization with specified role
  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: user.id,
    org_id: invite.org_id,
    role: invite.role,
  });

  if (roleError) {
    console.error('Failed to add user role:', roleError);
    throw new Error('Failed to join organization');
  }

  // Mark invite as accepted
  const { error: updateError } = await supabase
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  if (updateError) {
    console.error('Failed to mark invite as accepted:', updateError);
  }

  // Log audit event
  await createAuditLog({
    org_id: invite.org_id,
    action: 'invite.accepted',
    entity_type: 'invite',
    entity_id: invite.id,
    new_data: { user_id: user.id, role: invite.role },
  });

  revalidatePath(`/orgs/${invite.org_id}`);
  revalidatePath(`/orgs/${invite.org_id}/members`);

  return {
    success: true,
    org_id: invite.org_id,
  };
}

export async function listInvites(org_id: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: membership } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', org_id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Unauthorized: Only admins and owners can view invitations');
  }

  const { data: invites, error } = await supabase
    .from('invites')
    .select('*')
    .eq('org_id', org_id)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch invites:', error);
    throw new Error('Failed to fetch invitations');
  }

  return invites || [];
}

export async function cancelInvite(invite_id: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get invite to check org
  const { data: invite, error: fetchError } = await supabase
    .from('invites')
    .select('org_id, email, accepted_at')
    .eq('id', invite_id)
    .single();

  if (fetchError || !invite) {
    throw new Error('Invitation not found');
  }

  if (invite.accepted_at) {
    throw new Error('Cannot cancel an accepted invitation');
  }

  // Check if user is admin/owner
  const { data: membership } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', invite.org_id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Unauthorized');
  }

  // Delete invite
  const { error: deleteError } = await supabase.from('invites').delete().eq('id', invite_id);

  if (deleteError) {
    console.error('Failed to cancel invite:', deleteError);
    throw new Error('Failed to cancel invitation');
  }

  // Log audit event
  await createAuditLog({
    org_id: invite.org_id,
    action: 'invite.cancelled',
    entity_type: 'invite',
    entity_id: invite_id,
    old_data: { email: invite.email },
  });

  revalidatePath(`/orgs/${invite.org_id}/members`);

  return { success: true };
}
