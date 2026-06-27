-- ============================================================
-- Migration: 006_calendar_enhancements
-- Adds recurrence_rule to the hearings table
-- ============================================================

ALTER TABLE hearings
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
