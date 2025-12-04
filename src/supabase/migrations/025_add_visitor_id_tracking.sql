-- ============================================
-- MIGRATION 025: Add Visitor ID Tracking
-- ============================================
-- Purpose: Track unique people (90-day) vs unique sessions (30-min)
-- This allows distinguishing between:
--   - visitor_id: Unique PEOPLE (persists 90 days in localStorage)
--   - session_id: Unique VISITS (30-minute timeout in sessionStorage)
-- ============================================

-- Add visitor_id column to analytics_sessions table
ALTER TABLE analytics_sessions 
ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- Create index for fast visitor_id queries
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor_id 
ON analytics_sessions(visitor_id);

-- Create composite index for user_code + visitor_id (for unique visitor counts)
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_visitor 
ON analytics_sessions(user_code, visitor_id);

-- Update the ingest_analytics_batch function to handle visitor_id
CREATE OR REPLACE FUNCTION ingest_analytics_batch(
  events JSONB
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event JSONB;
  event_type TEXT;
  event_data JSONB;
  sessions_inserted INT := 0;
  page_views_inserted INT := 0;
  clicks_inserted INT := 0;
  session_ids_for_page_views TEXT[] := ARRAY[]::TEXT[];
  session_ids_for_clicks TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Validate input
  IF events IS NULL OR jsonb_array_length(events) = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No events provided'
    );
  END IF;

  -- Limit batch size to prevent abuse
  IF jsonb_array_length(events) > 100 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Batch size too large (max 100 events)'
    );
  END IF;

  -- Process each event
  FOR event IN SELECT * FROM jsonb_array_elements(events)
  LOOP
    event_type := event->>'type';
    event_data := event->'data';

    -- Validate required fields
    IF event_data->>'sessionId' IS NULL OR 
       event_data->>'userCode' IS NULL OR 
       event_data->>'shareCode' IS NULL THEN
      CONTINUE; -- Skip invalid events
    END IF;

    -- Handle session events
    IF event_type = 'session' THEN
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
      ) VALUES (
        event_data->>'sessionId',
        event_data->>'userCode',
        event_data->>'shareCode',
        event_data->>'contactId',
        event_data->>'visitorId',
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0),
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0),
        0,
        0,
        event_data->>'userAgent',
        event_data->>'referrer'
      )
      ON CONFLICT (session_id) 
      DO UPDATE SET
        last_seen = GREATEST(analytics_sessions.last_seen, EXCLUDED.last_seen),
        visitor_id = COALESCE(EXCLUDED.visitor_id, analytics_sessions.visitor_id),
        updated_at = NOW();
      
      sessions_inserted := sessions_inserted + 1;

    -- Handle page view events
    ELSIF event_type = 'page_view' THEN
      -- Validate page_type
      IF event_data->>'pageType' NOT IN ('home', 'contact', 'profile', 'portfolio') THEN
        CONTINUE;
      END IF;

      INSERT INTO analytics_page_views (
        session_id,
        user_code,
        share_code,
        contact_id,
        page_type,
        viewed_at
      ) VALUES (
        event_data->>'sessionId',
        event_data->>'userCode',
        event_data->>'shareCode',
        event_data->>'contactId',
        event_data->>'pageType',
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0)
      );
      
      page_views_inserted := page_views_inserted + 1;
      session_ids_for_page_views := array_append(
        session_ids_for_page_views, 
        event_data->>'sessionId'
      );

    -- Handle click events
    ELSIF event_type = 'click' THEN
      -- Validate click_category
      IF event_data->>'clickCategory' NOT IN ('contact', 'messaging', 'social', 'portfolio', 'aiAgent', 'other') THEN
        CONTINUE;
      END IF;

      INSERT INTO analytics_clicks (
        session_id,
        user_code,
        share_code,
        contact_id,
        click_target,
        click_category,
        clicked_at
      ) VALUES (
        event_data->>'sessionId',
        event_data->>'userCode',
        event_data->>'shareCode',
        event_data->>'contactId',
        event_data->>'clickTarget',
        event_data->>'clickCategory',
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0)
      );
      
      clicks_inserted := clicks_inserted + 1;
      session_ids_for_clicks := array_append(
        session_ids_for_clicks, 
        event_data->>'sessionId'
      );
    END IF;
  END LOOP;

  -- Update session page_views counts
  IF array_length(session_ids_for_page_views, 1) > 0 THEN
    UPDATE analytics_sessions
    SET 
      page_views = page_views + 1,
      updated_at = NOW()
    WHERE session_id = ANY(session_ids_for_page_views);
  END IF;

  -- Update session clicks counts
  IF array_length(session_ids_for_clicks, 1) > 0 THEN
    UPDATE analytics_sessions
    SET 
      clicks = clicks + 1,
      updated_at = NOW()
    WHERE session_id = ANY(session_ids_for_clicks);
  END IF;

  -- Return success summary
  RETURN json_build_object(
    'success', true,
    'sessions', sessions_inserted,
    'page_views', page_views_inserted,
    'clicks', clicks_inserted
  );
END;
$$ LANGUAGE plpgsql;

-- Update v_realtime_user_stats to include unique visitors
DROP VIEW IF EXISTS v_realtime_user_stats;
CREATE VIEW v_realtime_user_stats AS
SELECT 
  s.user_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT s.visitor_id) as unique_visitors,
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
  'Real-time analytics with unique visitors (visitor_id) and unique sessions (session_id)';

-- Update v_realtime_group_stats to include unique visitors
DROP VIEW IF EXISTS v_realtime_group_stats;
CREATE VIEW v_realtime_group_stats AS
SELECT 
  s.user_code,
  s.share_code,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT s.visitor_id) as unique_visitors,
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
  'Real-time group analytics with unique visitors (visitor_id) and unique sessions (session_id)';

-- Grant permissions
GRANT SELECT ON v_realtime_user_stats TO authenticated;
GRANT SELECT ON v_realtime_group_stats TO authenticated;

COMMENT ON COLUMN analytics_sessions.visitor_id IS 
  'Persistent visitor identifier (90-day localStorage). Tracks unique PEOPLE across sessions.';

COMMENT ON COLUMN analytics_sessions.session_id IS 
  'Session identifier (30-min sessionStorage). Tracks unique VISITS/SESSIONS.';
