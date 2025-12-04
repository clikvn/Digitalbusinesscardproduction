-- ============================================
-- APP-LAYER INITIALIZATION (NO TRIGGER)
-- ============================================
-- Since trigger keeps failing, we'll initialize from app code instead
-- This migration creates a function that the app can call after signup

-- ============================================
-- STEP 1: Ensure trigger is disabled
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- STEP 2: Create helper functions
-- ============================================

-- Generate user code
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
    END LOOP;
    
    IF NOT EXISTS (SELECT 1 FROM user_code_ownership WHERE user_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    EXIT WHEN attempt >= max_attempts;
  END LOOP;
  
  RAISE EXCEPTION 'Could not generate unique user code';
END;
$$;

-- ============================================
-- STEP 3: Create RPC function for app to call
-- ============================================

CREATE OR REPLACE FUNCTION public.initialize_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_code TEXT;
  v_group_id_public TEXT;
  v_group_id_private TEXT;
  v_group_id_business TEXT;
  v_group_id_personal TEXT;
  v_share_code_public TEXT;
  v_share_code_private TEXT;
  v_share_code_business TEXT;
  v_share_code_personal TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if already initialized (check user_code_ownership as source of truth)
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = v_user_id) THEN
    -- Return existing data
    SELECT user_code INTO v_user_code FROM user_code_ownership WHERE user_id = v_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'user_code', v_user_code,
      'message', 'Already initialized'
    );
  END IF;
  
  -- Check for ANY existing data (from failed previous attempts)
  -- If any exists, clean it ALL up before proceeding
  IF EXISTS (
    SELECT 1 FROM business_cards WHERE user_id = v_user_id
    UNION ALL
    SELECT 1 FROM user_share_groups WHERE user_id = v_user_id
    UNION ALL
    SELECT 1 FROM user_share_settings WHERE user_id = v_user_id
  ) THEN
    -- Clean up partial data from failed previous attempts
    -- Delete in correct order to respect foreign key constraints
    DELETE FROM user_share_settings WHERE user_id = v_user_id;
    DELETE FROM user_share_groups WHERE user_id = v_user_id;
    DELETE FROM business_cards WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Cleaned up partial data for user %', v_user_id;
  END IF;
  
  -- Generate codes
  v_user_code := generate_user_code();
  v_group_id_public := v_user_id::text || '_public';
  v_group_id_private := v_user_id::text || '_private';
  v_group_id_business := v_user_id::text || '_business';
  v_group_id_personal := v_user_id::text || '_personal';
  
  v_share_code_public := upper(substr(md5(random()::text || v_user_id::text || 'pub'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || v_user_id::text || 'prv'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || v_user_id::text || 'biz'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || v_user_id::text || 'per'), 1, 6));
  
  -- Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (v_user_id, v_user_code);
  
  -- Create business_cards
  -- Using flat columns + custom_fields JSONB structure
  INSERT INTO business_cards (
    user_id, user_code,
    name, title, company_name, bio,
    email, phone, website_url,
    avatar_url, background_image_url,
    linkedin_url, twitter_url, instagram_url, facebook_url,
    portfolio_images,
    custom_fields
  )
  VALUES (
    v_user_id, v_user_code,
    '', '', '', '',  -- name, title, company_name, bio
    '', '', '',      -- email, phone, website_url
    NULL, NULL,      -- avatar_url, background_image_url
    NULL, NULL, NULL, NULL,  -- social URLs
    ARRAY[]::text[],     -- portfolio_images (text array, not jsonb)
    '{
      "contact": {"phone":"","email":"","address":""},
      "socialMessaging": {"whatsapp":"","telegram":"","messenger":"","zalo":"","kakao":"","discord":"","wechat":""},
      "socialChannels": {"facebook":"","linkedin":"","twitter":"","youtube":"","tiktok":""},
      "profile": {"about":"","serviceAreas":"","specialties":"","experience":"","languages":"","certifications":""},
      "customLabels": {},
      "aiAgentVisible": false
    }'::jsonb
  );
  
  -- Create share groups (with individual inserts to pinpoint failures)
  BEGIN
    INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
    VALUES
      (v_group_id_public, v_user_id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
      (v_group_id_private, v_user_id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
      (v_group_id_business, v_user_id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
      (v_group_id_personal, v_user_id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4);
  EXCEPTION 
    WHEN unique_violation THEN
      -- If groups already exist, delete and retry
      RAISE NOTICE 'Share groups already exist, cleaning up...';
      DELETE FROM user_share_settings WHERE user_id = v_user_id;
      DELETE FROM user_share_groups WHERE user_id = v_user_id;
      
      -- Retry insert
      INSERT INTO user_share_groups (id, user_id, user_code, label, description, share_code, icon, color, is_default, display_order)
      VALUES
        (v_group_id_public, v_user_id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
        (v_group_id_private, v_user_id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
        (v_group_id_business, v_user_id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
        (v_group_id_personal, v_user_id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4);
  END;
  
  -- Create share settings
  BEGIN
    INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
    VALUES
      (v_user_id, v_user_code, v_group_id_public, '["personal.name","personal.title","personal.profileImage","contact.phone","contact.email"]'::jsonb),
      (v_user_id, v_user_code, v_group_id_private, '["personal.name","personal.title","personal.bio","personal.businessName","personal.profileImage","contact.phone","contact.email","contact.address","profile.about"]'::jsonb),
      (v_user_id, v_user_code, v_group_id_business, '["personal.name","personal.title","personal.businessName","personal.profileImage","contact.phone","contact.email","profile.about","profile.experience"]'::jsonb),
      (v_user_id, v_user_code, v_group_id_personal, '[]'::jsonb);
  EXCEPTION 
    WHEN unique_violation THEN
      -- If settings already exist, delete and retry
      RAISE NOTICE 'Share settings already exist, cleaning up...';
      DELETE FROM user_share_settings WHERE user_id = v_user_id;
      
      -- Retry insert
      INSERT INTO user_share_settings (user_id, user_code, group_id, visible_fields)
      VALUES
        (v_user_id, v_user_code, v_group_id_public, '["personal.name","personal.title","personal.profileImage","contact.phone","contact.email"]'::jsonb),
        (v_user_id, v_user_code, v_group_id_private, '["personal.name","personal.title","personal.bio","personal.businessName","personal.profileImage","contact.phone","contact.email","contact.address","profile.about"]'::jsonb),
        (v_user_id, v_user_code, v_group_id_business, '["personal.name","personal.title","personal.businessName","personal.profileImage","contact.phone","contact.email","profile.about","profile.experience"]'::jsonb),
        (v_user_id, v_user_code, v_group_id_personal, '[]'::jsonb);
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_code', v_user_code,
    'message', 'User initialized successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Clean up on any error
  BEGIN
    DELETE FROM user_share_settings WHERE user_id = v_user_id;
    DELETE FROM user_share_groups WHERE user_id = v_user_id;
    DELETE FROM business_cards WHERE user_id = v_user_id;
    DELETE FROM user_code_ownership WHERE user_id = v_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore cleanup errors
    NULL;
  END;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Initialization failed'
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.initialize_user_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_user_code() TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ App-layer initialization ready';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'After user signs up, call from your app:';
  RAISE NOTICE '';
  RAISE NOTICE '  const { data } = await supabase.rpc(''initialize_user_data'');';
  RAISE NOTICE '';
  RAISE NOTICE 'This will create all necessary data for the user.';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
