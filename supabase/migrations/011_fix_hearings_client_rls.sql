-- ============================================================
-- Migration: 011_fix_hearings_client_rls
-- Fixes client RLS select policy to allow viewing hearings
-- that are linked to the client's cases.
-- ============================================================

DROP POLICY IF EXISTS "hearings_select_client" ON hearings;

CREATE POLICY "hearings_select_client"
  ON hearings FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
    OR
    case_id IN (
      SELECT id FROM cases 
      WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
    )
  );
