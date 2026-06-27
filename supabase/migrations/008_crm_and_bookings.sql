-- ============================================================
-- LexFlow - Law Firm Management System
-- Migration 008: CRM Leads and Consultations
-- ============================================================

CREATE TYPE lead_status AS ENUM (
  'new',
  'consultation_booked',
  'proposal_sent',
  'converted',
  'lost'
);

CREATE TYPE consultation_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

-- ============================================================
-- TABLE: crm_leads
-- Public inquiries from the firm's website
-- ============================================================

CREATE TABLE crm_leads (
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

CREATE INDEX idx_crm_leads_firm_id ON crm_leads(firm_id);
CREATE INDEX idx_crm_leads_status ON crm_leads(status);

-- ============================================================
-- TABLE: crm_consultations
-- Booked consultations linking a lead to a lawyer
-- ============================================================

CREATE TABLE crm_consultations (
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

CREATE INDEX idx_crm_consultations_firm_id ON crm_consultations(firm_id);
CREATE INDEX idx_crm_consultations_lawyer ON crm_consultations(lawyer_id);
CREATE INDEX idx_crm_consultations_date ON crm_consultations(consultation_date);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_consultations ENABLE ROW LEVEL SECURITY;

-- Leads: Authenticated firm members can view/manage their firm's leads
CREATE POLICY "Firm members can manage leads" ON crm_leads
  FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Leads: Anyone can INSERT a lead (Public Website Form)
CREATE POLICY "Public can insert leads" ON crm_leads
  FOR INSERT
  WITH CHECK (true);

-- Consultations: Firm members can view/manage their firm's consultations
CREATE POLICY "Firm members can manage consultations" ON crm_consultations
  FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Consultations: Anyone can INSERT a consultation (Public Website Form)
CREATE POLICY "Public can insert consultations" ON crm_consultations
  FOR INSERT
  WITH CHECK (true);
