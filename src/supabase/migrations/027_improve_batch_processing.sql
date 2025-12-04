-- ============================================
-- MIGRATION 027: Improve Analytics Batch Processing
-- ============================================
-- Purpose: Process session events FIRST to prevent FK violations
-- Strategy: Two-pass processing - sessions first, then page_views/clicks
-- ============================================

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

  -- ======================================
  -- PASS 1: Process SESSION events FIRST
  -- ======================================
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

    -- Only process session events in this pass
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
    END IF;
  END LOOP;

  -- ======================================
  -- PASS 2: Process PAGE_VIEW and CLICK events
  -- ======================================
  FOR event IN SELECT * FROM jsonb_array_elements(events)
  LOOP
    event_type := event->>'type';
    event_data := event->'data';

    -- Validate required fields
    IF event_data->>'sessionId' IS NULL OR 
       event_data->>'userCode' IS NULL OR 
       event_data->>'shareCode' IS NULL THEN
      CONTINUE;
    END IF;

    -- Handle page view events
    IF event_type = 'page_view' THEN
      -- Validate page_type
      IF event_data->>'pageType' NOT IN ('home', 'contact', 'profile', 'portfolio') THEN
        CONTINUE;
      END IF;

      -- Ensure session exists (create if missing due to batch order issues)
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
        NULL, -- visitor_id unknown for orphaned page views
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0),
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0),
        0,
        0,
        'Unknown',
        ''
      )
      ON CONFLICT (session_id) DO NOTHING;

      -- Insert page view
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

      -- Ensure session exists (create if missing due to batch order issues)
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
        NULL, -- visitor_id unknown for orphaned clicks
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0),
        TO_TIMESTAMP((event_data->>'timestamp')::BIGINT / 1000.0),
        0,
        0,
        'Unknown',
        ''
      )
      ON CONFLICT (session_id) DO NOTHING;

      -- Insert click
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

  -- ======================================
  -- Update session counters
  -- ======================================
  
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

COMMENT ON FUNCTION ingest_analytics_batch IS 
  'Two-pass batch processor: (1) Process sessions first, (2) Process page views/clicks with automatic session creation for orphaned events';
