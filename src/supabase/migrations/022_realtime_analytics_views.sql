-- ============================================
-- MIGRATION 022: Real-Time Analytics Views
-- ============================================
-- Creates views that show real-time analytics from raw tables
-- This allows the dashboard to show data immediately without waiting for aggregation
-- ============================================

-- ============================================
-- Real-Time User Stats View
-- ============================================
-- Shows current stats aggregated from raw tables in real-time
CREATE OR REPLACE VIEW v_realtime_user_stats AS
SELECT 
  user_code,
  COUNT(DISTINCT session_id) as total_sessions,
  COALESCE(SUM(page_views), 0)::INTEGER as total_page_views,
  COALESCE(SUM(clicks), 0)::INTEGER as total_clicks,
  MIN(first_seen) as first_visit,
  MAX(last_seen) as last_visit
FROM analytics_sessions
GROUP BY user_code;

COMMENT ON VIEW v_realtime_user_stats IS 
  'Real-time analytics aggregated from raw sessions table. Updates immediately as events are tracked.';

-- ============================================
-- Real-Time Group Stats View
-- ============================================
-- Shows current stats per share group in real-time
CREATE OR REPLACE VIEW v_realtime_group_stats AS
SELECT 
  user_code,
  share_code,
  COUNT(DISTINCT session_id) as total_sessions,
  COALESCE(SUM(page_views), 0)::INTEGER as total_page_views,
  COALESCE(SUM(clicks), 0)::INTEGER as total_clicks,
  MIN(first_seen) as first_visit,
  MAX(last_seen) as last_visit
FROM analytics_sessions
GROUP BY user_code, share_code;

COMMENT ON VIEW v_realtime_group_stats IS 
  'Real-time analytics per share group. Updates immediately.';

-- ============================================
-- Real-Time Daily Stats View
-- ============================================
-- Shows stats grouped by date (for charts) in real-time
CREATE OR REPLACE VIEW v_realtime_daily_stats AS
SELECT 
  user_code,
  DATE(first_seen) as date,
  COUNT(DISTINCT session_id) as total_sessions,
  COALESCE(SUM(page_views), 0)::INTEGER as total_page_views,
  COALESCE(SUM(clicks), 0)::INTEGER as total_clicks
FROM analytics_sessions
GROUP BY user_code, DATE(first_seen)
ORDER BY user_code, date DESC;

COMMENT ON VIEW v_realtime_daily_stats IS 
  'Real-time daily analytics for charts. Groups sessions by date.';

-- ============================================
-- Real-Time Click Targets View
-- ============================================
-- Shows which elements are being clicked in real-time
CREATE OR REPLACE VIEW v_realtime_click_targets AS
SELECT 
  user_code,
  share_code,
  click_target,
  click_category,
  COUNT(*) as total_clicks,
  MAX(clicked_at) as last_clicked
FROM analytics_clicks
GROUP BY user_code, share_code, click_target, click_category
ORDER BY total_clicks DESC;

COMMENT ON VIEW v_realtime_click_targets IS 
  'Real-time click analytics showing most clicked elements.';

-- ============================================
-- Real-Time Page Stats View
-- ============================================
-- Shows which pages are being viewed in real-time
CREATE OR REPLACE VIEW v_realtime_page_stats AS
SELECT 
  user_code,
  share_code,
  page_type,
  COUNT(*) as total_views,
  MAX(viewed_at) as last_viewed
FROM analytics_page_views
GROUP BY user_code, share_code, page_type
ORDER BY total_views DESC;

COMMENT ON VIEW v_realtime_page_stats IS 
  'Real-time page view analytics showing most viewed pages.';

-- ============================================
-- Grant Permissions
-- ============================================
-- Allow authenticated users to query these views
GRANT SELECT ON v_realtime_user_stats TO authenticated;
GRANT SELECT ON v_realtime_group_stats TO authenticated;
GRANT SELECT ON v_realtime_daily_stats TO authenticated;
GRANT SELECT ON v_realtime_click_targets TO authenticated;
GRANT SELECT ON v_realtime_page_stats TO authenticated;

-- ============================================
-- Test the Views
-- ============================================
-- Uncomment to test:
-- SELECT * FROM v_realtime_user_stats;
-- SELECT * FROM v_realtime_group_stats;
-- SELECT * FROM v_realtime_daily_stats LIMIT 10;
-- SELECT * FROM v_realtime_click_targets LIMIT 10;
-- SELECT * FROM v_realtime_page_stats LIMIT 10;
