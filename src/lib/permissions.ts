/**
 * Permissions System
 *
 * Provides authorization checks based on role-based access control (RBAC).
 * Enforces security rules for organization resources.
 */

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export type Permission =
  | 'org.delete'
  | 'org.update'
  | 'member.invite'
  | 'member.remove'
  | 'member.update_role'
  | 'ticket.create'
  | 'ticket.update'
  | 'ticket.delete'
  | 'comment.create'
  | 'attachment.upload'
  | 'attachment.delete';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'org.delete',
    'org.update',
    'member.invite',
    'member.remove',
    'member.update_role',
    'ticket.create',
    'ticket.update',
    'ticket.delete',
    'comment.create',
    'attachment.upload',
    'attachment.delete',
  ],
  admin: [
    'org.update',
    'member.invite',
    'member.remove',
    'member.update_role',
    'ticket.create',
    'ticket.update',
    'ticket.delete',
    'comment.create',
    'attachment.upload',
    'attachment.delete',
  ],
  member: ['ticket.create', 'ticket.update', 'comment.create', 'attachment.upload'],
  viewer: [], // Read-only
};

export async function getUserRole(orgId: string): Promise<Role | null> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return (data as any).role as Role;
}

export async function hasPermission(orgId: string, permission: Permission): Promise<boolean> {
  const role = await getUserRole(orgId);
  if (!role) return false;

  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function requireRole(orgId: string, allowedRoles: Role[]) {
  const role = await getUserRole(orgId);

  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Insufficient permissions: Required role not met.');
  }

  return role;
}

export async function requirePermission(orgId: string, permission: Permission) {
  const allowed = await hasPermission(orgId, permission);

  if (!allowed) {
    throw new Error(`Permission denied: You cannot perform action '${permission}'.`);
  }
}
