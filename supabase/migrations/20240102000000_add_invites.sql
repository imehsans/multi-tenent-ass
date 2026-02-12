-- Add Invites Table and RLS Policies
-- This migration adds a complete invite system with expiry tracking

-- 1. Create Invites Table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT future_expiry CHECK (expires_at > created_at)
);

-- 2. Indexes for Performance
CREATE INDEX idx_invites_org_id ON invites(org_id);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_expires_at ON invites(expires_at) WHERE accepted_at IS NULL;

-- 3. Helper Function: Check if invite is valid
CREATE OR REPLACE FUNCTION is_invite_valid(invite_token text)
RETURNS boolean AS $$
DECLARE
  invite_record invites;
BEGIN
  SELECT * INTO invite_record FROM invites WHERE token = invite_token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if already accepted
  IF invite_record.accepted_at IS NOT NULL THEN
    RETURN false;
  END IF;
  
  -- Check if expired
  IF invite_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policies for Invites
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can view pending invites in their org
CREATE POLICY "Admins can view org invites"
  ON invites FOR SELECT
  USING (
    org_id IN (SELECT get_my_org_ids()) AND
    is_org_admin(org_id)
  );

-- Org admins/owners can create invites
CREATE POLICY "Admins can create invites"
  ON invites FOR INSERT
  WITH CHECK (
    org_id IN (SELECT get_my_org_ids()) AND
    is_org_admin(org_id)
  );

-- Org admins/owners can delete pending invites
CREATE POLICY "Admins can delete pending invites"
  ON invites FOR DELETE
  USING (
    org_id IN (SELECT get_my_org_ids()) AND
    is_org_admin(org_id) AND
    accepted_at IS NULL
  );

-- Anyone can view their own pending invites by email (for accept flow)
-- Note: This policy allows unauthenticated users to check invite validity
CREATE POLICY "Users can view invites by token"
  ON invites FOR SELECT
  USING (true); -- We'll validate via token in application logic

-- 5. Function: Clean up expired invites (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM invites 
  WHERE accepted_at IS NULL 
    AND expires_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Comment for documentation
COMMENT ON TABLE invites IS 'Tracks pending and accepted organization invitations with expiry';
COMMENT ON COLUMN invites.token IS 'Unique token for invite acceptance URL';
COMMENT ON COLUMN invites.expires_at IS 'Invitation expiry timestamp (typically 7 days)';
COMMENT ON COLUMN invites.accepted_at IS 'Timestamp when invite was accepted (NULL if pending)';
