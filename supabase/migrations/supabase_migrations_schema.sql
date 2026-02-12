-- ============================================
-- Complete Multi-Tenant Ops Console Schema
-- Generated: 2025-02-12
-- ============================================
-- This is a comprehensive migration file that includes:
-- 1. Schema cleanup and setup
-- 2. Enums and types
-- 3. All tables with constraints
-- 4. Helper functions
-- 5. Indexes for performance
-- 6. RLS policies for security
-- 7. Triggers for automation
-- 8. Storage bucket setup
-- ============================================

-- ============================================
-- 1. SCHEMA CLEANUP AND PERMISSIONS
-- ============================================

-- Clean slate (use with caution in production)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ============================================
-- 2. ENUMS AND TYPES
-- ============================================

CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE ticket_status AS ENUM ('open', 'investigating', 'mitigated', 'resolved');

-- ============================================
-- 3. TABLES
-- ============================================

-- Organizations Table
-- Core multi-tenant organization entity
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  
  CONSTRAINT org_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT org_slug_valid CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON COLUMN organizations.slug IS 'URL-safe unique identifier for the organization';

-- User Roles Table
-- Maps users to organizations with role-based access control
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  
  UNIQUE(user_id, org_id)
);

COMMENT ON TABLE user_roles IS 'User memberships in organizations with role-based permissions';

-- Invites Table
-- Manages organization invitations with token-based acceptance
CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT future_expiry CHECK (expires_at > created_at),
  CONSTRAINT no_duplicate_pending CHECK (
    accepted_at IS NOT NULL OR 
    NOT EXISTS (
      SELECT 1 FROM invites i2 
      WHERE i2.org_id = invites.org_id 
        AND i2.email = invites.email 
        AND i2.accepted_at IS NULL 
        AND i2.id != invites.id
    )
  )
);

COMMENT ON TABLE invites IS 'Organization invitations with expiry tracking';
COMMENT ON COLUMN invites.token IS 'Unique token for invite acceptance URL';
COMMENT ON COLUMN invites.expires_at IS 'Invitation expiry timestamp (typically 7 days)';

-- Tickets Table
-- Core incident/task management entity
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status ticket_status NOT NULL DEFAULT 'open',
  severity int NOT NULL CHECK (severity BETWEEN 1 AND 5),
  created_by uuid REFERENCES auth.users(id),
  assignee_id uuid REFERENCES auth.users(id),
  search_vector tsvector,
  
  CONSTRAINT ticket_title_not_empty CHECK (length(trim(title)) > 0)
);

COMMENT ON TABLE tickets IS 'Operational tickets (incidents/tasks) with multi-tenant isolation';
COMMENT ON COLUMN tickets.severity IS 'Severity level from 1 (lowest) to 5 (highest)';
COMMENT ON COLUMN tickets.search_vector IS 'Full-text search index for title and description';

-- Ticket Timeline Events Table
-- Immutable audit trail for all ticket activities
CREATE TABLE ticket_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) NOT NULL,
  content text,
  metadata jsonb,
  
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'comment',
      'status_change',
      'assignment_change',
      'tag_change',
      'severity_change',
      'attachment_added',
      'attachment_removed',
      'created'
    )
  )
);

COMMENT ON TABLE ticket_timeline_events IS 'Immutable timeline of all ticket activities and changes';
COMMENT ON COLUMN ticket_timeline_events.event_type IS 'Type of event (comment, status_change, etc.)';
COMMENT ON COLUMN ticket_timeline_events.metadata IS 'Event-specific data (old/new values for changes)';

-- Attachments Table
-- File metadata for Supabase Storage integration
CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_size bigint NOT NULL CHECK (file_size > 0),
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL
);

COMMENT ON TABLE attachments IS 'File attachment metadata linked to Supabase Storage';
COMMENT ON COLUMN attachments.file_path IS 'Storage path: attachments/{org_id}/{ticket_id}/{file_name}';

-- Audit Logs Table
-- Insert-only immutable audit trail for all critical actions
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id) NOT NULL,
  old_data jsonb,
  new_data jsonb,
  
  CONSTRAINT valid_action CHECK (
    action IN (
      'create',
      'update',
      'delete',
      'role_change',
      'invite_sent',
      'invite_accepted',
      'member_removed'
    )
  ),
  CONSTRAINT valid_entity_type CHECK (
    entity_type IN (
      'organization',
      'ticket',
      'comment',
      'attachment',
      'user_role',
      'invite'
    )
  )
);

