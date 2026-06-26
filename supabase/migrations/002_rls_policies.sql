-- ============================================================
-- LexFlow - Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get the current user's firm_id from their profile
CREATE OR REPLACE FUNCTION public.firm_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT firm_id FROM profiles WHERE id = auth.uid()
$$;

-- Get the current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Check if current user is staff (not a client)
CREATE OR REPLACE FUNCTION public.is_firm_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT role != 'client' FROM profiles WHERE id = auth.uid()
$$;

-- Check if current user is firm owner or senior lawyer
CREATE OR REPLACE FUNCTION public.is_firm_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT role IN ('firm_owner', 'senior_lawyer') FROM profiles WHERE id = auth.uid()
$$;

-- Check if current user is firm owner
CREATE OR REPLACE FUNCTION public.is_firm_owner()
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
  SELECT role = 'firm_owner' FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- firms TABLE POLICIES
-- ============================================================

-- Staff can view their own firm
CREATE POLICY "firms_select_staff"
  ON firms FOR SELECT
  USING (id = public.firm_id());

-- Only firm owner can update firm
CREATE POLICY "firms_update_owner"
  ON firms FOR UPDATE
  USING (id = public.firm_id() AND public.is_firm_owner());

-- Insert is handled by service role (during onboarding)
CREATE POLICY "firms_insert_service"
  ON firms FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- subscriptions TABLE POLICIES
-- ============================================================

CREATE POLICY "subscriptions_select_staff"
  ON subscriptions FOR SELECT
  USING (firm_id = public.firm_id());

CREATE POLICY "subscriptions_update_owner"
  ON subscriptions FOR UPDATE
  USING (firm_id = public.firm_id() AND public.is_firm_owner());

CREATE POLICY "subscriptions_insert_service"
  ON subscriptions FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- profiles TABLE POLICIES
-- ============================================================

-- Users can see all profiles in their firm
CREATE POLICY "profiles_select_same_firm"
  ON profiles FOR SELECT
  USING (firm_id = public.firm_id() OR id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Firm admins can update any profile in their firm
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- Service role handles inserts (during signup / invite)
CREATE POLICY "profiles_insert_service"
  ON profiles FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- clients TABLE POLICIES
-- ============================================================

-- Firm staff can view all clients in their firm
CREATE POLICY "clients_select_staff"
  ON clients FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

-- Clients can see only their own record (via profile link)
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT
  USING (profile_id = auth.uid());

-- Staff can create clients
CREATE POLICY "clients_insert_staff"
  ON clients FOR INSERT
  WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());

-- Staff can update clients
CREATE POLICY "clients_update_staff"
  ON clients FOR UPDATE
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

-- Only admin can delete clients
CREATE POLICY "clients_delete_admin"
  ON clients FOR DELETE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- ============================================================
-- cases TABLE POLICIES
-- ============================================================

-- Staff can view cases in their firm
CREATE POLICY "cases_select_staff"
  ON cases FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

-- Clients can see cases where they are the client
CREATE POLICY "cases_select_client"
  ON cases FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

CREATE POLICY "cases_insert_staff"
  ON cases FOR INSERT
  WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "cases_update_staff"
  ON cases FOR UPDATE
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "cases_delete_admin"
  ON cases FOR DELETE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- ============================================================
-- case_team_members TABLE POLICIES
-- ============================================================

CREATE POLICY "case_team_select_staff"
  ON case_team_members FOR SELECT
  USING (
    case_id IN (SELECT id FROM cases WHERE firm_id = public.firm_id())
  );

CREATE POLICY "case_team_insert_admin"
  ON case_team_members FOR INSERT
  WITH CHECK (
    case_id IN (SELECT id FROM cases WHERE firm_id = public.firm_id())
    AND public.is_firm_staff()
  );

CREATE POLICY "case_team_delete_admin"
  ON case_team_members FOR DELETE
  USING (
    case_id IN (SELECT id FROM cases WHERE firm_id = public.firm_id())
    AND public.is_firm_admin()
  );

-- ============================================================
-- case_updates TABLE POLICIES
-- ============================================================

