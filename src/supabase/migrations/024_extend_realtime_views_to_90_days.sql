-- ============================================
-- MIGRATION 024: Extend Real-Time Views to 90 Days
-- ============================================
-- Problem: Views only showed 30 days, but dashboard has 90-day filter
-- Solution: Update views to show last 90 days
-- ============================================

-- ============================================
-- Drop existing views first (PostgreSQL limitation)
-- ============================================
-- CREATE OR REPLACE VIEW cannot change column order/names
-- So we must DROP first, then CREATE fresh

DROP VIEW IF EXISTS v_realtime_daily_stats;
DROP VIEW IF EXISTS v_realtime_user_stats;
DROP VIEW IF EXISTS v_realtime_group_stats;
DROP VIEW IF EXISTS v_realtime_click_targets;
DROP VIEW IF EXISTS v_realtime_page_stats;

-- ============================================
-- 1. Create Daily Stats View (90 days)
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
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'  -- Extended to 90 days
GROUP BY s.user_code, s.share_code, DATE(s.first_seen)
ORDER BY date DESC;

-- ============================================
-- 2. Create User Stats View (90 days total)
-- ============================================
CREATE VIEW v_realtime_user_stats AS
SELECT 
  s.user_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT pv.id) as total_page_views,
  COUNT(DISTINCT c.id) as total_clicks,
  MIN(s.first_seen) as first_visit,
  MAX(s.last_seen) as last_visit
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'  -- Extended to 90 days
GROUP BY s.user_code;

-- ============================================
-- 3. Create Group Stats View (90 days)
-- ============================================
CREATE VIEW v_realtime_group_stats AS
SELECT 
  s.user_code,
  s.share_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT pv.id) as total_page_views,
  COUNT(DISTINCT c.id) as total_clicks,
  MIN(s.first_seen) as first_visit,
  MAX(s.last_seen) as last_visit
FROM analytics_sessions s
LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
LEFT JOIN analytics_clicks c ON s.session_id = c.session_id
WHERE s.first_seen >= CURRENT_DATE - INTERVAL '90 days'  -- Extended to 90 days
GROUP BY s.user_code, s.share_code;

-- ============================================
-- 4. Create Click Targets View (90 days)
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
WHERE c.clicked_at >= CURRENT_DATE - INTERVAL '90 days'  -- Extended to 90 days
GROUP BY s.user_code, s.share_code, c.click_category, c.click_target
ORDER BY total_clicks DESC;

-- ============================================
-- 5. Create Page Stats View (90 days)
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
WHERE pv.viewed_at >= CURRENT_DATE - INTERVAL '90 days'  -- Extended to 90 days
GROUP BY s.user_code, s.share_code, pv.page_type
ORDER BY total_views DESC;

-- ============================================
-- Performance Note
-- ============================================
-- Views still calculate in real-time (no storage cost)
-- Query speed impact:
-- - 30 days: ~10-50ms
-- - 90 days: ~20-100ms (3x more data to scan)
-- 
-- If queries get too slow (>100ms), use hybrid approach:
-- - Views for last 7 days (real-time)
-- - Aggregated tables for 8-90 days (pre-computed)
-- ============================================

-- ============================================
-- Verification
-- ============================================
-- Test that views now show 90 days:
-- SELECT MIN(date), MAX(date), COUNT(*) 
-- FROM v_realtime_daily_stats 
-- WHERE user_code = 'YOUR_USER_CODE';
-- 
-- Should show: min_date = 90 days ago, max_date = today
-- ============================================