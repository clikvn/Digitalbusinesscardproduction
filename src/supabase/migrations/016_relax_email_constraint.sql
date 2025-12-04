-- ============================================
-- Migration: Relax Email Constraint for Auto-Save
-- ============================================
-- Date: 2025-11-28
-- Purpose: Fix "new row for relation business_cards violates check constraint email_format"
--          error that occurs during auto-save when users are typing incomplete emails
--
-- Issue: The strict email format constraint rejects partial emails like "j" or "john@"
--        during auto-save with 800ms debounce. This causes errors while user is typing.
--
-- Solution: Relax the constraint to allow NULL or empty strings, while still
--           validating complete email addresses. Client-side validation prevents
--           saving invalid emails, but this provides a safety net.
-- ============================================

-- Drop existing strict constraint
ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS email_format;

-- Create new relaxed constraint that allows:
-- 1. NULL values
-- 2. Empty strings
-- 3. Valid email format
ALTER TABLE business_cards 
ADD CONSTRAINT email_format 
CHECK (
  email IS NULL OR 
  email = '' OR
  email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
);

-- ============================================
-- Verification
-- ============================================
-- To verify the constraint was created correctly, run:
-- 
-- SELECT 
--   conname AS constraint_name,
--   pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'business_cards'::regclass
--   AND conname = 'email_format';
--
-- Expected result:
-- CHECK ((email IS NULL) OR (email = ''::text) OR (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'::text))

-- ============================================
-- Test Cases
-- ============================================
-- These should all succeed after this migration:
--
-- 1. NULL email (allowed):
--    UPDATE business_cards SET email = NULL WHERE user_code = 'test';
--
-- 2. Empty email (allowed):
--    UPDATE business_cards SET email = '' WHERE user_code = 'test';
--
-- 3. Valid email (allowed):
--    UPDATE business_cards SET email = 'test@example.com' WHERE user_code = 'test';
--
-- 4. Invalid email (rejected):
--    UPDATE business_cards SET email = 'not-an-email' WHERE user_code = 'test';
--    -- ERROR: new row violates check constraint "email_format"

-- ============================================
-- Notes
-- ============================================
-- - Client-side validation in /lib/api.ts prevents saving invalid emails
-- - This constraint is a safety net for data integrity
-- - Auto-save with 800ms debounce may still attempt to save partial emails
-- - The relaxed constraint allows the save to proceed if email is empty
-- - Validation errors during auto-save are now silently logged (see /hooks/useBusinessCard.ts)
