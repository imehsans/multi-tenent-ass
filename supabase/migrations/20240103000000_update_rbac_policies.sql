-- Update RLS Policies for Strict Role-Based Access Control
-- This migration updates existing policies to match exact role permissions

-- ============================================
-- TICKETS TABLE - Role-Based Access
-- ============================================

-- Drop existing ticket policies
DROP POLICY IF EXISTS "Role-based create tickets" ON tickets;
DROP POLICY IF EXISTS "Role-based update tickets" ON tickets;
DROP POLICY IF EXISTS "Role-based delete tickets" ON tickets;

-- Viewers, Members, Admins, Owners can view tickets in their orgs
-- (SELECT policy already exists and is correct)

-- ONLY Members, Admins, Owners can create tickets (NOT Viewers)
CREATE POLICY "Members and above can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

-- ONLY Members, Admins, Owners can update tickets (NOT Viewers)
CREATE POLICY "Members and above can update tickets"
  ON tickets FOR UPDATE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

-- ONLY Admins and Owners can delete tickets (NOT Members or Viewers)
CREATE POLICY "Admins and owners can delete tickets"
  ON tickets FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('admin', 'owner')
  );

-- ============================================
-- TIMELINE EVENTS (COMMENTS) - Role-Based Access
-- ============================================

-- Drop existing timeline policies
DROP POLICY IF EXISTS "Role-based add timeline events" ON ticket_timeline_events;

-- ONLY Members, Admins, Owners can add comments/timeline events (NOT Viewers)
CREATE POLICY "Members and above can create timeline events"
  ON ticket_timeline_events FOR INSERT
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

-- ONLY Admins and Owners can delete timeline events
CREATE POLICY "Admins and owners can delete timeline events"
  ON ticket_timeline_events FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('admin', 'owner')
  );

-- ============================================
-- ATTACHMENTS - Role-Based Access
-- ============================================

-- Drop existing attachment policies
DROP POLICY IF EXISTS "Role-based upload attachments" ON attachments;
DROP POLICY IF EXISTS "Role-based delete attachments" ON attachments;

-- ONLY Members, Admins, Owners can upload attachments (NOT Viewers)
CREATE POLICY "Members and above can upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('member', 'admin', 'owner')
  );

-- ONLY Admins and Owners can delete attachments
CREATE POLICY "Admins and owners can delete attachments"
  ON attachments FOR DELETE
  USING (
    is_org_member(org_id) AND 
    get_my_org_role(org_id) IN ('admin', 'owner')
  );

-- ============================================
-- USER ROLES (MEMBERS) - Role-Based Access
-- ============================================

-- Drop existing user_roles policies
DROP POLICY IF EXISTS "Admins/Owners can manage members" ON user_roles;

-- Create separate policies for better control

-- IMPORTANT: When creating a NEW organization, the creator needs to be able to insert themselves as owner
-- This policy allows:
-- 1. Anyone to insert themselves as owner when no other owner exists yet (new org)
-- 2. Admins/Owners to invite new members to existing orgs
CREATE POLICY "Allow owner assignment on new org or admin invite"
  ON user_roles FOR INSERT
  WITH CHECK (
    -- Allow if user is inserting themselves AND no owner exists yet (new org creation)
    (user_id = auth.uid() AND role = 'owner' AND 
     NOT EXISTS (SELECT 1 FROM user_roles WHERE org_id = user_roles.org_id AND role = 'owner'))
    OR
    -- Allow if user is already admin/owner of this org (inviting members)
    is_org_admin(org_id)
  );

-- Admins and Owners can update member roles
CREATE POLICY "Admins and owners can update member roles"
  ON user_roles FOR UPDATE
  USING (
    is_org_admin(org_id)
  );

-- Admins and Owners can remove members
CREATE POLICY "Admins and owners can remove members"
  ON user_roles FOR DELETE
  USING (
    is_org_admin(org_id)
  );

-- ============================================
-- ORGANIZATIONS - Owner-Only Deletion
-- ============================================

-- Organizations can be created by anyone (existing policy is fine)
-- Organizations can be viewed by members (existing policy is fine)

-- Add update policy for Admins and Owners
DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;
CREATE POLICY "Admins and owners can update organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- ONLY Owners can delete organizations
CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid() AND role = 'owner')
  );

-- ============================================
-- COMMENTS
-- ============================================
-- Add a comment explaining RLS approach
COMMENT ON POLICY "Members and above can create tickets" ON tickets IS 
  'Viewers have read-only access. Members can create tickets. Admins and Owners have full access.';

COMMENT ON POLICY "Admins and owners can delete tickets" ON tickets IS 
  'Only Admins and Owners can delete tickets. Members cannot delete.';

COMMENT ON POLICY "Allow owner assignment on new org or admin invite" ON user_roles IS
  'Allows creator to assign themselves as owner during org creation, or admins to invite members.';
