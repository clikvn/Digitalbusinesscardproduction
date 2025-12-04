-- ============================================
-- DIAGNOSTIC: Check share_contacts table status
-- ============================================
-- Run this to see what's actually in your database
-- ============================================

-- 1. Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'share_contacts'
    ) THEN 'YES - Table exists'
    ELSE 'NO - Table does NOT exist'
  END AS table_exists;

-- 2. List all columns in share_contacts (if table exists)
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'share_contacts'
ORDER BY ordinal_position;

-- 3. Check all constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.share_contacts'::regclass;

-- 4. Check all indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'share_contacts'
  AND schemaname = 'public';

-- 5. Check RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'share_contacts'
  AND schemaname = 'public';

-- 6. Count rows
SELECT COUNT(*) AS row_count
FROM share_contacts;

-- 7. Check sample data (if any)
SELECT *
FROM share_contacts
LIMIT 5;

-- ============================================
-- EXPECTED OUTPUT
-- ============================================
-- If table is properly configured, you should see:
-- 
-- table_exists: 'YES - Table exists'
-- 
-- Columns (12 total):
-- - id (uuid)
-- - user_id (uuid)
-- - user_code (text)
-- - contact_name (text)
-- - contact_email (text)
-- - contact_phone (text)
-- - contact_company (text)
-- - notes (text)
-- - share_code (text)
-- - contact_code (text)
-- - created_at (timestamp with time zone)
-- - updated_at (timestamp with time zone)
