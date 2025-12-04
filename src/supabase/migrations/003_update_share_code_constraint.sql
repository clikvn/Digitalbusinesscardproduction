-- ============================================
-- Migration: Update share_code constraint to allow 6-8 characters
-- ============================================
-- This migration updates the valid_share_code constraint on user_share_groups
-- to allow share codes between 6-8 characters instead of exactly 6.
--
-- Author: Migration 003
-- Date: 2024
-- ============================================

BEGIN;

-- ============================================
-- DROP OLD CONSTRAINT
-- ============================================

ALTER TABLE user_share_groups 
DROP CONSTRAINT IF EXISTS valid_share_code;

RAISE NOTICE 'Dropped old valid_share_code constraint';

-- ============================================
-- ADD NEW CONSTRAINT
-- ============================================

-- New constraint: Must be 6-8 alphanumeric uppercase characters
ALTER TABLE user_share_groups
ADD CONSTRAINT valid_share_code 
  CHECK (share_code ~ '^[A-Z0-9]{6,8}$');

RAISE NOTICE 'Added new valid_share_code constraint (6-8 characters)';

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  -- Verify constraint exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'valid_share_code'
    AND conrelid = 'user_share_groups'::regclass
  ) THEN
    RAISE EXCEPTION 'Constraint valid_share_code was not created!';
  END IF;
  
  RAISE NOTICE '✅ Migration completed successfully';
  RAISE NOTICE 'Share codes now accept 6-8 uppercase alphanumeric characters';
END $$;

COMMIT;
