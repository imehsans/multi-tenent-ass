/**
 * Organization Server Actions
 *
 * Manages operations related to organizations and their memberships.
 */

'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import slugify from 'slugify';
import { createAuditLog } from './audit';
import { requireRole } from '@/lib/permissions';

export async function getUserOrganizations() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Optimized query for organizations via membership
  const { data, error } = await supabase
    .from('user_roles')
    .select(
      `
      id,
      role,
      organizations!inner (
        id,
        name,
        slug,
        created_at
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((membership: any) => ({
    ...membership.organizations,
    role: membership.role,
    membershipId: membership.id,
  }));
}

export async function createOrganization(formData: FormData) {
  const user = await requireAuth();

  // Use service role client to bypass RLS for org creation
  // This is safe because we verify auth above
  const supabaseAdmin = createServiceRoleClient();

  const name = formData.get('name') as string;
  if (!name || name.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  const slug = slugify(name, { lower: true, strict: true });

  // 1. Create Organization (using admin client to bypass RLS)
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name, slug })
    .select()
    .single();

  if (orgError) throw orgError;

  // 2. Add Creator as OWNER explicitly (Reliability fix)
  // We try to insert. If trigger already did it, we catch duplicate/conflict or ignore.
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({
      user_id: user.id,
      org_id: org.id,
      role: 'owner',
    })
    .select()
    .single();

  if (roleError) {
    // If it's a duplicate key violation, it means the trigger worked.
    // We can ignore it. Otherwise, we should log it.
    if (!roleError.message.includes('unique constraint') && !roleError.message.includes('duplicate key')) {
      console.error('Failed to assign owner role:', roleError);
      // We might want to throw here, but let's see. If role assignment fails, user can't access org.
      throw new Error('Failed to assign owner role to organization creator.');
    }
  }

  console.log('Owner role assigned successfully');

  // 3. Audit Log
  await createAuditLog({
    org_id: org.id,
    action: 'org.created',
    entity_type: 'organization',
    entity_id: org.id,
    new_data: { name: org.name, slug: org.slug },
  });

  revalidatePath('/orgs');
  return org;
}

export async function getOrganizationMembers(orgId: string) {
  const user = await requireAuth();
  // Ensure user is a member of the organization (any role)
  await requireRole(orgId, ['owner', 'admin', 'member', 'viewer']);

  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Enhance with user details using Admin API
  // Note: specific to assignment/demo where profiles table isn't enforced
  const supabaseAdmin = createServiceRoleClient();

  const membersWithDetails = await Promise.all(
    members.map(async (member) => {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
        member.user_id
      );

      if (userError || !userData.user) {
        return {
          ...member,
          user: {
            full_name: 'Unknown User',
            email: 'unknown@example.com',
          },
        };
      }

      return {
        ...member,
        user: {
          full_name: userData.user.user_metadata?.full_name || 'No Name',
          email: userData.user.email || 'No Email',
        },
      };
    })
  );

  return membersWithDetails;
}

export async function getOrganization(orgId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // RLS ensures access control
  const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();

  if (error) throw error;
  return data;
}

export async function updateOrganization(orgId: string, updates: { name: string }) {
  await requireAuth();
  await requireRole(orgId, ['owner']); // Only owners can update

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .update({ name: updates.name })
    .eq('id', orgId)
    .select()
    .single();

  if (error) throw error;

  await createAuditLog({
    org_id: orgId,
    action: 'org.update',
    entity_type: 'organization',
    entity_id: orgId,
    new_data: updates,
  });

  revalidatePath(`/orgs/${orgId}`);
  return data;
}

export async function deleteOrganization(orgId: string) {
  await requireAuth();
  await requireRole(orgId, ['owner']); // Only owners can delete

  // We need service role to delete everything due to potential RLS restrictions on cascade
  const supabaseAdmin = createServiceRoleClient();

  // 1. Log deletion before it happens (if possible, or just rely on logs disappearing? No, let's log to a global log if we had one.
  // For now, we just delete.

  const { error } = await supabaseAdmin.from('organizations').delete().eq('id', orgId);

  if (error) throw error;

  revalidatePath('/orgs');
}
