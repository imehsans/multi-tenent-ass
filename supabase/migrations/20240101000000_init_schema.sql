-- 1. Nuke everything (Clean Slate)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 2. Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 3. Create Enums
CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE ticket_status AS ENUM ('open', 'investigating', 'mitigated', 'resolved');

-- 4. Tables (Create tables first so functions can reference them)

-- Organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

-- User Roles
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  org_id uuid REFERENCES organizations(id) NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE(user_id, org_id)
);

-- Tickets
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  org_id uuid REFERENCES organizations(id) NOT NULL,
  title text NOT NULL,
  description text,
  status ticket_status NOT NULL DEFAULT 'open',
  severity int NOT NULL CHECK (severity BETWEEN 1 AND 5),
  created_by uuid REFERENCES auth.users(id),
  assignee_id uuid REFERENCES auth.users(id),
  search_vector tsvector
);

-- Timeline Events
CREATE TABLE ticket_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES organizations(id) NOT NULL,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) NOT NULL,
  content text,
  metadata jsonb
);

-- Attachments
CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES organizations(id) NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Audit Logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  org_id uuid REFERENCES organizations(id) NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id) NOT NULL,
  old_data jsonb,
  new_data jsonb
);

-- 5. Helper Functions (Now tables exist)

-- Helper: Get my org IDs
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
  SELECT org_id FROM user_roles WHERE user_id = auth.uid();
$$;

-- Helper: Check if I am Admin/Owner in an org
CREATE OR REPLACE FUNCTION is_org_admin(organization_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND org_id = organization_id
      AND role IN ('owner', 'admin')
  );
$$;

-- Helper: Get my specific role in an org
CREATE OR REPLACE FUNCTION get_my_org_role(organization_id uuid)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid() AND org_id = organization_id;
$$;

-- Helper: Basic Membership Check
CREATE OR REPLACE FUNCTION is_org_member(organization_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND org_id = organization_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RLS Policies (Now tables and functions exist)

-- Organizations RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_my_org_ids()));
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- User Roles RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view members in their organizations"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR
    org_id IN (SELECT get_my_org_ids())
  );
CREATE POLICY "Admins/Owners can manage members"
  ON user_roles FOR ALL
  USING (
    is_org_admin(org_id)
  );

-- Tickets RLS
CREATE INDEX idx_tickets_org_id ON tickets(org_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN(search_vector);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tickets in their orgs"
  ON tickets FOR SELECT
  USING (is_org_member(org_id));
CREATE POLICY "Role-based create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('owner', 'admin', 'member')
  );
CREATE POLICY "Role-based update tickets"
  ON tickets FOR UPDATE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('owner', 'admin', 'member')
  );
CREATE POLICY "Role-based delete tickets"
  ON tickets FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('owner', 'admin')
  );

-- Timeline Events RLS
ALTER TABLE ticket_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view timeline in their orgs"
  ON ticket_timeline_events FOR SELECT
  USING (is_org_member(org_id));
CREATE POLICY "Role-based add timeline events"
  ON ticket_timeline_events FOR INSERT
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('owner', 'admin', 'member')
  );

-- Attachments RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view attachments in their orgs"
  ON attachments FOR SELECT
  USING (is_org_member(org_id));
CREATE POLICY "Role-based upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('owner', 'admin', 'member')
  );
CREATE POLICY "Role-based delete attachments"
  ON attachments FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('owner', 'admin')
  );

-- Audit Logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audit logs in their orgs"
  ON audit_logs FOR SELECT
  USING (is_org_member(org_id));
CREATE POLICY "System/Users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (is_org_member(org_id));
CREATE POLICY "Audit logs are immutable" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "Audit logs cannot be deleted" ON audit_logs FOR DELETE USING (false);

-- 7. Triggers

-- Auto-assign Owner on Org Create
CREATE OR REPLACE FUNCTION public.handle_new_comp_user() 
RETURNS trigger AS $$
BEGIN
  -- Only assign owner if there is an actual user context (skips for service_role/seed)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, org_id, role)
    VALUES (auth.uid(), NEW.id, 'owner');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_org_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_comp_user();

-- Updated At timestamp
CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

-- Search Vector
CREATE FUNCTION tickets_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE PROCEDURE tickets_search_vector_trigger();
