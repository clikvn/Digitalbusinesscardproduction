-- ============================================
-- REMOVE PHONE FORMAT CONSTRAINT (RECOMMENDED)
-- ============================================
-- The phone_format constraint is causing issues.
-- Since this is a business card app, users should be able to 
-- enter phone numbers in any format they prefer.

-- Simply remove the constraint
ALTER TABLE business_cards 
DROP CONSTRAINT IF EXISTS phone_format;

-- Done! Phone field now accepts any value (including NULL and empty strings)

-- Verify
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'business_cards'::regclass
  AND conname = 'phone_format';
-- Should return 0 rows if constraint was successfully removed

-- Test insert (should work now)
-- INSERT INTO business_cards (user_id, user_code, name, phone)
-- VALUES ('test-user-id', 'testcode', 'Test User', '123')
-- ON CONFLICT (user_code) DO NOTHING;
