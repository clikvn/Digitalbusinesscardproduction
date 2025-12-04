-- ============================================
-- MIGRATION 026: Fix Analytics Foreign Key Constraints
-- ============================================
-- Purpose: Remove strict foreign key constraints from analytics tables
-- Reason: Page views and clicks may arrive before session events in batches
--         Analytics data doesn't need strict referential integrity
--         Better to allow orphaned records than fail entire batch
-- ============================================

-- Drop foreign key constraints from analytics_page_views
ALTER TABLE analytics_page_views 
DROP CONSTRAINT IF EXISTS fk_page_views_session;

-- Drop foreign key constraints from analytics_clicks
ALTER TABLE analytics_clicks 
DROP CONSTRAINT IF EXISTS fk_clicks_session;

-- Add indexes for performance (soft references)
CREATE INDEX IF NOT EXISTS idx_page_views_session_id 
ON analytics_page_views(session_id);

CREATE INDEX IF NOT EXISTS idx_clicks_session_id 
ON analytics_clicks(session_id);

-- Add comments to document the soft reference relationship
COMMENT ON COLUMN analytics_page_views.session_id IS 
  'Soft reference to analytics_sessions.session_id (no FK constraint). Orphaned records are acceptable for analytics.';

COMMENT ON COLUMN analytics_clicks.session_id IS 
  'Soft reference to analytics_sessions.session_id (no FK constraint). Orphaned records are acceptable for analytics.';

-- Optional: Create a cleanup function to link orphaned records later
-- (This can run periodically to ensure data consistency without blocking ingestion)
CREATE OR REPLACE FUNCTION cleanup_orphaned_analytics()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create missing sessions for orphaned page views
  INSERT INTO analytics_sessions (
    session_id,
    user_code,
    share_code,
    contact_id,
    visitor_id,
    first_seen,
    last_seen,
    page_views,
    clicks,
    user_agent,
    referrer
  )
  SELECT DISTINCT
    pv.session_id,
    pv.user_code,
    pv.share_code,
    pv.contact_id,
    NULL as visitor_id,
    MIN(pv.viewed_at),
    MAX(pv.viewed_at),
    0,
    0,
    'Unknown' as user_agent,
    '' as referrer
  FROM analytics_page_views pv
  LEFT JOIN analytics_sessions s ON pv.session_id = s.session_id
  WHERE s.session_id IS NULL
  GROUP BY pv.session_id, pv.user_code, pv.share_code, pv.contact_id
  ON CONFLICT (session_id) DO NOTHING;

  -- Create missing sessions for orphaned clicks
  INSERT INTO analytics_sessions (
    session_id,
    user_code,
    share_code,
    contact_id,
    visitor_id,
    first_seen,
    last_seen,
    page_views,
    clicks,
    user_agent,
    referrer
  )
  SELECT DISTINCT
    c.session_id,
    c.user_code,
    c.share_code,
    c.contact_id,
    NULL as visitor_id,
    MIN(c.clicked_at),
    MAX(c.clicked_at),
    0,
    0,
    'Unknown' as user_agent,
    '' as referrer
  FROM analytics_clicks c
  LEFT JOIN analytics_sessions s ON c.session_id = s.session_id
  WHERE s.session_id IS NULL
  GROUP BY c.session_id, c.user_code, c.share_code, c.contact_id
  ON CONFLICT (session_id) DO NOTHING;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_orphaned_analytics IS 
  'Creates missing session records for orphaned page views and clicks. Can be run periodically.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_orphaned_analytics TO authenticated;
