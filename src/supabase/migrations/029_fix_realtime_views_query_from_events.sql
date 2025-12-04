-- ============================================
-- MIGRATION 029: Fix Real-Time Views to Query from Events
-- ============================================
-- Problem: Views are based on analytics_sessions table, but FK constraints 
-- were removed to allow orphaned events. This means views miss orphaned 
-- analytics_page_views and analytics_clicks that don't have session records.
--
-- Solution: Rebuild views to query from analytics_page_views and analytics_clicks
-- directly (the source of truth), not from analytics_sessions.
--
-- IMPORTANT: visitor_id only exists in analytics_sessions table, so we need
-- to LEFT JOIN with sessions to get visitor_id while still capturing orphaned events.
-- ============================================

-- ============================================
-- Drop existing views
-- ============================================
DROP VIEW IF EXISTS v_realtime_user_stats;
DROP VIEW IF EXISTS v_realtime_group_stats;
DROP VIEW IF EXISTS v_realtime_daily_stats;

-- ============================================
-- 1. User Stats View - Query from events, not sessions
-- ============================================
CREATE VIEW v_realtime_user_stats AS
WITH page_view_stats AS (
  SELECT 
    pv.user_code,
    COUNT(DISTINCT pv.session_id) as sessions_from_views,
    COUNT(DISTINCT s.visitor_id) as visitors_from_views,
    COUNT(*) as total_page_views,
    MIN(pv.viewed_at) as first_view,
    MAX(pv.viewed_at) as last_view
  FROM analytics_page_views pv
  LEFT JOIN analytics_sessions s ON pv.session_id = s.session_id
  WHERE pv.viewed_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY pv.user_code
),
click_stats AS (
  SELECT 
    c.user_code,
    COUNT(DISTINCT c.session_id) as sessions_from_clicks,
    COUNT(DISTINCT s.visitor_id) as visitors_from_clicks,
    COUNT(*) as total_clicks
  FROM analytics_clicks c
  LEFT JOIN analytics_sessions s ON c.session_id = s.session_id
  WHERE c.clicked_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY c.user_code
)
SELECT 
  COALESCE(pv.user_code, c.user_code) as user_code,
  GREATEST(
    COALESCE(pv.sessions_from_views, 0),
    COALESCE(c.sessions_from_clicks, 0)
  ) as total_sessions,
  GREATEST(
    COALESCE(pv.visitors_from_views, 0),
    COALESCE(c.visitors_from_clicks, 0)
  ) as unique_visitors,
  COALESCE(pv.total_page_views, 0) as total_page_views,
  COALESCE(c.total_clicks, 0) as total_clicks,
  pv.first_view as first_visit,
  pv.last_view as last_visit
FROM page_view_stats pv
FULL OUTER JOIN click_stats c ON pv.user_code = c.user_code;

COMMENT ON VIEW v_realtime_user_stats IS 
  'Real-time user stats queried directly from analytics events (page_views + clicks), not sessions table. LEFT JOIN with sessions for visitor_id. Handles orphaned events correctly.';

-- ============================================
-- 2. Group Stats View - Query from events, not sessions
-- ============================================
CREATE VIEW v_realtime_group_stats AS
WITH page_view_stats AS (
  SELECT 
    pv.user_code,
    pv.share_code,
    COUNT(DISTINCT pv.session_id) as sessions_from_views,
    COUNT(DISTINCT s.visitor_id) as visitors_from_views,
    COUNT(*) as total_page_views
  FROM analytics_page_views pv
  LEFT JOIN analytics_sessions s ON pv.session_id = s.session_id
  WHERE pv.viewed_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY pv.user_code, pv.share_code
),
click_stats AS (
  SELECT 
    c.user_code,
    c.share_code,
    COUNT(DISTINCT c.session_id) as sessions_from_clicks,
    COUNT(DISTINCT s.visitor_id) as visitors_from_clicks,
    COUNT(*) as total_clicks
  FROM analytics_clicks c
  LEFT JOIN analytics_sessions s ON c.session_id = s.session_id
  WHERE c.clicked_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY c.user_code, c.share_code
)
SELECT 
  COALESCE(pv.user_code, c.user_code) as user_code,
  COALESCE(pv.share_code, c.share_code) as share_code,
  GREATEST(
    COALESCE(pv.sessions_from_views, 0),
    COALESCE(c.sessions_from_clicks, 0)
  ) as total_sessions,
  GREATEST(
    COALESCE(pv.visitors_from_views, 0),
    COALESCE(c.visitors_from_clicks, 0)
  ) as unique_visitors,
  COALESCE(pv.total_page_views, 0) as total_page_views,
  COALESCE(c.total_clicks, 0) as total_clicks