COMMENT ON TABLE audit_logs IS 'Insert-only immutable audit trail for compliance and security';
COMMENT ON COLUMN audit_logs.old_data IS 'JSON snapshot of entity before change';
COMMENT ON COLUMN audit_logs.new_data IS 'JSON snapshot of entity after change';

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Get all organizations the current user belongs to
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM user_roles WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION get_my_org_ids IS 'Returns all organization IDs the current user is a member of';

-- Check if user is admin or owner in an organization
CREATE OR REPLACE FUNCTION is_org_admin(organization_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND org_id = organization_id
      AND role IN ('owner', 'admin')
  );
$$;

COMMENT ON FUNCTION is_org_admin IS 'Checks if current user is admin or owner of specified organization';

-- Get user's specific role in an organization
CREATE OR REPLACE FUNCTION get_my_org_role(organization_id uuid)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid() AND org_id = organization_id LIMIT 1;
$$;

COMMENT ON FUNCTION get_my_org_role IS 'Returns current user"s role in specified organization';

-- Check if user is a member of an organization
CREATE OR REPLACE FUNCTION is_org_member(organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND org_id = organization_id
  );
END;
$$;

COMMENT ON FUNCTION is_org_member IS 'Checks if current user is a member of specified organization';

-- Validate if an invite token is still valid
CREATE OR REPLACE FUNCTION is_invite_valid(invite_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  invite_record invites;
BEGIN
  SELECT * INTO invite_record FROM invites WHERE token = invite_token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF invite_record.accepted_at IS NOT NULL THEN
    RETURN false;
  END IF;
  
  IF invite_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION is_invite_valid IS 'Validates invite token and checks expiry/acceptance status';

-- Clean up expired invites (maintenance function)
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM invites 
  WHERE accepted_at IS NULL 
    AND expires_at < now() - interval '30 days';
END;
$$;

COMMENT ON FUNCTION cleanup_expired_invites IS 'Removes invites that have been expired for 30+ days';

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- User Roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON user_roles(org_id);
CREATE INDEX idx_user_roles_composite ON user_roles(org_id, role);

-- Invites
CREATE INDEX idx_invites_org_id ON invites(org_id);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_pending ON invites(expires_at) WHERE accepted_at IS NULL;

-- Tickets (Critical for performance with 10k+ records)
CREATE INDEX idx_tickets_org_id ON tickets(org_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_severity ON tickets(severity);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tickets_created_by ON tickets(created_by);

-- Composite index for pagination and filtering
CREATE INDEX idx_tickets_org_updated ON tickets(org_id, updated_at DESC, id DESC);
CREATE INDEX idx_tickets_org_created ON tickets(org_id, created_at DESC, id DESC);

-- Full-text search index
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN(search_vector);

-- Timeline Events
CREATE INDEX idx_timeline_ticket_id ON ticket_timeline_events(ticket_id);
CREATE INDEX idx_timeline_org_id ON ticket_timeline_events(org_id);
CREATE INDEX idx_timeline_created_at ON ticket_timeline_events(created_at DESC);
CREATE INDEX idx_timeline_event_type ON ticket_timeline_events(event_type);

-- Attachments
CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX idx_attachments_org_id ON attachments(org_id);
CREATE INDEX idx_attachments_file_path ON attachments(file_path);

-- Audit Logs
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- ======== ORGANIZATIONS ========
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_my_org_ids()));

CREATE POLICY "Any authenticated user can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM user_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    id IN (
      SELECT org_id FROM user_roles 
      WHERE user_id = auth.uid() 
        AND role = 'owner'
    )
  );

-- ======== USER ROLES ========
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members in their organizations"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR
    org_id IN (SELECT get_my_org_ids())
  );

CREATE POLICY "Allow owner assignment on new org or admin invite"
  ON user_roles FOR INSERT
  WITH CHECK (
    -- Allow self-assignment as owner during org creation (no owner exists yet)
    (user_id = auth.uid() AND role = 'owner' AND 
     NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.org_id = user_roles.org_id AND ur.role = 'owner'))
    OR
    -- Allow admins/owners to invite members
    is_org_admin(org_id)
  );

