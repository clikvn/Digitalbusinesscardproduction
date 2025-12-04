-- ============================================
-- MIGRATION 023: Auto-Cleanup Raw Analytics Data
-- ============================================
-- Automatically deletes raw events older than 30 days
-- Runs weekly to save storage
-- Pre-aggregated data is kept FOREVER
-- ============================================

-- ============================================
-- Option 1: Manual Cleanup (Run When Needed)
-- ============================================
-- Uncomment to clean up now:
-- SELECT cleanup_old_raw_events(30); -- Keep last 30 days

-- ============================================
-- Option 2: Scheduled Cleanup (pg_cron)
-- ============================================
-- NOTE: pg_cron is NOT available on Supabase free plan!
-- You need to run cleanup manually or use GitHub Actions

-- IF you have pg_cron (paid plan), uncomment this:
/*
SELECT cron.schedule(
  'cleanup-old-analytics',
  '0 3 * * 0',  -- Every Sunday at 3 AM
  $$SELECT cleanup_old_raw_events(30)$$
);
*/

-- ============================================
-- Option 3: GitHub Actions (Recommended for Free Plan)
-- ============================================
-- Create: .github/workflows/analytics-cleanup.yml
-- See: /ANALYTICS_CLEANUP_GITHUB_ACTION.yml

-- ============================================
-- Verify Cleanup Function Exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_raw_events'
  ) THEN
    RAISE NOTICE 'WARNING: cleanup_old_raw_events() function not found!';
    RAISE NOTICE 'You need to apply migration 004 first.';
  ELSE
    RAISE NOTICE '✅ Cleanup function exists and ready to use.';
  END IF;
END $$;

-- ============================================
-- How to Use (Manual)
-- ============================================
-- Keep last 7 days:
-- SELECT cleanup_old_raw_events(7);

-- Keep last 30 days:
-- SELECT cleanup_old_raw_events(30);

-- Keep last 90 days (default):
-- SELECT cleanup_old_raw_events(90);

-- ============================================
-- Check What Will Be Deleted (Before Running)
-- ============================================
-- Uncomment to see how much data will be deleted:
/*
SELECT 
  'analytics_sessions' as table_name,
  COUNT(*) as rows_to_delete,
  pg_size_pretty(pg_total_relation_size('analytics_sessions')) as current_size
FROM analytics_sessions 
WHERE first_seen < NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'analytics_page_views',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('analytics_page_views'))
FROM analytics_page_views 
WHERE viewed_at < NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'analytics_clicks',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('analytics_clicks'))
FROM analytics_clicks 
WHERE clicked_at < NOW() - INTERVAL '30 days';
*/

-- ============================================
-- IMPORTANT: What Gets Deleted vs Kept
-- ============================================
-- DELETED (to save storage):
-- • Raw session events older than X days
-- • Raw page view events older than X days
-- • Raw click events older than X days
--
-- KEPT FOREVER:
-- • analytics_daily_user_stats (daily summaries)
-- • analytics_daily_group_stats (daily summaries)
-- • analytics_daily_click_targets (daily summaries)
-- • analytics_daily_page_stats (daily summaries)
--
-- You still have historical data, just summarized!
-- ============================================
