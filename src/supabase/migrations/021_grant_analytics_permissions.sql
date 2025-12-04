-- ============================================
-- MIGRATION 021: Grant Analytics Permissions
-- ============================================
-- Ensures anonymous users can call the analytics RPC function
-- This is critical for guest tracking to work
-- ============================================

-- CRITICAL: Grant execute permission to anonymous and authenticated users
-- This allows guests to track their visits without logging in
GRANT EXECUTE ON FUNCTION ingest_analytics_batch(jsonb) TO anon, authenticated;

-- Verify the grant worked
DO $$
DECLARE
  anon_granted BOOLEAN;
  auth_granted BOOLEAN;
BEGIN
  -- Check if anon has permission
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.routine_privileges 
    WHERE routine_name = 'ingest_analytics_batch' 
      AND grantee = 'anon'
      AND privilege_type = 'EXECUTE'
  ) INTO anon_granted;

  -- Check if authenticated has permission
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.routine_privileges 
    WHERE routine_name = 'ingest_analytics_batch' 
      AND grantee = 'authenticated'
      AND privilege_type = 'EXECUTE'
  ) INTO auth_granted;

  -- Report results
  IF anon_granted AND auth_granted THEN
    RAISE NOTICE '✅ Analytics permissions granted successfully';
    RAISE NOTICE '   - anon: EXECUTE permission granted';
    RAISE NOTICE '   - authenticated: EXECUTE permission granted';
  ELSE
    IF NOT anon_granted THEN
      RAISE WARNING '❌ anon role missing EXECUTE permission';
    END IF;
    IF NOT auth_granted THEN
      RAISE WARNING '❌ authenticated role missing EXECUTE permission';
    END IF;
  END IF;
END $$;

-- OPTIONAL: Grant on the aggregate function if it exists (used by cron)
-- This is SAFE - it only grants if your function exists
-- It won't create any new functions or modify existing ones
DO $$
BEGIN
  -- Check which aggregate function you have and grant permission
  -- (Different projects may have different function names)
  
  -- Option A: Standard version (most common)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'aggregate_analytics_daily') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION aggregate_analytics_daily(date) TO postgres, authenticated';
    RAISE NOTICE '✅ Granted permission on aggregate_analytics_daily';
  END IF;
  
  -- Option B: Extended version with contact support (newer projects)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'aggregate_analytics_daily_with_contacts') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION aggregate_analytics_daily_with_contacts(date) TO postgres, authenticated';
    RAISE NOTICE '✅ Granted permission on aggregate_analytics_daily_with_contacts';
  END IF;
  
  -- If neither exists, that's fine - the cron job may not be set up yet
END $$;

COMMENT ON FUNCTION ingest_analytics_batch IS 
  'Public analytics ingestion endpoint. Accessible by anonymous users for guest tracking. Uses SECURITY DEFINER to bypass RLS.';