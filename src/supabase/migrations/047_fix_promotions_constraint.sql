-- ============================================
-- MIGRATION: Fix promotions table constraint
-- ============================================
-- Purpose: Remove the problematic expires_at constraint
-- Issue: The constraint "promotions_expires_at_future" checks expires_at > created_at,
--        but this can fail due to timing issues and is too restrictive.
-- Solution: Remove the constraint since we validate expires_at > NOW() in application logic
-- ============================================

-- Drop the problematic constraint
ALTER TABLE public.promotions
DROP CONSTRAINT IF EXISTS promotions_expires_at_future;

-- Add comment explaining why we don't have this constraint
COMMENT ON COLUMN public.promotions.expires_at IS 
  'Expiration date/time for the promotion code. Validated in application logic (expires_at > NOW()) rather than via database constraint to avoid timing issues.';
