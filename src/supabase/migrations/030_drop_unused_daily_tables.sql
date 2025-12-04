-- ============================================
-- MIGRATION 030: Drop Unused Daily Analytics Tables
-- ============================================
-- Problem: 
-- - Created 5 daily ETL tables (migration 004 & 005)
-- - Set up cron job to populate them daily at 2 AM
-- - Application uses real-time views instead
-- - Only 0 out of 5 daily tables are actually queried!
--
-- Solution: Drop unused tables to save storage and reduce complexity
--
-- IMPORTANT: This migration drops tables that are populated but never used.
-- If you want to use daily tables in the future, DO NOT run this migration.
-- ============================================

-- ============================================
-- PART 1: Drop Unused Daily Tables
-- ============================================

-- Drop unused daily aggregation tables
DROP TABLE IF EXISTS analytics_daily_user_stats CASCADE;
DROP TABLE IF EXISTS analytics_daily_group_stats CASCADE;
DROP TABLE IF EXISTS analytics_daily_click_targets CASCADE;
DROP TABLE IF EXISTS analytics_daily_page_stats CASCADE;

-- ⚠️ ALSO DROP analytics_daily_contact_stats 
-- Reason: Table created in migration 005, but:
-- - api.analytics.getEngagedContactsCount() is DEFINED but NEVER CALLED
-- - No component uses this function
-- - Table is being populated but never queried
-- - If needed in future, can be recreated from raw events
DROP TABLE IF EXISTS analytics_daily_contact_stats CASCADE;

-- ============================================
-- PART 2: Drop Unused ETL Functions
-- ============================================

-- Drop the original daily aggregation function (migration 004)
-- This function populates tables we just dropped
DROP FUNCTION IF EXISTS aggregate_analytics_daily(DATE);
DROP FUNCTION IF EXISTS aggregate_analytics_daily();

-- Drop the extended function with contact stats (migration 005)
-- This function is only called by api.analytics.aggregateDaily() 
-- which is never used in the application
DROP FUNCTION IF EXISTS aggregate_analytics_daily_with_contacts(DATE);
DROP FUNCTION IF EXISTS aggregate_analytics_daily_with_contacts();

-- Drop backfill helper function
DROP FUNCTION IF EXISTS backfill_aggregates(DATE, DATE);

-- ============================================
-- PART 3: Unschedule Cron Job
-- ============================================

-- Unschedule the daily aggregation cron job
DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule the job if it exists
    PERFORM cron.unschedule('aggregate-analytics-daily');
    RAISE NOTICE 'Successfully unscheduled aggregate-analytics-daily cron job';
  ELSE
    RAISE NOTICE 'pg_cron extension not available, no cron job to unschedule';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not unschedule cron job: %', SQLERRM;
END $$;

-- ============================================
-- PART 4: What Remains (What We Actually Use)
-- ============================================

-- ✅ STILL IN USE - Real-time views (queried by app)
-- - v_realtime_user_stats
-- - v_realtime_group_stats
-- - v_realtime_daily_stats
-- - v_realtime_click_targets (unused but lightweight view)
-- - v_realtime_page_stats (unused but lightweight view)

-- ✅ STILL IN USE - Raw event tables (source of truth)
-- - analytics_sessions
-- - analytics_page_views
-- - analytics_clicks

-- ✅ STILL IN USE - Supporting tables
-- - user_share_groups
-- - share_contacts
-- - etc.

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables are dropped
-- Run after migration to confirm:

-- Should return 0 rows
-- SELECT tablename FROM pg_tables 
-- WHERE tablename LIKE 'analytics_daily_%' 
-- AND schemaname = 'public';

-- Should still exist (3 tables)
-- SELECT tablename FROM pg_tables 
-- WHERE tablename IN ('analytics_sessions', 'analytics_page_views', 'analytics_clicks')
-- AND schemaname = 'public';

-- Should still exist (5 views)
-- SELECT viewname FROM pg_views 
-- WHERE viewname LIKE 'v_realtime_%' 
-- AND schemaname = 'public';

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- If you need to rollback this migration, you need to:
-- 1. Re-run migration 004_analytics_scalable_schema.sql (tables + functions)
-- 2. Re-run migration 005_analytics_contact_stats.sql (contact stats)
-- 3. Manually backfill data using backfill_aggregates() function
-- 
-- Note: Data is NOT lost! Raw events are still in analytics_page_views
-- and analytics_clicks tables, so you can regenerate daily aggregates.

COMMENT ON TABLE analytics_sessions IS 'Real-time analytics sessions table - source of truth for session data';
COMMENT ON TABLE analytics_page_views IS 'Real-time analytics page views - source of truth for view events';
COMMENT ON TABLE analytics_clicks IS 'Real-time analytics clicks - source of truth for click events';
