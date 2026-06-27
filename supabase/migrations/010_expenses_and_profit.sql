-- ============================================================
-- LexFlow - Law Firm Management System
-- Migration 010: Expense Tracking
-- ============================================================

CREATE TYPE expense_category AS ENUM (
  'travel',
  'stamp_duty',
  'printing',
  'court_fee',
  'filing_fee',
  'photocopy',
  'miscellaneous'
);

-- ============================================================
-- TABLE: expenses
-- ============================================================

CREATE TABLE expenses (
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

CREATE INDEX idx_expenses_firm_id ON expenses(firm_id);
CREATE INDEX idx_expenses_case_id ON expenses(case_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage expenses for their firm" ON expenses
  FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );
