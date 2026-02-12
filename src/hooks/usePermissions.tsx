'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Role, Permission } from '@/lib/permissions';

interface UsePermissionsReturn {
  role: Role | null;
  loading: boolean;
  can: (permission: Permission) => boolean;
  isViewer: boolean;
  isMember: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  canCreateTicket: boolean;
  canEditTicket: boolean;
  canDeleteTicket: boolean;
  canComment: boolean;
  canUploadAttachment: boolean;
  canManageMembers: boolean;
  canDeleteOrg: boolean;
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'org.create',
    'org.update',
    'org.delete',
    'member.invite',
    'member.remove',
    'member.update_role',
    'ticket.create',
    'ticket.update',
    'ticket.status_change',
    'ticket.delete',
    'comment.create',
    'comment.update',
    'comment.delete',
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
    'ticket.status_change',
    'ticket.delete',
    'comment.create',
    'comment.update',
    'comment.delete',
    'attachment.upload',
    'attachment.delete',
  ],
  member: [
    'ticket.create',
    'ticket.update',
    'ticket.status_change',
    'comment.create',
    'attachment.upload',
  ],
  viewer: [],
};

export function usePermissions(orgId: string): UsePermissionsReturn {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Get user's role in this org
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setRole(null);
      } else {
        setRole(data.role as Role);
      }

      setLoading(false);
    };

    fetchRole();
  }, [orgId]);

  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role].includes(permission);
  };

  return {
    role,
    loading,
    can,
    // Role checks
    isViewer: role === 'viewer',
    isMember: role === 'member',
    isAdmin: role === 'admin',
    isOwner: role === 'owner',
    // Common permission shortcuts
    canCreateTicket: can('ticket.create'),
    canEditTicket: can('ticket.update'),
    canDeleteTicket: can('ticket.delete'),
    canComment: can('comment.create'),
    canUploadAttachment: can('attachment.upload'),
    canManageMembers: can('member.invite'),
    canDeleteOrg: can('org.delete'),
  };
}

export function WithPermission({
  orgId,
  permission,
  children,
  fallback = null,
}: {
  orgId: string;
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, loading } = usePermissions(orgId);

  if (loading) return null;
  if (!can(permission)) return <>{fallback}</>;

  return <>{children}</>;
}

export function WithRole({
  orgId,
  roles,
  children,
  fallback = null,
}: {
  orgId: string;
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role, loading } = usePermissions(orgId);

  if (loading) return null;
  if (!role || !roles.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
}
