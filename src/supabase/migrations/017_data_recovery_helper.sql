-- ============================================
-- Data Recovery Helper Script
-- ============================================
-- Purpose: Help identify and recover from data overwrite bug
-- Date: 2025-11-28
--
-- ISSUE: Business card data was being overwritten with "Christine Nguyen" 
--        demo data on page refresh/logout
--
-- This script helps you:
-- 1. Check if your data was affected
-- 2. View what data is currently stored
-- 3. Prepare for manual recovery if needed
-- ============================================

-- ============================================
-- STEP 1: Check if You Were Affected
-- ============================================
-- This query checks if your business card has Christine Nguyen's demo data

SELECT 
  user_code,
  name,
  email,
  title,
  company_name,
  CASE 
    WHEN name = 'Christine Nguyen' THEN '⚠️ AFFECTED - Demo data detected'
    ELSE '✅ OK - Your data is intact'
  END AS status,
  created_at,
  updated_at
FROM business_cards
WHERE user_id = auth.uid();

-- If status shows "AFFECTED", your data was overwritten
-- If status shows "OK", you're good!

-- ============================================
-- STEP 2: List All Affected Accounts
-- ============================================
-- (For admin use) Shows all accounts with Christine Nguyen data

SELECT 
  user_code,
  user_id,
  email,
  updated_at,
  created_at,
  updated_at - created_at AS account_age
FROM business_cards
WHERE name = 'Christine Nguyen'
  AND email = 'christine@spaceandstyle.co'
ORDER BY updated_at DESC;

-- Accounts where updated_at is very close to created_at are likely NEW accounts (OK)
-- Accounts where updated_at is much later are likely OVERWRITTEN (AFFECTED)

-- ============================================
-- STEP 3: Check Update History (if available)
-- ============================================
-- Note: This only works if you have audit logging enabled

-- If you have a history/audit table, you can query it like:
-- SELECT * FROM business_cards_history 
-- WHERE user_code = 'YOUR_USER_CODE' 
-- ORDER BY updated_at DESC;

-- ============================================
-- STEP 4: Manual Data Update Template
-- ============================================
-- Use this template to restore your data manually

-- First, verify your user_code:
SELECT user_code FROM business_cards WHERE user_id = auth.uid();

-- Then update with your actual data:
-- IMPORTANT: Replace ALL the placeholder values with your actual data!

/*
UPDATE business_cards
SET 
  name = 'Your Actual Name',              -- Replace this!
  email = 'your.email@example.com',       -- Replace this!
  phone = '+1234567890',                  -- Replace this!
  title = 'Your Job Title',               -- Replace this!
  company_name = 'Your Company Name',     -- Replace this!
  bio = 'Your actual bio text...',        -- Replace this!
  avatar_url = NULL,                      -- Or your avatar URL
  background_image_url = NULL,            -- Or your background URL
  linkedin_url = NULL,                    -- Or your LinkedIn URL
  twitter_url = NULL,                     -- Or your Twitter URL
  instagram_url = NULL,                   -- Or your Instagram URL
  facebook_url = NULL,                    -- Or your Facebook URL
  website_url = NULL,                     -- Or your website URL
  updated_at = NOW()
WHERE user_id = auth.uid()
  AND user_code = 'YOUR_USER_CODE';       -- Replace with your actual user_code!
*/

-- Verify the update:
-- SELECT * FROM business_cards WHERE user_id = auth.uid();

-- ============================================
-- STEP 5: Check Point-in-Time Recovery Options
-- ============================================
-- Supabase Pro/Team plans have point-in-time recovery
-- You can restore to a point before the overwrite happened

-- To use PITR:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Database > Backups
-- 3. Select a restore point BEFORE the bug occurred
-- 4. Restore to a new database or specific tables
-- 5. Compare and copy your correct data

-- ============================================
-- STEP 6: Prevention Check
-- ============================================
-- Verify the fix is in place by checking recent updates

SELECT 
  user_code,
  name,
  email,
  updated_at,
  updated_at > NOW() - INTERVAL '1 hour' AS recently_modified
FROM business_cards
WHERE user_id = auth.uid();

-- If recently_modified is TRUE and name is still YOUR name:
-- ✅ Fix is working! Auto-save is not overwriting your data

-- If recently_modified is TRUE and name is "Christine Nguyen":
-- ❌ Bug may still be active - check the code fixes!

-- ============================================
-- STEP 7: Monitor for Future Issues
-- ============================================
-- Set up a monitoring query to track unexpected changes

-- Run this periodically or set up as a scheduled function:
SELECT 
  user_code,
  name,
  email,
  updated_at,
  LAG(updated_at) OVER (PARTITION BY user_code ORDER BY updated_at) AS previous_update,
  updated_at - LAG(updated_at) OVER (PARTITION BY user_code ORDER BY updated_at) AS time_since_last_update
FROM business_cards
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 10;

-- Look for:
-- - Multiple updates within seconds (could indicate auto-save loop)
-- - Name changing to "Christine Nguyen" (would indicate bug recurrence)

-- ============================================
-- NOTES
-- ============================================
-- 1. The bug has been fixed in the application code
-- 2. This script helps identify and recover from past damage
-- 3. No automatic recovery - data must be restored manually or via PITR
-- 4. Going forward, the fix prevents this from happening again
-- 5. If you see Christine Nguyen data, it was overwritten - restore manually

-- ============================================
-- SUPPORT
-- ============================================
-- If you need help:
-- 1. Document your current data state (run STEP 1 query)
-- 2. Check if you have backups or PITR available
-- 3. Review the fix documentation: /CRITICAL_FIX_DATA_OVERWRITE.md
-- 4. Test the fix with: /VERIFY_FIX.md

-- ============================================
-- SUCCESS INDICATORS
-- ============================================
-- You'll know the fix is working when:
-- ✅ Page refreshes don't change your data
-- ✅ No "Saved to cloud" toast on page load
-- ✅ Your actual name stays in the database
-- ✅ updated_at only changes when you make actual edits
