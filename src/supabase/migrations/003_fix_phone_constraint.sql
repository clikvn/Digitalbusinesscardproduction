-- ============================================
-- FIX PHONE FORMAT CONSTRAINT
-- ============================================
-- Issue: phone_format constraint is too strict
-- Solution: Remove it or make it very lenient
--
-- Run this migration to fix the error:
-- "new row for relation business_cards violates check constraint phone_format"

-- Drop the strict phone format constraint
ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS phone_format;

-- Add a lenient constraint (optional - can be removed entirely)
-- This allows NULL, empty string, or any phone-like string
ALTER TABLE business_cards 
ADD CONSTRAINT phone_format 
CHECK (
  phone IS NULL OR 
  phone = '' OR
  length(trim(phone)) >= 3  -- Very lenient - just needs 3+ characters
);

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ Phone constraint fixed!';
  RAISE NOTICE 'Phone field now accepts: NULL, empty string, or 3+ characters';
END $$;
