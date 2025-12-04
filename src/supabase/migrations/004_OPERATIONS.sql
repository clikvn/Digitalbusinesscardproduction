-- ============================================
-- ANALYTICS OPERATIONS REFERENCE
-- ============================================
-- Quick reference for common analytics operations
-- Use these queries for testing and maintenance
-- ============================================

-- ============================================
-- TESTING & VERIFICATION
-- ============================================

-- Check if migration was applied successfully
SELECT 
  tablename, 
  schemaname
FROM pg_tables 
WHERE tablename LIKE 'analytics_%'
ORDER BY tablename;

-- Check all indexes were created
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename LIKE 'analytics_%'
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename LIKE 'analytics_%';

-- Check table sizes
SELECT * FROM analytics_table_sizes;

-- Check data volume
SELECT * FROM analytics_summary;

-- ============================================
-- MANUAL AGGREGATION
-- ============================================

-- Aggregate yesterday's data
SELECT aggregate_analytics_daily();

-- Aggregate specific date
SELECT aggregate_analytics_daily('2025-01-15'::DATE);

-- Aggregate last 7 days (backfill)
SELECT backfill_aggregates(
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE - INTERVAL '1 day'
);

-- Aggregate last 30 days (backfill)
SELECT backfill_aggregates(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day'
);

-- Get aggregation results as JSON
SELECT aggregate_analytics_daily()::JSON;

-- ============================================
-- DATA INSPECTION
-- ============================================

-- View recent sessions
SELECT 
  session_id,
  user_code,
  share_code,
  first_seen,
  page_views,
  clicks
FROM analytics_sessions
ORDER BY first_seen DESC
LIMIT 20;

-- View recent page views
SELECT 
  session_id,
  user_code,
  page_type,
  viewed_at
FROM analytics_page_views
ORDER BY viewed_at DESC
LIMIT 20;

-- View recent clicks
SELECT 
  session_id,
  user_code,
  click_target,
  click_category,
  clicked_at
FROM analytics_clicks
ORDER BY clicked_at DESC
LIMIT 20;

-- View daily user stats
SELECT 
  user_code,
  date,
  total_sessions,
  total_page_views,
  total_clicks
FROM analytics_daily_user_stats
ORDER BY date DESC
LIMIT 30;

-- View top clicked targets
SELECT 
  click_target,
  click_category,
  SUM(click_count) as total_clicks
FROM analytics_daily_click_targets
WHERE user_code = 'YOUR_USER_CODE'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY click_target, click_category
ORDER BY total_clicks DESC
LIMIT 10;

-- ============================================
-- PERFORMANCE TESTING
-- ============================================

-- Test query performance - Old way (JSONB)
-- (Keep analytics_events for comparison during migration)
EXPLAIN ANALYZE
SELECT 
  event_data->>'userCode' as user_code,
  COUNT(*) FILTER (WHERE event_type = 'view') as views,
  COUNT(*) FILTER (WHERE event_type = 'click') as clicks
FROM analytics_events
WHERE event_data->>'userCode' = 'myclik'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY event_data->>'userCode';

-- Test query performance - New way (aggregated)
EXPLAIN ANALYZE
SELECT 
  user_code,
  SUM(total_page_views) as views,
  SUM(total_clicks) as clicks
FROM analytics_daily_user_stats
WHERE user_code = 'myclik'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_code;

-- ============================================
-- MONITORING QUERIES
-- ============================================

-- Sessions per day (last 30 days)
SELECT 
  date,
  SUM(total_sessions) as sessions,
  SUM(total_page_views) as page_views,
  SUM(total_clicks) as clicks
FROM analytics_daily_user_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Top users by traffic
SELECT 
  user_code,
  SUM(total_sessions) as total_sessions,
  SUM(total_page_views) as total_page_views,
  SUM(total_clicks) as total_clicks
FROM analytics_daily_user_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_code
ORDER BY total_sessions DESC
LIMIT 10;

-- Click-through rate by user
SELECT 
  user_code,
  SUM(total_page_views) as views,
  SUM(total_clicks) as clicks,
  CASE 
    WHEN SUM(total_page_views) > 0 
    THEN ROUND((SUM(total_clicks)::NUMERIC / SUM(total_page_views)::NUMERIC) * 100, 2)
    ELSE 0
  END as ctr_percent
