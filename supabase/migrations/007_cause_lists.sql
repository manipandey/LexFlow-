-- ============================================================
-- Migration: 007_cause_lists
-- Creates the public court_cause_lists table for scraping
-- ============================================================

CREATE TABLE court_cause_lists (
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

-- Indexes for faster searching
CREATE INDEX idx_cause_lists_date ON court_cause_lists(date);
CREATE INDEX idx_cause_lists_bench ON court_cause_lists(bench_type);
CREATE INDEX idx_cause_lists_case_number ON court_cause_lists USING gin(to_tsvector('english', case_number));
CREATE INDEX idx_cause_lists_party ON court_cause_lists USING gin(to_tsvector('english', party_name));
CREATE INDEX idx_cause_lists_advocate ON court_cause_lists USING gin(to_tsvector('english', advocate_name));

-- Allow anyone authenticated to read the public cause lists
ALTER TABLE court_cause_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cause lists"
  ON court_cause_lists
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update (via the scraper API)
-- We don't add policies for insert/update/delete for authenticated users,
-- meaning they are denied by default.