CREATE POLICY "case_updates_select_staff"
  ON case_updates FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "case_updates_select_client"
  ON case_updates FOR SELECT
  USING (
    firm_id = public.firm_id()
    AND case_id IN (
      SELECT c.id FROM cases c
      JOIN clients cl ON c.client_id = cl.id
      WHERE cl.profile_id = auth.uid()
    )
  );

CREATE POLICY "case_updates_insert_staff"
  ON case_updates FOR INSERT
  WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "case_updates_update_own"
  ON case_updates FOR UPDATE
  USING (author_id = auth.uid() AND public.is_firm_staff());

CREATE POLICY "case_updates_delete_admin"
  ON case_updates FOR DELETE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- ============================================================
-- hearings TABLE POLICIES
-- ============================================================

CREATE POLICY "hearings_select_staff"
  ON hearings FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "hearings_select_client"
  ON hearings FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

CREATE POLICY "hearings_insert_staff"
  ON hearings FOR INSERT
  WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "hearings_update_staff"
  ON hearings FOR UPDATE
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "hearings_delete_admin"
  ON hearings FOR DELETE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- ============================================================
-- documents TABLE POLICIES
-- ============================================================

CREATE POLICY "documents_select_staff"
  ON documents FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

-- Clients can only see documents explicitly shared with them
CREATE POLICY "documents_select_client"
  ON documents FOR SELECT
  USING (
    is_shared_with_client = TRUE
    AND client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

CREATE POLICY "documents_insert_staff"
  ON documents FOR INSERT
  WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "documents_update_staff"
  ON documents FOR UPDATE
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "documents_delete_admin"
  ON documents FOR DELETE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- ============================================================
-- tasks TABLE POLICIES
-- ============================================================

CREATE POLICY "tasks_select_staff"
  ON tasks FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "tasks_insert_staff"
  ON tasks FOR INSERT
  WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "tasks_update_assigned_or_admin"
  ON tasks FOR UPDATE
  USING (
    firm_id = public.firm_id()
    AND public.is_firm_staff()
    AND (assigned_to = auth.uid() OR public.is_firm_admin())
  );

CREATE POLICY "tasks_delete_admin"
  ON tasks FOR DELETE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- ============================================================
-- invoices TABLE POLICIES
-- ============================================================

CREATE POLICY "invoices_select_staff"
  ON invoices FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

-- Clients can see their own invoices
CREATE POLICY "invoices_select_client"
  ON invoices FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
    AND status != 'draft'
  );

CREATE POLICY "invoices_insert_staff"
  ON invoices FOR INSERT
  WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "invoices_update_staff"
  ON invoices FOR UPDATE
  USING (firm_id = public.firm_id() AND public.is_firm_staff());

CREATE POLICY "invoices_delete_admin"
  ON invoices FOR DELETE
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- ============================================================
-- invoice_items TABLE POLICIES
-- ============================================================

CREATE POLICY "invoice_items_select"
  ON invoice_items FOR SELECT
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id())
  );

CREATE POLICY "invoice_items_insert_staff"
  ON invoice_items FOR INSERT
  WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id())
    AND public.is_firm_staff()
  );

CREATE POLICY "invoice_items_update_staff"
  ON invoice_items FOR UPDATE
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id())
    AND public.is_firm_staff()
  );

CREATE POLICY "invoice_items_delete_staff"
  ON invoice_items FOR DELETE
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id())
    AND public.is_firm_staff()
  );

-- ============================================================
-- notifications TABLE POLICIES
-- ============================================================

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_insert_service"
  ON notifications FOR INSERT
  WITH CHECK (firm_id = public.firm_id());

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (recipient_id = auth.uid());

-- ============================================================
-- activity_logs TABLE POLICIES
-- ============================================================

-- Only firm admins can view audit logs
CREATE POLICY "activity_logs_select_admin"
  ON activity_logs FOR SELECT
  USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- Service role inserts logs
CREATE POLICY "activity_logs_insert"
  ON activity_logs FOR INSERT
  WITH CHECK (firm_id = public.firm_id());

-- ============================================================
-- messages TABLE POLICIES
-- ============================================================

CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    firm_id = public.firm_id()
    AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  WITH CHECK (
    firm_id = public.firm_id()
    AND sender_id = auth.uid()
  );

CREATE POLICY "messages_update_recipient"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid());