FROM page_view_stats pv
FULL OUTER JOIN click_stats c ON pv.user_code = c.user_code AND pv.share_code = c.share_code;

COMMENT ON VIEW v_realtime_group_stats IS 
  'Real-time group stats queried directly from analytics events (page_views + clicks), not sessions table. LEFT JOIN with sessions for visitor_id. Handles orphaned events correctly.';

-- ============================================
-- 3. Daily Stats View - Query from events, not sessions
-- ============================================
CREATE VIEW v_realtime_daily_stats AS
WITH page_view_stats AS (
  SELECT 
    pv.user_code,
    pv.share_code,
    DATE(pv.viewed_at) as date,
    COUNT(DISTINCT pv.session_id) as sessions_from_views,
    COUNT(DISTINCT s.visitor_id) as visitors_from_views,
    COUNT(*) as total_page_views
  FROM analytics_page_views pv
  LEFT JOIN analytics_sessions s ON pv.session_id = s.session_id
  WHERE pv.viewed_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY pv.user_code, pv.share_code, DATE(pv.viewed_at)
),
click_stats AS (
  SELECT 
    c.user_code,
    c.share_code,
    DATE(c.clicked_at) as date,
    COUNT(DISTINCT c.session_id) as sessions_from_clicks,
    COUNT(DISTINCT s.visitor_id) as visitors_from_clicks,
    COUNT(*) as total_clicks
  FROM analytics_clicks c
  LEFT JOIN analytics_sessions s ON c.session_id = s.session_id
  WHERE c.clicked_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY c.user_code, c.share_code, DATE(c.clicked_at)
)
SELECT 
  COALESCE(pv.user_code, c.user_code) as user_code,
  COALESCE(pv.share_code, c.share_code) as share_code,
  COALESCE(pv.date, c.date) as date,
  GREATEST(
    COALESCE(pv.sessions_from_views, 0),
    COALESCE(c.sessions_from_clicks, 0)
  ) as total_sessions,
  GREATEST(
    COALESCE(pv.visitors_from_views, 0),
    COALESCE(c.visitors_from_clicks, 0)
  ) as unique_visitors,
  COALESCE(pv.total_page_views, 0) as total_page_views,
  COALESCE(c.total_clicks, 0) as total_clicks
FROM page_view_stats pv
FULL OUTER JOIN click_stats c 
  ON pv.user_code = c.user_code 
  AND pv.share_code = c.share_code 
  AND pv.date = c.date
ORDER BY date DESC;

COMMENT ON VIEW v_realtime_daily_stats IS 
  'Real-time daily stats queried directly from analytics events (page_views + clicks), not sessions table. LEFT JOIN with sessions for visitor_id. Handles orphaned events correctly.';

-- ============================================
-- Grant Permissions
-- ============================================
GRANT SELECT ON v_realtime_user_stats TO authenticated;
GRANT SELECT ON v_realtime_group_stats TO authenticated;
GRANT SELECT ON v_realtime_daily_stats TO authenticated;

-- ============================================
-- Test the Views
-- ============================================
-- Verify views work and return data
-- SELECT * FROM v_realtime_user_stats LIMIT 5;
-- SELECT * FROM v_realtime_group_stats LIMIT 5;
-- SELECT * FROM v_realtime_daily_stats LIMIT 5;