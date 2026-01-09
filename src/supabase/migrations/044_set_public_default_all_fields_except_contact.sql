-- ============================================
-- UPDATE: Set Public group default to all fields except Contact Information
-- ============================================
-- Purpose: When new users register, the Public share group should have all fields
-- selected by default EXCEPT contact information (phone, email, address) for privacy
--
-- Fields included in Public default:
-- - All personal fields (name, title, businessName, bio, profileImage)
-- - All social messaging fields (zalo, messenger, telegram, whatsapp, etc.)
-- - All social channels fields (facebook, linkedin, twitter, youtube, tiktok)
-- - All profile fields (about, serviceAreas, specialties, experience, languages, certifications)
-- - Portfolio
--
-- Fields EXCLUDED from Public default (for privacy):
-- - contact.phone
-- - contact.email
-- - contact.address

CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_code TEXT;
  v_group_id_public TEXT;
  v_group_id_private TEXT;
  v_group_id_business TEXT;
  v_group_id_personal TEXT;
  v_share_code_public TEXT;
  v_share_code_private TEXT;
  v_share_code_business TEXT;
  v_share_code_personal TEXT;
  v_user_name TEXT;
  v_user_email TEXT;
  -- Public group: All fields EXCEPT contact information
  v_public_fields JSONB;