FROM analytics_daily_user_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_code
ORDER BY ctr_percent DESC
LIMIT 10;

-- Sessions with no clicks (bounces)
SELECT 
  COUNT(*) FILTER (WHERE clicks = 0) as bounce_sessions,
  COUNT(*) as total_sessions,
  ROUND(
    (COUNT(*) FILTER (WHERE clicks = 0)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
    2
  ) as bounce_rate_percent
FROM analytics_sessions
WHERE first_seen >= CURRENT_DATE - INTERVAL '7 days';

-- Average pages per session
SELECT 
  AVG(page_views) as avg_pages_per_session,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY page_views) as median_pages
FROM analytics_sessions
WHERE first_seen >= CURRENT_DATE - INTERVAL '7 days';

-- ============================================
-- CRON JOB MANAGEMENT
-- ============================================

-- List all cron jobs (if pg_cron is available)
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job;

-- View cron job run history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname = 'aggregate-analytics-daily'
ORDER BY start_time DESC
LIMIT 20;

-- Manually trigger cron job (for testing)
-- Note: This just runs the function, doesn't use cron
SELECT aggregate_analytics_daily();

-- Unschedule cron job
SELECT cron.unschedule('aggregate-analytics-daily');

-- Reschedule cron job (2 AM daily)
SELECT cron.schedule(
  'aggregate-analytics-daily',
  '0 2 * * *',
  $$SELECT aggregate_analytics_daily()$$
);

-- ============================================
-- DATA CLEANUP
-- ============================================

-- Check how much old data exists
SELECT 
  'sessions' as table_name,
  COUNT(*) as rows_older_than_90_days
FROM analytics_sessions
WHERE first_seen < NOW() - INTERVAL '90 days'
UNION ALL
SELECT 
  'page_views',
  COUNT(*)
FROM analytics_page_views
WHERE viewed_at < NOW() - INTERVAL '90 days'
UNION ALL
SELECT 
  'clicks',
  COUNT(*)
FROM analytics_clicks
WHERE clicked_at < NOW() - INTERVAL '90 days';

-- Delete raw events older than 90 days (keeps aggregates!)
SELECT cleanup_old_raw_events(90);

-- Delete raw events older than 30 days
SELECT cleanup_old_raw_events(30);

-- Get cleanup results as JSON
SELECT cleanup_old_raw_events(90)::JSON;

-- ============================================
-- MIGRATION HELPERS
-- ============================================

