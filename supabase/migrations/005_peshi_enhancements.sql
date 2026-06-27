-- ============================================================
-- Migration: 005_peshi_enhancements
-- Adds hearing_status and bench to the hearings table
-- ============================================================

-- Alter hearings table to add new columns
ALTER TABLE hearings
ADD COLUMN IF NOT EXISTS hearing_status TEXT NOT NULL DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS bench TEXT;

-- Create an index for hearing_status for quicker filtering
CREATE INDEX IF NOT EXISTS idx_hearings_status ON hearings(hearing_status);