BEGIN
  -- Validate user_id parameter
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid parameter',
      'message', 'user_id cannot be null'
    );
  END IF;
  
  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User does not exist',
      'message', 'User not found in auth.users'
    );
  END IF;
  
  -- Check if already initialized (idempotent)
  IF EXISTS (SELECT 1 FROM user_code_ownership WHERE user_id = p_user_id) THEN
    SELECT user_code INTO v_user_code FROM user_code_ownership WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'user_code', v_user_code,
      'message', 'User already initialized'
    );
  END IF;

  -- Fetch name and email from auth.users metadata
  SELECT 
    COALESCE(
      (raw_user_meta_data->>'name'),
      (raw_user_meta_data->>'full_name'),
      ''
    ),
    COALESCE(email, '')
  INTO v_user_name, v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Generate unique codes
  v_user_code := generate_unique_user_code();
  v_group_id_public := p_user_id::text || '_public';
  v_group_id_private := p_user_id::text || '_private';
  v_group_id_business := p_user_id::text || '_business';
  v_group_id_personal := p_user_id::text || '_personal';
  
  v_share_code_public := upper(substr(md5(random()::text || p_user_id::text || 'pub'), 1, 6));
  v_share_code_private := upper(substr(md5(random()::text || p_user_id::text || 'prv'), 1, 6));
  v_share_code_business := upper(substr(md5(random()::text || p_user_id::text || 'biz'), 1, 6));
  v_share_code_personal := upper(substr(md5(random()::text || p_user_id::text || 'per'), 1, 6));

  -- Build Public group fields: ALL fields EXCEPT contact information
  v_public_fields := '[
    "personal.name",
    "personal.title",
    "personal.businessName",
    "personal.bio",
    "personal.profileImage",
    "socialMessaging.zalo",
    "socialMessaging.messenger",
    "socialMessaging.telegram",
    "socialMessaging.whatsapp",
    "socialMessaging.kakao",
    "socialMessaging.discord",
    "socialMessaging.wechat",
    "socialChannels.facebook",
    "socialChannels.linkedin",
    "socialChannels.twitter",
    "socialChannels.youtube",
    "socialChannels.tiktok",
    "profile.about",
    "profile.serviceAreas",
    "profile.specialties",
    "profile.experience",
    "profile.languages",
    "profile.certifications",
    "portfolio"
  ]'::jsonb;

  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (p_user_id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Create user_plan (default to 'free')
  INSERT INTO user_plan (user_id, plan_name)
  VALUES (p_user_id, 'free')
  ON CONFLICT (user_id) DO UPDATE
  SET plan_name = EXCLUDED.plan_name;

  -- 3. Create business_cards with name from signup and custom_fields JSONB
  INSERT INTO business_cards (
    user_id, 
    user_code,
    name,
    title,
    company_name,
    bio,
    email,
    phone,
    website_url,
    avatar_url,
    background_image_url,
    linkedin_url,
    twitter_url,
    instagram_url,
    facebook_url,
    portfolio_images,
    custom_fields
  )
  VALUES (
    p_user_id, 
    v_user_code,
    COALESCE(v_user_name, ''),  -- name from signup metadata
    '',  -- title
    '',  -- company_name
    '',  -- bio
    COALESCE(v_user_email, ''),  -- email from auth.users
    '',  -- phone
    '',  -- website_url
    null,  -- avatar_url
    null,  -- background_image_url
    '',  -- linkedin_url
    '',  -- twitter_url
    '',  -- instagram_url
    '',  -- facebook_url
    null,  -- portfolio_images
    jsonb_build_object(
      'contact', jsonb_build_object(
        'email', COALESCE(v_user_email, ''),
        'phone', '',
        'address', ''
      ),
      'profile', jsonb_build_object(
        'about', '',
        'serviceAreas', '',
        'specialties', '',
        'experience', '',
        'languages', '',
        'certifications', ''
      ),
      'socialMessaging', jsonb_build_object(
        'whatsapp', '',
        'telegram', '',
        'messenger', '',
        'zalo', '',
        'kakao', '',
        'discord', '',
        'wechat', ''
      ),
      'socialChannels', jsonb_build_object(
        'facebook', '',
        'linkedin', '',
        'twitter', '',
        'youtube', '',
        'tiktok', ''
      ),
      'portfolio', '[]'::jsonb,
      'customLabels', '{}'::jsonb,
      'profileImage', '',
      'aiAgentVisible', false,
      'portfolioCategories', '[]'::jsonb
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Create default share groups
  INSERT INTO user_share_groups (
    id, 
    user_id, 
    user_code, 
    label, 
    description, 
    share_code, 
    icon, 
    color, 
    is_default, 
    display_order
  )
  VALUES
    (v_group_id_public, p_user_id, v_user_code, 'Public', 'Anyone with your public link', v_share_code_public, 'Users', 'blue', true, 1),
    (v_group_id_private, p_user_id, v_user_code, 'Private', 'Trusted contacts only', v_share_code_private, 'Shield', 'purple', true, 2),
    (v_group_id_business, p_user_id, v_user_code, 'Business', 'Professional contacts', v_share_code_business, 'Briefcase', 'green', true, 3),
    (v_group_id_personal, p_user_id, v_user_code, 'Personal', 'Close friends & family', v_share_code_personal, 'Heart', 'pink', true, 4)
  ON CONFLICT (id) DO NOTHING;

  -- 5. Create share settings with updated Public default (all fields except contact)
  INSERT INTO user_share_settings (
    user_id, 
    user_code, 
    share_code,
    group_id, 
    visible_fields
  )
  VALUES
    -- Public: All fields EXCEPT contact information (phone, email, address)
    (p_user_id, v_user_code, v_share_code_public, v_group_id_public, v_public_fields),
    -- Private: Keep existing default (all fields including contact)
    (p_user_id, v_user_code, v_share_code_private, v_group_id_private, 
      '["personal.name","personal.title","personal.bio","personal.businessName","personal.profileImage","contact.phone","contact.email","contact.address","profile.about"]'::jsonb),
    -- Business: Keep existing default
    (p_user_id, v_user_code, v_share_code_business, v_group_id_business, 
      '["personal.name","personal.title","personal.businessName","personal.profileImage","contact.phone","contact.email"]'::jsonb),
    -- Personal: Empty (user can configure)
    (p_user_id, v_user_code, v_share_code_personal, v_group_id_personal, 
      '[]'::jsonb)
  ON CONFLICT (user_code, group_id) DO NOTHING;

  -- Return success with user_code
  RETURN jsonb_build_object(
    'success', true,
    'user_code', v_user_code,
    'message', 'User initialized successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return detailed error for debugging
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE,
    'message', 'Failed to initialize user data: ' || SQLERRM
  );
END;
$function$;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Updated initialize_user_data to set Public group with all fields except contact information';
  RAISE NOTICE '✅ Public group now includes: personal.*, socialMessaging.*, socialChannels.*, profile.*, portfolio';
  RAISE NOTICE '✅ Public group excludes: contact.phone, contact.email, contact.address (for privacy)';
END $$;