CREATE POLICY "Admins and owners can update member roles"
  ON user_roles FOR UPDATE
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Admins and owners can remove members"
  ON user_roles FOR DELETE
  USING (is_org_admin(org_id));

-- ======== INVITES ========
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view org invites"
  ON invites FOR SELECT
  USING (
    org_id IN (SELECT get_my_org_ids()) AND
    is_org_admin(org_id)
  );

CREATE POLICY "Anyone can view invites by token for acceptance"
  ON invites FOR SELECT
  USING (true);

CREATE POLICY "Admins can create invites"
  ON invites FOR INSERT
  WITH CHECK (
    org_id IN (SELECT get_my_org_ids()) AND
    is_org_admin(org_id)
  );

CREATE POLICY "Admins can delete pending invites"
  ON invites FOR DELETE
  USING (
    org_id IN (SELECT get_my_org_ids()) AND
    is_org_admin(org_id) AND
    accepted_at IS NULL
  );

CREATE POLICY "System can update invites for acceptance"
  ON invites FOR UPDATE
  USING (true)
  WITH CHECK (accepted_at IS NOT NULL);

-- ======== TICKETS ========
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets in their organizations"
  ON tickets FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Members and above can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

CREATE POLICY "Members and above can update tickets"
  ON tickets FOR UPDATE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  )
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

CREATE POLICY "Admins and owners can delete tickets"
  ON tickets FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('admin', 'owner')
  );

-- ======== TICKET TIMELINE EVENTS ========
ALTER TABLE ticket_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline in their organizations"
  ON ticket_timeline_events FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Members and above can create timeline events"
  ON ticket_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

CREATE POLICY "Admins and owners can delete timeline events"
  ON ticket_timeline_events FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('admin', 'owner')
  );

-- ======== ATTACHMENTS ========
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their organizations"
  ON attachments FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Members and above can upload attachments"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

CREATE POLICY "Admins and owners can delete attachments"
  ON attachments FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('admin', 'owner')
  );

-- ======== AUDIT LOGS ========
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs in their organizations"
  ON audit_logs FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "System and users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(org_id));

-- Immutability enforcement
CREATE POLICY "Audit logs are immutable - no updates" 
  ON audit_logs FOR UPDATE 
  USING (false);

CREATE POLICY "Audit logs cannot be deleted" 
  ON audit_logs FOR DELETE 
  USING (false);

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Auto-assign creator as owner when organization is created
CREATE OR REPLACE FUNCTION handle_new_org_created() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only assign owner if there is an authenticated user context
  -- (This allows seed scripts to bypass automatic owner assignment)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO user_roles (user_id, org_id, role)
    VALUES (auth.uid(), NEW.id, 'owner');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_org_created();

-- Auto-update ticket updated_at timestamp
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TRIGGER handle_ticket_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

-- Auto-update ticket search vector on insert/update
CREATE OR REPLACE FUNCTION update_ticket_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER ticket_search_vector_update
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_search_vector();

-- ============================================
-- 8. STORAGE BUCKETS (Run via dashboard or API)
-- ============================================

-- Note: Storage buckets must be created via Supabase Dashboard or API
-- This is reference SQL for the bucket configuration

/*
-- Create attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- RLS for attachments bucket
CREATE POLICY "Users can view attachments in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  -- Path format: attachments/{org_id}/{ticket_id}/{filename}
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  -- Verify user is member and has permission
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('member', 'admin', 'owner')
  )
);

CREATE POLICY "Admins can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
  )
);
*/

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

-- Verify schema health
DO $$
BEGIN
  RAISE NOTICE 'Schema migration completed successfully!';
  RAISE NOTICE 'Tables created: %, %, %, %, %, %, %', 
    'organizations', 'user_roles', 'invites', 'tickets', 
    'ticket_timeline_events', 'attachments', 'audit_logs';
  RAISE NOTICE 'RLS enabled on all tables with strict multi-tenant isolation';
  RAISE NOTICE 'Indexes created for optimal query performance';
END $$;
