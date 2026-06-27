-- ============================================================
-- LexFlow - Law Firm Management System
-- Migration 009: Firm Website Fields
-- ============================================================

ALTER TABLE firms 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
