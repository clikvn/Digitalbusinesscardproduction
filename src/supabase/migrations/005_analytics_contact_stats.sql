-- ============================================
-- MIGRATION 005: Analytics Contact-Level Statistics
-- ============================================
-- Purpose: Track individual contact engagement for "Engaged Contacts" metrics
-- 
-- Key Insight:
-- - Group URL: /usercode/groupcode → Tracks group-level analytics
-- - Contact URL: /usercode/groupcode/contactcode → Tracks BOTH:
--   1. Individual contact engagement (this migration)
--   2. Group-level analytics (already working in migration 004)
--
-- Use Cases:
-- - "Engaged Contacts" metric: How many unique contacts interacted with my card?
-- - Individual contact analytics: How did John Doe engage with my portfolio?
-- - Contact comparison: Which contacts are most engaged?
-- ============================================

-- ============================================
-- PART 1: CONTACT ENGAGEMENT TABLE
-- ============================================

-- ---------------------------------------------
-- Table: analytics_daily_contact_stats
-- Purpose: Track engagement metrics per individual contact
-- Aggregation: Daily (same as other analytics tables)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_daily_contact_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  user_code TEXT NOT NULL,
  share_code TEXT NOT NULL,
  contact_code TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Engagement Metrics
  total_sessions INT DEFAULT 0,
  total_page_views INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  
  -- First/Last Interaction
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_contact_date UNIQUE (user_code, share_code, contact_code, date)
);

-- Add comments
COMMENT ON TABLE analytics_daily_contact_stats IS 'Daily engagement metrics for individual contacts (people who received tracked share links)';
COMMENT ON COLUMN analytics_daily_contact_stats.contact_code IS 'Unique code from share_contacts table identifying the individual recipient';
COMMENT ON COLUMN analytics_daily_contact_stats.total_sessions IS 'How many times this contact visited on this date';
COMMENT ON COLUMN analytics_daily_contact_stats.total_page_views IS 'Total page views by this contact on this date';
COMMENT ON COLUMN analytics_daily_contact_stats.total_clicks IS 'Total clicks by this contact on this date';

-- ============================================
-- PART 2: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contact_stats_user_code_date
  ON analytics_daily_contact_stats(user_code, date DESC);

CREATE INDEX IF NOT EXISTS idx_contact_stats_contact_code
  ON analytics_daily_contact_stats(user_code, contact_code, date DESC);

CREATE INDEX IF NOT EXISTS idx_contact_stats_share_code
  ON analytics_daily_contact_stats(user_code, share_code, date DESC);

-- ============================================
-- PART 3: UPDATE AGGREGATION FUNCTION
-- ============================================

-- Update the aggregate_analytics_daily function to include contact stats
-- This extends the existing function from migration 004

