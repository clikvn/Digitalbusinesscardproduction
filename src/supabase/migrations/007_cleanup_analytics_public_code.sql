-- ============================================
-- CLEANUP INVALID "public" SHARE CODES IN ANALYTICS
-- ============================================
-- PROBLEM: analytics_sessions, analytics_page_views, and analytics_clicks tables 
--          have rows with share_code = "public"
-- This happened when tracking used hardcoded fallback instead of database lookup
-- SOLUTION: Update these rows to use the actual public group's share_code
-- 
-- IMPORTANT: The view v_realtime_page_stats joins analytics_page_views with 
--            analytics_sessions and uses share_code from SESSIONS table!
--            So we must update analytics_sessions first!

-- Step 1: Create a helper function to get the actual public share code for a user
CREATE OR REPLACE FUNCTION get_user_public_share_code(p_user_code TEXT)
RETURNS TEXT AS $$
DECLARE
  v_share_code TEXT;
BEGIN
  -- Query for the public group's share code
  SELECT share_code INTO v_share_code
  FROM user_share_groups
  WHERE user_code = p_user_code
    AND label = 'Public'  -- Match by label (IDs are UUID-based)
  LIMIT 1;
  
  RETURN v_share_code;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update analytics_sessions table FIRST
-- This is critical because v_realtime_page_stats uses share_code from sessions!
DO $$
DECLARE
  v_user RECORD;
  v_actual_share_code TEXT;
  v_rows_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '=== UPDATING analytics_sessions ===';
  
  FOR v_user IN 
    SELECT DISTINCT user_code 
    FROM analytics_sessions 
    WHERE share_code = 'public'
  LOOP
    -- Get their actual public share code
    v_actual_share_code := get_user_public_share_code(v_user.user_code);
    
    IF v_actual_share_code IS NOT NULL THEN
      -- Update the invalid entries
      UPDATE analytics_sessions
      SET share_code = v_actual_share_code
      WHERE user_code = v_user.user_code
        AND share_code = 'public';
      
      GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
      
      RAISE NOTICE 'Updated % sessions for user_code: % (public -> %)', 
        v_rows_updated, v_user.user_code, v_actual_share_code;
    ELSE
      RAISE WARNING 'Could not find public share code for user_code: %', v_user.user_code;
    END IF;
  END LOOP;
END $$;

-- Step 3: Update analytics_page_views table
DO $$
DECLARE
  v_user RECORD;
  v_actual_share_code TEXT;
  v_rows_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '=== UPDATING analytics_page_views ===';
  
  FOR v_user IN 
    SELECT DISTINCT user_code 
    FROM analytics_page_views 
    WHERE share_code = 'public'
  LOOP
    -- Get their actual public share code
    v_actual_share_code := get_user_public_share_code(v_user.user_code);
    
    IF v_actual_share_code IS NOT NULL THEN
      -- Update the invalid entries
      UPDATE analytics_page_views
      SET share_code = v_actual_share_code
      WHERE user_code = v_user.user_code
        AND share_code = 'public';
      
      GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
      
      RAISE NOTICE 'Updated % page_views for user_code: % (public -> %)', 
        v_rows_updated, v_user.user_code, v_actual_share_code;
    ELSE
      RAISE WARNING 'Could not find public share code for user_code: %', v_user.user_code;
    END IF;
  END LOOP;
END $$;

-- Step 4: Update analytics_clicks table
DO $$
DECLARE
  v_user RECORD;
  v_actual_share_code TEXT;
  v_rows_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '=== UPDATING analytics_clicks ===';
  
  FOR v_user IN 
    SELECT DISTINCT user_code 
    FROM analytics_clicks 
    WHERE share_code = 'public'
  LOOP
    -- Get their actual public share code
    v_actual_share_code := get_user_public_share_code(v_user.user_code);
    
    IF v_actual_share_code IS NOT NULL THEN
      -- Update the invalid entries
      UPDATE analytics_clicks
      SET share_code = v_actual_share_code
      WHERE user_code = v_user.user_code
        AND share_code = 'public';
      
      GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
      
      RAISE NOTICE 'Updated % clicks for user_code: % (public -> %)', 
        v_rows_updated, v_user.user_code, v_actual_share_code;
    ELSE
      RAISE WARNING 'Could not find public share code for user_code: %', v_user.user_code;
    END IF;
  END LOOP;
END $$;

-- Step 5: Verify cleanup
DO $$
DECLARE
  v_sessions_count INTEGER;
  v_page_views_count INTEGER;
  v_clicks_count INTEGER;
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
  
  -- Count remaining "public" entries
  SELECT COUNT(*) INTO v_sessions_count
  FROM analytics_sessions
  WHERE share_code = 'public';
  
  SELECT COUNT(*) INTO v_page_views_count
  FROM analytics_page_views
  WHERE share_code = 'public';
  
  SELECT COUNT(*) INTO v_clicks_count
  FROM analytics_clicks
  WHERE share_code = 'public';
  
  RAISE NOTICE 'Remaining "public" entries:';
  RAISE NOTICE '  - analytics_sessions: %', v_sessions_count;
  RAISE NOTICE '  - analytics_page_views: %', v_page_views_count;
  RAISE NOTICE '  - analytics_clicks: %', v_clicks_count;
  
  IF v_sessions_count = 0 AND v_page_views_count = 0 AND v_clicks_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All invalid "public" share codes have been cleaned up!';
  ELSE
    RAISE WARNING '⚠️ WARNING: Still found invalid "public" entries in one or more tables';
  END IF;
END $$;