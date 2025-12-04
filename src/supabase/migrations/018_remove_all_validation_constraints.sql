-- ============================================
-- REMOVE ALL EMAIL AND PHONE VALIDATION CONSTRAINTS
-- ============================================
-- Date: 2025-11-28
-- Purpose: Treat email and phone as plain text fields without database validation
--
-- RATIONALE:
-- 1. Auto-save with 800ms debounce saves incomplete data while user is typing
-- 2. Database constraints reject partial inputs like "j" or "john@" or "123"
-- 3. Client-side validation already handles format checking
-- 4. Business card app needs flexibility - users may have non-standard formats
-- 5. Better to have lenient storage + app-layer validation than strict DB constraints
--
-- IMPACT:
-- ✅ No more constraint errors during auto-save
-- ✅ Email and phone fields accept any text (including empty, partial, or custom formats)
-- ✅ Application layer still validates before final submission (if needed)
-- ✅ Users can save work-in-progress without errors
-- ============================================

-- ============================================
-- STEP 1: Remove Email Format Constraint
-- ============================================

-- Drop any email format constraints
ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS email_format;

ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS business_cards_email_check;

ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS check_email_format;

-- Verify email constraint removed
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'business_cards'::regclass
    AND conname LIKE '%email%';
  
  IF constraint_count > 0 THEN
    RAISE WARNING 'Email constraints still exist: %', constraint_count;
  ELSE
    RAISE NOTICE '✅ All email constraints removed successfully';
  END IF;
END $$;

-- ============================================
-- STEP 2: Remove Phone Format Constraint
-- ============================================

-- Drop any phone format constraints
ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS phone_format;

ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS business_cards_phone_check;

ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS check_phone_format;

-- Verify phone constraint removed
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'business_cards'::regclass
    AND conname LIKE '%phone%';
  
  IF constraint_count > 0 THEN
    RAISE WARNING 'Phone constraints still exist: %', constraint_count;
  ELSE
    RAISE NOTICE '✅ All phone constraints removed successfully';
  END IF;
END $$;

-- ============================================
-- STEP 3: List All Remaining Constraints
-- ============================================

-- Show all constraints on business_cards table for verification
DO $$
DECLARE
  rec RECORD;
  constraint_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Remaining Constraints on business_cards ===';
  
  FOR rec IN 
    SELECT 
      conname as constraint_name,
      CASE contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        ELSE contype::text
      END as constraint_type
    FROM pg_constraint
    WHERE conrelid = 'business_cards'::regclass
    ORDER BY contype, conname
  LOOP
    RAISE NOTICE '  - % (%)', rec.constraint_name, rec.constraint_type;
    constraint_count := constraint_count + 1;
  END LOOP;
  
  IF constraint_count = 0 THEN
    RAISE NOTICE 'No constraints found (this is unusual - should at least have PRIMARY KEY)';
  ELSE
    RAISE NOTICE 'Total constraints: %', constraint_count;
  END IF;
END $$;

-- ============================================
-- STEP 4: Test Plain Text Storage
-- ============================================

-- These examples should all work now (partial/incomplete values are OK)

-- Example test cases that should succeed:
COMMENT ON COLUMN business_cards.email IS 
  'Accepts any text: empty, partial (j, john@), complete (john@example.com), or custom formats';

COMMENT ON COLUMN business_cards.phone IS 
  'Accepts any text: empty, partial (1, 123), complete (+1-234-567-8900), or custom formats';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check email column definition
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_cards' 
  AND column_name = 'email';

-- Check phone column definition
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_cards' 
  AND column_name = 'phone';

-- ============================================
-- SUCCESS CRITERIA
-- ============================================
-- ✅ No email_format constraint exists
-- ✅ No phone_format constraint exists
-- ✅ Email field accepts any text value
-- ✅ Phone field accepts any text value
-- ✅ Auto-save works without constraint violations
-- ✅ Users can save incomplete data while typing

-- ============================================
-- NOTES
-- ============================================
-- 1. Email and phone are now plain TEXT fields with no validation
-- 2. Client-side validation in /lib/api.ts handles format checking
-- 3. Silent error handling in /hooks/useBusinessCard.ts prevents UI errors
-- 4. Database accepts any value - validation is application responsibility
-- 5. This is the recommended approach for business card apps with auto-save

-- Migration complete! 🎉
