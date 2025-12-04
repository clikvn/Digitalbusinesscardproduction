-- ============================================
-- FIX SHARE CODE CONSTRAINT (6-8 CHARACTERS)
-- ============================================
-- Date: 2025-11-28
-- Purpose: Allow share codes to be 6-8 characters instead of fixed at 6
--
-- ERROR FIXED:
-- "new row for relation user_share_groups violates check constraint valid_share_code"
--
-- BEFORE: Share code must be exactly 6 characters
-- AFTER: Share code can be 6, 7, or 8 characters
-- ============================================

-- ============================================
-- STEP 1: Drop Old Constraint
-- ============================================

-- Remove the strict 6-character-only constraint
ALTER TABLE user_share_groups 
DROP CONSTRAINT IF EXISTS valid_share_code;

-- Verify constraint was removed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'user_share_groups'::regclass 
      AND conname = 'valid_share_code'
  ) THEN
    RAISE EXCEPTION '❌ Failed to drop valid_share_code constraint';
  ELSE
    RAISE NOTICE '✅ Dropped old valid_share_code constraint';
  END IF;
END $$;

-- ============================================
-- STEP 2: Add New Flexible Constraint
-- ============================================

-- Add new constraint that allows 6-8 characters
ALTER TABLE user_share_groups 
ADD CONSTRAINT valid_share_code 
CHECK (share_code ~ '^[A-Z0-9]{6,8}$');

-- Verify new constraint was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'user_share_groups'::regclass 
      AND conname = 'valid_share_code'
  ) THEN
    RAISE NOTICE '✅ Added new valid_share_code constraint (6-8 characters)';
  ELSE
    RAISE EXCEPTION '❌ Failed to add valid_share_code constraint';
  END IF;
END $$;

-- ============================================
-- STEP 3: Test Valid Share Codes
-- ============================================

-- Test examples (should all pass validation):
-- - 'ABC123' (6 chars) ✅
-- - 'ABC1234' (7 chars) ✅
-- - 'ABC12345' (8 chars) ✅
-- 
-- Test invalid examples (should fail):
-- - 'ABC12' (5 chars) ❌
-- - 'ABC123456' (9 chars) ❌
-- - 'abc123' (lowercase) ❌
-- - 'ABC 123' (space) ❌
-- - 'ABC-123' (special char) ❌

-- ============================================
-- STEP 4: Show Constraint Details
-- ============================================

-- Display the new constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_share_groups'::regclass
  AND conname = 'valid_share_code';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all existing share codes comply with new constraint
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM user_share_groups
  WHERE share_code !~ '^[A-Z0-9]{6,8}$';
  
  IF invalid_count > 0 THEN
    RAISE WARNING '⚠️ Found % share codes that do not match new constraint', invalid_count;
    
    -- Show which ones are invalid
    RAISE WARNING 'Invalid share codes:';
    FOR rec IN (
      SELECT user_code, share_code, group_name
      FROM user_share_groups
      WHERE share_code !~ '^[A-Z0-9]{6,8}$'
      LIMIT 10
    )
    LOOP
      RAISE WARNING '  - %: "%" (group: %)', rec.user_code, rec.share_code, rec.group_name;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ All existing share codes comply with new constraint (6-8 characters)';
  END IF;
END $$;

-- ============================================
-- SUCCESS CRITERIA
-- ============================================
-- ✅ Old constraint (exactly 6 chars) removed
-- ✅ New constraint (6-8 chars) added
-- ✅ Share codes can now be 6, 7, or 8 characters
-- ✅ Still uppercase alphanumeric only (A-Z, 0-9)
-- ✅ UI validation matches database constraint

-- ============================================
-- CONSTRAINT DETAILS
-- ============================================
-- Pattern: ^[A-Z0-9]{6,8}$
-- 
-- Breakdown:
--   ^           - Start of string
--   [A-Z0-9]    - Uppercase letter or digit
--   {6,8}       - Between 6 and 8 characters
--   $           - End of string
--
-- Valid examples:
--   ✅ ABC123 (6)
--   ✅ ABC1234 (7)
--   ✅ ABC12345 (8)
--   ✅ ABCDEF (6)
--   ✅ A1B2C3 (6)
--   ✅ ZYXW987 (7)
--
-- Invalid examples:
--   ❌ ABC12 (only 5 chars)
--   ❌ ABC123456 (9 chars - too long)
--   ❌ abc123 (lowercase not allowed)
--   ❌ ABC-123 (special characters not allowed)
--   ❌ ABC 123 (spaces not allowed)

-- Migration complete! 🎉
