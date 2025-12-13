-- ============================================
-- FIX: initialize_user_data to match actual business_cards schema
-- ============================================

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

  -- 1. Create user_code_ownership
  INSERT INTO user_code_ownership (user_id, user_code)
  VALUES (p_user_id, v_user_code)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Create business_cards with actual schema (individual columns, not nested JSONB)
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
    contact,
    social_messaging
  )
  VALUES (
    p_user_id, 
    v_user_code,
    '',  -- name
    '',  -- title
    '',  -- company_name
    '',  -- bio
    '',  -- email
    '',  -- phone
    '',  -- website_url
    null,  -- avatar_url
    null,  -- background_image_url
    '',  -- linkedin_url
    '',  -- twitter_url
    '',  -- instagram_url
    '',  -- facebook_url
    '{}'::jsonb,  -- contact
    '{}'::jsonb   -- social_messaging
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Create default share groups
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

  -- 4. Create share settings with share_code
  INSERT INTO user_share_settings (
    user_id, 
    user_code, 
    share_code,
    group_id, 
    visible_fields
  )
  VALUES
    (p_user_id, v_user_code, v_share_code_public, v_group_id_public, 
      '["name","title","avatar_url","phone","email"]'::jsonb),
    (p_user_id, v_user_code, v_share_code_private, v_group_id_private, 
      '["name","title","bio","company_name","avatar_url","phone","email","website_url"]'::jsonb),
    (p_user_id, v_user_code, v_share_code_business, v_group_id_business, 
      '["name","title","company_name","avatar_url","phone","email"]'::jsonb),
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
