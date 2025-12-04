-- ============================================
-- MIGRATION 028: Add visitor_id to Real-Time Views
-- ============================================
-- Problem: Group filter shows incorrect "New Shares" (unique people) count
-- Root Cause: v_realtime_group_stats and v_realtime_user_stats don't track visitor_id
-- Solution: Add COUNT(DISTINCT visitor_id) as unique_visitors to both views
-- ============================================

-- ============================================
-- Drop existing views first (PostgreSQL limitation)
-- ============================================
DROP VIEW IF EXISTS v_realtime_daily_stats;
DROP VIEW IF EXISTS v_realtime_user_stats;
DROP VIEW IF EXISTS v_realtime_group_stats;
DROP VIEW IF EXISTS v_realtime_click_targets;
DROP VIEW IF EXISTS v_realtime_page_stats;

-- ============================================
-- 1. Create User Stats View with visitor_id
-- ============================================
CREATE VIEW v_realtime_user_stats AS
SELECT 
  s.user_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT s.visitor_id) as unique_visitors,  -- ✅ ADDED: Unique people (90-day)
  COUNT(DISTINCT pv.id) as total_page_views,
  COUNT(DISTINCT c.id) as total_clicks,
  MIN(s.first_seen) as first_visit,
  MAX(s.last_seen) as last_visit
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.user_code;

COMMENT ON VIEW v_realtime_user_stats IS 
  'Real-time analytics per user. unique_visitors = unique people (visitor_id), total_sessions = unique visits (session_id).';

-- ============================================
-- 2. Create Group Stats View with visitor_id
-- ============================================
CREATE VIEW v_realtime_group_stats AS
SELECT 
  s.user_code,
  s.share_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT s.visitor_id) as unique_visitors,  -- ✅ ADDED: Unique people (90-day)
  COUNT(DISTINCT pv.id) as total_page_views,
  COUNT(DISTINCT c.id) as total_clicks,
  MIN(s.first_seen) as first_visit,
  MAX(s.last_seen) as last_visit
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.user_code, s.share_code;

COMMENT ON VIEW v_realtime_group_stats IS 
  'Real-time analytics per share group. unique_visitors = unique people (visitor_id), total_sessions = unique visits (session_id).';

-- ============================================
-- 3. Create Daily Stats View (unchanged)
-- ============================================
CREATE VIEW v_realtime_daily_stats AS
SELECT 
  s.user_code,
  s.share_code,
  DATE(s.first_seen) as date,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT pv.id) as total_page_views,
  COUNT(DISTINCT c.id) as total_clicks
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.user_code, s.share_code, DATE(s.first_seen)
ORDER BY date DESC;

COMMENT ON VIEW v_realtime_daily_stats IS 
  'Real-time daily analytics for charts. Groups sessions by date.';

-- ============================================
-- 4. Create Click Targets View (unchanged)
-- ============================================
CREATE VIEW v_realtime_click_targets AS
SELECT 
  s.user_code,
  s.share_code,
  c.click_category as target_type,
  c.click_target as target_label,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT s.session_id) as unique_sessions
FROM analytics_clicks c
JOIN analytics_sessions s ON c.session_id = s.session_id
WHERE c.clicked_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.user_code, s.share_code, c.click_category, c.click_target
ORDER BY total_clicks DESC;

COMMENT ON VIEW v_realtime_click_targets IS 
  'Real-time click analytics showing most clicked elements per group.';

-- ============================================
-- 5. Create Page Stats View (unchanged)
-- ============================================
CREATE VIEW v_realtime_page_stats AS
SELECT 
  s.user_code,
  s.share_code,
  pv.page_type,
  COUNT(*) as total_views,
  COUNT(DISTINCT s.session_id) as unique_sessions
FROM analytics_page_views pv
JOIN analytics_sessions s ON pv.session_id = s.session_id
WHERE pv.viewed_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.user_code, s.share_code, pv.page_type
ORDER BY total_views DESC;

COMMENT ON VIEW v_realtime_page_stats IS 
  'Real-time page view analytics showing most viewed pages per group.';

-- ============================================
-- Grant Permissions
-- ============================================
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
