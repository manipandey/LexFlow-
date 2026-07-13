-- ============================================================================
-- LexFlow - Law Firm Management System
-- Production Update: Tables & RLS Policies for Cause Lists, CRM, Expenses & Client Portal
-- Copy and paste this script into your Supabase SQL Editor and click RUN
-- ============================================================================

-- ============================================================================
-- 0. HEARINGS COLUMNS (Migrations 005 & 006)
-- ============================================================================
ALTER TABLE hearings
ADD COLUMN IF NOT EXISTS hearing_status TEXT NOT NULL DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS bench TEXT,
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

CREATE INDEX IF NOT EXISTS idx_hearings_status ON hearings(hearing_status);

-- ============================================================================
-- 1. COURT CAUSE LISTS (Migration 007)
-- ============================================================================
CREATE TABLE IF NOT EXISTS court_cause_lists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            DATE NOT NULL,
  bench_type      TEXT NOT NULL, -- Civil, Criminal, Constitutional, Special
  judge_name      TEXT,
  case_number     TEXT NOT NULL,
  party_name      TEXT,
  advocate_name   TEXT,
  hearing_status  TEXT,
  courtroom       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cause_lists_date ON court_cause_lists(date);
CREATE INDEX IF NOT EXISTS idx_cause_lists_bench ON court_cause_lists(bench_type);
CREATE INDEX IF NOT EXISTS idx_cause_lists_case_number ON court_cause_lists USING gin(to_tsvector('english', case_number));
CREATE INDEX IF NOT EXISTS idx_cause_lists_party ON court_cause_lists USING gin(to_tsvector('english', party_name));
CREATE INDEX IF NOT EXISTS idx_cause_lists_advocate ON court_cause_lists USING gin(to_tsvector('english', advocate_name));

ALTER TABLE court_cause_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read cause lists" ON court_cause_lists;
CREATE POLICY "Anyone can read cause lists"
  ON court_cause_lists
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 2. CRM LEADS & CONSULTATIONS (Migration 008)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'new',
    'consultation_booked',
    'proposal_sent',
    'converted',
    'lost'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE consultation_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS crm_leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  legal_issue     TEXT,
  status          lead_status NOT NULL DEFAULT 'new',
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_firm_id ON crm_leads(firm_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);

CREATE TABLE IF NOT EXISTS crm_consultations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  lawyer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consultation_date DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME,
  status          consultation_status NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  is_paid         BOOLEAN NOT NULL DEFAULT FALSE,
  amount_paid     NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_consultations_firm_id ON crm_consultations(firm_id);
CREATE INDEX IF NOT EXISTS idx_crm_consultations_lawyer ON crm_consultations(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_crm_consultations_date ON crm_consultations(consultation_date);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Firm members can manage leads" ON crm_leads;
CREATE POLICY "Firm members can manage leads" ON crm_leads
  FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can insert leads" ON crm_leads;
CREATE POLICY "Public can insert leads" ON crm_leads
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Firm members can manage consultations" ON crm_consultations;
CREATE POLICY "Firm members can manage consultations" ON crm_consultations
  FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can insert consultations" ON crm_consultations;
CREATE POLICY "Public can insert consultations" ON crm_consultations
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 3. FIRM WEBSITE FIELDS (Migration 009)
-- ============================================================================
ALTER TABLE firms 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- ============================================================================
-- 4. EXPENSE TRACKING (Migration 010)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'travel',
    'stamp_duty',
    'printing',
    'court_fee',
    'filing_fee',
    'photocopy',
    'miscellaneous'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
  category        expense_category NOT NULL DEFAULT 'miscellaneous',
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'NPR',
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  description     TEXT,
  receipt_url     TEXT,
  logged_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_billable     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_firm_id ON expenses(firm_id);
CREATE INDEX IF NOT EXISTS idx_expenses_case_id ON expenses(case_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage expenses for their firm" ON expenses;
CREATE POLICY "Users can manage expenses for their firm" ON expenses
  FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 5. RLS POLICY FIX FOR CLIENT HEARINGS (Migration 011)
-- ============================================================================
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

-- Reload PostgREST schema cache to ensure the API recognizes the new tables immediately
NOTIFY pgrst, 'reload schema';