CREATE OR REPLACE FUNCTION aggregate_analytics_daily_with_contacts(
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  rows_user_stats INT;
  rows_group_stats INT;
  rows_contact_stats INT;
  rows_click_targets INT;
  rows_page_stats INT;
  result JSON;
BEGIN
  -- Aggregate user stats (overall metrics)
  INSERT INTO analytics_daily_user_stats (
    user_code, 
    date, 
    total_sessions, 
    total_page_views, 
    total_clicks, 
    unique_share_codes
  )
  SELECT 
    s.user_code,
    target_date,
    COUNT(DISTINCT s.session_id) as total_sessions,
    COALESCE(SUM(s.page_views), 0) as total_page_views,
    COALESCE(SUM(s.clicks), 0) as total_clicks,
    ARRAY_AGG(DISTINCT s.share_code) as unique_share_codes
  FROM analytics_sessions s
  WHERE DATE(s.first_seen) = target_date
  GROUP BY s.user_code
  ON CONFLICT (user_code, date) 
  DO UPDATE SET 
    total_sessions = EXCLUDED.total_sessions,
    total_page_views = EXCLUDED.total_page_views,
    total_clicks = EXCLUDED.total_clicks,
    unique_share_codes = EXCLUDED.unique_share_codes,
    updated_at = NOW();
  
  GET DIAGNOSTICS rows_user_stats = ROW_COUNT;

  -- Aggregate group stats (per share code)
  -- NOTE: This counts ALL visits to a group, including those with contact_code
  INSERT INTO analytics_daily_group_stats (
    user_code, 
    share_code, 
    date, 
    total_sessions, 
    total_page_views, 
    total_clicks
  )
  SELECT 
    s.user_code,
    s.share_code,
    target_date,
    COUNT(DISTINCT s.session_id) as total_sessions,
    COALESCE(SUM(s.page_views), 0) as total_page_views,
    COALESCE(SUM(s.clicks), 0) as total_clicks
  FROM analytics_sessions s
  WHERE DATE(s.first_seen) = target_date
  GROUP BY s.user_code, s.share_code
  ON CONFLICT (user_code, share_code, date) 
  DO UPDATE SET 
    total_sessions = EXCLUDED.total_sessions,
    total_page_views = EXCLUDED.total_page_views,
    total_clicks = EXCLUDED.total_clicks,
    updated_at = NOW();
  
  GET DIAGNOSTICS rows_group_stats = ROW_COUNT;

  -- ⭐ NEW: Aggregate contact stats (per individual contact)
  -- Only aggregates sessions that have a contact_id
  INSERT INTO analytics_daily_contact_stats (
    user_code,
    share_code,
    contact_code,
    date,
    total_sessions,
    total_page_views,
    total_clicks,
    first_visit,
    last_visit
  )
  SELECT 
    s.user_code,
    s.share_code,
    s.contact_id as contact_code,
    target_date,
    COUNT(DISTINCT s.session_id) as total_sessions,
    COALESCE(SUM(s.page_views), 0) as total_page_views,
    COALESCE(SUM(s.clicks), 0) as total_clicks,
    MIN(s.first_seen) as first_visit,
    MAX(s.last_seen) as last_visit
  FROM analytics_sessions s
  WHERE DATE(s.first_seen) = target_date
    AND s.contact_id IS NOT NULL  -- Only count sessions with contact tracking
  GROUP BY s.user_code, s.share_code, s.contact_id
  ON CONFLICT (user_code, share_code, contact_code, date) 
  DO UPDATE SET 
    total_sessions = EXCLUDED.total_sessions,
    total_page_views = EXCLUDED.total_page_views,
    total_clicks = EXCLUDED.total_clicks,
    first_visit = EXCLUDED.first_visit,
    last_visit = EXCLUDED.last_visit,
    updated_at = NOW();
  
  GET DIAGNOSTICS rows_contact_stats = ROW_COUNT;

  -- Aggregate click targets (what was clicked)
  INSERT INTO analytics_daily_click_targets (
    user_code, 
    share_code, 
    date, 
    click_target, 
    click_category, 
    click_count
  )
  SELECT 
    c.user_code,
    c.share_code,
    target_date,
    c.click_target,
    c.click_category,
    COUNT(*) as click_count
  FROM analytics_clicks c
  WHERE DATE(c.clicked_at) = target_date
  GROUP BY c.user_code, c.share_code, c.click_target, c.click_category
  ON CONFLICT (user_code, share_code, date, click_target) 
  DO UPDATE SET 
    click_count = EXCLUDED.click_count,
    click_category = EXCLUDED.click_category,
    updated_at = NOW();
  
  GET DIAGNOSTICS rows_click_targets = ROW_COUNT;

  -- Aggregate page stats (page views by page type)
  INSERT INTO analytics_daily_page_stats (
    user_code, 
    share_code, 
    date, 
    page_type, 
    view_count
  )
  SELECT 
    pv.user_code,
    pv.share_code,
    target_date,
    pv.page_type,
    COUNT(*) as view_count
  FROM analytics_page_views pv
  WHERE DATE(pv.viewed_at) = target_date
  GROUP BY pv.user_code, pv.share_code, pv.page_type
  ON CONFLICT (user_code, share_code, date, page_type) 
  DO UPDATE SET 
    view_count = EXCLUDED.view_count,
    updated_at = NOW();
  
  GET DIAGNOSTICS rows_page_stats = ROW_COUNT;

  -- Build result JSON
  result := json_build_object(
    'success', true,
    'date', target_date,
    'rows_aggregated', json_build_object(
      'user_stats', rows_user_stats,
      'group_stats', rows_group_stats,
      'contact_stats', rows_contact_stats,
      'click_targets', rows_click_targets,
      'page_stats', rows_page_stats
    ),
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION aggregate_analytics_daily_with_contacts IS 'Aggregates analytics for a specific date including contact-level stats. Run daily via cron job.';

-- ============================================
-- PART 4: HELPER VIEWS FOR QUERYING
-- ============================================

-- ---------------------------------------------
-- View: v_engaged_contacts_summary
-- Purpose: Quick summary of engaged contacts
-- Usage: SELECT * FROM v_engaged_contacts_summary WHERE user_code = 'myclik'
-- ---------------------------------------------
CREATE OR REPLACE VIEW v_engaged_contacts_summary AS
SELECT 
  cs.user_code,
  cs.share_code,
  cs.contact_code,
  sc.contact_name,
  sc.contact_email,
  sc.contact_company,
  -- Lifetime engagement metrics
  COUNT(DISTINCT cs.date) as days_active,
  SUM(cs.total_sessions) as total_sessions,
  SUM(cs.total_page_views) as total_page_views,
  SUM(cs.total_clicks) as total_clicks,
  MIN(cs.first_visit) as first_visit,
  MAX(cs.last_visit) as last_visit,
  -- Latest activity
  MAX(cs.date) as last_active_date
FROM analytics_daily_contact_stats cs
LEFT JOIN share_contacts sc 
  ON cs.user_code = sc.user_code 
  AND cs.contact_code = sc.contact_code
GROUP BY 
  cs.user_code, 
  cs.share_code, 
  cs.contact_code,
  sc.contact_name,
  sc.contact_email,
  sc.contact_company
ORDER BY last_visit DESC;

COMMENT ON VIEW v_engaged_contacts_summary IS 'Summary view of all engaged contacts with lifetime metrics. Join with share_contacts for contact details.';

-- ---------------------------------------------
-- View: v_contact_engagement_timeline
-- Purpose: Day-by-day engagement for a specific contact
-- Usage: SELECT * FROM v_contact_engagement_timeline 
--        WHERE user_code = 'myclik' AND contact_code = 'abc123'
-- ---------------------------------------------
CREATE OR REPLACE VIEW v_contact_engagement_timeline AS
SELECT 
  cs.user_code,
  cs.share_code,
  cs.contact_code,
  sc.contact_name,
  cs.date,
  cs.total_sessions,
  cs.total_page_views,
  cs.total_clicks,
  cs.first_visit,
  cs.last_visit
FROM analytics_daily_contact_stats cs
LEFT JOIN share_contacts sc 
  ON cs.user_code = sc.user_code 
  AND cs.contact_code = sc.contact_code
ORDER BY cs.user_code, cs.contact_code, cs.date DESC;

COMMENT ON VIEW v_contact_engagement_timeline IS 'Day-by-day engagement timeline for each contact';

-- ============================================
-- PART 5: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE analytics_daily_contact_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own contact analytics
DROP POLICY IF EXISTS "Users can read their own contact analytics" ON analytics_daily_contact_stats;
CREATE POLICY "Users can read their own contact analytics"
  ON analytics_daily_contact_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_code_ownership uco
      WHERE uco.user_code = analytics_daily_contact_stats.user_code
        AND uco.user_id = auth.uid()
    )
  );

