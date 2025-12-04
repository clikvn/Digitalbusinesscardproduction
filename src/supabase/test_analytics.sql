-- ============================================
-- ANALYTICS DIAGNOSTIC & TEST SCRIPT
-- ============================================
-- Run this script to diagnose analytics issues
-- Copy/paste into Supabase SQL Editor
-- ============================================

-- ================================================
-- PART 1: DIAGNOSTIC CHECKS
-- ================================================

-- 1. Check if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ingest_analytics_batch') THEN
    RAISE NOTICE '✅ Function ingest_analytics_batch exists';
  ELSE
    RAISE NOTICE '❌ Function ingest_analytics_batch NOT FOUND - Run migration 020';
    RAISE EXCEPTION 'Function not found';
  END IF;
END $$;

-- 2. Check if SECURITY DEFINER is set
DO $$
DECLARE
  is_security_definer BOOLEAN;
BEGIN
  SELECT prosecdef INTO is_security_definer
  FROM pg_proc 
  WHERE proname = 'ingest_analytics_batch';
  
  IF is_security_definer THEN
    RAISE NOTICE '✅ Function has SECURITY DEFINER (bypasses RLS)';
  ELSE
    RAISE NOTICE '❌ Function missing SECURITY DEFINER - Run migration 020';
    RAISE EXCEPTION 'SECURITY DEFINER not set';
  END IF;
END $$;

-- 3. Check permissions
DO $$
DECLARE
  anon_granted BOOLEAN;
  auth_granted BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'ingest_analytics_batch' 
      AND grantee = 'anon'
  ) INTO anon_granted;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_name = 'ingest_analytics_batch' 
      AND grantee = 'authenticated'
  ) INTO auth_granted;
  
  IF anon_granted THEN
    RAISE NOTICE '✅ Permission granted to anon (guest users)';
  ELSE
    RAISE NOTICE '❌ Permission NOT granted to anon - Run migration 021';
    RAISE EXCEPTION 'Missing permission for anon';
  END IF;
  
  IF auth_granted THEN
    RAISE NOTICE '✅ Permission granted to authenticated users';
  ELSE
    RAISE NOTICE '⚠️  Permission NOT granted to authenticated';
  END IF;
END $$;

-- 4. Check if analytics tables exist
DO $$
DECLARE
  sessions_exists BOOLEAN;
  page_views_exists BOOLEAN;
  clicks_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'analytics_sessions'
  ) INTO sessions_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'analytics_page_views'
  ) INTO page_views_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'analytics_clicks'
  ) INTO clicks_exists;
  
  IF sessions_exists AND page_views_exists AND clicks_exists THEN
    RAISE NOTICE '✅ All analytics tables exist';
  ELSE
    IF NOT sessions_exists THEN
      RAISE NOTICE '❌ Table analytics_sessions NOT FOUND - Run migration 004';
    END IF;
    IF NOT page_views_exists THEN
      RAISE NOTICE '❌ Table analytics_page_views NOT FOUND - Run migration 004';
    END IF;
    IF NOT clicks_exists THEN
      RAISE NOTICE '❌ Table analytics_clicks NOT FOUND - Run migration 004';
    END IF;
    RAISE EXCEPTION 'Missing analytics tables';
  END IF;
END $$;

-- ================================================
-- PART 2: TEST FUNCTION WITH SAMPLE DATA
-- ================================================

-- Clean up any previous test data
DELETE FROM analytics_clicks WHERE session_id = 'test_session_001';
DELETE FROM analytics_page_views WHERE session_id = 'test_session_001';
DELETE FROM analytics_sessions WHERE session_id = 'test_session_001';

-- Test the function with your actual user code
-- Replace 'UHAN98' with your user code if different
SELECT ingest_analytics_batch('[
  {
    "type": "session",
    "data": {
      "sessionId": "test_session_001",
      "userCode": "UHAN98",
      "shareCode": "123AAA",
      "contactId": null,
      "timestamp": 1764740621184,
      "userAgent": "Test Browser",
      "referrer": "https://test.com"
    },
    "timestamp": 1764740621184
  },
  {
    "type": "page_view",
    "data": {
      "sessionId": "test_session_001",
      "userCode": "UHAN98",
      "shareCode": "123AAA",
      "contactId": null,
      "pageType": "home",
      "timestamp": 1764740621185
    },
    "timestamp": 1764740621185
  },
  {
    "type": "click",
    "data": {
      "sessionId": "test_session_001",
      "userCode": "UHAN98",
      "shareCode": "123AAA",
      "contactId": null,
      "clickTarget": "contact.phone",
      "clickCategory": "contact",
      "timestamp": 1764740621186
    },
    "timestamp": 1764740621186
  }
]'::jsonb) AS result;

-- Expected result:
-- {
--   "success": true,
--   "processed": 3,
--   "sessions_inserted": 1,
--   "page_views_inserted": 1,
--   "clicks_inserted": 1
-- }

-- ================================================
-- PART 3: VERIFY DATA WAS INSERTED
-- ================================================

-- Check if session was created
SELECT 
  'analytics_sessions' as table_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ Data inserted' ELSE '❌ No data' END as status,
  COUNT(*) as row_count
FROM analytics_sessions
WHERE session_id = 'test_session_001';

-- Check if page view was created
SELECT 
  'analytics_page_views' as table_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ Data inserted' ELSE '❌ No data' END as status,
  COUNT(*) as row_count
FROM analytics_page_views
WHERE session_id = 'test_session_001';

-- Check if click was created
SELECT 
  'analytics_clicks' as table_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ Data inserted' ELSE '❌ No data' END as status,
  COUNT(*) as row_count
FROM analytics_clicks
WHERE session_id = 'test_session_001';

-- Show the actual data
SELECT 'SESSION:' as data_type, * FROM analytics_sessions WHERE session_id = 'test_session_001'
UNION ALL
SELECT 'PAGE_VIEW:', pv.* FROM analytics_page_views pv WHERE session_id = 'test_session_001'
UNION ALL
SELECT 'CLICK:', c.* FROM analytics_clicks c WHERE session_id = 'test_session_001';

-- ================================================
-- PART 4: CHECK FOR REAL DATA FROM YOUR APP
-- ================================================

-- Check if ANY data exists for your user code
SELECT 
  'Total Sessions' as metric,
  COUNT(*)::text as value
FROM analytics_sessions
WHERE user_code = 'UHAN98'

UNION ALL

SELECT 
  'Total Page Views' as metric,
  COUNT(*)::text as value
FROM analytics_page_views
WHERE user_code = 'UHAN98'

UNION ALL

SELECT 
  'Total Clicks' as metric,
  COUNT(*)::text as value
FROM analytics_clicks
WHERE user_code = 'UHAN98';

-- Show most recent sessions
SELECT 
  session_id,
  user_code,
  share_code,
  first_seen,
  page_views,
  clicks
FROM analytics_sessions
WHERE user_code = 'UHAN98'
ORDER BY first_seen DESC;

-- ================================================
-- PART 5: CLEANUP TEST DATA (Optional)
-- ================================================

-- Uncomment to clean up test data:
-- DELETE FROM analytics_clicks WHERE session_id = 'test_session_001';
-- DELETE FROM analytics_page_views WHERE session_id = 'test_session_001';
-- DELETE FROM analytics_sessions WHERE session_id = 'test_session_001';