-- Compare old vs new data (during parallel run)
SELECT 
  'old_system' as system,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_type = 'view') as views,
  COUNT(*) FILTER (WHERE event_type = 'click') as clicks
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  'new_system',
  (SELECT COUNT(*) FROM analytics_page_views WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days') +
  (SELECT COUNT(*) FROM analytics_clicks WHERE clicked_at >= CURRENT_DATE - INTERVAL '7 days'),
  (SELECT COUNT(*) FROM analytics_page_views WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days'),
  (SELECT COUNT(*) FROM analytics_clicks WHERE clicked_at >= CURRENT_DATE - INTERVAL '7 days');

-- Migrate data from old analytics_events to new schema
-- WARNING: Only run this if you have old data to migrate!
-- This is a one-time operation
DO $$
DECLARE
  event_record RECORD;
  session_data JSONB;
BEGIN
  -- This is an EXAMPLE - adjust based on your actual analytics_events structure
  FOR event_record IN 
    SELECT 
      event_data,
      created_at
    FROM analytics_events
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
      AND event_type = 'view'
  LOOP
    session_data := event_record.event_data;
    
    -- Insert session (ignore duplicates)
    INSERT INTO analytics_sessions (
      session_id,
      user_code,
      share_code,
      contact_id,
      first_seen,
      last_seen,
      page_views,
      clicks
    ) VALUES (
      session_data->>'sessionId',
      session_data->>'userCode',
      session_data->>'shareCode',
      session_data->>'contactId',
      TO_TIMESTAMP((session_data->>'timestamp')::BIGINT / 1000),
      TO_TIMESTAMP((session_data->>'timestamp')::BIGINT / 1000),
      0,
      0
    )
    ON CONFLICT (session_id) DO NOTHING;
    
    -- Insert page view if it has eventTarget
    IF session_data->>'eventTarget' IS NOT NULL AND 
       session_data->>'eventTarget' LIKE 'page.%' THEN
      INSERT INTO analytics_page_views (
        session_id,
        user_code,
        share_code,
        contact_id,
        page_type,
        viewed_at
      ) VALUES (
        session_data->>'sessionId',
        session_data->>'userCode',
        session_data->>'shareCode',
        session_data->>'contactId',
        REPLACE(session_data->>'eventTarget', 'page.', ''),
        TO_TIMESTAMP((session_data->>'timestamp')::BIGINT / 1000)
      );
    END IF;
  END LOOP;
  
  -- Similar loop for click events...
  -- (Add if you need to migrate click data)
  
  RAISE NOTICE 'Migration of old events complete!';
END $$;

-- ============================================
-- USEFUL DASHBOARD QUERIES
-- ============================================

-- Get dashboard metrics for a user (last 30 days)
WITH date_range AS (
  SELECT 
    CURRENT_DATE - INTERVAL '30 days' as start_date,
    CURRENT_DATE as end_date
)
SELECT 
  'overall_metrics' as metric_type,
  json_build_object(
    'totalSessions', SUM(total_sessions),
    'totalPageViews', SUM(total_page_views),
    'totalClicks', SUM(total_clicks),
    'clickThroughRate', 
      CASE 
        WHEN SUM(total_page_views) > 0 
        THEN ROUND((SUM(total_clicks)::NUMERIC / SUM(total_page_views)::NUMERIC), 4)
        ELSE 0
      END
  ) as metrics
FROM analytics_daily_user_stats, date_range
WHERE user_code = 'YOUR_USER_CODE'
  AND date >= start_date
  AND date <= end_date;

-- Get top click targets for a user (last 30 days)
SELECT 
  click_target,
  click_category,
  SUM(click_count) as total_clicks
FROM analytics_daily_click_targets
WHERE user_code = 'YOUR_USER_CODE'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY click_target, click_category
ORDER BY total_clicks DESC
LIMIT 10;

-- Get page breakdown (last 30 days)
SELECT 
  page_type,
  SUM(view_count) as total_views
FROM analytics_daily_page_stats
WHERE user_code = 'YOUR_USER_CODE'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY page_type
ORDER BY total_views DESC;

-- Get group breakdown (last 30 days)
SELECT 
  share_code,
  SUM(total_sessions) as sessions,
  SUM(total_page_views) as page_views,
  SUM(total_clicks) as clicks
FROM analytics_daily_group_stats
WHERE user_code = 'YOUR_USER_CODE'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY share_code
ORDER BY sessions DESC;

-- Get daily trend (last 30 days)
SELECT 
  date,
  total_sessions,
  total_page_views,
  total_clicks
FROM analytics_daily_user_stats
WHERE user_code = 'YOUR_USER_CODE'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- ============================================
-- DEBUGGING
-- ============================================

-- Check for orphaned page views (sessions deleted but views remain)
SELECT COUNT(*)
FROM analytics_page_views pv
WHERE NOT EXISTS (
  SELECT 1 FROM analytics_sessions s 
  WHERE s.session_id = pv.session_id
);

-- Check for orphaned clicks
SELECT COUNT(*)
FROM analytics_clicks c
WHERE NOT EXISTS (
  SELECT 1 FROM analytics_sessions s 
  WHERE s.session_id = c.session_id
);

-- Find sessions with mismatched counts
SELECT 
  s.session_id,
  s.page_views as session_page_views,
  COUNT(pv.id) as actual_page_views,
  s.clicks as session_clicks,
  COUNT(c.id) as actual_clicks
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
GROUP BY s.session_id, s.page_views, s.clicks
HAVING 
  s.page_views != COUNT(pv.id) OR
  s.clicks != COUNT(c.id)
LIMIT 10;

-- ============================================
-- NOTES
-- ============================================
-- 1. Replace 'YOUR_USER_CODE' with actual user code
-- 2. Adjust date ranges as needed
-- 3. These queries are optimized for the new schema
-- 4. Old analytics_events queries are kept for comparison
-- 5. Always test queries on staging first
-- ============================================