-- Policy: System can insert/update (for aggregation function)
DROP POLICY IF EXISTS "System can insert contact analytics" ON analytics_daily_contact_stats;
CREATE POLICY "System can insert contact analytics"
  ON analytics_daily_contact_stats FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update contact analytics" ON analytics_daily_contact_stats;
CREATE POLICY "System can update contact analytics"
  ON analytics_daily_contact_stats FOR UPDATE
  USING (true);

-- ============================================
-- PART 6: EXAMPLE QUERIES
-- ============================================

-- Example 1: Get "Engaged Contacts" count for a user
-- SELECT COUNT(DISTINCT contact_code) as engaged_contacts_count
-- FROM analytics_daily_contact_stats
-- WHERE user_code = 'myclik'
--   AND total_clicks > 0;  -- Only count contacts who clicked something

-- Example 2: Get top 10 most engaged contacts
-- SELECT * FROM v_engaged_contacts_summary
-- WHERE user_code = 'myclik'
-- ORDER BY total_clicks DESC, total_page_views DESC
-- LIMIT 10;

-- Example 3: Get contact engagement for a specific group
-- SELECT 
--   contact_code,
--   SUM(total_sessions) as sessions,
--   SUM(total_page_views) as views,
--   SUM(total_clicks) as clicks
-- FROM analytics_daily_contact_stats
-- WHERE user_code = 'myclik'
--   AND share_code = 'work'
-- GROUP BY contact_code
-- ORDER BY clicks DESC;

-- Example 4: Get engagement timeline for a specific contact
-- SELECT * FROM v_contact_engagement_timeline
-- WHERE user_code = 'myclik'
--   AND contact_code = 'abc123'
-- ORDER BY date DESC;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✅ Created analytics_daily_contact_stats table
-- ✅ Updated aggregation function to include contact stats
-- ✅ Created helper views for easy querying
-- ✅ Added RLS policies for security
-- ✅ Added indexes for performance
--
-- Key Behavior:
-- - URLs with contact_code (/user/group/contact) count BOTH:
--   1. In group stats (analytics_daily_group_stats)
--   2. In contact stats (analytics_daily_contact_stats)
-- - URLs without contact_code (/user/group) only count in group stats
--
-- This allows tracking:
-- - Overall group performance (all visitors)
-- - Individual contact engagement (tracked shares)
-- - "Engaged Contacts" metric (unique contacts who interacted)
